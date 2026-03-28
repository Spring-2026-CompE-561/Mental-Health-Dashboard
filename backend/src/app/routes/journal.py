"""API endpoints for journal entry CRUD operations."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.journal import JournalCreate, JournalResponse, JournalUpdate
from app.schemas.user import SuccessResponse
from app.services.journal_service import (
    create_journal,
    delete_journal,
    get_all_journals,
    get_journal,
    update_journal,
)

router = APIRouter()


@router.post("/create", response_model=JournalResponse, status_code=status.HTTP_201_CREATED)
async def create_journal_entry(
    entry: JournalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a journal entry for the authenticated user."""
    return create_journal(db, current_user_id=current_user.id, body=entry.body)


@router.get("/", response_model=list[JournalResponse])
async def get_all_journal_entries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all journal entries for the authenticated user."""
    return get_all_journals(db, current_user_id=current_user.id)


@router.get("/{id}", response_model=JournalResponse)
async def get_journal_entry(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single journal entry (must belong to the authenticated user)."""
    return get_journal(db, journal_id=id, current_user_id=current_user.id)


@router.put("/{id}", response_model=JournalResponse)
async def update_journal_entry(
    id: int,
    entry: JournalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a journal entry (must belong to the authenticated user)."""
    return update_journal(db, journal_id=id, current_user_id=current_user.id, body=entry.body)


@router.delete("/{id}", response_model=SuccessResponse)
async def delete_journal_entry(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a journal entry (must belong to the authenticated user)."""
    delete_journal(db, journal_id=id, current_user_id=current_user.id)
    return SuccessResponse(success=True, message="Journal entry deleted successfully")
