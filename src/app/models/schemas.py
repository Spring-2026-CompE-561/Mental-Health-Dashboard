from datetime import date

from pydantic import BaseModel, EmailStr, Field


class BaseSchema(BaseModel):
    class Config:
        from_attributes = True  



class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    username: str | None = None
    email: EmailStr | None = None


class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str


class UserDeleteRequest(BaseModel):
    password: str


class UserResponse(BaseSchema):
    id: int
    username: str
    email: EmailStr


class LoginResponse(BaseSchema):
    token: str
    userId: str


# --- Journal Schemas ---


class JournalBase(BaseModel):
    body: str


class JournalCreate(JournalBase):
    pass


class JournalResponse(JournalBase, BaseSchema):
    id: int
    user_id: int
    date_created: date


# --- Questionnaire Schemas ---


class QuestionnaireBase(BaseModel):
    score: float = Field(..., description="The daily questionnaire score")


class QuestionnaireCreate(QuestionnaireBase):
    pass


class QuestionnaireResponse(QuestionnaireBase, BaseSchema):
    id: int
    user_id: int
    created_at: date


class QuestionnaireAverage(BaseModel):
    user_id: int
    avg_score: float


class QuestionnaireAverageResponse(BaseSchema):
    success: bool = True
    average: QuestionnaireAverage


# --- Generic Response Schemas ---


class SuccessResponse(BaseModel):
    success: bool = True
    message: str | None = None
