from fastapi import APIRouter
from app.core.config import settings
from app.db.session import check_db_connection
from app.schemas.health import HealthCheckResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthCheckResponse, summary="API & Database Health Check")
def health_check() -> HealthCheckResponse:
    """Return health status of the API and its SQLite database."""
    db_operational = check_db_connection()
    return HealthCheckResponse(
        status="healthy" if db_operational else "degraded",
        project_name=settings.PROJECT_NAME,
        environment=settings.ENVIRONMENT,
        database="connected" if db_operational else "disconnected",
    )

