from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import Optional


class JournalBase(BaseModel):
    body: str


class JournalCreate(JournalBase):
    pass  # user_id comes from the JWT, never from the request body


class JournalUpdate(BaseModel):
    body: Optional[str] = None


class JournalResponse(JournalBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: date