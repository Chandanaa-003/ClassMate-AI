from datetime import datetime
from pydantic import BaseModel, Field


class HealthCheckResponse(BaseModel):
    status: str = Field(..., description="Overall status of the backend (e.g., 'healthy')")
    project_name: str = Field(..., description="Project name")
    environment: str = Field(..., description="Current deployment environment")
    database: str = Field(..., description="Status of the SQLite database connection")
    version: str = Field(default="0.1.0", description="API version")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="UTC timestamp of the check")

