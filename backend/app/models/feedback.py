from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.subject import Subject
    from app.models.user import User


class Feedback(Base):
    __tablename__ = "feedbacks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    subject_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # Student ID is stored privately to enforce one submission per student per period.
    # It must NEVER be exposed in public or lecturer-facing APIs.
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    overall_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    teaching_clarity_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    lecture_pace_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    concept_understanding_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    positive_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    improvement_suggestions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    additional_comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    feedback_period: Mapped[str] = mapped_column(
        String(50), default="general", nullable=False, index=True
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

    # Prevent duplicate submissions by the same student for the same subject in the same period
    __table_args__ = (
        UniqueConstraint(
            "subject_id", "student_id", "feedback_period", name="uq_subject_student_period_feedback"
        ),
    )

    # Relationships
    subject: Mapped["Subject"] = relationship("Subject", back_populates="feedbacks")
    student: Mapped["User"] = relationship("User", back_populates="feedbacks")

    def __repr__(self) -> str:
        return f"<Feedback id={self.id} subject_id={self.subject_id} period={self.feedback_period}>"

