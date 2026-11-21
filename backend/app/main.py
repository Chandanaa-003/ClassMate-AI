from contextlib import asynccontextmanager
import logging
import sys
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.storage import get_base_upload_dir
from app.db.session import init_db
from app.api.router import api_router
from app.api.routes.health import router as health_router

# Configure production logging format
logging.basicConfig(
    level=logging.INFO if settings.ENVIRONMENT.lower() == "production" else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("classmate_ai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Safe Startup Lifecycle
    db_scheme = settings.DATABASE_URL.split("://")[0] if "://" in settings.DATABASE_URL else "unknown"
    storage_dir = str(get_base_upload_dir())
    logger.info(f"=== Starting {settings.PROJECT_NAME} ===")
    logger.info(f"Environment: {settings.ENVIRONMENT} (Debug: {settings.DEBUG})")
    logger.info(f"Database dialect: {db_scheme}")
    logger.info(f"Audio storage mount: {storage_dir}")
    logger.info(f"Allowed CORS origins: {settings.BACKEND_CORS_ORIGINS}")

    try:
        init_db()
        logger.info("Database initialized successfully.")
    except Exception as exc:
        logger.critical(f"Database initialization error on startup: {exc}", exc_info=True)
        raise

    yield

    # Safe Shutdown Lifecycle
    logger.info(f"=== Shutting down {settings.PROJECT_NAME} gracefully ===")


# Build FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# CORS configuration
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# Production Global Exception Handler - Prevent Stack Trace Leaks
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # If it's already an HTTPException, preserve its status and detail
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=getattr(exc, "headers", None),
        )

    # Log full traceback server-side
    logger.exception(f"Unhandled server exception on {request.method} {request.url.path}: {exc}")

    # Return safe sanitized response in production
    if settings.ENVIRONMENT.lower() == "production" or not settings.DEBUG:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An internal server error occurred. Please contact support if the problem persists."
            },
        )

    # In development, return debug error message
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc)},
    )


@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs": "/docs" if settings.DEBUG else "Disabled in production",
        "health": "/health",
        "readiness": "/ready",
        "api_v1": settings.API_V1_STR,
    }


# Health check exposed at root level (/health, /ready) and versioned (/api/v1/health, /api/v1/ready)
app.include_router(health_router, prefix="", tags=["Health"])
app.include_router(health_router, prefix=settings.API_V1_STR, tags=["Health"])
app.include_router(api_router, prefix=settings.API_V1_STR)
