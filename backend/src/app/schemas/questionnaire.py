from pydantic import BaseModel, ConfigDict, field_validator
from datetime import date
from typing import Optional


class QuestionnaireBase(BaseModel):
    score: float

    @field_validator("score")
    @classmethod
    def score_must_be_valid(cls, v: float) -> float:
        if not (0 <= v <= 100):
            raise ValueError("Score must be between 0 and 100")
        return v


class QuestionnaireCreate(QuestionnaireBase):
    pass  # user_id comes from the JWT


class QuestionnaireResponse(QuestionnaireBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: date


class QuestionnaireAverageResponse(BaseModel):
    average_score: Optional[float] = None
    from_date: Optional[date] = None
    to_date: Optional[date] = None