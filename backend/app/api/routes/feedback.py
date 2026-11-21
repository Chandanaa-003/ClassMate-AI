from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user
from app.api.routes.lecture import verify_classroom_access
from app.db.session import get_db
from app.models.classroom import Classroom, ClassroomMembership
from app.models.feedback import Feedback
from app.models.subject import Subject
from app.models.user import User, UserRole
from app.schemas.feedback import (
    AnonymizedFeedbackItem,
    ClassroomAnalyticsResponse,
    FeedbackCreate,
    FeedbackResponse,
    FeedbackUpdate,
    SubjectAnalyticsResponse,
)
from app.services.analytics import calculate_feedback_metrics, extract_feedback_themes

router = APIRouter(tags=["Anonymous Feedback & Analytics"])


def build_feedback_response(fb: Feedback, current_user_id: int) -> FeedbackResponse:
    """Build response for author. Note: student_id is never sent in the response."""
    return FeedbackResponse(
        id=fb.id,
        subject_id=fb.subject_id,
        overall_rating=fb.overall_rating,
        teaching_clarity_rating=fb.teaching_clarity_rating,
        lecture_pace_rating=fb.lecture_pace_rating,
        concept_understanding_rating=fb.concept_understanding_rating,
        positive_feedback=fb.positive_feedback,
        improvement_suggestions=fb.improvement_suggestions,
        additional_comments=fb.additional_comments,
        feedback_period=fb.feedback_period,
        is_owner=fb.student_id == current_user_id,
        created_at=fb.created_at,
        updated_at=fb.updated_at,
    )


def map_anonymized_item(fb: Feedback) -> AnonymizedFeedbackItem:
    """Serialize feedback for lecturer analytics with ZERO identity details."""
    return AnonymizedFeedbackItem(
        id=fb.id,
        overall_rating=fb.overall_rating,
        teaching_clarity_rating=fb.teaching_clarity_rating,
        lecture_pace_rating=fb.lecture_pace_rating,
        concept_understanding_rating=fb.concept_understanding_rating,
        positive_feedback=fb.positive_feedback,
        improvement_suggestions=fb.improvement_suggestions,
        additional_comments=fb.additional_comments,
        feedback_period=fb.feedback_period,
        created_at=fb.created_at,
    )


@router.post(
    "/subjects/{subject_id}/feedback",
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit anonymous feedback for a subject (Students)",
)
def submit_feedback(
    subject_id: int,
    feedback_in: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FeedbackResponse:
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found.",
        )

    # Verify classroom membership
    is_lecturer, is_member = verify_classroom_access(subject, current_user.id, db)
    if is_lecturer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lecturers cannot submit student feedback for their own subjects.",
        )

    period = (feedback_in.feedback_period or "general").strip().lower()

    # Prevent duplicate submissions by the same student for the same period
    existing = (
        db.query(Feedback)
        .filter(
            Feedback.subject_id == subject.id,
            Feedback.student_id == current_user.id,
            Feedback.feedback_period == period,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You have already submitted feedback for this subject in the '{period}' period. You can edit your existing feedback.",
        )

    feedback = Feedback(
        subject_id=subject.id,
        student_id=current_user.id,
        overall_rating=feedback_in.overall_rating,
        teaching_clarity_rating=feedback_in.teaching_clarity_rating,
        lecture_pace_rating=feedback_in.lecture_pace_rating,
        concept_understanding_rating=feedback_in.concept_understanding_rating,
        positive_feedback=feedback_in.positive_feedback.strip() if feedback_in.positive_feedback else None,
        improvement_suggestions=feedback_in.improvement_suggestions.strip() if feedback_in.improvement_suggestions else None,
        additional_comments=feedback_in.additional_comments.strip() if feedback_in.additional_comments else None,
        feedback_period=period,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return build_feedback_response(feedback, current_user.id)


@router.put(
    "/feedback/{feedback_id}",
    response_model=FeedbackResponse,
    summary="Edit and update submitted feedback (Author only)",
)
def update_feedback(
    feedback_id: int,
    feedback_in: FeedbackUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FeedbackResponse:
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback entry not found.",
        )

    # Privacy and security: only author can edit their own feedback
    if feedback.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are only authorized to edit your own feedback.",
        )

    if feedback_in.overall_rating is not None:
        feedback.overall_rating = feedback_in.overall_rating
    if feedback_in.teaching_clarity_rating is not None:
        feedback.teaching_clarity_rating = feedback_in.teaching_clarity_rating
    if feedback_in.lecture_pace_rating is not None:
        feedback.lecture_pace_rating = feedback_in.lecture_pace_rating
    if feedback_in.concept_understanding_rating is not None:
        feedback.concept_understanding_rating = feedback_in.concept_understanding_rating
    if feedback_in.positive_feedback is not None:
        feedback.positive_feedback = feedback_in.positive_feedback.strip() or None
    if feedback_in.improvement_suggestions is not None:
        feedback.improvement_suggestions = feedback_in.improvement_suggestions.strip() or None
    if feedback_in.additional_comments is not None:
        feedback.additional_comments = feedback_in.additional_comments.strip() or None

    db.commit()
    db.refresh(feedback)

    return build_feedback_response(feedback, current_user.id)


@router.get(
    "/subjects/{subject_id}/feedback/me",
    response_model=Optional[FeedbackResponse],
    summary="Retrieve current student's feedback for a subject in a specific period",
)
def get_my_feedback(
    subject_id: int,
    period: Optional[str] = Query("general", description="Evaluation period"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Optional[FeedbackResponse]:
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found.",
        )

    # Verify classroom membership
    verify_classroom_access(subject, current_user.id, db)

    norm_period = (period or "general").strip().lower()
    feedback = (
        db.query(Feedback)
        .filter(
            Feedback.subject_id == subject.id,
            Feedback.student_id == current_user.id,
            Feedback.feedback_period == norm_period,
        )
        .first()
    )

    if not feedback:
        return None

    return build_feedback_response(feedback, current_user.id)


@router.get(
    "/subjects/{subject_id}/feedback/analytics",
    response_model=SubjectAnalyticsResponse,
    summary="Subject feedback analytics (Lecturer only)",
)
def get_subject_feedback_analytics(
    subject_id: int,
    period: Optional[str] = Query(None, description="Filter by evaluation period"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> SubjectAnalyticsResponse:
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found.",
        )

    # Security check: only the classroom lecturer can access analytics
    if subject.classroom.lecturer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the classroom lecturer can access feedback analytics.",
        )

    query = db.query(Feedback).filter(Feedback.subject_id == subject.id)
    norm_period = period.strip().lower() if period and period.strip() else None
    if norm_period:
        query = query.filter(Feedback.feedback_period == norm_period)

    feedbacks = query.order_by(Feedback.created_at.desc()).all()

    metrics = calculate_feedback_metrics(feedbacks)
    pos_themes, imp_themes = extract_feedback_themes(feedbacks)
    recent_items = [map_anonymized_item(fb) for fb in feedbacks[:20]]

    return SubjectAnalyticsResponse(
        subject_id=subject.id,
        subject_name=subject.name,
        classroom_id=subject.classroom_id,
        total_submissions=metrics["total_submissions"],
        average_overall=metrics["average_overall"],
        average_clarity=metrics["average_clarity"],
        average_pace=metrics["average_pace"],
        average_understanding=metrics["average_understanding"],
        rating_distribution=metrics["rating_distribution"],
        positive_themes=pos_themes,
        improvement_themes=imp_themes,
        recent_feedback=recent_items,
        has_sufficient_data=metrics["has_sufficient_data"],
        period_filter=norm_period,
    )


@router.get(
    "/classrooms/{classroom_id}/feedback/analytics",
    response_model=ClassroomAnalyticsResponse,
    summary="Classroom-wide feedback analytics & subject comparison (Lecturer only)",
)
def get_classroom_feedback_analytics(
    classroom_id: int,
    period: Optional[str] = Query(None, description="Filter by evaluation period"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ClassroomAnalyticsResponse:
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found.",
        )

    # Security check: only the classroom lecturer can access analytics
    if classroom.lecturer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the classroom lecturer can access feedback analytics.",
        )

    subjects = db.query(Subject).filter(Subject.classroom_id == classroom.id).all()
    subject_ids = [s.id for s in subjects]

    norm_period = period.strip().lower() if period and period.strip() else None

    # Fetch all feedback across all classroom subjects
    if subject_ids:
        query = db.query(Feedback).filter(Feedback.subject_id.in_(subject_ids))
        if norm_period:
            query = query.filter(Feedback.feedback_period == norm_period)
        all_feedbacks = query.order_by(Feedback.created_at.desc()).all()
    else:
        all_feedbacks = []

    metrics = calculate_feedback_metrics(all_feedbacks)
    pos_themes, imp_themes = extract_feedback_themes(all_feedbacks)
    recent_items = [map_anonymized_item(fb) for fb in all_feedbacks[:25]]

    # Compute breakdown for each subject
    subject_breakdown = []
    for s in subjects:
        s_feedbacks = [fb for fb in all_feedbacks if fb.subject_id == s.id]
        s_metrics = calculate_feedback_metrics(s_feedbacks)
        subject_breakdown.append({
            "subject_id": s.id,
            "subject_name": s.name,
            "code": s.code,
            "total_submissions": s_metrics["total_submissions"],
            "average_overall": s_metrics["average_overall"],
            "average_clarity": s_metrics["average_clarity"],
            "average_pace": s_metrics["average_pace"],
            "average_understanding": s_metrics["average_understanding"],
            "has_sufficient_data": s_metrics["has_sufficient_data"],
        })

    return ClassroomAnalyticsResponse(
        classroom_id=classroom.id,
        classroom_name=classroom.name,
        total_submissions=metrics["total_submissions"],
        average_overall=metrics["average_overall"],
        average_clarity=metrics["average_clarity"],
        average_pace=metrics["average_pace"],
        average_understanding=metrics["average_understanding"],
        rating_distribution=metrics["rating_distribution"],
        positive_themes=pos_themes,
        improvement_themes=imp_themes,
        subject_breakdown=subject_breakdown,
        recent_feedback=recent_items,
        has_sufficient_data=metrics["has_sufficient_data"],
        period_filter=norm_period,
    )

