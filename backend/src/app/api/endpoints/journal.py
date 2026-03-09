from datetime import date

from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

# Import Database Dependency
from app.api.deps import get_db

# Import Schemas
from app.models.schemas import JournalCreate, JournalResponse, SuccessResponse

router = APIRouter()


@router.post("/create", response_model=JournalResponse)
async def create_journal(entry: JournalCreate, db: Session = Depends(get_db), authorization: str = Header(...)):
    """Create a journal entry"""
    return {"id": 1, "user_id": 123, "body": entry.body, "date_created": date.today()}


@router.get("/", response_model=list[JournalResponse])
async def get_all_journals(db: Session = Depends(get_db), authorization: str = Header(...)):
    """Get all journal entries for logged-in user"""
    return [{"id": 1, "user_id": 123, "body": "My mood today...", "date_created": date.today()}]


@router.get("/{id}", response_model=JournalResponse)
async def get_journal(id: int, db: Session = Depends(get_db), authorization: str = Header(...)):
    """Get a single journal entry"""
    return {"id": id, "user_id": 123, "body": "Content", "date_created": date.today()}


@router.put("/{id}")
async def update_journal(
    id: int, entry: JournalCreate, db: Session = Depends(get_db), authorization: str = Header(...)
):
    """Update an existing journal entry"""
    return {"success": True, "journal": {"id": id, "body": entry.body}}


@router.delete("/{id}", response_model=SuccessResponse)
async def delete_journal(id: int, db: Session = Depends(get_db), authorization: str = Header(...)):
    """Delete a journal entry"""
    return {"success": True}
