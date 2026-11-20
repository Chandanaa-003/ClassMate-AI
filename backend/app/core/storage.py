import os
from pathlib import Path
from typing import Optional, Set, Tuple
import uuid
from fastapi import HTTPException, UploadFile, status

# Allowed file extensions and MIME types
ALLOWED_EXTENSIONS: Set[str] = {".mp3", ".wav", ".webm", ".m4a", ".ogg", ".aac", ".mp4"}
ALLOWED_MIME_TYPES: Set[str] = {
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/webm",
    "video/webm",  # WebM recordings from MediaRecorder often report video/webm
    "audio/ogg",
    "application/ogg",
    "audio/aac",
    "audio/x-aac",
    "audio/x-m4a",
    "audio/m4a",
    "audio/mp4",
    "video/mp4",
}

# 50 MB maximum audio upload size
MAX_FILE_SIZE_BYTES: int = 50 * 1024 * 1024

# Base uploads directory (backend/uploads/lectures)
BASE_UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "lectures"
BASE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def get_file_extension(filename: Optional[str]) -> str:
    """Extract and normalize file extension."""
    if not filename:
        return ""
    return Path(filename).suffix.lower()


def validate_audio_file_header(filename: Optional[str], content_type: Optional[str]) -> str:
    """Validate file extension and content type before reading body."""
    ext = get_file_extension(filename)
    if not ext or ext not in ALLOWED_EXTENSIONS:
        allowed_str = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file format '{ext}'. Allowed formats: {allowed_str}",
        )

    # Some browsers may send generic application/octet-stream; if extension is valid, allow it
    if content_type and content_type.lower() != "application/octet-stream":
        normalized_mime = content_type.lower().split(";")[0].strip()
        if normalized_mime not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid content type '{content_type}'. Must be a valid audio file.",
            )

    return ext


def save_audio_file(
    file: UploadFile,
    max_size_bytes: int = MAX_FILE_SIZE_BYTES,
) -> Tuple[str, int]:
    """
    Safely stream and store uploaded audio file to disk.
    Enforces maximum size limit and prevents path traversal.
    Returns: (stored_filename, total_bytes_written)
    """
    ext = validate_audio_file_header(file.filename, file.content_type)

    # Generate cryptographically safe unique filename
    unique_name = f"{uuid.uuid4().hex}{ext}"
    target_path = BASE_UPLOAD_DIR / unique_name

    # Prevent path traversal
    try:
        resolved_path = target_path.resolve()
        if not str(resolved_path).startswith(str(BASE_UPLOAD_DIR.resolve())):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid destination path detected.",
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File path validation failed.",
        )

    total_bytes = 0
    chunk_size = 1024 * 1024  # 1MB chunks

    try:
        with open(target_path, "wb") as buffer:
            while True:
                chunk = file.file.read(chunk_size)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > max_size_bytes:
                    # Clean up partially written file
                    buffer.close()
                    if target_path.exists():
                        target_path.unlink()
                    max_mb = max_size_bytes // (1024 * 1024)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"File exceeds maximum size limit of {max_mb} MB.",
                    )
                buffer.write(chunk)
    except HTTPException:
        raise
    except Exception as exc:
        if target_path.exists():
            target_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save audio file: {str(exc)}",
        )

    return unique_name, total_bytes


def get_audio_file_path(filename: str) -> Path:
    """
    Resolve and verify that the audio file exists inside the uploads directory.
    Prevents path traversal attacks like ../../etc/passwd.
    """
    if not filename or ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename specified.",
        )

    file_path = (BASE_UPLOAD_DIR / filename).resolve()
    base_path = BASE_UPLOAD_DIR.resolve()

    if not str(file_path).startswith(str(base_path)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to specified file path is denied.",
        )

    if not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio recording file not found on disk.",
        )

    return file_path


def delete_audio_file(filename: Optional[str]) -> bool:
    """Safely delete an audio recording from disk."""
    if not filename:
        return False
    try:
        file_path = get_audio_file_path(filename)
        if file_path.exists():
            file_path.unlink()
            return True
    except Exception:
        pass
    return False

