"""Business logic for questionnaire creation, retrieval, and management."""

from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.questionnaire import Questionnaire
from app.models.user import User
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
    get_questionnaires_by_user,
)
from app.repository.questionnaire import (
    update_questionnaire as repo_update,
)


def create(db: Session, user: User, score: float) -> Questionnaire:
    """Create a new questionnaire entry for the given user."""
    return repo_create(db, user_id=user.id, score=score)


def get_all(db: Session, user: User) -> list[Questionnaire]:
    """Return all questionnaire entries belonging to the given user."""
    return get_questionnaires_by_user(db, user_id=user.id)


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
    entry = get_one(db, user, questionnaire_id)  # handles 404 + 403
    return repo_update(db, entry, score)


def remove(db: Session, user: User, questionnaire_id: int) -> None:
    """Delete a questionnaire entry, enforcing ownership."""
    entry = get_one(db, user, questionnaire_id)  # handles 404 + 403
    repo_delete(db, entry)
