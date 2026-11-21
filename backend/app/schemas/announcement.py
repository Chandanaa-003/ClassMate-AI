from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class AnnouncementCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Announcement title")
    content: str = Field(..., min_length=1, max_length=10000, description="Announcement content")
    subject_id: Optional[int] = Field(None, description="Optional subject ID if announcement is subject-specific")
    priority: str = Field("Normal", pattern="^(Normal|Important|Urgent)$", description="Priority level")


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1, max_length=10000)
    priority: Optional[str] = Field(None, pattern="^(Normal|Important|Urgent)$")


class AnnouncementResponse(BaseModel):
    id: int
    classroom_id: int
    classroom_name: Optional[str] = None
    subject_id: Optional[int] = None
    subject_name: Optional[str] = None
    lecturer_id: int
    lecturer_name: str
    title: str
    content: str
    priority: str
    created_at: datetime
    updated_at: datetime
    is_author: bool = False

    model_config = ConfigDict(from_attributes=True)

