from collections.abc import Generator

from app.models.database import SessionLocal


def get_db() -> Generator:
    """
    Database session generator.
    Yields a session to the route and ensures it is closed after the request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
