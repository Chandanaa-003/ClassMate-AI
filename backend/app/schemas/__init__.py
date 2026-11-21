"""Pydantic schemas package."""
from app.schemas.ai import (
    GenerateNotesRequest,
    SegmentSchema,
    SmartNoteResponse,
    TranscribeRequest,
    TranscriptResponse,
    TranscriptUpdateRequest,
)
from app.schemas.announcement import (
    AnnouncementCreate,
    AnnouncementResponse,
    AnnouncementUpdate,
)
from app.schemas.classroom import (
    ClassroomCreate,
    ClassroomDetailResponse,
    ClassroomJoin,
    ClassroomMemberResponse,
    ClassroomResponse,
)
from app.schemas.doubt import (
    AnswerCreate,
    AnswerResponse,
    DoubtCreate,
    DoubtDetailResponse,
    DoubtResponse,
    VoteResponse,
)
from app.schemas.feedback import (
    AnonymizedFeedbackItem,
    ClassroomAnalyticsResponse,
    FeedbackCreate,
    FeedbackResponse,
    FeedbackUpdate,
    SubjectAnalyticsResponse,
)
from app.schemas.health import HealthCheckResponse
from app.schemas.lecture import LectureDeleteResponse, LectureResponse, LectureReviewRequest
from app.schemas.notification import (
    MarkReadResponse,
    NotificationListResponse,
    NotificationResponse,
    UnreadCountResponse,
)
from app.schemas.subject import SubjectCreate, SubjectResponse, SubjectUpdate
from app.schemas.user import Token, TokenPayload, UserCreate, UserLogin, UserResponse, UserRole

__all__ = [
    "AnnouncementCreate",
    "AnnouncementResponse",
    "AnnouncementUpdate",
    "AnonymizedFeedbackItem",
    "AnswerCreate",
    "AnswerResponse",
    "ClassroomAnalyticsResponse",
    "ClassroomCreate",
    "ClassroomDetailResponse",
    "ClassroomJoin",
    "ClassroomMemberResponse",
    "ClassroomResponse",
    "DoubtCreate",
    "DoubtDetailResponse",
    "DoubtResponse",
    "FeedbackCreate",
    "FeedbackResponse",
    "FeedbackUpdate",
    "GenerateNotesRequest",
    "HealthCheckResponse",
    "MarkReadResponse",
    "NotificationListResponse",
    "NotificationResponse",
    "SubjectAnalyticsResponse",
    "LectureDeleteResponse",
    "LectureResponse",
    "LectureReviewRequest",
    "SegmentSchema",
    "SmartNoteResponse",
    "SubjectCreate",
    "SubjectResponse",
    "SubjectUpdate",
    "Token",
    "TokenPayload",
    "TranscribeRequest",
    "TranscriptResponse",
    "TranscriptUpdateRequest",
    "UnreadCountResponse",
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "UserRole",
    "VoteResponse",
]
