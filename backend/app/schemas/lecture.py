from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator


class LectureBase(BaseModel):
    title: str
    description: Optional[str] = None
    duration: Optional[float] = None


class LectureResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    subject_id: int
    duration: Optional[float] = None
    approval_status: str
    rejection_reason: Optional[str] = None
    uploader_name: str
    uploader_role: str
    is_uploader: bool
    can_review: bool
    can_delete: bool
    audio_url: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LectureReviewRequest(BaseModel):
    status: str  # "APPROVED" or "REJECTED"
    rejection_reason: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        normalized = v.strip().upper()
        if normalized not in ("APPROVED", "REJECTED", "PENDING"):
            raise ValueError("Status must be 'APPROVED' or 'REJECTED'")
        return normalized


class LectureDeleteResponse(BaseModel):
    message: str
    id: int

