from datetime import date

from pydantic import BaseModel, ConfigDict, field_validator


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


class QuestionnaireUpdate(QuestionnaireBase):
    pass  # same validation as create


class QuestionnaireResponse(QuestionnaireBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: date


class QuestionnaireAverageResponse(BaseModel):
    average_score: float | None = None
    from_date: date | None = None
    to_date: date | None = None
