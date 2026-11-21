"""API routes package."""
from app.api.routes.ai import router as ai_router
from app.api.routes.auth import router as auth_router
from app.api.routes.classroom import router as classroom_router
from app.api.routes.doubt import router as doubt_router
from app.api.routes.feedback import router as feedback_router
from app.api.routes.health import router as health_router
from app.api.routes.lecture import router as lecture_router
from app.api.routes.subject import router as subject_router

__all__ = [
    "ai_router",
    "auth_router",
    "classroom_router",
    "doubt_router",
    "feedback_router",
    "health_router",
    "lecture_router",
    "subject_router",
]
