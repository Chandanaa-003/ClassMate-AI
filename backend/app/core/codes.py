import secrets
from sqlalchemy.orm import Session
from app.models.classroom import Classroom

# Alphanumeric characters excluding ambiguous ones (0, O, 1, I, L)
CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"


def generate_join_code(length: int = 6) -> str:
    """Generate a random alphanumeric join code formatted as CM-XXXX."""
    random_part = "".join(secrets.choice(CODE_CHARS) for _ in range(length))
    return f"CM-{random_part}"


def generate_unique_join_code(db: Session, max_attempts: int = 10) -> str:
    """Generate a unique join code that does not exist in the database."""
    for _ in range(max_attempts):
        code = generate_join_code(length=4)
        exists = db.query(Classroom).filter(Classroom.join_code == code).first()
        if not exists:
            return code

    # Fallback to longer random code if collision occurs
    return f"CM-{''.join(secrets.choice(CODE_CHARS) for _ in range(6))}"

