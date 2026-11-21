"""Pydantic schemas package."""
from app.schemas.ai import (
    GenerateNotesRequest,
    SegmentSchema,
    SmartNoteResponse,
    TranscribeRequest,
    TranscriptResponse,
    TranscriptUpdateRequest,
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
from app.schemas.subject import SubjectCreate, SubjectResponse, SubjectUpdate
from app.schemas.user import Token, TokenPayload, UserCreate, UserLogin, UserResponse, UserRole

__all__ = [
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
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "UserRole",
    "VoteResponse",
]
