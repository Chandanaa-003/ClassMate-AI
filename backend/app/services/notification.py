from datetime import datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.classroom import ClassroomMembership
from app.models.notification import Notification


def create_notification(
    db: Session,
    recipient_id: int,
    title: str,
    message: str,
    notification_type: str,
    classroom_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    resource_id: Optional[int] = None,
    dedup_window_minutes: int = 10,
) -> Optional[Notification]:
    """
    Create a notification for a user with duplicate prevention.
    If an identical notification for (recipient, type, resource) was created recently,
    returns the existing record rather than creating a duplicate.
    """
    # Duplicate prevention query
    query = db.query(Notification).filter(
        Notification.recipient_id == recipient_id,
        Notification.notification_type == notification_type,
    )
    if resource_id is not None:
        query = query.filter(Notification.resource_id == resource_id)
    if classroom_id is not None:
        query = query.filter(Notification.classroom_id == classroom_id)
    if subject_id is not None:
        query = query.filter(Notification.subject_id == subject_id)

    # Check recent window or unread status
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=dedup_window_minutes)
    existing = query.filter(
        (Notification.is_read == False) | (Notification.created_at >= cutoff)
    ).first()

    if existing:
        return existing

    notification = Notification(
        recipient_id=recipient_id,
        title=title,
        message=message,
        notification_type=notification_type,
        classroom_id=classroom_id,
        subject_id=subject_id,
        resource_id=resource_id,
        is_read=False,
    )
    db.add(notification)
    try:
        db.commit()
        db.refresh(notification)
        return notification
    except Exception:
        db.rollback()
        return None


def notify_classroom_members(
    db: Session,
    classroom_id: int,
    title: str,
    message: str,
    notification_type: str,
    exclude_user_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    resource_id: Optional[int] = None,
) -> List[Notification]:
    """
    Broadcast a notification to all enrolled student members in a classroom.
    """
    memberships = (
        db.query(ClassroomMembership)
        .filter(ClassroomMembership.classroom_id == classroom_id)
        .all()
    )

    created_notifications: List[Notification] = []
    for m in memberships:
        if exclude_user_id is not None and m.user_id == exclude_user_id:
            continue
        notif = create_notification(
            db=db,
            recipient_id=m.user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            classroom_id=classroom_id,
            subject_id=subject_id,
            resource_id=resource_id,
        )
        if notif:
            created_notifications.append(notif)

    return created_notifications

