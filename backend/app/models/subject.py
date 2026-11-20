from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.classroom import Classroom
    from app.models.user import User


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    classroom_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_by_id: Mapped[int] = mapped_column(
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

    # Prevent duplicate subject names within the same classroom
    __table_args__ = (
        UniqueConstraint("classroom_id", "name", name="uq_classroom_subject_name"),
    )

    # Relationships
    classroom: Mapped["Classroom"] = relationship("Classroom", back_populates="subjects")
    creator: Mapped["User"] = relationship("User", back_populates="created_subjects")

    def __repr__(self) -> str:
        return f"<Subject id={self.id} name={self.name} classroom_id={self.classroom_id}>"

