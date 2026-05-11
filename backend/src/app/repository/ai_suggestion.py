"""Data access layer for AI suggestion caching."""

from __future__ import annotations

from datetime import date

from sqlalchemy.orm import Session

from app.models.ai_suggestion import AiSuggestion


def get_suggestion_for_today(
    db: Session, user_id: int, suggestion_type: str
) -> AiSuggestion | None:
    return (
        db.query(AiSuggestion)
        .filter(
            AiSuggestion.user_id == user_id,
            AiSuggestion.suggestion_type == suggestion_type,
            AiSuggestion.created_at == date.today(),
        )
        .first()
    )


def delete_suggestions_for_today(
    db: Session, user_id: int, suggestion_type: str
) -> None:
    db.query(AiSuggestion).filter(
        AiSuggestion.user_id == user_id,
        AiSuggestion.suggestion_type == suggestion_type,
        AiSuggestion.created_at == date.today(),
    ).delete()
    db.commit()


def create_suggestion(
    db: Session,
    user_id: int,
    suggestion_type: str,
    content: str,
    source: str,
) -> AiSuggestion:
    row = AiSuggestion(
        user_id=user_id,
        suggestion_type=suggestion_type,
        content=content,
        source=source,
        created_at=date.today(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
