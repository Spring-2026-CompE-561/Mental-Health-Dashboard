from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.schemas import (
    LoginResponse,
    SuccessResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.services.user_service import register, login as service_login

router = APIRouter()


@router.post("/create-account", response_model=UserResponse)
async def create_account(user_data: UserCreate, db: Session = Depends(get_db)):
    user = register(
        db,
        username=user_data.username,
        email=user_data.email,
        password=user_data.password,
    )
    return user


@router.post("/login", response_model=LoginResponse)
async def login_user(credentials: UserLogin, db: Session = Depends(get_db)):
    result = service_login(db, email=credentials.email, password=credentials.password)
    return result


@router.post("/logout", response_model=SuccessResponse)
async def logout():
    return {"success": True, "message": "Logged out successfully"}


@router.get("/auth/google/callback")
async def google_callback(code: str = Query(...), db: Session = Depends(get_db)):
    return {"message": "Google OAuth not yet implemented", "code": code}
