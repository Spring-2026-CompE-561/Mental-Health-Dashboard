"""Business logic for questionnaire creation, retrieval, and management."""

from datetime import date

from app.models.questionnaire import Questionnaire
from app.models.user import User
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repository.questionnaire import (
    create_questionnaire as repo_create,
)
from app.repository.questionnaire import (
    delete_questionnaire as repo_delete,
)
from app.repository.questionnaire import (
    get_average_score as repo_get_average,
)
from app.repository.questionnaire import (
    get_questionnaire_by_id,
    get_questionnaire_by_user_and_date,
    get_questionnaires_by_user,
)
from app.repository.questionnaire import (
    update_questionnaire as repo_update,
)


def create(db: Session, user: User, score: float) -> Questionnaire:
    """Upsert today's questionnaire entry.

    A user may only have one mood entry per day. If one already exists for today,
    the score is updated in place; otherwise a new entry is created.
    """
    today = date.today()
    existing = get_questionnaire_by_user_and_date(db, user_id=user.id, on_date=today)
    if existing:
        return repo_update(db, existing, score)
    return repo_create(db, user_id=user.id, score=score)


def get_all(
    db: Session,
    user: User,
    from_date: date | None = None,
    to_date: date | None = None,
) -> list[Questionnaire]:
    """Return questionnaire entries for the user, optionally filtered by date range."""
    return get_questionnaires_by_user(db, user_id=user.id, from_date=from_date, to_date=to_date)


def get_today(db: Session, user: User) -> Questionnaire | None:
    """Return the user's questionnaire for today, if one exists."""
    return get_questionnaire_by_user_and_date(db, user_id=user.id, on_date=date.today())


def get_one(db: Session, user: User, questionnaire_id: int) -> Questionnaire:
    """Retrieve a single questionnaire, enforcing ownership. Raises 404 or 403."""
    entry = get_questionnaire_by_id(db, questionnaire_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Questionnaire not found",
        )
    if entry.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this questionnaire",
        )
    return entry


def average(
    db: Session,
    user: User,
    from_date: date | None = None,
    to_date: date | None = None,
) -> dict:
    """Compute the user's average questionnaire score, optionally within a date range."""
    avg = repo_get_average(db, user_id=user.id, from_date=from_date, to_date=to_date)
    return {
        "average_score": avg,
        "from_date": from_date,
        "to_date": to_date,
    }


def update(db: Session, user: User, questionnaire_id: int, score: float) -> Questionnaire:
    """Update the score of an existing questionnaire, enforcing ownership."""
    entry = get_one(db, user, questionnaire_id)
    return repo_update(db, entry, score)


def remove(db: Session, user: User, questionnaire_id: int) -> None:
    """Delete a questionnaire entry, enforcing ownership."""
    entry = get_one(db, user, questionnaire_id)
    repo_delete(db, entry)
