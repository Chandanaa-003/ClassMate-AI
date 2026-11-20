"""API routes package."""
from app.api.routes.auth import router as auth_router
from app.api.routes.classroom import router as classroom_router
from app.api.routes.doubt import router as doubt_router
from app.api.routes.health import router as health_router
from app.api.routes.lecture import router as lecture_router
from app.api.routes.subject import router as subject_router

__all__ = [
    "auth_router",
    "classroom_router",
    "doubt_router",
    "health_router",
    "lecture_router",
    "subject_router",
]
