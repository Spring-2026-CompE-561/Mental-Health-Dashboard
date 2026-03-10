from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.repositories.db import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse, SuccessResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create account with username/email/password"""
    return {"id": 1, "username": user_data.username, "email": user_data.email}

@router.post("/login")
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Log in with credentials and receive a JWT token"""
    return {"token": "jwt-token-here", "userId": "user-uuid"}

@router.post("/logout")
async def logout():
    """Log out user"""
    return {"success": True}

@router.get("/google/callback")
async def google_callback(code: str = Query(...), db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    return {"message": "Google account connected", "userId": "user-uuid"}
