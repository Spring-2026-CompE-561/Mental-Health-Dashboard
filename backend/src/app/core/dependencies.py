"""Shared FastAPI dependencies for database sessions and authentication."""

from collections.abc import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.settings import settings
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")


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


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Decode the JWT bearer token and return the authenticated User, or raise 401."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        user_id_int = int(user_id)
    except (JWTError, ValueError, TypeError):
        raise credentials_exception from None

    user = db.query(User).filter(User.id == user_id_int).first()
    if user is None:
        raise credentials_exception
    return user
