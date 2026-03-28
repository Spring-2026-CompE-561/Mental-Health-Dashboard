"""API endpoints for questionnaire CRUD and score aggregation."""

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.questionnaire import (
    QuestionnaireAverageResponse,
    QuestionnaireCreate,
    QuestionnaireResponse,
    QuestionnaireUpdate,
)
from app.schemas.user import SuccessResponse
from app.services.questionnaire_service import (
    average,
    create,
    get_all,
    get_one,
    remove,
    update,
)

router = APIRouter()


@router.post("/", response_model=QuestionnaireResponse)
async def save_questionnaire(
    data: QuestionnaireCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save daily questionnaire score."""
    return create(db, current_user, data.score)


@router.get("/average", response_model=QuestionnaireAverageResponse)
async def get_average_score(
    from_date: date | None = Query(None),
    to_date: date | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get average questionnaire score, optionally filtered by date range."""
    return average(db, current_user, from_date=from_date, to_date=to_date)


@router.get("/", response_model=list[QuestionnaireResponse])
async def get_questionnaires(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all questionnaire scores for the logged-in user."""
    return get_all(db, current_user)


@router.get("/{questionnaire_id}", response_model=QuestionnaireResponse)
async def get_questionnaire(
    questionnaire_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single questionnaire entry by ID."""
    return get_one(db, current_user, questionnaire_id)


@router.put("/{questionnaire_id}", response_model=QuestionnaireResponse)
async def update_questionnaire(
    questionnaire_id: int,
    data: QuestionnaireUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing questionnaire score."""
    return update(db, current_user, questionnaire_id, data.score)


@router.delete("/{questionnaire_id}", response_model=SuccessResponse)
async def delete_questionnaire(
    questionnaire_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a questionnaire entry."""
    remove(db, current_user, questionnaire_id)
    return SuccessResponse(success=True, message="Questionnaire deleted")
