from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class SubjectCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Subject name")
    code: Optional[str] = Field(default=None, max_length=20, description="Optional subject code, e.g. CS101")
    description: Optional[str] = Field(default=None, max_length=1000, description="Optional subject description")

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Subject name must be at least 2 characters long.")
        return cleaned

    @field_validator("code")
    @classmethod
    def clean_code(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip().upper()
            return cleaned if cleaned else None
        return None


class SubjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100, description="Updated subject name")
    code: Optional[str] = Field(default=None, max_length=20, description="Updated subject code")
    description: Optional[str] = Field(default=None, max_length=1000, description="Updated subject description")

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            if len(cleaned) < 2:
                raise ValueError("Subject name must be at least 2 characters long.")
            return cleaned
        return None

    @field_validator("code")
    @classmethod
    def clean_code(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            cleaned = v.strip().upper()
            return cleaned if cleaned else None
        return None


class SubjectResponse(BaseModel):
    id: int
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    classroom_id: int
    classroom_name: str
    created_by_id: int
    creator_name: str
    created_at: datetime
    updated_at: datetime
    is_lecturer: bool = False

    model_config = ConfigDict(from_attributes=True)

