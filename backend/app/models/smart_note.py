from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.transcript import ProcessingStatus

if TYPE_CHECKING:
    from app.models.lecture import Lecture


class SmartNote(Base):
    __tablename__ = "smart_notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    lecture_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("lectures.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    overview: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content_markdown: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sections_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON-encoded 9 structured sections
    status: Mapped[str] = mapped_column(
        String(20), default=ProcessingStatus.NOT_STARTED.value, nullable=False, index=True
    )
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
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
    lecture: Mapped["Lecture"] = relationship("Lecture", back_populates="smart_note")

    def __repr__(self) -> str:
        return f"<SmartNote id={self.id} lecture_id={self.lecture_id} status={self.status}>"

