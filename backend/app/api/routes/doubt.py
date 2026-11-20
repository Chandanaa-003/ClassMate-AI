from typing import List, Optional, Tuple
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.classroom import ClassroomMembership
from app.models.doubt import Answer, Doubt, Vote
from app.models.subject import Subject
from app.models.user import User, UserRole
from app.schemas.doubt import (
    AnswerCreate,
    AnswerResponse,
    DoubtCreate,
    DoubtDetailResponse,
    DoubtResponse,
    VoteResponse,
)

router = APIRouter(tags=["Doubts & Discussions"])


def get_author_display(user: Optional[User], is_anonymous: bool) -> Tuple[str, Optional[str]]:
    """Mask author name if post is anonymous while preserving role hint."""
    if is_anonymous or not user:
        if user and user.role == UserRole.LECTURER:
            return "Anonymous Lecturer", "lecturer"
        return "Anonymous Student", "student"
    return user.full_name, user.role.value


def build_answer_response(answer: Answer, current_user_id: int) -> AnswerResponse:
    author_name, author_role = get_author_display(answer.author, answer.is_anonymous)
    has_voted = any(v.user_id == current_user_id for v in answer.votes) if answer.votes else False
    vote_count = len(answer.votes) if answer.votes else 0

    return AnswerResponse(
        id=answer.id,
        doubt_id=answer.doubt_id,
        content=answer.content,
        is_anonymous=answer.is_anonymous,
        author_name=author_name,
        author_role=author_role,
        is_author=answer.author_id == current_user_id,
        is_accepted=answer.is_accepted,
        vote_count=vote_count,
        has_voted=has_voted,
        created_at=answer.created_at,
        updated_at=answer.updated_at,
    )


def build_doubt_response(doubt: Doubt, current_user_id: int, can_moderate: bool) -> DoubtResponse:
    author_name, author_role = get_author_display(doubt.author, doubt.is_anonymous)
    answer_count = len(doubt.answers) if doubt.answers else 0

    return DoubtResponse(
        id=doubt.id,
        subject_id=doubt.subject_id,
        title=doubt.title,
        description=doubt.description,
        is_anonymous=doubt.is_anonymous,
        status=doubt.status,
        author_name=author_name,
        author_role=author_role,
        is_author=doubt.author_id == current_user_id,
        can_moderate=can_moderate,
        answer_count=answer_count,
        created_at=doubt.created_at,
        updated_at=doubt.updated_at,
    )


def verify_classroom_access(subject: Subject, user_id: int, db: Session) -> Tuple[bool, bool]:
    """Verify if user is the lecturer or an enrolled member of the subject's classroom."""
    classroom = subject.classroom
    is_lecturer = classroom.lecturer_id == user_id
    is_member = False
    if not is_lecturer:
        membership = (
            db.query(ClassroomMembership)
            .filter(
                ClassroomMembership.classroom_id == classroom.id,
                ClassroomMembership.user_id == user_id,
            )
            .first()
        )
        is_member = membership is not None

    if not is_lecturer and not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not belong to this classroom.",
        )

    return is_lecturer, is_member


@router.post(
    "/subjects/{subject_id}/doubts",
    response_model=DoubtResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Post a question/doubt in a subject (Anonymous by default)",
)
def create_doubt(
    subject_id: int,
    doubt_in: DoubtCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DoubtResponse:
    """Create a doubt. Any student or lecturer belonging to the classroom can ask a question."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found.",
        )

    is_lecturer, _ = verify_classroom_access(subject, current_user.id, db)

    doubt = Doubt(
        subject_id=subject.id,
        author_id=current_user.id,
        title=doubt_in.title,
        description=doubt_in.description,
        is_anonymous=doubt_in.is_anonymous,
        status="open",
    )
    db.add(doubt)
    db.commit()
    db.refresh(doubt)

    return build_doubt_response(doubt, current_user.id, is_lecturer)


@router.get(
    "/subjects/{subject_id}/doubts",
    response_model=List[DoubtResponse],
    summary="List doubts in a subject with search and filtering",
)
def get_subject_doubts(
    subject_id: int,
    search: Optional[str] = Query(None, description="Search keyword in title or description"),
    filter_by: Optional[str] = Query("latest", description="Filter by: latest, unanswered, popular, resolved"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[DoubtResponse]:
    """Retrieve doubts for a subject with filters and anonymous protections."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found.",
        )

    is_lecturer, _ = verify_classroom_access(subject, current_user.id, db)

    query = db.query(Doubt).filter(Doubt.subject_id == subject_id)

    # Search filter
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            func.lower(Doubt.title).like(term) | func.lower(Doubt.description).like(term)
        )

    # Filter logic
    if filter_by == "unanswered":
        # Doubts with 0 answers
        query = query.outerjoin(Answer, Doubt.id == Answer.doubt_id).group_by(Doubt.id).having(func.count(Answer.id) == 0)
    elif filter_by == "resolved":
        query = query.filter(Doubt.status == "resolved")
    elif filter_by in ("popular", "most_popular"):
        # Order by answer count descending
        query = query.outerjoin(Answer, Doubt.id == Answer.doubt_id).group_by(Doubt.id).order_by(func.count(Answer.id).desc(), Doubt.created_at.desc())
    else:
        # Default: latest
        query = query.order_by(Doubt.created_at.desc())

    doubts = query.all()
    return [build_doubt_response(d, current_user.id, is_lecturer) for d in doubts]


@router.get(
    "/doubts/{doubt_id}",
    response_model=DoubtDetailResponse,
    summary="Get doubt details with full answers and voting state",
)
def get_doubt_detail(
    doubt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DoubtDetailResponse:
    """Retrieve full doubt thread with answers, vote tallies, and accepted status."""
    doubt = db.query(Doubt).filter(Doubt.id == doubt_id).first()
    if not doubt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doubt question not found.",
        )

    is_lecturer, _ = verify_classroom_access(doubt.subject, current_user.id, db)

    # Serialize answers
    answer_responses = [build_answer_response(a, current_user.id) for a in doubt.answers]

    base = build_doubt_response(doubt, current_user.id, is_lecturer)
    return DoubtDetailResponse(
        **base.model_dump(),
        answers=answer_responses,
    )


@router.post(
    "/doubts/{doubt_id}/answers",
    response_model=AnswerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Answer a doubt question (Identified or Anonymous)",
)
def create_answer(
    doubt_id: int,
    answer_in: AnswerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> AnswerResponse:
    """Post an answer to a doubt. Any member of the classroom can answer."""
    doubt = db.query(Doubt).filter(Doubt.id == doubt_id).first()
    if not doubt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doubt question not found.",
        )

    verify_classroom_access(doubt.subject, current_user.id, db)

    answer = Answer(
        doubt_id=doubt.id,
        author_id=current_user.id,
        content=answer_in.content,
        is_anonymous=answer_in.is_anonymous,
        is_accepted=False,
    )
    db.add(answer)
    db.commit()
    db.refresh(answer)

    return build_answer_response(answer, current_user.id)


@router.post(
    "/answers/{answer_id}/vote",
    response_model=VoteResponse,
    summary="Upvote an answer (Single vote per user enforced)",
)
def vote_answer(
    answer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> VoteResponse:
    """Upvote an answer. Users can vote only once per answer."""
    answer = db.query(Answer).filter(Answer.id == answer_id).first()
    if not answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Answer not found.",
        )

    verify_classroom_access(answer.doubt.subject, current_user.id, db)

    existing_vote = (
        db.query(Vote)
        .filter(Vote.answer_id == answer.id, Vote.user_id == current_user.id)
        .first()
    )
    if existing_vote:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already upvoted this answer.",
        )

    vote = Vote(
        answer_id=answer.id,
        user_id=current_user.id,
    )
    db.add(vote)
    db.commit()
    db.refresh(answer)

    return VoteResponse(
        answer_id=answer.id,
        vote_count=len(answer.votes),
        has_voted=True,
        message="Upvote recorded successfully.",
    )


@router.post(
    "/answers/{answer_id}/accept",
    response_model=AnswerResponse,
    summary="Accept an answer as the best solution (Question author only)",
)
def accept_answer(
    answer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> AnswerResponse:
    """Mark an answer as accepted. Only the author of the question has permission."""
    answer = db.query(Answer).filter(Answer.id == answer_id).first()
    if not answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Answer not found.",
        )

    doubt = answer.doubt
    if doubt.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the question author can accept an answer.",
        )

    # Toggle accepted status
    if answer.is_accepted:
        answer.is_accepted = False
        doubt.status = "open"
    else:
        # Unaccept any previously accepted answers for this question
        for other_ans in doubt.answers:
            other_ans.is_accepted = False
        answer.is_accepted = True
        doubt.status = "resolved"

    db.commit()
    db.refresh(answer)

    return build_answer_response(answer, current_user.id)


@router.delete(
    "/doubts/{doubt_id}",
    summary="Delete a doubt (Question author or classroom lecturer)",
)
def delete_doubt(
    doubt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a doubt thread. Allowed for the author or the classroom lecturer (moderation)."""
    doubt = db.query(Doubt).filter(Doubt.id == doubt_id).first()
    if not doubt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doubt question not found.",
        )

    is_author = doubt.author_id == current_user.id
    is_lecturer = doubt.subject.classroom.lecturer_id == current_user.id

    if not is_author and not is_lecturer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the question author or classroom lecturer can delete this doubt.",
        )

    title = doubt.title
    db.delete(doubt)
    db.commit()

    return {
        "message": f"Successfully deleted doubt '{title}'.",
        "doubt_id": doubt_id,
    }

