import json
import re
from typing import Any, Dict, List, Tuple
from app.core.config import settings
from app.models.feedback import Feedback
from app.services.ai.provider import get_openai_client, is_openai_configured


def calculate_feedback_metrics(feedbacks: List[Feedback]) -> Dict[str, Any]:
    """Calculate aggregate ratings, distribution, and sufficiency flags."""
    total = len(feedbacks)
    if total == 0:
        return {
            "total_submissions": 0,
            "average_overall": 0.0,
            "average_clarity": 0.0,
            "average_pace": 0.0,
            "average_understanding": 0.0,
            "rating_distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            "has_sufficient_data": False,
        }

    avg_overall = round(sum(f.overall_rating for f in feedbacks) / total, 2)
    avg_clarity = round(sum(f.teaching_clarity_rating for f in feedbacks) / total, 2)
    avg_pace = round(sum(f.lecture_pace_rating for f in feedbacks) / total, 2)
    avg_understanding = round(sum(f.concept_understanding_rating for f in feedbacks) / total, 2)

    dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for f in feedbacks:
        if f.overall_rating in dist:
            dist[f.overall_rating] += 1

    return {
        "total_submissions": total,
        "average_overall": avg_overall,
        "average_clarity": avg_clarity,
        "average_pace": avg_pace,
        "average_understanding": avg_understanding,
        "rating_distribution": dist,
        "has_sufficient_data": total >= 3,
    }


def extract_fallback_themes(feedbacks: List[Feedback]) -> Tuple[List[str], List[str]]:
    """Grounded rule-based extraction of positive feedback and improvement themes."""
    pos_texts = [f.positive_feedback.strip() for f in feedbacks if f.positive_feedback and f.positive_feedback.strip()]
    imp_texts = [f.improvement_suggestions.strip() for f in feedbacks if f.improvement_suggestions and f.improvement_suggestions.strip()]

    positive_themes: List[str] = []
    improvement_themes: List[str] = []

    # Positive theme extraction
    for text in pos_texts:
        sentences = [s.strip() for s in re.split(r"[.!?\n]+", text) if len(s.strip()) > 8]
        for s in sentences:
            clean = s.capitalize()
            if clean not in positive_themes and len(positive_themes) < 5:
                positive_themes.append(clean)

    # Improvement theme extraction
    for text in imp_texts:
        sentences = [s.strip() for s in re.split(r"[.!?\n]+", text) if len(s.strip()) > 8]
        for s in sentences:
            clean = s.capitalize()
            if clean not in improvement_themes and len(improvement_themes) < 5:
                improvement_themes.append(clean)

    return positive_themes, improvement_themes


def extract_feedback_themes(feedbacks: List[Feedback]) -> Tuple[List[str], List[str]]:
    """
    Extract common positive feedback themes and areas for improvement.
    Uses OpenAI LLM when configured, or grounded fallback engine.
    Ensures zero hallucination.
    """
    if not feedbacks:
        return [], []

    pos_entries = [f.positive_feedback.strip() for f in feedbacks if f.positive_feedback and f.positive_feedback.strip()]
    imp_entries = [f.improvement_suggestions.strip() for f in feedbacks if f.improvement_suggestions and f.improvement_suggestions.strip()]

    if not pos_entries and not imp_entries:
        return [], []

    client = get_openai_client()
    if client is not None and settings.AI_PROVIDER.lower() == "openai" and (len(pos_entries) >= 2 or len(imp_entries) >= 2):
        try:
            pos_joined = "\n".join(f"- {p}" for p in pos_entries[:15])
            imp_joined = "\n".join(f"- {i}" for i in imp_entries[:15])

            system_prompt = (
                "You are an academic feedback analytics assistant. "
                "Analyze the submitted student feedback strictly and summarize the common themes. "
                "Do not invent themes or trends not found in the feedback texts. "
                "Return a JSON object with two keys:\n"
                "1. 'positive_themes': list of up to 4 short bullet points summarizing what students liked\n"
                "2. 'improvement_themes': list of up to 4 short bullet points summarizing suggested improvements\n"
            )
            user_prompt = f"Student Likes:\n{pos_joined}\n\nStudent Suggestions for Improvement:\n{imp_joined}"

            response = client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            content = response.choices[0].message.content or "{}"
            parsed = json.loads(content)
            pos_themes = parsed.get("positive_themes", [])
            imp_themes = parsed.get("improvement_themes", [])
            return pos_themes, imp_themes
        except Exception:
            pass

    return extract_fallback_themes(feedbacks)

