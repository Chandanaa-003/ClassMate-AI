from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional
from app.core.config import settings
from app.services.ai.provider import get_openai_client, is_openai_configured


@dataclass
class TranscriptionResult:
    text: str
    language: str
    segments: List[Dict[str, Any]] = field(default_factory=list)


def generate_mock_transcription(audio_file_path: Path, language_hint: Optional[str] = None) -> TranscriptionResult:
    """
    Generate realistic, grounded mock transcripts with segment timestamps for testing
    or when OpenAI API key is not configured.
    Supports English, Kannada, and Kannada-English mixed speech.
    """
    filename = audio_file_path.name.lower()
    hint = (language_hint or "").lower()

    if "kannada" in filename or "kannada" in hint or hint == "kn":
        # Pure Kannada mock transcription
        segments = [
            {"id": 0, "start": 0.0, "end": 4.5, "text": "ನಮಸ್ಕಾರ ವಿದ್ಯಾರ್ಥಿಗಳೇ, ಇವತ್ತಿನ ತರಗತಿಗೆ ಎಲ್ಲರಿಗೂ ಸ್ವಾಗತ."},
            {"id": 1, "start": 4.5, "end": 10.2, "text": "ನಾವು ಇಂದು ಕಂಪ್ಯೂಟರ್ ಸೈನ್ಸ್‌ನ ಮೂಲಭೂತ ಪರಿಕಲ್ಪನೆಗಳ ಬಗ್ಗೆ ಚರ್ಚಿಸುತ್ತಿದ್ದೇವೆ."},
            {"id": 2, "start": 10.2, "end": 16.8, "text": "ಡೇಟಾ ಸ್ಟ್ರಕ್ಚರ್ಸ್ ಎಂದರೆ ಕಂಪ್ಯೂಟರ್‌ನಲ್ಲಿ ಮಾಹಿತಿಯನ್ನು ವ್ಯವಸ್ಥಿತವಾಗಿ ಸಂಗ್ರಹಿಸುವ ವಿಧಾನ."},
            {"id": 3, "start": 16.8, "end": 22.5, "text": "ಸ್ಟ್ಯಾಕ್ ಮತ್ತು ಕ್ಯೂ ಎಂಬುದು ಅತ್ಯಂತ ಪ್ರಮುಖವಾದ ಎರಡು ಲೀನಿಯರ್ ಡೇಟಾ ಸ್ಟ್ರಕ್ಚರ್‌ಗಳು."},
            {"id": 4, "start": 22.5, "end": 28.0, "text": "ಪರೀಕ್ಷೆಯಲ್ಲಿ ಈ ವಿಷಯದ ಬಗ್ಗೆ ಖಚಿತವಾಗಿ ಪ್ರಶ್ನೆಗಳು ಬರುತ್ತವೆ. ದಯವಿಟ್ಟು ಗಮನವಿಟ್ಟು ಓದಿ."},
        ]
        text = " ".join(s["text"] for s in segments)
        return TranscriptionResult(text=text, language="kannada", segments=segments)

    if "mixed" in filename or "mixed" in hint or "kannada-english" in hint:
        # Kannada-English mixed speech mock transcription
        segments = [
            {"id": 0, "start": 0.0, "end": 4.2, "text": "Namaskara students. Today's lecture is on fundamental Data Structures."},
            {"id": 1, "start": 4.2, "end": 9.8, "text": "Naavu ivattu Stack mathu Queue bagge thilkolona. Both are linear data structures."},
            {"id": 2, "start": 9.8, "end": 16.4, "text": "Stack alli Last In First Out (LIFO) principle follow aagutthe. For example, a plate dispenser or undo operations."},
            {"id": 3, "start": 16.4, "end": 22.1, "text": "Adhe thara Queue alli First In First Out (FIFO) principle use maadtivi, like ticket counter line."},
            {"id": 4, "start": 22.1, "end": 27.8, "text": "Exam point of view nalli ee push, pop, enqueue mathu dequeue operations thumba important. Please practice them well."},
        ]
        text = " ".join(s["text"] for s in segments)
        return TranscriptionResult(text=text, language="kn-en (mixed)", segments=segments)

    # Standard English academic lecture transcription
    segments = [
        {"id": 0, "start": 0.0, "end": 5.2, "text": "Good morning class. Today we will explore fundamental data structures and algorithmic complexity."},
        {"id": 1, "start": 5.2, "end": 11.8, "text": "Specifically, we will analyze linear data structures: stacks, queues, and dynamic arrays."},
        {"id": 2, "start": 11.8, "end": 18.5, "text": "A stack operates strictly on the Last-In, First-Out (LIFO) protocol, where insertions and deletions happen at the top."},
        {"id": 3, "start": 18.5, "end": 25.2, "text": "A queue, conversely, operates under the First-In, First-Out (FIFO) principle, similar to a physical queue of people."},
        {"id": 4, "start": 25.2, "end": 32.0, "text": "Notice that both push and pop operations on a well-designed stack achieve O(1) constant time complexity."},
        {"id": 5, "start": 32.0, "end": 38.6, "text": "For the upcoming midterm exam, make sure you can implement both structures using linked lists and arrays."},
    ]
    text = " ".join(s["text"] for s in segments)
    return TranscriptionResult(text=text, language="english", segments=segments)


def transcribe_audio_file(
    audio_file_path: Path,
    language_hint: Optional[str] = None,
) -> TranscriptionResult:
    """
    Transcribe audio file into text with timestamps and language detection.
    Uses OpenAI Whisper when configured, or reliable grounded mock fallback.
    """
    if not audio_file_path.is_file():
        raise FileNotFoundError(f"Audio file '{audio_file_path}' does not exist on disk.")

    client = get_openai_client()

    # If OpenAI is configured and AI_PROVIDER is 'openai', invoke Whisper API
    if client is not None and settings.AI_PROVIDER.lower() == "openai":
        try:
            with open(audio_file_path, "rb") as audio_file:
                kwargs: Dict[str, Any] = {
                    "model": settings.WHISPER_MODEL,
                    "file": audio_file,
                    "response_format": "verbose_json",
                }
                # Support language hint if user specifically requested Kannada or English
                if language_hint:
                    norm_hint = language_hint.strip().lower()
                    if norm_hint in ("kn", "kannada"):
                        kwargs["language"] = "kn"
                    elif norm_hint in ("en", "english"):
                        kwargs["language"] = "en"

                transcript_obj = client.audio.transcriptions.create(**kwargs)

                # Extract segments
                segments: List[Dict[str, Any]] = []
                raw_segments = getattr(transcript_obj, "segments", None)
                if raw_segments and isinstance(raw_segments, list):
                    for idx, seg in enumerate(raw_segments):
                        start = getattr(seg, "start", 0.0) if hasattr(seg, "start") else seg.get("start", 0.0)
                        end = getattr(seg, "end", 0.0) if hasattr(seg, "end") else seg.get("end", 0.0)
                        text = getattr(seg, "text", "") if hasattr(seg, "text") else seg.get("text", "")
                        segments.append({
                            "id": idx,
                            "start": round(float(start), 2),
                            "end": round(float(end), 2),
                            "text": str(text).strip(),
                        })

                detected_lang = getattr(transcript_obj, "language", None) or language_hint or "en"
                full_text = getattr(transcript_obj, "text", "") or ""

                return TranscriptionResult(
                    text=full_text.strip(),
                    language=str(detected_lang),
                    segments=segments,
                )
        except Exception as exc:
            # If live API error (e.g. invalid key or network issue), raise so background task logs it
            raise RuntimeError(f"OpenAI Whisper transcription failed: {str(exc)}")

    # Fallback to realistic mock transcription when key is not provided or provider is 'mock'
    return generate_mock_transcription(audio_file_path, language_hint)

