from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user, get_current_lecturer
from app.core.codes import generate_unique_join_code
from app.db.session import get_db
from app.models.classroom import Classroom, ClassroomMembership
from app.models.user import User, UserRole
from app.schemas.classroom import (
    ClassroomCreate,
    ClassroomDetailResponse,
    ClassroomJoin,
    ClassroomMemberResponse,
    ClassroomResponse,
)

router = APIRouter(prefix="/classrooms", tags=["Classrooms"])


def build_classroom_response(classroom: Classroom, current_user_id: int) -> ClassroomResponse:
    """Helper to serialize Classroom model into ClassroomResponse with dynamic fields."""
    return ClassroomResponse(
        id=classroom.id,
        name=classroom.name,
        description=classroom.description,
        join_code=classroom.join_code,
        lecturer_id=classroom.lecturer_id,
        lecturer_name=classroom.lecturer.full_name if classroom.lecturer else "Unknown",
        lecturer_email=classroom.lecturer.email if classroom.lecturer else "",
        member_count=len(classroom.memberships) if classroom.memberships else 0,
        created_at=classroom.created_at,
        updated_at=classroom.updated_at,
        is_lecturer=classroom.lecturer_id == current_user_id,
    )


@router.post(
    "",
    response_model=ClassroomResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new classroom (Lecturers only)",
)
def create_classroom(
    classroom_in: ClassroomCreate,
    db: Session = Depends(get_db),
    current_lecturer: User = Depends(get_current_lecturer),
) -> ClassroomResponse:
    """Create a new classroom with a unique join code. Accessible only by Lecturers."""
    join_code = generate_unique_join_code(db)

    classroom = Classroom(
        name=classroom_in.name,
        description=classroom_in.description,
        join_code=join_code,
        lecturer_id=current_lecturer.id,
    )
    db.add(classroom)
    db.commit()
    db.refresh(classroom)

    return build_classroom_response(classroom, current_lecturer.id)


@router.post(
    "/join",
    response_model=ClassroomResponse,
    summary="Join a classroom using join code (Students)",
)
def join_classroom(
    join_data: ClassroomJoin,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ClassroomResponse:
    """Join an existing classroom by its unique join code."""
    classroom = (
        db.query(Classroom)
        .filter(Classroom.join_code == join_data.join_code.strip().upper())
        .first()
    )
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid join code. No classroom found matching this code.",
        )

    # Check if user is the lecturer of this classroom
    if classroom.lecturer_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are the lecturer of this classroom and cannot join as a student.",
        )

    # Check if already joined
    existing_membership = (
        db.query(ClassroomMembership)
        .filter(
            ClassroomMembership.classroom_id == classroom.id,
            ClassroomMembership.user_id == current_user.id,
        )
        .first()
    )
    if existing_membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already joined this classroom.",
        )

    membership = ClassroomMembership(
        classroom_id=classroom.id,
        user_id=current_user.id,
    )
    db.add(membership)
    db.commit()
    db.refresh(classroom)

    return build_classroom_response(classroom, current_user.id)


@router.get(
    "",
    response_model=List[ClassroomResponse],
    summary="Get user classrooms (created for Lecturers, joined for Students)",
)
def get_classrooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[ClassroomResponse]:
    """Retrieve all classrooms relevant to the authenticated user."""
    if current_user.role == UserRole.LECTURER:
        classrooms = (
            db.query(Classroom)
            .filter(Classroom.lecturer_id == current_user.id)
            .order_by(Classroom.created_at.desc())
            .all()
        )
    else:
        # Student: get joined classrooms
        classrooms = (
            db.query(Classroom)
            .join(ClassroomMembership, Classroom.id == ClassroomMembership.classroom_id)
            .filter(ClassroomMembership.user_id == current_user.id)
            .order_by(ClassroomMembership.joined_at.desc())
            .all()
        )

    return [build_classroom_response(c, current_user.id) for c in classrooms]


@router.get(
    "/{classroom_id}",
    response_model=ClassroomDetailResponse,
    summary="Get classroom details and member list",
)
def get_classroom_detail(
    classroom_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ClassroomDetailResponse:
    """Get classroom details. User must be the lecturer or an enrolled member."""
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found.",
        )

    # Membership / ownership check
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

    # Format member records
    members = []
    for m in classroom.memberships:
        if m.user:
            members.append(
                ClassroomMemberResponse(
                    id=m.id,
                    user_id=m.user.id,
                    email=m.user.email,
                    full_name=m.user.full_name,
                    role=m.user.role.value,
                    joined_at=m.joined_at,
                )
            )

    base_response = build_classroom_response(classroom, current_user.id)
    return ClassroomDetailResponse(
        **base_response.model_dump(),
        members=members,
    )


@router.get(
    "/{classroom_id}/members",
    response_model=List[ClassroomMemberResponse],
    summary="Get list of members in a classroom",
)
def get_classroom_members(
    classroom_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[ClassroomMemberResponse]:
    """Retrieve member roster. User must belong to the classroom."""
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found.",
        )

    is_lecturer = classroom.lecturer_id == current_user.id
    if not is_lecturer:
        membership = (
            db.query(ClassroomMembership)
            .filter(
                ClassroomMembership.classroom_id == classroom.id,
                ClassroomMembership.user_id == current_user.id,
            )
            .first()
        )
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not belong to this classroom.",
            )

    members = []
    for m in classroom.memberships:
        if m.user:
            members.append(
                ClassroomMemberResponse(
                    id=m.id,
                    user_id=m.user.id,
                    email=m.user.email,
                    full_name=m.user.full_name,
                    role=m.user.role.value,
                    joined_at=m.joined_at,
                )
            )
    return members


@router.delete(
    "/{classroom_id}/leave",
    summary="Leave a joined classroom (Students only)",
)
def leave_classroom(
    classroom_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Allow an enrolled student to leave a classroom."""
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found.",
        )

    if classroom.lecturer_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lecturers cannot leave classrooms they created.",
        )

    membership = (
        db.query(ClassroomMembership)
        .filter(
            ClassroomMembership.classroom_id == classroom.id,
            ClassroomMembership.user_id == current_user.id,
        )
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not a member of this classroom.",
        )

    db.delete(membership)
    db.commit()

    return {
        "message": f"Successfully left classroom '{classroom.name}'.",
        "classroom_id": classroom_id,
    }

