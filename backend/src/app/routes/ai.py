"""API endpoints for AI-generated suggestions."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.ai_suggestion import MoodSuggestionsResponse
from app.services.ai_suggestion_service import get_mood_suggestions
from app.services.questionnaire_service import get_today

router = APIRouter()


@router.get("/mood-suggestions", response_model=MoodSuggestionsResponse)
async def mood_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = get_today(db, current_user)
    if not today:
        return MoodSuggestionsResponse(
            heading="Log your mood first to get personalised suggestions",
            color="#b2def9",
            suggestions=[],
            source="none",
        )
    return await get_mood_suggestions(
        db,
        user_id=current_user.id,
        mood=today.mood,
        depression=today.depression,
        anxiety=today.anxiety,
        score=today.score or 0.0,
    )
