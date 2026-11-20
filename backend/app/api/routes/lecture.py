from pathlib import Path
from typing import List, Optional, Tuple
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Security, UploadFile, status
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user, security_scheme
from app.core.security import decode_access_token
from app.core.storage import (
    delete_audio_file,
    get_audio_file_path,
    save_audio_file,
)
from app.db.session import get_db
from app.models.classroom import ClassroomMembership
from app.models.lecture import Lecture, LectureStatus
from app.models.subject import Subject
from app.models.user import User, UserRole
from app.schemas.lecture import (
    LectureDeleteResponse,
    LectureResponse,
    LectureReviewRequest,
)

router = APIRouter(tags=["Lectures & Recordings"])


def verify_classroom_access(subject: Subject, user_id: int, db: Session) -> Tuple[bool, bool]:
    """
    Verify if user is the lecturer or an enrolled member of the subject's classroom.
    Returns: (is_lecturer, is_member)
    """
    classroom = subject.classroom
    is_lecturer = classroom.lecturer_id == user_id
    is_member = False
    if not is_lecturer:
        membership = (
            db.query(ClassroomMembership)
            .filter(
                ClassroomMembership.classroom_id == classroom.id,
                ClassroomMembership.user_id == user_id,
            )
            .first()
        )
        is_member = membership is not None

    if not is_lecturer and not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not belong to this classroom.",
        )

    return is_lecturer, is_member


def build_lecture_response(lecture: Lecture, current_user_id: int, is_lecturer: bool) -> LectureResponse:
    """Serialize Lecture model into client response schema with authorization flags."""
    uploader_name = lecture.uploader.full_name if lecture.uploader else "Unknown"
    uploader_role = lecture.uploader.role.value if lecture.uploader else "student"
    is_uploader = lecture.uploaded_by_id == current_user_id

    # Can review if current user is the classroom lecturer
    can_review = is_lecturer
    # Can delete if current user is uploader or classroom lecturer
    can_delete = is_uploader or is_lecturer

    return LectureResponse(
        id=lecture.id,
        title=lecture.title,
        description=lecture.description,
        subject_id=lecture.subject_id,
        duration=lecture.duration,
        approval_status=lecture.approval_status,
        rejection_reason=lecture.rejection_reason,
        uploader_name=uploader_name,
        uploader_role=uploader_role,
        is_uploader=is_uploader,
        can_review=can_review,
        can_delete=can_delete,
        audio_url=f"/api/v1/lectures/{lecture.id}/audio",
        created_at=lecture.created_at,
        updated_at=lecture.updated_at,
    )


def get_audio_media_type(filename: str) -> str:
    """Map audio file extension to appropriate MIME type for streaming."""
    ext = Path(filename).suffix.lower()
    mapping = {
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".webm": "audio/webm",
        ".ogg": "audio/ogg",
        ".m4a": "audio/mp4",
        ".aac": "audio/aac",
        ".mp4": "audio/mp4",
    }
    return mapping.get(ext, "audio/mpeg")


@router.post(
    "/subjects/{subject_id}/lectures/upload",
    response_model=LectureResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a lecture audio recording to a subject",
)
def upload_lecture(
    subject_id: int,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    duration: Optional[float] = Form(None),
    status_override: Optional[str] = Form(None, alias="status"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> LectureResponse:
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found.",
        )

    is_lecturer, _ = verify_classroom_access(subject, current_user.id, db)

    clean_title = title.strip()
    if not clean_title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lecture title cannot be empty.",
        )

    # Safely write audio to disk & enforce file constraints
    stored_filename, file_size = save_audio_file(file)

    # Determine initial approval status:
    # If the classroom lecturer uploads and requests approval (e.g. from UI toggle), allow direct approval
    approval_status = LectureStatus.PENDING.value
    if is_lecturer and status_override:
        if status_override.strip().upper() == LectureStatus.APPROVED.value:
            approval_status = LectureStatus.APPROVED.value

    clean_desc = description.strip() if description and description.strip() else None

    lecture = Lecture(
        title=clean_title,
        description=clean_desc,
        subject_id=subject.id,
        uploaded_by_id=current_user.id,
        audio_file_path=stored_filename,
        file_size_bytes=file_size,
        duration=duration,
        approval_status=approval_status,
    )
    db.add(lecture)
    db.commit()
    db.refresh(lecture)

    return build_lecture_response(lecture, current_user.id, is_lecturer)


@router.get(
    "/subjects/{subject_id}/lectures",
    response_model=List[LectureResponse],
    summary="List lectures in a subject with role-based approval visibility",
)
def list_lectures(
    subject_id: int,
    status_filter: Optional[str] = Query(None, alias="status"),
    mine: bool = Query(False, description="Filter only current user uploads"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[LectureResponse]:
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found.",
        )

    is_lecturer, _ = verify_classroom_access(subject, current_user.id, db)

    query = db.query(Lecture).filter(Lecture.subject_id == subject.id)

    if is_lecturer:
        # Classroom lecturer can inspect all lectures in their classroom
        if status_filter:
            norm_status = status_filter.strip().upper()
            query = query.filter(Lecture.approval_status == norm_status)
        if mine:
            query = query.filter(Lecture.uploaded_by_id == current_user.id)
    else:
        # Students:
        if mine:
            # When viewing their own uploads, students can see their own PENDING, APPROVED, or REJECTED
            query = query.filter(Lecture.uploaded_by_id == current_user.id)
            if status_filter:
                norm_status = status_filter.strip().upper()
                query = query.filter(Lecture.approval_status == norm_status)
        else:
            # Public library: Students MUST ONLY see APPROVED lectures
            if status_filter and status_filter.strip().upper() != LectureStatus.APPROVED.value:
                # If a student requests pending/rejected with mine=False, only show their own
                query = query.filter(
                    Lecture.approval_status == status_filter.strip().upper(),
                    Lecture.uploaded_by_id == current_user.id,
                )
            else:
                query = query.filter(Lecture.approval_status == LectureStatus.APPROVED.value)

    lectures = query.order_by(Lecture.created_at.desc()).all()
    return [build_lecture_response(lec, current_user.id, is_lecturer) for lec in lectures]


@router.get(
    "/lectures/{lecture_id}",
    response_model=LectureResponse,
    summary="Retrieve details of a single lecture",
)
def get_lecture(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> LectureResponse:
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecture not found.",
        )

    is_lecturer, _ = verify_classroom_access(lecture.subject, current_user.id, db)
    is_uploader = lecture.uploaded_by_id == current_user.id

    # If not approved, only uploader and classroom lecturer may access details
    if lecture.approval_status != LectureStatus.APPROVED.value and not is_lecturer and not is_uploader:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: This lecture recording has not been approved.",
        )

    return build_lecture_response(lecture, current_user.id, is_lecturer)


@router.get(
    "/lectures/{lecture_id}/audio",
    summary="Stream or download the audio file of a lecture",
)
def stream_lecture_audio(
    lecture_id: int,
    token: Optional[str] = Query(None, description="Auth token for HTML5 audio tags"),
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_scheme),
    db: Session = Depends(get_db),
):
    # Authenticate via Bearer header or token query parameter
    current_user: Optional[User] = None
    raw_token = None
    if credentials and credentials.credentials:
        raw_token = credentials.credentials
    elif token:
        raw_token = token

    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials required to access audio.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(raw_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if user_id:
        try:
            current_user = db.query(User).filter(User.id == int(user_id)).first()
        except ValueError:
            current_user = db.query(User).filter(User.email == user_id).first()

    if not current_user or not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user account is invalid or inactive.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecture not found.",
        )

    is_lecturer, _ = verify_classroom_access(lecture.subject, current_user.id, db)
    is_uploader = lecture.uploaded_by_id == current_user.id

    # Privacy enforcement: Pending or rejected audio can ONLY be played by uploader or lecturer
    if lecture.approval_status != LectureStatus.APPROVED.value and not is_lecturer and not is_uploader:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: This lecture recording has not been approved.",
        )

    file_path = get_audio_file_path(lecture.audio_file_path)
    media_type = get_audio_media_type(lecture.audio_file_path)

    # Sanitize title for content disposition header
    safe_title = "".join(c for c in lecture.title if c.isalnum() or c in (" ", "-", "_")).strip()
    ext = Path(lecture.audio_file_path).suffix
    download_filename = f"{safe_title}{ext}" if safe_title else f"lecture_{lecture.id}{ext}"

    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        headers={
            "Accept-Ranges": "bytes",
            "Content-Disposition": f'inline; filename="{download_filename}"',
        },
    )


@router.patch(
    "/lectures/{lecture_id}/review",
    response_model=LectureResponse,
    summary="Lecturer review: Approve or reject an uploaded lecture recording",
)
def review_lecture(
    lecture_id: int,
    review_in: LectureReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> LectureResponse:
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecture not found.",
        )

    # Only the lecturer who owns the classroom can approve or reject
    if lecture.subject.classroom.lecturer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the lecturer responsible for this classroom can review lectures.",
        )

    new_status = review_in.status.upper()
    lecture.approval_status = new_status

    if new_status == LectureStatus.REJECTED.value:
        lecture.rejection_reason = (
            review_in.rejection_reason.strip() if review_in.rejection_reason and review_in.rejection_reason.strip() else "Rejected by instructor."
        )
    elif new_status == LectureStatus.APPROVED.value:
        lecture.rejection_reason = None

    db.commit()
    db.refresh(lecture)

    return build_lecture_response(lecture, current_user.id, is_lecturer=True)


@router.delete(
    "/lectures/{lecture_id}",
    response_model=LectureDeleteResponse,
    summary="Delete a lecture recording and its audio file",
)
def delete_lecture(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> LectureDeleteResponse:
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecture not found.",
        )

    is_uploader = lecture.uploaded_by_id == current_user.id
    is_lecturer = lecture.subject.classroom.lecturer_id == current_user.id

    if not is_uploader and not is_lecturer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this lecture.",
        )

    # Remove audio file from disk
    delete_audio_file(lecture.audio_file_path)

    deleted_id = lecture.id
    db.delete(lecture)
    db.commit()

    return LectureDeleteResponse(
        message="Lecture deleted successfully.",
        id=deleted_id,
    )

