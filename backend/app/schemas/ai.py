from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class SegmentSchema(BaseModel):
    id: int
    start: float
    end: float
    text: str


class TranscriptResponse(BaseModel):
    id: Optional[int] = None
    lecture_id: int
    transcript_text: Optional[str] = None
    language: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    segments: List[SegmentSchema] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TranscriptUpdateRequest(BaseModel):
    transcript_text: str


class TranscribeRequest(BaseModel):
    force_retry: bool = False
    language: Optional[str] = None


class GenerateNotesRequest(BaseModel):
    force_retry: bool = False


class SmartNoteResponse(BaseModel):
    id: Optional[int] = None
    lecture_id: int
    overview: Optional[str] = None
    content_markdown: Optional[str] = None
    sections: Optional[Dict[str, Any]] = None
    status: str
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

