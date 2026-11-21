"""Main API router configuration."""
from fastapi import APIRouter
from app.api.routes.ai import router as ai_router
from app.api.routes.announcements import router as announcements_router
from app.api.routes.auth import router as auth_router
from app.api.routes.classroom import router as classroom_router
from app.api.routes.doubt import router as doubt_router
from app.api.routes.feedback import router as feedback_router
from app.api.routes.health import router as health_router
from app.api.routes.lecture import router as lecture_router
from app.api.routes.notifications import router as notifications_router
from app.api.routes.subject import router as subject_router

api_router = APIRouter()
api_router.include_router(health_router, prefix="", tags=["Health"])
api_router.include_router(auth_router)
api_router.include_router(classroom_router)
api_router.include_router(subject_router)
api_router.include_router(doubt_router)
api_router.include_router(lecture_router)
api_router.include_router(ai_router)
api_router.include_router(feedback_router)
api_router.include_router(announcements_router)
api_router.include_router(notifications_router)

__all__ = ["api_router"]

