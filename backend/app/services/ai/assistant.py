import json
import re
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.lecture import Lecture, LectureStatus
from app.models.transcript import ProcessingStatus, Transcript
from app.services.ai.provider import get_openai_client, is_openai_configured


def format_timestamp(seconds: float) -> str:
    """Format seconds into [MM:SS] or [HH:MM:SS] string."""
    s = int(seconds)
    hours = s // 3600
    minutes = (s % 3600) // 60
    secs = s % 60
    if hours > 0:
        return f"[{hours:02d}:{minutes:02d}:{secs:02d}]"
    return f"[{minutes:02d}:{secs:02d}]"


def extract_keywords(query: str) -> List[str]:
    """Tokenize query into meaningful search keywords, ignoring common stopwords."""
    stopwords = {
        "what", "is", "the", "how", "a", "an", "in", "of", "to", "for", "and", "or",
        "on", "at", "by", "from", "with", "about", "can", "you", "tell", "me", "does",
        "why", "which", "when", "where", "explain", "describe", "define", "do", "we"
    }
    words = re.findall(r"\b[a-zA-Z0-9_\-]{2,}\b", query.lower())
    return [w for w in words if w not in stopwords]


def answer_classroom_question(
    db: Session,
    question: str,
    subject_id: Optional[int] = None,
    lecture_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Generate an answer to a student question strictly grounded in approved lecture transcripts.
    Returns: { "answer": str, "sources": List[Dict[str, Any]], "is_grounded": bool }
    """
    clean_question = question.strip()
    if not clean_question:
        return {
            "answer": "Please ask a question regarding the lecture topics.",
            "sources": [],
            "is_grounded": False,
        }

    # Query approved lectures with completed transcripts
    query = (
        db.query(Lecture)
        .join(Transcript, Lecture.id == Transcript.lecture_id)
        .filter(
            Lecture.approval_status == LectureStatus.APPROVED.value,
            Transcript.status == ProcessingStatus.COMPLETED.value,
            Transcript.transcript_text.isnot(None),
        )
    )

    if lecture_id is not None:
        query = query.filter(Lecture.id == lecture_id)
    elif subject_id is not None:
        query = query.filter(Lecture.subject_id == subject_id)

    lectures = query.all()

    if not lectures:
        return {
            "answer": (
                "No approved lecture recordings or completed transcripts are currently available for this subject. "
                "Once lecture recordings are approved and transcribed, you can ask questions grounded in the lecture content."
            ),
            "sources": [],
            "is_grounded": False,
        }

    # Extract all transcript segments across available lectures
    keywords = extract_keywords(clean_question)
    scored_segments: List[Dict[str, Any]] = []

    for lec in lectures:
        transcript = lec.transcript
        if not transcript or not transcript.transcript_text:
            continue

        raw_segments = []
        if transcript.segments:
            try:
                raw_segments = json.loads(transcript.segments)
            except Exception:
                pass

        if not raw_segments:
            # Fallback: chunk full transcript text by sentences if segment JSON is missing
            sentences = re.split(r"(?<=[.!?])\s+", transcript.transcript_text)
            for idx, sent in enumerate(sentences):
                if sent.strip():
                    raw_segments.append({
                        "id": idx,
                        "start": 0.0,
                        "end": 0.0,
                        "text": sent.strip(),
                    })

        for seg in raw_segments:
            seg_text = seg.get("text", "").strip()
            if not seg_text:
                continue

            seg_lower = seg_text.lower()
            # Score segment based on keyword occurrences
            score = sum(1 for kw in keywords if kw in seg_lower)
            if score > 0 or not keywords:
                scored_segments.append({
                    "lecture_id": lec.id,
                    "lecture_title": lec.title,
                    "start": seg.get("start", 0.0),
                    "end": seg.get("end", 0.0),
                    "timestamp": format_timestamp(seg.get("start", 0.0)),
                    "text": seg_text,
                    "score": score,
                })

    # Sort scored segments descending by relevance score
    scored_segments.sort(key=lambda s: s["score"], reverse=True)
    top_segments = scored_segments[:7]

    # If no segments matched keywords, take the initial overview segments
    if not top_segments and scored_segments:
        top_segments = scored_segments[:4]

    # Build sources list
    sources = [
        {
            "lecture_id": s["lecture_id"],
            "lecture_title": s["lecture_title"],
            "timestamp": s["timestamp"],
            "start": s["start"],
            "snippet": s["text"][:160] + ("..." if len(s["text"]) > 160 else ""),
        }
        for s in top_segments
    ]

    # Assemble context string
    context_blocks = []
    for s in top_segments:
        context_blocks.append(
            f"Lecture: '{s['lecture_title']}' {s['timestamp']}\nExcerpt: \"{s['text']}\""
        )
    context_text = "\n\n".join(context_blocks)

    # 1. OpenAI Assistant Generation (if configured)
    client = get_openai_client()
    if client and is_openai_configured() and context_text:
        try:
            system_prompt = (
                "You are ClassMate AI, an intelligent, helpful academic classroom assistant. "
                "Your responses MUST BE STRICTLY GROUNDED in the provided lecture transcript segments.\n\n"
                "STRICT GROUNDING RULES:\n"
                "1. Only state facts directly supported by the provided lecture excerpts.\n"
                "2. If the user question cannot be answered using the provided excerpts, state: "
                "'Based on the classroom lecture recordings, this topic was not covered in class.' "
                "Do not invent facts or guess outside the lectures.\n"
                "3. Cite the lecture title and timestamp (e.g. '[02:15]') whenever referencing concepts.\n"
                "4. Be concise, pedagogical, and encouraging."
            )

            user_prompt = (
                f"Course Lecture Transcripts:\n{context_text}\n\n"
                f"Student Question: {clean_question}\n\n"
                "Answer the student's question based strictly on the excerpts above:"
            )

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
                max_tokens=600,
            )
            answer_text = response.choices[0].message.content or ""
            return {
                "answer": answer_text.strip(),
                "sources": sources,
                "is_grounded": True,
            }
        except Exception:
            # Fall back gracefully to offline grounded synthesis
            pass

    # 2. Honest Grounded Offline Fallback
    if not top_segments or all(s["score"] == 0 for s in top_segments) and keywords:
        return {
            "answer": (
                "Based on the classroom lecture recordings for this subject, this topic was not explicitly covered in the approved lectures. "
                "Try asking about topics discussed in class, or post your question on the Anonymous Doubt Board for instructor review."
            ),
            "sources": [],
            "is_grounded": False,
        }

    # Formulate grounded synthesis from excerpts
    synthesis_lines = [
        f"### 🎓 Classroom Assistant Explanation\n",
        f"Based on the lecture discussions in **{top_segments[0]['lecture_title']}**:\n",
    ]
    for seg in top_segments[:4]:
        synthesis_lines.append(f"- **{seg['timestamp']}**: {seg['text']}")

    synthesis_lines.append(
        "\n\n*(Response grounded in lecture transcripts with timestamp references)*"
    )

    return {
        "answer": "\n".join(synthesis_lines),
        "sources": sources,
        "is_grounded": True,
    }

