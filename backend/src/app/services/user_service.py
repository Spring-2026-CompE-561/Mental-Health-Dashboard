"""Business logic for user registration, authentication, and account management."""

from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import create_access_token, hash_password, verify_password
from app.core.settings import settings
from app.models.user import User
from app.repository.user import (
    create_user as repo_create_user,
)
from app.repository.user import (
    delete_user as repo_delete_user,
)
from app.repository.user import (
    get_user_by_email,
)
from app.repository.user import (
    get_user_by_id as repo_get_user_by_id,
)
from app.repository.user import (
    update_user_password as repo_update_password,
)


def get_by_id(db: Session, user_id: int) -> User:
    """Retrieve a user by ID or raise 404 if not found."""
    user = repo_get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


def register(db: Session, username: str, email: str, password: str) -> User:
    """Validate inputs, hash the password, and create a new user account."""
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters",
        )
    existing_user = get_user_by_email(db, email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    hashed_pw = hash_password(password)
    return repo_create_user(db, username=username, email=email, hashed_password=hashed_pw)


def login(db: Session, email: str, password: str) -> dict:
    """Authenticate credentials and return a JWT access token."""
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(data={"sub": str(user.id)}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}


def change_password(db: Session, user: User, current_password: str, new_password: str) -> User:
    """Verify the current password, then update to a new one."""
    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters",
        )
    new_hashed = hash_password(new_password)
    return repo_update_password(db, user, new_hashed)


def remove_account(db: Session, user: User, password: str) -> None:
    """Verify the password and permanently delete the user account."""
    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is incorrect",
        )
    repo_delete_user(db, user)
