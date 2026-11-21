from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.announcement import Announcement
    from app.models.notification import Notification
    from app.models.subject import Subject
    from app.models.user import User


class Classroom(Base):
    __tablename__ = "classrooms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    join_code: Mapped[str] = mapped_column(String(16), unique=True, index=True, nullable=False)
    lecturer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
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
    lecturer: Mapped["User"] = relationship("User", back_populates="owned_classrooms")
    memberships: Mapped[List["ClassroomMembership"]] = relationship(
        "ClassroomMembership",
        back_populates="classroom",
        cascade="all, delete-orphan",
    )
    subjects: Mapped[List["Subject"]] = relationship(
        "Subject",
        back_populates="classroom",
        cascade="all, delete-orphan",
    )
    announcements: Mapped[List["Announcement"]] = relationship(
        "Announcement",
        back_populates="classroom",
        cascade="all, delete-orphan",
        order_by="desc(Announcement.created_at)",
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification",
        back_populates="classroom",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Classroom id={self.id} name={self.name} code={self.join_code}>"


class ClassroomMembership(Base):
    __tablename__ = "classroom_memberships"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    classroom_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Prevent a student from joining the same classroom twice at the database level
    __table_args__ = (
        UniqueConstraint("classroom_id", "user_id", name="uq_classroom_user_membership"),
    )

    # Relationships
    classroom: Mapped["Classroom"] = relationship("Classroom", back_populates="memberships")
    user: Mapped["User"] = relationship("User", back_populates="classroom_memberships")

    def __repr__(self) -> str:
        return f"<ClassroomMembership classroom_id={self.classroom_id} user_id={self.user_id}>"
