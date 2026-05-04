"""Pydantic schemas for user requests and responses."""

from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


class UserBase(BaseModel):
    username: str
    email: EmailStr

    @field_validator("username")
    @classmethod
    def username_must_be_valid(cls, v: str) -> str:
        stripped = v.strip()
        if len(stripped) < 3:
            raise ValueError("Username must be at least 3 characters")
        if len(stripped) > 50:
            raise ValueError("Username must be at most 50 characters")
        return stripped


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
    oauth_provider: str | None = None
    created_at: date | None = None


class SuccessResponse(BaseModel):
    success: bool
    message: str
