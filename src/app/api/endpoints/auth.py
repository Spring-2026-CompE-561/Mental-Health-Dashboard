from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

# Import Database Dependency
from app.api.deps import get_db

# Import Schemas
from app.models.schemas import LoginResponse, UserCreate, UserLogin, UserResponse

router = APIRouter()


@router.post("/create-account", response_model=UserResponse)
async def create_account(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create account with username/email/password"""
    return {"id": 1, "username": user_data.username, "email": user_data.email}


@router.post("/login", response_model=LoginResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Log in with credentials and receive a JWT token"""
    return {"token": "jwt-token-here", "userId": "user-uuid"}


@router.get("/auth/google/callback")
async def google_callback(code: str = Query(...), db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    return {"message": "Google account connected", "userId": "user-uuid"}
