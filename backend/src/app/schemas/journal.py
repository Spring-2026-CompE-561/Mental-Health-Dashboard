"""Pydantic schemas for journal requests and responses."""

from datetime import date

from pydantic import BaseModel, ConfigDict


class JournalBase(BaseModel):
    body: str


class JournalCreate(JournalBase):
    pass  # user_id comes from the JWT, never from the request body


class JournalUpdate(BaseModel):
    body: str


class JournalResponse(JournalBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: date


class JournalPromptResponse(BaseModel):
    """Response from the AI prompt suggestion endpoint."""

    prompt: str
    source: str  # "ai" when Groq generated it, "fallback" when from the curated list
