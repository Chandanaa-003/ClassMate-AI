from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class ClassroomCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Name of the classroom")
    description: Optional[str] = Field(default=None, max_length=500, description="Optional description of the classroom")

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Classroom name must be at least 2 characters long.")
        return cleaned


class ClassroomJoin(BaseModel):
    join_code: str = Field(..., min_length=4, max_length=20, description="Classroom join code")

    @field_validator("join_code")
    @classmethod
    def normalize_code(cls, v: str) -> str:
        return v.strip().upper()


class ClassroomMemberResponse(BaseModel):
    id: int = Field(..., description="Membership record ID")
    user_id: int = Field(..., description="Student user ID")
    email: str = Field(..., description="Student email")
    full_name: str = Field(..., description="Student full name")
    role: str = Field(..., description="User role ('student')")
    joined_at: datetime = Field(..., description="Timestamp when the student joined")

    model_config = ConfigDict(from_attributes=True)


class ClassroomResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    join_code: str
    lecturer_id: int
    lecturer_name: str
    lecturer_email: str
    member_count: int = 0
    created_at: datetime
    updated_at: datetime
    is_lecturer: bool = False

    model_config = ConfigDict(from_attributes=True)


class ClassroomDetailResponse(ClassroomResponse):
    members: List[ClassroomMemberResponse] = []

