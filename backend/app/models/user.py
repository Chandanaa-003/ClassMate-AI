from datetime import datetime, timezone
import enum
from typing import List, TYPE_CHECKING
from sqlalchemy import Boolean, DateTime, Enum as SAEnum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.classroom import Classroom, ClassroomMembership
    from app.models.doubt import Answer, Doubt, Vote
    from app.models.subject import Subject


class UserRole(str, enum.Enum):
    STUDENT = "student"
    LECTURER = "lecturer"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, values_callable=lambda obj: [e.value for e in obj], native_enum=False),
        default=UserRole.STUDENT,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
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
    owned_classrooms: Mapped[List["Classroom"]] = relationship(
        "Classroom",
        back_populates="lecturer",
        cascade="all, delete-orphan",
    )
    classroom_memberships: Mapped[List["ClassroomMembership"]] = relationship(
        "ClassroomMembership",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    created_subjects: Mapped[List["Subject"]] = relationship(
        "Subject",
        back_populates="creator",
        cascade="all, delete-orphan",
    )
    doubts: Mapped[List["Doubt"]] = relationship(
        "Doubt",
        back_populates="author",
        cascade="all, delete-orphan",
    )
    answers: Mapped[List["Answer"]] = relationship(
        "Answer",
        back_populates="author",
        cascade="all, delete-orphan",
    )
    votes: Mapped[List["Vote"]] = relationship(
        "Vote",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
