from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.repositories.db import get_db
from app.schemas.user import UserResponse, SuccessResponse

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/{id}", response_model=UserResponse)
async def get_user(id: int, db: Session = Depends(get_db)):
    """Retrieve a single user"""
    return {"id": id, "username": "johndoe", "email": "john@example.com"}

@router.put("/{id}", response_model=SuccessResponse)
async def update_user(id: int, db: Session = Depends(get_db)):
    """Update user account"""
    return {"success": True}

@router.delete("/{id}", response_model=SuccessResponse)
async def delete_user(id: int, db: Session = Depends(get_db)):
    """Delete a user account"""
    return {"success": True, "message": "User deleted successfully"}
