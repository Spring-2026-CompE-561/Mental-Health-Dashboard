from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app.repositories.db import get_db
from app.schemas.questionnaire import QuestionnaireCreate, QuestionnaireResponse, QuestionnaireAverageResponse

router = APIRouter(prefix="/questionnaires", tags=["Questionnaires"])

@router.post("/", response_model=QuestionnaireResponse)
async def save_questionnaire(data: QuestionnaireCreate, db: Session = Depends(get_db)):
    """Save daily questionnaire score"""
    return {"id": 1, "user_id": 123, "score": data.score, "created_at": date.today()}

@router.get("/average", response_model=QuestionnaireAverageResponse)
async def get_average_score(from_date: date = Query(None), to_date: date = Query(None), db: Session = Depends(get_db)):
    """Get average questionnaire score for a given user and date range"""
    return {"success": True, "user_id": 123, "avg_score": 78.5}

@router.get("/{id}", response_model=QuestionnaireResponse)
async def get_questionnaire(id: int, db: Session = Depends(get_db)):
    """Get questionnaire score for a given id"""
    return {"id": id, "user_id": 123, "score": 85.0, "created_at": date.today()}
