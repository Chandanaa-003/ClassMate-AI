from datetime import datetime, timezone
import enum
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.classroom import Classroom
    from app.models.subject import Subject
    from app.models.user import User


class NotificationType(str, enum.Enum):
    ANNOUNCEMENT = "announcement"
    LECTURE_APPROVED = "lecture_approved"
    LECTURE_UPLOADED = "lecture_uploaded"
    SMART_NOTES_READY = "smart_notes_ready"
    DOUBT_ANSWERED = "doubt_answered"
    ANSWER_ACCEPTED = "answer_accepted"
    FEEDBACK_SUBMITTED = "feedback_submitted"
    DOUBT_CREATED = "doubt_created"
    CLASSROOM_UPDATE = "classroom_update"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    recipient_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    classroom_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=True, index=True
    )
    subject_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=True, index=True
    )
    resource_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    # Relationships
    recipient: Mapped["User"] = relationship("User", back_populates="notifications")
    classroom: Mapped[Optional["Classroom"]] = relationship("Classroom", back_populates="notifications")
    subject: Mapped[Optional["Subject"]] = relationship("Subject", back_populates="notifications")

    def __repr__(self) -> str:
        return f"<Notification id={self.id} recipient_id={self.recipient_id} type={self.notification_type} is_read={self.is_read}>"

