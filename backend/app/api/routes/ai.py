import json
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user
from app.api.routes.lecture import verify_classroom_access
from app.core.storage import get_audio_file_path
from app.db.session import SessionLocal, get_db
from app.models.lecture import Lecture, LectureStatus
from app.models.smart_note import SmartNote
from app.models.transcript import ProcessingStatus, Transcript
from app.models.user import User
from app.schemas.ai import (
    GenerateNotesRequest,
    SegmentSchema,
    SmartNoteResponse,
    TranscribeRequest,
    TranscriptResponse,
    TranscriptUpdateRequest,
)
from app.services.ai.notes_generator import generate_smart_notes
from app.services.ai.transcription import transcribe_audio_file

router = APIRouter(tags=["AI Transcription & Smart Notes"])


# ============================================================================
# Background Processing Workers
# ============================================================================

def process_transcription_job(lecture_id: int, language_hint: Optional[str] = None):
    """Background task worker to transcribe audio file and persist transcript segments."""
    db: Session = SessionLocal()
    try:
        lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
        if not lecture:
            return

        transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture_id).first()
        if not transcript:
            return

        audio_path = get_audio_file_path(lecture.audio_file_path)

        result = transcribe_audio_file(audio_path, language_hint=language_hint)

        transcript.transcript_text = result.text
        transcript.language = result.language
        transcript.segments = json.dumps(result.segments)
        transcript.status = ProcessingStatus.COMPLETED.value
        transcript.error_message = None
        db.commit()
    except Exception as exc:
        db.rollback()
        transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture_id).first()
        if transcript:
            transcript.status = ProcessingStatus.FAILED.value
            transcript.error_message = str(exc)
            db.commit()
    finally:
        db.close()


def process_notes_job(lecture_id: int):
    """Background task worker to generate grounded 9-section smart notes."""
    db: Session = SessionLocal()
    try:
        lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
        if not lecture:
            return

        transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture_id).first()
        if not transcript or not transcript.transcript_text:
            return

        note = db.query(SmartNote).filter(SmartNote.lecture_id == lecture_id).first()
        if not note:
            return

        result = generate_smart_notes(transcript.transcript_text, lecture.title)

        note.overview = result.overview
        note.content_markdown = result.content_markdown
        note.sections_json = json.dumps(result.sections)
        note.status = ProcessingStatus.COMPLETED.value
        note.error_message = None
        db.commit()
    except Exception as exc:
        db.rollback()
        note = db.query(SmartNote).filter(SmartNote.lecture_id == lecture_id).first()
        if note:
            note.status = ProcessingStatus.FAILED.value
            note.error_message = str(exc)
            db.commit()
    finally:
        db.close()


# ============================================================================
# Helpers
# ============================================================================

def parse_segments(raw_segments: Optional[str]) -> List[SegmentSchema]:
    """Parse JSON encoded segment records into Pydantic models."""
    if not raw_segments:
        return []
    try:
        data = json.loads(raw_segments)
        return [SegmentSchema(**item) for item in data]
    except Exception:
        return []


def build_transcript_response(transcript: Transcript) -> TranscriptResponse:
    return TranscriptResponse(
        id=transcript.id,
        lecture_id=transcript.lecture_id,
        transcript_text=transcript.transcript_text,
        language=transcript.language,
        status=transcript.status,
        error_message=transcript.error_message,
        segments=parse_segments(transcript.segments),
        created_at=transcript.created_at,
        updated_at=transcript.updated_at,
    )


def build_smart_note_response(note: SmartNote) -> SmartNoteResponse:
    sections_dict = None
    if note.sections_json:
        try:
            sections_dict = json.loads(note.sections_json)
        except Exception:
            sections_dict = None

    return SmartNoteResponse(
        id=note.id,
        lecture_id=note.lecture_id,
        overview=note.overview,
        content_markdown=note.content_markdown,
        sections=sections_dict,
        status=note.status,
        error_message=note.error_message,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


# ============================================================================
# API Endpoints
# ============================================================================

@router.post(
    "/lectures/{lecture_id}/transcribe",
    response_model=TranscriptResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger asynchronous AI transcription for an approved lecture",
)
def trigger_transcription(
    lecture_id: int,
    background_tasks: BackgroundTasks,
    request_data: Optional[TranscribeRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> TranscriptResponse:
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecture not found.",
        )

    is_lecturer, _ = verify_classroom_access(lecture.subject, current_user.id, db)
    is_uploader = lecture.uploaded_by_id == current_user.id

    # If lecture is not approved, only uploader or classroom lecturer can access
    if lecture.approval_status != LectureStatus.APPROVED.value and not is_lecturer and not is_uploader:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Lecture recording has not been approved.",
        )

    force_retry = request_data.force_retry if request_data else False
    language_hint = request_data.language if request_data else None

    transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture.id).first()

    if transcript:
        # Prevent duplicate jobs
        if transcript.status == ProcessingStatus.PROCESSING.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transcription is already in progress for this lecture.",
            )

        if transcript.status == ProcessingStatus.COMPLETED.value and not force_retry:
            return build_transcript_response(transcript)

        # Reset for processing / retry
        transcript.status = ProcessingStatus.PROCESSING.value
        transcript.error_message = None
        db.commit()
        db.refresh(transcript)
    else:
        transcript = Transcript(
            lecture_id=lecture.id,
            status=ProcessingStatus.PROCESSING.value,
        )
        db.add(transcript)
        db.commit()
        db.refresh(transcript)

    background_tasks.add_task(process_transcription_job, lecture.id, language_hint)
    return build_transcript_response(transcript)


@router.get(
    "/lectures/{lecture_id}/transcript",
    response_model=TranscriptResponse,
    summary="Retrieve the current transcript and processing status of a lecture",
)
def get_transcript(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> TranscriptResponse:
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecture not found.",
        )

    is_lecturer, _ = verify_classroom_access(lecture.subject, current_user.id, db)
    is_uploader = lecture.uploaded_by_id == current_user.id

    if lecture.approval_status != LectureStatus.APPROVED.value and not is_lecturer and not is_uploader:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Lecture recording has not been approved.",
        )

    transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture.id).first()
    if not transcript:
        return TranscriptResponse(
            lecture_id=lecture.id,
            status=ProcessingStatus.NOT_STARTED.value,
            segments=[],
        )

    return build_transcript_response(transcript)


@router.put(
    "/lectures/{lecture_id}/transcript",
    response_model=TranscriptResponse,
    summary="Edit and update transcript text (Authorized users only)",
)
def update_transcript(
    lecture_id: int,
    update_data: TranscriptUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> TranscriptResponse:
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecture not found.",
        )

    is_lecturer, _ = verify_classroom_access(lecture.subject, current_user.id, db)
    is_uploader = lecture.uploaded_by_id == current_user.id

    # Only classroom lecturer or uploader can edit transcript text
    if not is_lecturer and not is_uploader:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to edit this transcript.",
        )

    transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture.id).first()
    if not transcript:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcript not found for this lecture.",
        )

    clean_text = update_data.transcript_text.strip()
    if not clean_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript text cannot be empty.",
        )

    transcript.transcript_text = clean_text
    db.commit()
    db.refresh(transcript)

    return build_transcript_response(transcript)


@router.post(
    "/lectures/{lecture_id}/generate-notes",
    response_model=SmartNoteResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Generate structured 9-section AI Smart Notes from completed transcript",
)
def trigger_generate_notes(
    lecture_id: int,
    background_tasks: BackgroundTasks,
    request_data: Optional[GenerateNotesRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> SmartNoteResponse:
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecture not found.",
        )

    is_lecturer, _ = verify_classroom_access(lecture.subject, current_user.id, db)
    is_uploader = lecture.uploaded_by_id == current_user.id

    if lecture.approval_status != LectureStatus.APPROVED.value and not is_lecturer and not is_uploader:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Lecture recording has not been approved.",
        )

    # Transcript must be COMPLETED before notes can be generated
    transcript = db.query(Transcript).filter(Transcript.lecture_id == lecture.id).first()
    if not transcript or transcript.status != ProcessingStatus.COMPLETED.value or not transcript.transcript_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot generate notes: Transcript must be completed and non-empty.",
        )

    force_retry = request_data.force_retry if request_data else False
    note = db.query(SmartNote).filter(SmartNote.lecture_id == lecture.id).first()

    if note:
        # Prevent duplicate jobs
        if note.status == ProcessingStatus.PROCESSING.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Notes generation is already in progress for this lecture.",
            )

        if note.status == ProcessingStatus.COMPLETED.value and not force_retry:
            return build_smart_note_response(note)

        # Reset status for regeneration
        note.status = ProcessingStatus.PROCESSING.value
        note.error_message = None
        db.commit()
        db.refresh(note)
    else:
        note = SmartNote(
            lecture_id=lecture.id,
            status=ProcessingStatus.PROCESSING.value,
        )
        db.add(note)
        db.commit()
        db.refresh(note)

    background_tasks.add_task(process_notes_job, lecture.id)
    return build_smart_note_response(note)


@router.get(
    "/lectures/{lecture_id}/notes",
    response_model=SmartNoteResponse,
    summary="Retrieve AI Smart Notes for a lecture",
)
def get_smart_notes(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> SmartNoteResponse:
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecture not found.",
        )

    is_lecturer, _ = verify_classroom_access(lecture.subject, current_user.id, db)
    is_uploader = lecture.uploaded_by_id == current_user.id

    if lecture.approval_status != LectureStatus.APPROVED.value and not is_lecturer and not is_uploader:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Lecture recording has not been approved.",
        )

    note = db.query(SmartNote).filter(SmartNote.lecture_id == lecture.id).first()
    if not note:
        return SmartNoteResponse(
            lecture_id=lecture.id,
            status=ProcessingStatus.NOT_STARTED.value,
        )

    return build_smart_note_response(note)

