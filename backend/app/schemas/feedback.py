from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class FeedbackCreate(BaseModel):
    overall_rating: int = Field(..., ge=1, le=5, description="Overall satisfaction rating (1-5 stars)")
    teaching_clarity_rating: int = Field(..., ge=1, le=5, description="Teaching clarity rating (1-5 stars)")
    lecture_pace_rating: int = Field(..., ge=1, le=5, description="Lecture pace rating (1-5 stars)")
    concept_understanding_rating: int = Field(..., ge=1, le=5, description="Concept understanding rating (1-5 stars)")
    positive_feedback: Optional[str] = Field(None, max_length=2000, description="What did you like about the teaching?")
    improvement_suggestions: Optional[str] = Field(None, max_length=2000, description="What should be improved?")
    additional_comments: Optional[str] = Field(None, max_length=2000, description="Additional comments or suggestions")
    feedback_period: Optional[str] = Field("general", max_length=50, description="Evaluation period (e.g. general, midterm, end-term)")


class FeedbackUpdate(BaseModel):
    overall_rating: Optional[int] = Field(None, ge=1, le=5)
    teaching_clarity_rating: Optional[int] = Field(None, ge=1, le=5)
    lecture_pace_rating: Optional[int] = Field(None, ge=1, le=5)
    concept_understanding_rating: Optional[int] = Field(None, ge=1, le=5)
    positive_feedback: Optional[str] = Field(None, max_length=2000)
    improvement_suggestions: Optional[str] = Field(None, max_length=2000)
    additional_comments: Optional[str] = Field(None, max_length=2000)


class FeedbackResponse(BaseModel):
    id: int
    subject_id: int
    overall_rating: int
    teaching_clarity_rating: int
    lecture_pace_rating: int
    concept_understanding_rating: int
    positive_feedback: Optional[str] = None
    improvement_suggestions: Optional[str] = None
    additional_comments: Optional[str] = None
    feedback_period: str
    is_owner: bool = True
    created_at: datetime
    updated_at: datetime

    # IMPORTANT: Zero exposure of student_id or user identity!
    model_config = ConfigDict(from_attributes=True)


class AnonymizedFeedbackItem(BaseModel):
    id: int
    overall_rating: int
    teaching_clarity_rating: int
    lecture_pace_rating: int
    concept_understanding_rating: int
    positive_feedback: Optional[str] = None
    improvement_suggestions: Optional[str] = None
    additional_comments: Optional[str] = None
    feedback_period: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SubjectAnalyticsResponse(BaseModel):
    subject_id: int
    subject_name: str
    classroom_id: int
    total_submissions: int
    average_overall: float
    average_clarity: float
    average_pace: float
    average_understanding: float
    rating_distribution: Dict[int, int]
    positive_themes: List[str]
    improvement_themes: List[str]
    recent_feedback: List[AnonymizedFeedbackItem]
    has_sufficient_data: bool
    period_filter: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ClassroomAnalyticsResponse(BaseModel):
    classroom_id: int
    classroom_name: str
    total_submissions: int
    average_overall: float
    average_clarity: float
    average_pace: float
    average_understanding: float
    rating_distribution: Dict[int, int]
    positive_themes: List[str]
    improvement_themes: List[str]
    subject_breakdown: List[Dict[str, Any]]
    recent_feedback: List[AnonymizedFeedbackItem]
    has_sufficient_data: bool
    period_filter: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

