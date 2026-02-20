from datetime import date

from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

# Import Database Dependency
from app.api.deps import get_db

# Import Schemas
from app.models.schemas import (
    QuestionnaireAverageResponse,
    QuestionnaireCreate,
    QuestionnaireResponse,
)

router = APIRouter()


@router.post("/", response_model=QuestionnaireResponse)
async def save_questionnaire(
    data: QuestionnaireCreate, db: Session = Depends(get_db), authorization: str = Header(...)
):
    """Save daily questionnaire score"""
    return {"id": 1, "user_id": 123, "score": data.score, "created_at": date.today()}


@router.get("/", response_model=list[QuestionnaireResponse])
async def get_questionnaires(db: Session = Depends(get_db), authorization: str = Header(...)):
    """Get questionnaire scores for logged-in user"""
    return [{"id": 1, "user_id": 123, "score": 85.0, "created_at": date.today()}]


@router.get("/average", response_model=QuestionnaireAverageResponse)
async def get_average_score(db: Session = Depends(get_db), authorization: str = Header(...)):
    """Get average questionnaire score"""
    return {"success": True, "average": {"user_id": 123, "avg_score": 78.5}}
