from pydantic import BaseModel
from datetime import date

class JournalBase(BaseModel):
    body: str

class JournalCreate(JournalBase):
    pass

class JournalResponse(JournalBase):
    id: int
    user_id: int
    date_created: date
    
    class Config:
        from_attributes = True
