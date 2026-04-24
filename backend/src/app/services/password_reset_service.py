import secrets
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import hash_password
from app.core.settings import settings
from app.models.password_reset import PasswordResetToken
from app.repository.user import get_user_by_email, update_user_password
from app.services.email_service import send_password_reset_email


def request_password_reset(db: Session, email: str) -> None:
    """Create a reset token (if the email exists) and send a reset email.

    Always returns silently — callers should report success regardless of whether
    the email was registered, to avoid leaking which accounts exist.
    """
    user = get_user_by_email(db, email)
    if not user:
        return
    # OAuth-only accounts have no password to reset.
    if not user.hashed_password:
        return

    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.reset_token_expire_minutes)

    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at,
        used=False,
    )
    db.add(reset_token)
    db.commit()

    reset_link = f"{settings.frontend_url}/reset-password?token={token}"
    send_password_reset_email(user.email, reset_link)


def reset_password(db: Session, token: str, new_password: str) -> None:
    """Consume a reset token and update the user's password."""
    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters",
        )

    reset_token = db.query(PasswordResetToken).filter(PasswordResetToken.token == token).first()

    if not reset_token or reset_token.used or reset_token.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    from app.repository.user import get_user_by_id

    user = get_user_by_id(db, reset_token.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    update_user_password(db, user, hash_password(new_password))
    reset_token.used = True
    db.commit()
