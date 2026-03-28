"""API endpoints for user registration, login, logout, and OAuth callbacks."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.token import Token
from app.schemas.user import SuccessResponse, UserCreate, UserLogin, UserResponse
from app.services.user_service import login as login_user
from app.services.user_service import register

router = APIRouter()


@router.post("/create-account", response_model=UserResponse)
async def create_account(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create account with username/email/password."""
    user = register(db, username=user_data.username, email=user_data.email, password=user_data.password)
    return user


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Log in with credentials and receive a JWT token."""
    return login_user(db, email=credentials.email, password=credentials.password)


@router.post("/logout", response_model=SuccessResponse)
async def logout():
    """Log out (client-side token invalidation)."""
    return SuccessResponse(success=True, message="Logged out successfully")


@router.get("/auth/google/callback")
async def google_callback(code: str = Query(...)):
    """Handle Google OAuth callback."""
    return {"message": "Google OAuth callback placeholder", "code": code}
