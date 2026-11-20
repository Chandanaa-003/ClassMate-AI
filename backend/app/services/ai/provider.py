import os
from typing import Optional
from openai import OpenAI
from app.core.config import settings


def is_openai_configured() -> bool:
    """Check if a valid OpenAI API key is configured."""
    key = settings.OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY")
    if not key:
        return False
    if "your-openai-api-key" in key.lower() or key.strip() == "":
        return False
    return True


def get_openai_client() -> Optional[OpenAI]:
    """Retrieve an initialized OpenAI client if configured, otherwise None."""
    if not is_openai_configured():
        return None
    api_key = settings.OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY")
    return OpenAI(api_key=api_key)

