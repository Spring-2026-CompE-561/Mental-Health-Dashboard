import logging
import smtplib
from email.message import EmailMessage

from app.core.settings import settings

logger = logging.getLogger("mental_health_api")


def _send_via_smtp(to_email: str, subject: str, body: str) -> None:
    """Send a plain-text email via SMTP."""
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from_email
    msg["To"] = to_email
    msg.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        if settings.smtp_use_tls:
            server.starttls()
        if settings.smtp_username and settings.smtp_password:
            server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(msg)


def send_email(to_email: str, subject: str, body: str) -> None:
    """Send an email, falling back to logging if SMTP isn't configured."""
    if not settings.smtp_host:
        logger.info(
            "\n--- EMAIL (SMTP not configured, logging instead) ---\n"
            "To: %s\nSubject: %s\n\n%s\n"
            "---------------------------------------------------\n",
            to_email,
            subject,
            body,
        )
        return

    try:
        _send_via_smtp(to_email, subject, body)
    except Exception:
        # Don't leak SMTP errors to the caller — they could reveal whether an account exists.
        # Log the full traceback for operators.
        logger.exception("Failed to send email to %s", to_email)


def send_password_reset_email(to_email: str, reset_link: str) -> None:
    """Compose and send a password-reset email."""
    subject = "Reset your Mental Health Dashboard password"
    body = (
        "Hi,\n\n"
        "We received a request to reset the password for your Mental Health Dashboard account.\n"
        "Click the link below to choose a new password. This link expires in "
        f"{settings.reset_token_expire_minutes} minutes.\n\n"
        f"{reset_link}\n\n"
        "If you didn't request a password reset, you can safely ignore this email.\n\n"
        "— Mental Health Dashboard"
    )
    send_email(to_email, subject, body)
