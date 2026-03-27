from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.journal import Journal
from app.repository.journal import (
    create_journal as repo_create_journal,
    delete_journal as repo_delete_journal,
    get_all_journals_by_user,
    get_journal_by_id,
    update_journal as repo_update_journal,
)


def get_journal(db: Session, journal_id: int, current_user_id: int) -> Journal:
    journal = get_journal_by_id(db, journal_id)
    if not journal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal entry not found",
        )
    if journal.user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this journal entry",
        )
    return journal


def get_all_journals(db: Session, current_user_id: int) -> list[Journal]:
    return get_all_journals_by_user(db, current_user_id)


def create_journal(db: Session, current_user_id: int, body: str) -> Journal:
    return repo_create_journal(db, user_id=current_user_id, body=body)


def update_journal(
    db: Session, journal_id: int, current_user_id: int, body: str
) -> Journal:
    journal = get_journal_by_id(db, journal_id)
    if not journal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal entry not found",
        )
    if journal.user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this journal entry",
        )
    return repo_update_journal(db, journal, body)


def delete_journal(
    db: Session, journal_id: int, current_user_id: int
) -> None:
    journal = get_journal_by_id(db, journal_id)
    if not journal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Journal entry not found",
        )
    if journal.user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this journal entry",
        )
    repo_delete_journal(db, journal)