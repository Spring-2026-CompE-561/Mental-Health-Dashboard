from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.database import User
from app.models.schemas import (
    SuccessResponse,
    UserDeleteRequest,
    UserPasswordUpdate,
    UserResponse,
)
from app.repository.user import get_user_by_id
from app.services.user_service import change_password, remove_account

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.put("/{user_id}", response_model=SuccessResponse)
async def update_password(
    user_id: int,
    passwords: UserPasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own account",
        )

    result = change_password(
        db,
        user=current_user,
        current_password=passwords.current_password,
        new_password=passwords.new_password,
    )
    return result


@router.delete("/{user_id}", response_model=SuccessResponse)
async def delete_user_account(
    user_id: int,
    req: UserDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own account",
        )

    result = remove_account(db, user=current_user, password=req.password)
    return result
