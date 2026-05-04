"""Pydantic schemas for questionnaire requests and responses."""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel, ConfigDict, field_validator


class QuestionnaireBase(BaseModel):
    mood: float
    depression: float
    anxiety: float

    @field_validator("mood")
    @classmethod
    def validate_mood(cls, v: float) -> float:
        if not (0 <= v <= 10):
            raise ValueError("mood must be between 0 and 10")
        return v

    @field_validator("depression")
    @classmethod
    def validate_depression(cls, v: float) -> float:
        if not (0 <= v <= 10):
            raise ValueError("depression must be between 0 and 10")
        return v

    @field_validator("anxiety")
    @classmethod
    def validate_anxiety(cls, v: float) -> float:
        if not (0 <= v <= 10):
            raise ValueError("anxiety must be between 0 and 10")
        return v


class QuestionnaireCreate(QuestionnaireBase):
    pass  # user_id comes from the JWT


class QuestionnaireUpdate(QuestionnaireBase):
    pass  # same validation as create


class QuestionnaireResponse(QuestionnaireBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    score: float | None = None
    created_at: date


class QuestionnaireAverageResponse(BaseModel):
    average_score: float | None = None
    from_date: date | None = None
    to_date: date | None = None
