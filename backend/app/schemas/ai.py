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


class ChatSourceItem(BaseModel):
    lecture_id: int
    lecture_title: str
    timestamp: str
    start: float
    snippet: str


class ChatMessageSchema(BaseModel):
    id: int
    conversation_id: int
    sender: str
    content: str
    sources: List[ChatSourceItem] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatRequest(BaseModel):
    question: str
    conversation_id: Optional[int] = None
    lecture_id: Optional[int] = None


class ChatResponse(BaseModel):
    conversation_id: int
    message_id: int
    answer: str
    sources: List[ChatSourceItem] = []
    is_grounded: bool = True
    created_at: datetime


class ConversationResponse(BaseModel):
    id: int
    title: str
    subject_id: Optional[int] = None
    lecture_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageSchema] = []

    model_config = ConfigDict(from_attributes=True)
