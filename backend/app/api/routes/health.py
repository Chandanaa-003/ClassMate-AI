from fastapi import APIRouter, Response, status
from app.core.config import settings
from app.core.storage import check_storage_writable
from app.db.session import check_db_connection
from app.schemas.health import HealthCheckResponse, ReadinessCheckResponse

router = APIRouter(tags=["Health & Monitoring"])


@router.get("/health", response_model=HealthCheckResponse, summary="Liveness Probe: API Health")
def health_check() -> HealthCheckResponse:
    """
    Return liveness status of the API service and its active database connection.
    Used by load balancers and container orchestrators for liveness probes.
    """
    db_operational = check_db_connection()
    return HealthCheckResponse(
        status="healthy" if db_operational else "degraded",
        project_name=settings.PROJECT_NAME,
        environment=settings.ENVIRONMENT,
        database="connected" if db_operational else "disconnected",
    )


@router.get(
    "/ready",
    response_model=ReadinessCheckResponse,
    summary="Readiness Probe: Database and Storage Health",
)
@router.get(
    "/health/readiness",
    response_model=ReadinessCheckResponse,
    summary="Readiness Probe: Database and Storage Health (Alias)",
)
def readiness_check(response: Response) -> ReadinessCheckResponse:
    """
    Return readiness status of the backend by verifying both database connectivity
    and write capability to persistent audio storage.
    Returns HTTP 503 if any core subsystem is unavailable.
    """
    db_operational = check_db_connection()
    storage_ok, storage_path = check_storage_writable()

    is_ready = db_operational and storage_ok
    if not is_ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return ReadinessCheckResponse(
        status="ready" if is_ready else "not_ready",
        database="connected" if db_operational else "disconnected",
        storage="writable" if storage_ok else "unwritable",
        storage_path=storage_path if storage_ok else "Storage path inaccessible",
        environment=settings.ENVIRONMENT,
    )
