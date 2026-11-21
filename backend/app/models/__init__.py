"""Database models package."""
from app.models.announcement import Announcement, AnnouncementPriority
from app.models.classroom import Classroom, ClassroomMembership
from app.models.doubt import Answer, Doubt, Vote
from app.models.feedback import Feedback
from app.models.lecture import Lecture, LectureStatus
from app.models.notification import Notification, NotificationType
from app.models.smart_note import SmartNote
from app.models.subject import Subject
from app.models.transcript import ProcessingStatus, Transcript
from app.models.user import User, UserRole

__all__ = [
    "Announcement",
    "AnnouncementPriority",
    "Answer",
    "Classroom",
    "ClassroomMembership",
    "Doubt",
    "Feedback",
    "Lecture",
    "LectureStatus",
    "Notification",
    "NotificationType",
    "ProcessingStatus",
    "SmartNote",
    "Subject",
    "Transcript",
    "User",
    "UserRole",
    "Vote",
]
