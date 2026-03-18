from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.database import User
from app.repository.user import (
    create_user as repo_create_user,
    delete_user as repo_delete_user,
    get_user_by_email,
    update_user_password as repo_update_password,
)


def register(db: Session, username: str, email: str, password: str) -> User:
    existing_user = get_user_by_email(db, email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    hashed_pw = hash_password(password)
    user = repo_create_user(db, username=username, email=email, hashed_password=hashed_pw)
    return user


def login(db: Session, email: str, password: str) -> dict:
    user = get_user_by_email(db, email)

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(data={"sub": user.id})
    return {"token": access_token, "userId": str(user.id)}


def change_password(
    db: Session, user: User, current_password: str, new_password: str
) -> dict:
    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long",
        )

    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )

    new_hashed = hash_password(new_password)
    repo_update_password(db, user, new_hashed)
    return {"success": True, "message": "Password updated successfully"}


def remove_account(db: Session, user: User, password: str) -> dict:
    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
        )

    repo_delete_user(db, user)
    return {"success": True, "message": "Account deleted successfully"}
