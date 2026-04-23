"""API endpoints for user registration, login, logout, password-reset, and OAuth callbacks."""

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.settings import settings
from app.schemas.password_reset import ForgotPasswordRequest, ResetPasswordRequest
from app.schemas.token import Token
from app.schemas.user import SuccessResponse, UserCreate, UserLogin, UserResponse
from app.services.google_oauth_service import get_google_auth_url, google_login
from app.services.password_reset_service import request_password_reset, reset_password
from app.services.user_service import login as login_user
from app.services.user_service import register

router = APIRouter()


@router.post("/create-account", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
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


@router.post("/forgot-password", response_model=SuccessResponse)
async def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Request a password-reset email.

    Always returns success, even when the email isn't registered, so attackers can't
    use this endpoint to enumerate valid accounts.
    """
    request_password_reset(db, email=payload.email)
    return SuccessResponse(
        success=True,
        message="If an account exists with that email, a reset link has been sent.",
    )


@router.post("/reset-password", response_model=SuccessResponse)
async def reset_password_endpoint(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Consume a reset token and set a new password."""
    reset_password(db, token=payload.token, new_password=payload.new_password)
    return SuccessResponse(success=True, message="Password reset successfully")


@router.get("/auth/google/login")
async def google_login_url():
    """Return the Google OAuth2 consent screen URL."""
    url = get_google_auth_url()
    return {"url": url}


@router.get("/auth/google/callback")
async def google_callback(code: str = Query(...), db: Session = Depends(get_db)):
    """Exchange a Google authorization code for a JWT token, then redirect to the frontend.

    The JWT is passed as a query parameter to the frontend callback route, which reads it,
    stores it in localStorage, and forwards the user to the dashboard.
    """
    token_data = google_login(code, db)
    redirect_url = f"{settings.frontend_url}/auth/google/callback?token={token_data['access_token']}"
    return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)
