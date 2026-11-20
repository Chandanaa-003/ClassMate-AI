"""Database models package."""
from app.models.classroom import Classroom, ClassroomMembership
from app.models.doubt import Answer, Doubt, Vote
from app.models.lecture import Lecture, LectureStatus
from app.models.smart_note import SmartNote
from app.models.subject import Subject
from app.models.transcript import ProcessingStatus, Transcript
from app.models.user import User, UserRole

__all__ = [
    "Answer",
    "Classroom",
    "ClassroomMembership",
    "Doubt",
    "Lecture",
    "LectureStatus",
    "ProcessingStatus",
    "SmartNote",
    "Subject",
    "Transcript",
    "User",
    "UserRole",
    "Vote",
]
