from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class DoubtCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200, description="Question title")
    description: str = Field(..., min_length=5, max_length=5000, description="Detailed question description")
    is_anonymous: bool = Field(default=True, description="Post anonymously (default: True)")

    @field_validator("title")
    @classmethod
    def clean_title(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 3:
            raise ValueError("Title must be at least 3 characters long.")
        return cleaned

    @field_validator("description")
    @classmethod
    def clean_description(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 5:
            raise ValueError("Description must be at least 5 characters long.")
        return cleaned


class AnswerCreate(BaseModel):
    content: str = Field(..., min_length=2, max_length=5000, description="Answer content")
    is_anonymous: bool = Field(default=False, description="Post answer anonymously (default: False)")

    @field_validator("content")
    @classmethod
    def clean_content(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Answer must be at least 2 characters long.")
        return cleaned


class AnswerResponse(BaseModel):
    id: int
    doubt_id: int
    content: str
    is_anonymous: bool
    author_name: str
    author_role: Optional[str] = None
    is_author: bool = False
    is_accepted: bool = False
    vote_count: int = 0
    has_voted: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DoubtResponse(BaseModel):
    id: int
    subject_id: int
    title: str
    description: str
    is_anonymous: bool
    status: str
    author_name: str
    author_role: Optional[str] = None
    is_author: bool = False
    can_moderate: bool = False
    answer_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DoubtDetailResponse(DoubtResponse):
    answers: List[AnswerResponse] = []


class VoteResponse(BaseModel):
    answer_id: int
    vote_count: int
    has_voted: bool
    message: str

