import json
import logging
import os
from typing import List, Optional, Union
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("classmate_ai.config")

DEFAULT_DEV_SECRET = "classmate-super-secret-key-change-in-production-123456789"


class Settings(BaseSettings):
    PROJECT_NAME: str = "ClassMate AI"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # SQLite / PostgreSQL Database connection string
    DATABASE_URL: str = "sqlite:///./classmate.db"

    # JWT Authentication
    SECRET_KEY: str = DEFAULT_DEV_SECRET
    JWT_SECRET_KEY: Optional[str] = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS origins allowed
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    CORS_ORIGINS: Optional[Union[str, List[str]]] = None
    CORS_ORIGIN_REGEX: Optional[str] = None

    # Persistent Audio Storage Path (defaults to backend/uploads/lectures if None)
    AUDIO_STORAGE_PATH: Optional[str] = None

    # AI Configuration (Module 6: Transcription & Smart Notes)
    AI_PROVIDER: str = "openai"
    OPENAI_API_KEY: Optional[str] = None
    WHISPER_MODEL: str = "whisper-1"
    LLM_MODEL: str = "gpt-4o-mini"
    GEMINI_API_KEY: Optional[str] = None

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        """Fix legacy postgres:// prefixes from Heroku/Railway to postgresql://."""
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v_trimmed = v.strip()
            if v_trimmed.startswith("[") and v_trimmed.endswith("]"):
                try:
                    parsed = json.loads(v_trimmed)
                    return [str(origin).strip().rstrip("/") for origin in parsed if str(origin).strip()]
                except Exception:
                    pass
            return [origin.strip().rstrip("/") for origin in v.split(",") if origin.strip()]
        elif isinstance(v, list):
            return [str(origin).strip().rstrip("/") for origin in v if str(origin).strip()]
        return v

    @model_validator(mode="after")
    def apply_production_settings_and_aliases(self) -> "Settings":
        # Support JWT_SECRET_KEY alias
        if self.JWT_SECRET_KEY and self.JWT_SECRET_KEY.strip():
            self.SECRET_KEY = self.JWT_SECRET_KEY.strip()

        # Support CORS_ORIGINS alias
        if self.CORS_ORIGINS:
            if isinstance(self.CORS_ORIGINS, str):
                origins = [o.strip().rstrip("/") for o in self.CORS_ORIGINS.split(",") if o.strip()]
            else:
                origins = [str(o).strip().rstrip("/") for o in self.CORS_ORIGINS if str(o).strip()]

            # If running in production and BACKEND_CORS_ORIGINS has only default localhosts, replace with production origins
            if self.ENVIRONMENT.lower() == "production" and self.BACKEND_CORS_ORIGINS == [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            ]:
                self.BACKEND_CORS_ORIGINS = origins
            else:
                for o in origins:
                    if o not in self.BACKEND_CORS_ORIGINS:
                        self.BACKEND_CORS_ORIGINS.append(o)

        # Support PORT environment variable (standard in Heroku, Render, Railway, Fly.io)
        env_port = os.environ.get("PORT")
        if env_port and env_port.isdigit():
            self.PORT = int(env_port)

        # Production security verification
        if self.ENVIRONMENT.lower() == "production":
            self.DEBUG = False
            if self.SECRET_KEY == DEFAULT_DEV_SECRET or len(self.SECRET_KEY) < 32:
                logger.warning(
                    "[SECURITY WARNING] Running in production with default or low-entropy SECRET_KEY! "
                    "Ensure a strong random SECRET_KEY (min 32 characters) is configured in your production environment."
                )

        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
