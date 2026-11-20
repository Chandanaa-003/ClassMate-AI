from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.classroom import Classroom, ClassroomMembership
from app.models.subject import Subject
from app.models.user import User
from app.schemas.subject import SubjectCreate, SubjectResponse, SubjectUpdate

router = APIRouter(tags=["Subjects"])


def build_subject_response(subject: Subject, current_user_id: int) -> SubjectResponse:
    """Helper to serialize Subject model into SubjectResponse with dynamic fields."""
    return SubjectResponse(
        id=subject.id,
        name=subject.name,
        code=subject.code,
        description=subject.description,
        classroom_id=subject.classroom_id,
        classroom_name=subject.classroom.name if subject.classroom else "Unknown",
        created_by_id=subject.created_by_id,
        creator_name=subject.creator.full_name if subject.creator else "Unknown",
        created_at=subject.created_at,
        updated_at=subject.updated_at,
        is_lecturer=subject.classroom.lecturer_id == current_user_id if subject.classroom else False,
    )


@router.post(
    "/classrooms/{classroom_id}/subjects",
    response_model=SubjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new subject in a classroom (Lecturer owner only)",
)
def create_subject(
    classroom_id: int,
    subject_in: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> SubjectResponse:
    """Create a subject inside a classroom. Only the lecturer who owns the classroom can perform this."""
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found.",
        )

    # Permission check: Only the classroom lecturer can create subjects
    if classroom.lecturer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the lecturer who owns this classroom can create subjects.",
        )

    # Duplicate check: Prevent duplicate subject names inside the same classroom (case-insensitive)
    existing_subject = (
        db.query(Subject)
        .filter(
            Subject.classroom_id == classroom.id,
            func.lower(Subject.name) == subject_in.name.strip().lower(),
        )
        .first()
    )
    if existing_subject:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A subject with the name '{subject_in.name}' already exists in this classroom.",
        )

    subject = Subject(
        name=subject_in.name.strip(),
        code=subject_in.code,
        description=subject_in.description,
        classroom_id=classroom.id,
        created_by_id=current_user.id,
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)

    return build_subject_response(subject, current_user.id)


@router.get(
    "/classrooms/{classroom_id}/subjects",
    response_model=List[SubjectResponse],
    summary="Get all subjects in a classroom (Classroom members & owner)",
)
def get_classroom_subjects(
    classroom_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[SubjectResponse]:
    """Retrieve subjects in a classroom. User must be the lecturer or an enrolled student."""
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found.",
        )

    is_lecturer = classroom.lecturer_id == current_user.id
    is_member = False
    if not is_lecturer:
        membership = (
            db.query(ClassroomMembership)
            .filter(
                ClassroomMembership.classroom_id == classroom.id,
                ClassroomMembership.user_id == current_user.id,
            )
            .first()
        )
        is_member = membership is not None

    if not is_lecturer and not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not belong to this classroom.",
        )

    subjects = (
        db.query(Subject)
        .filter(Subject.classroom_id == classroom_id)
        .order_by(Subject.created_at.asc())
        .all()
    )

    return [build_subject_response(s, current_user.id) for s in subjects]


@router.get(
    "/subjects/{subject_id}",
    response_model=SubjectResponse,
    summary="Get details of a specific subject",
)
def get_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> SubjectResponse:
    """Retrieve subject details. User must belong to the subject's classroom."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found.",
        )

    classroom = subject.classroom
    is_lecturer = classroom.lecturer_id == current_user.id
    is_member = False
    if not is_lecturer:
        membership = (
            db.query(ClassroomMembership)
            .filter(
                ClassroomMembership.classroom_id == classroom.id,
                ClassroomMembership.user_id == current_user.id,
            )
            .first()
        )
        is_member = membership is not None

    if not is_lecturer and not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not belong to this subject's classroom.",
        )

    return build_subject_response(subject, current_user.id)


@router.put(
    "/subjects/{subject_id}",
    response_model=SubjectResponse,
    summary="Update a subject (Classroom lecturer only)",
)
def update_subject(
    subject_id: int,
    subject_in: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> SubjectResponse:
    """Update subject details. Only the lecturer who owns the classroom can edit subjects."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found.",
        )

    if subject.classroom.lecturer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the classroom lecturer can edit this subject.",
        )

    # If updating name, check for duplicate name in the same classroom
    if subject_in.name is not None and subject_in.name.strip():
        new_name = subject_in.name.strip()
        existing = (
            db.query(Subject)
            .filter(
                Subject.classroom_id == subject.classroom_id,
                func.lower(Subject.name) == new_name.lower(),
                Subject.id != subject.id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A subject with the name '{new_name}' already exists in this classroom.",
            )
        subject.name = new_name

    if subject_in.code is not None:
        subject.code = subject_in.code

    if subject_in.description is not None:
        subject.description = subject_in.description

    db.commit()
    db.refresh(subject)

    return build_subject_response(subject, current_user.id)


@router.delete(
    "/subjects/{subject_id}",
    summary="Delete a subject (Classroom lecturer only)",
)
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a subject. Only the lecturer who owns the classroom can delete subjects."""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found.",
        )

    if subject.classroom.lecturer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the classroom lecturer can delete this subject.",
        )

    subject_name = subject.name
    db.delete(subject)
    db.commit()

    return {
        "message": f"Successfully deleted subject '{subject_name}'.",
        "subject_id": subject_id,
    }

