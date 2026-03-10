from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app.repositories.db import get_db
from app.schemas.journal import JournalCreate, JournalResponse

router = APIRouter(prefix="/journals", tags=["Journals"])

@router.post("/", response_model=JournalResponse)
async def create_journal(entry: JournalCreate, db: Session = Depends(get_db)):
    """Create a journal entry"""
    return {"id": 1, "user_id": 123, "body": entry.body, "date_created": date.today()}

@router.get("/", response_model=List[JournalResponse])
async def get_all_journals(db: Session = Depends(get_db)):
    """Get all journal entries for logged in user"""
    return [{"id": 1, "user_id": 123, "body": "My mood today...", "date_created": date.today()}]

@router.get("/{id}", response_model=JournalResponse)
async def get_journal(id: int, db: Session = Depends(get_db)):
    """Get a single journal entry"""
    return {"id": id, "user_id": 123, "body": "Content", "date_created": date.today()}

@router.put("/{id}", response_model=JournalResponse)
async def update_journal(id: int, entry: JournalCreate, db: Session = Depends(get_db)):
    """Update an existing journal entry"""
    return {"id": id, "user_id": 123, "body": entry.body, "date_created": date.today()}

@router.delete("/{id}")
async def delete_journal(id: int, db: Session = Depends(get_db)):
    """Delete a journal entry"""
    return {"success": True}
