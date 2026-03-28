"""Business logic for Google OAuth2 authentication."""

from datetime import timedelta
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import create_access_token
from app.core.settings import settings
from app.repository.user import create_oauth_user, get_user_by_email, get_user_by_google_id

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


def get_google_auth_url() -> str:
    """Build the Google OAuth2 consent screen URL."""
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


def exchange_code_for_token(code: str) -> str:
    """Exchange an authorization code for a Google access token."""
    response = httpx.post(
        GOOGLE_TOKEN_URL,
        data={
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.google_redirect_uri,
            "grant_type": "authorization_code",
        },
    )
    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to exchange authorization code with Google",
        )
    token_data = response.json()
    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No access token received from Google",
        )
    return access_token


def get_google_user_info(access_token: str) -> dict:
    """Fetch user profile information from Google using an access token."""
    response = httpx.get(
        GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"},
    )
    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to fetch user info from Google",
        )
    return response.json()


def google_login(code: str, db: Session) -> dict:
    """Complete the Google OAuth2 login flow and return a JWT token."""
    access_token = exchange_code_for_token(code)
    user_info = get_google_user_info(access_token)

    google_id = user_info.get("id")
    email = user_info.get("email")
    name = user_info.get("name", email)

    if not google_id or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not retrieve email or ID from Google",
        )

    # Look up by Google ID first, then by email
    user = get_user_by_google_id(db, google_id)
    if not user:
        user = get_user_by_email(db, email)
    if not user:
        user = create_oauth_user(db, email=email, username=name, google_id=google_id)

    token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    jwt_token = create_access_token(data={"sub": str(user.id)}, expires_delta=token_expires)
    return {"access_token": jwt_token, "token_type": "bearer"}
