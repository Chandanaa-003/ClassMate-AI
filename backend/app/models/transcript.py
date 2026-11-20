from datetime import datetime, timezone
import enum
from typing import Optional, TYPE_CHECKING
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.lecture import Lecture


class ProcessingStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class Transcript(Base):
    __tablename__ = "transcripts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    lecture_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("lectures.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    transcript_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    language: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default=ProcessingStatus.NOT_STARTED.value, nullable=False, index=True
    )
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    segments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON-encoded array of segment dicts
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
    lecture: Mapped["Lecture"] = relationship("Lecture", back_populates="transcript")

    def __repr__(self) -> str:
        return f"<Transcript id={self.id} lecture_id={self.lecture_id} status={self.status}>"

