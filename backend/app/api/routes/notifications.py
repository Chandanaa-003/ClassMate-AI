from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import (
    MarkReadResponse,
    NotificationListResponse,
    NotificationResponse,
    UnreadCountResponse,
)

router = APIRouter(tags=["Notifications"])


def serialize_notification(n: Notification) -> NotificationResponse:
    classroom_name = n.classroom.name if n.classroom else None
    subject_name = n.subject.name if n.subject else None
    return NotificationResponse(
        id=n.id,
        recipient_id=n.recipient_id,
        title=n.title,
        message=n.message,
        notification_type=n.notification_type,
        classroom_id=n.classroom_id,
        classroom_name=classroom_name,
        subject_id=n.subject_id,
        subject_name=subject_name,
        resource_id=n.resource_id,
        is_read=n.is_read,
        created_at=n.created_at,
    )


@router.get(
    "/notifications",
    response_model=NotificationListResponse,
    summary="List current user's notifications (supports pagination & read filter)",
)
def get_notifications(
    is_read: Optional[bool] = Query(None, description="Filter by read status (true/false)"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    skip: int = Query(0, ge=0, description="Items to skip"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> NotificationListResponse:
    query = db.query(Notification).filter(Notification.recipient_id == current_user.id)
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)

    total = query.count()
    items = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

    unread_count = (
        db.query(func.count(Notification.id))
        .filter(
            Notification.recipient_id == current_user.id,
            Notification.is_read == False,
        )
        .scalar()
        or 0
    )

    return NotificationListResponse(
        items=[serialize_notification(item) for item in items],
        total=total,
        unread_count=unread_count,
        limit=limit,
        skip=skip,
    )


@router.get(
    "/notifications/unread-count",
    response_model=UnreadCountResponse,
    summary="Get unread notifications count for badge indicators",
)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> UnreadCountResponse:
    count = (
        db.query(func.count(Notification.id))
        .filter(
            Notification.recipient_id == current_user.id,
            Notification.is_read == False,
        )
        .scalar()
        or 0
    )
    return UnreadCountResponse(unread_count=count)


@router.patch(
    "/notifications/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark single notification as read",
)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> NotificationResponse:
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id)
        .first()
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )
    if notification.recipient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You cannot modify another user's notification.",
        )

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return serialize_notification(notification)


@router.patch(
    "/notifications/read-all",
    response_model=MarkReadResponse,
    summary="Mark all user notifications as read",
)
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> MarkReadResponse:
    db.query(Notification).filter(
        Notification.recipient_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()

    return MarkReadResponse(
        success=True,
        message="All notifications marked as read.",
        unread_count=0,
    )


@router.delete(
    "/notifications/{notification_id}",
    summary="Delete a notification",
)
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id)
        .first()
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )
    if notification.recipient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You cannot delete another user's notification.",
        )

    db.delete(notification)
    db.commit()
    return {"success": True, "message": "Notification deleted successfully."}

