from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


class HealthCheckResponse(BaseModel):
    status: str = Field(..., description="Overall status of the backend (e.g., 'healthy')")
    project_name: str = Field(..., description="Project name")
    environment: str = Field(..., description="Current deployment environment")
    database: str = Field(..., description="Status of the database connection")
    version: str = Field(default="1.0.0", description="API version")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of the check",
    )


class ReadinessCheckResponse(BaseModel):
    status: str = Field(..., description="Overall readiness: 'ready' or 'not_ready'")
    database: str = Field(..., description="Database connection: 'connected' or 'disconnected'")
    storage: str = Field(..., description="Audio storage readiness: 'writable' or 'unwritable'")
    storage_path: Optional[str] = Field(None, description="Audio storage directory path")
    environment: str = Field(..., description="Current deployment environment")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of the check",
    )
