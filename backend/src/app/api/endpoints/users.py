from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.user import (
    SuccessResponse,
    UserDeleteRequest,
    UserResponse,
    UserUpdatePassword,
)
from app.services.user_service import change_password, get_by_id, remove_account

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user."""
    return current_user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Retrieve a single user by ID."""
    return get_by_id(db, user_id)


@router.put("/{user_id}", response_model=SuccessResponse)
async def update_user_password(
    user_id: int,
    payload: UserUpdatePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change the password for a user (must be the authenticated user)."""
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user",
        )
    change_password(db, current_user, payload.current_password, payload.new_password)
    return SuccessResponse(success=True, message="Password updated successfully")


@router.delete("/{user_id}", response_model=SuccessResponse)
async def delete_user(
    user_id: int,
    payload: UserDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a user account (must be the authenticated user)."""
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this user",
        )
    remove_account(db, current_user, payload.password)
    return SuccessResponse(success=True, message="Account deleted successfully")
