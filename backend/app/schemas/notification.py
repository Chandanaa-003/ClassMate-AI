from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class NotificationResponse(BaseModel):
    id: int
    recipient_id: int
    title: str
    message: str
    notification_type: str
    classroom_id: Optional[int] = None
    classroom_name: Optional[str] = None
    subject_id: Optional[int] = None
    subject_name: Optional[str] = None
    resource_id: Optional[int] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    total: int
    unread_count: int
    limit: int
    skip: int


class UnreadCountResponse(BaseModel):
    unread_count: int


class MarkReadResponse(BaseModel):
    success: bool
    message: str
    unread_count: int

