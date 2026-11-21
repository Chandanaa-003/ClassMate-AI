from datetime import datetime, timezone
import enum
from typing import Optional, TYPE_CHECKING
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.classroom import Classroom
    from app.models.subject import Subject
    from app.models.user import User


class AnnouncementPriority(str, enum.Enum):
    NORMAL = "Normal"
    IMPORTANT = "Important"
    URGENT = "Urgent"


class Announcement(Base):
    __tablename__ = "announcements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    classroom_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    subject_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=True, index=True
    )
    lecturer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    priority: Mapped[str] = mapped_column(
        String(20), default=AnnouncementPriority.NORMAL.value, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    classroom: Mapped["Classroom"] = relationship("Classroom", back_populates="announcements")
    subject: Mapped[Optional["Subject"]] = relationship("Subject", back_populates="announcements")
    lecturer: Mapped["User"] = relationship("User", back_populates="announcements")

    def __repr__(self) -> str:
        return f"<Announcement id={self.id} title={self.title} classroom_id={self.classroom_id} priority={self.priority}>"

