from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user, get_current_lecturer, get_current_student
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import Token, UserCreate, UserLogin, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account (Student or Lecturer)",
)
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> Token:
    """Register a new user, hash their password, and return a JWT access token."""
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(subject=user.id, role=user.role.value)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=Token,
    summary="User login with email and password",
)
def login(login_data: UserLogin, db: Session = Depends(get_db)) -> Token:
    """Authenticate a user and return a signed JWT access token."""
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account.",
        )

    access_token = create_access_token(subject=user.id, role=user.role.value)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user profile",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
) -> UserResponse:
    """Return profile data of the currently logged-in user."""
    return UserResponse.model_validate(current_user)


@router.get(
    "/student/dashboard",
    summary="Student protected dashboard endpoint",
)
def get_student_dashboard(
    current_student: User = Depends(get_current_student),
):
    """Protected route accessible only by verified Students."""
    return {
        "message": f"Welcome to the Student Dashboard, {current_student.full_name}!",
        "role": current_student.role.value,
        "features": [
            "Access class study materials",
            "Generate AI summaries & notes",
            "Take AI-generated practice quizzes",
            "Ask ClassMate AI learning questions",
        ],
    }


@router.get(
    "/lecturer/dashboard",
    summary="Lecturer protected dashboard endpoint",
)
def get_lecturer_dashboard(
    current_lecturer: User = Depends(get_current_lecturer),
):
    """Protected route accessible only by verified Lecturers."""
    return {
        "message": f"Welcome to the Lecturer Dashboard, {current_lecturer.full_name}!",
        "role": current_lecturer.role.value,
        "features": [
            "Upload course syllabus & lecture slides",
            "Generate AI quiz templates & question banks",
            "Review student comprehension analytics",
            "Manage course announcements",
        ],
    }

