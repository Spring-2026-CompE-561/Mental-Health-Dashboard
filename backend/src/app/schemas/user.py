from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdatePassword(BaseModel):
    current_password: str
    new_password: str


class UserDeleteRequest(BaseModel):
    password: str


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    oauth_provider: Optional[str] = None
    created_at: Optional[date] = None


class SuccessResponse(BaseModel):
    success: bool
    message: str
