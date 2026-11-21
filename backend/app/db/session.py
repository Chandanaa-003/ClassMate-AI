from pathlib import Path
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.db.base import Base

# Ensure target database directory exists if using file-based SQLite
if settings.DATABASE_URL.startswith("sqlite:///"):
    sqlite_path_str = settings.DATABASE_URL.replace("sqlite:///", "", 1)
    if sqlite_path_str and not sqlite_path_str.startswith(":memory:"):
        db_file_path = Path(sqlite_path_str).resolve()
        db_file_path.parent.mkdir(parents=True, exist_ok=True)

connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Initialize database tables."""
    import app.models  # noqa: F401 - ensure models are loaded
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Dependency for obtaining database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """Verify database connection is operational."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception:
        return False

