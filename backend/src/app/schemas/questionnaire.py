from pydantic import BaseModel
from datetime import date

class QuestionnaireBase(BaseModel):
    score: float

class QuestionnaireCreate(QuestionnaireBase):
    pass

class QuestionnaireResponse(QuestionnaireBase):
    id: int
    user_id: int
    created_at: date
    
    class Config:
        from_attributes = True

class QuestionnaireAverageResponse(BaseModel):
    success: bool
    user_id: int
    avg_score: float
