from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.schemas import SuccessResponse, UserDeleteRequest, UserResponse, UserUpdate

router = APIRouter()


@router.get("/{id}", response_model=UserResponse)
async def get_user(id: int, db: Session = Depends(get_db)):
    """Retrieve a single user"""
    return {"id": id, "name": "John Doe", "email": "john@example.com"}


@router.put("/{id}")
async def update_user(id: int, user_data: UserUpdate, db: Session = Depends(get_db)):
    """Updates user information"""
    return {"success": True, "user": {"id": id, **user_data.dict()}}


@router.delete("/{id}", response_model=SuccessResponse)
async def delete_user(id: int, req: UserDeleteRequest, db: Session = Depends(get_db)):
    """Delete a user account"""
    return {"success": True, "message": "User deleted successfully"}
