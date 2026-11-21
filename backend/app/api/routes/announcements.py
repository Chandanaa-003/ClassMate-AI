from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.announcement import Announcement
from app.models.classroom import Classroom, ClassroomMembership
from app.models.subject import Subject
from app.models.user import User, UserRole
from app.schemas.announcement import (
    AnnouncementCreate,
    AnnouncementResponse,
    AnnouncementUpdate,
)
from app.services.notification import notify_classroom_members

router = APIRouter(tags=["Announcements"])


def verify_classroom_membership(
    db: Session, classroom_id: int, user_id: int
) -> tuple[Classroom, bool]:
    """
    Verify user is either the owner lecturer or an enrolled member.
    Returns: (classroom, is_lecturer)
    """
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found.",
        )

    is_lecturer = classroom.lecturer_id == user_id
    if is_lecturer:
        return classroom, True

    membership = (
        db.query(ClassroomMembership)
        .filter(
            ClassroomMembership.classroom_id == classroom_id,
            ClassroomMembership.user_id == user_id,
        )
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not a member of this classroom.",
        )

    return classroom, False


def serialize_announcement(a: Announcement, current_user_id: int) -> AnnouncementResponse:
    lecturer_name = a.lecturer.full_name if a.lecturer else "Instructor"
    classroom_name = a.classroom.name if a.classroom else None
    subject_name = a.subject.name if a.subject else None
    return AnnouncementResponse(
        id=a.id,
        classroom_id=a.classroom_id,
        classroom_name=classroom_name,
        subject_id=a.subject_id,
        subject_name=subject_name,
        lecturer_id=a.lecturer_id,
        lecturer_name=lecturer_name,
        title=a.title,
        content=a.content,
        priority=a.priority,
        created_at=a.created_at,
        updated_at=a.updated_at,
        is_author=a.lecturer_id == current_user_id,
    )


@router.post(
    "/classrooms/{classroom_id}/announcements",
    response_model=AnnouncementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Publish a new announcement (Lecturer only)",
)
def create_announcement(
    classroom_id: int,
    payload: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> AnnouncementResponse:
    classroom, is_lecturer = verify_classroom_membership(db, classroom_id, current_user.id)
    if not is_lecturer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the classroom lecturer can publish announcements.",
        )

    subject_name = None
    if payload.subject_id is not None:
        subject = db.query(Subject).filter(Subject.id == payload.subject_id).first()
        if not subject or subject.classroom_id != classroom_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid subject ID for this classroom.",
            )
        subject_name = subject.name

    announcement = Announcement(
        title=payload.title.strip(),
        content=payload.content.strip(),
        classroom_id=classroom_id,
        subject_id=payload.subject_id,
        lecturer_id=current_user.id,
        priority=payload.priority,
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)

    # Broadcast notification to enrolled members
    prefix = f"[{payload.priority}] " if payload.priority in ("Important", "Urgent") else ""
    target_scope = f" in {subject_name}" if subject_name else f" in {classroom.name}"
    notif_title = f"{prefix}New Announcement{target_scope}"
    snippet = payload.content[:150] + ("..." if len(payload.content) > 150 else "")
    notif_message = f"{payload.title}: {snippet}"

    notify_classroom_members(
        db=db,
        classroom_id=classroom_id,
        title=notif_title,
        message=notif_message,
        notification_type="announcement",
        exclude_user_id=current_user.id,
        subject_id=payload.subject_id,
        resource_id=announcement.id,
    )

    return serialize_announcement(announcement, current_user.id)


@router.get(
    "/classrooms/{classroom_id}/announcements",
    response_model=List[AnnouncementResponse],
    summary="List classroom announcements",
)
def get_classroom_announcements(
    classroom_id: int,
    subject_id: Optional[int] = Query(None, description="Filter announcements by subject"),
    include_general: bool = Query(True, description="When subject_id is specified, also include classroom-wide announcements"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[AnnouncementResponse]:
    verify_classroom_membership(db, classroom_id, current_user.id)

    query = db.query(Announcement).filter(Announcement.classroom_id == classroom_id)
    if subject_id is not None:
        if include_general:
            query = query.filter(
                (Announcement.subject_id == subject_id) | (Announcement.subject_id == None)
            )
        else:
            query = query.filter(Announcement.subject_id == subject_id)

    announcements = query.order_by(Announcement.created_at.desc()).all()
    return [serialize_announcement(a, current_user.id) for a in announcements]


@router.get(
    "/announcements/{announcement_id}",
    response_model=AnnouncementResponse,
    summary="Get single announcement details",
)
def get_announcement_detail(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> AnnouncementResponse:
    announcement = (
        db.query(Announcement)
        .filter(Announcement.id == announcement_id)
        .first()
    )
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found.",
        )

    verify_classroom_membership(db, announcement.classroom_id, current_user.id)
    return serialize_announcement(announcement, current_user.id)


@router.put(
    "/announcements/{announcement_id}",
    response_model=AnnouncementResponse,
    summary="Update announcement (Lecturer owner only)",
)
def update_announcement(
    announcement_id: int,
    payload: AnnouncementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> AnnouncementResponse:
    announcement = (
        db.query(Announcement)
        .filter(Announcement.id == announcement_id)
        .first()
    )
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found.",
        )

    classroom = announcement.classroom
    if classroom.lecturer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the classroom lecturer can edit this announcement.",
        )

    if payload.title is not None:
        announcement.title = payload.title.strip()
    if payload.content is not None:
        announcement.content = payload.content.strip()
    if payload.priority is not None:
        announcement.priority = payload.priority

    db.commit()
    db.refresh(announcement)
    return serialize_announcement(announcement, current_user.id)


@router.delete(
    "/announcements/{announcement_id}",
    summary="Delete announcement (Lecturer owner only)",
)
def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    announcement = (
        db.query(Announcement)
        .filter(Announcement.id == announcement_id)
        .first()
    )
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found.",
        )

    classroom = announcement.classroom
    if classroom.lecturer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the classroom lecturer can delete this announcement.",
        )

    db.delete(announcement)
    db.commit()
    return {"success": True, "message": "Announcement deleted successfully."}

