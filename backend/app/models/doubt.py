from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.subject import Subject
    from app.models.user import User


class Doubt(Base):
    __tablename__ = "doubts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    subject_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    author_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False)  # "open" or "resolved"
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
    subject: Mapped["Subject"] = relationship("Subject", back_populates="doubts")
    author: Mapped["User"] = relationship("User", back_populates="doubts")
    answers: Mapped[List["Answer"]] = relationship(
        "Answer",
        back_populates="doubt",
        cascade="all, delete-orphan",
        order_by="desc(Answer.is_accepted), desc(Answer.created_at)",
    )

    def __repr__(self) -> str:
        return f"<Doubt id={self.id} title={self.title[:30]} anon={self.is_anonymous}>"


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    doubt_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("doubts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    author_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_accepted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
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
    doubt: Mapped["Doubt"] = relationship("Doubt", back_populates="answers")
    author: Mapped["User"] = relationship("User", back_populates="answers")
    votes: Mapped[List["Vote"]] = relationship(
        "Vote",
        back_populates="answer",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Answer id={self.id} doubt_id={self.doubt_id} accepted={self.is_accepted}>"


class Vote(Base):
    __tablename__ = "votes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    answer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("answers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Prevent duplicate votes by the same user on the same answer
    __table_args__ = (
        UniqueConstraint("user_id", "answer_id", name="uq_user_answer_vote"),
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="votes")
    answer: Mapped["Answer"] = relationship("Answer", back_populates="votes")

    def __repr__(self) -> str:
        return f"<Vote id={self.id} user_id={self.user_id} answer_id={self.answer_id}>"

