from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import date
from typing import Optional


class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    oauth_provider: Optional[str] = None
    created_at: date


class UserUpdatePassword(BaseModel):
    current_password: str
    new_password: str