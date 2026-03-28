"""CRUD operations for the Questionnaire model."""

from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.questionnaire import Questionnaire


def create_questionnaire(db: Session, user_id: int, score: float) -> Questionnaire:
    """Insert a new questionnaire record and return it."""
    entry = Questionnaire(
        user_id=user_id,
        score=score,
        created_at=date.today(),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_questionnaire_by_id(db: Session, questionnaire_id: int) -> Questionnaire | None:
    """Return a questionnaire by primary key, or None if not found."""
    return db.query(Questionnaire).filter(Questionnaire.id == questionnaire_id).first()


def get_questionnaires_by_user(db: Session, user_id: int) -> list[Questionnaire]:
    """Return all questionnaires for a user, ordered by most recent first."""
    return (
        db.query(Questionnaire).filter(Questionnaire.user_id == user_id).order_by(Questionnaire.created_at.desc()).all()
    )


def get_average_score(
    db: Session,
    user_id: int,
    from_date: date | None = None,
    to_date: date | None = None,
) -> float | None:
    """Compute the average score for a user, optionally filtered by date range."""
    query = db.query(func.avg(Questionnaire.score)).filter(Questionnaire.user_id == user_id)
    if from_date:
        query = query.filter(Questionnaire.created_at >= from_date)
    if to_date:
        query = query.filter(Questionnaire.created_at <= to_date)
    result = query.scalar()
    return round(result, 2) if result is not None else None


def update_questionnaire(db: Session, questionnaire: Questionnaire, score: float) -> Questionnaire:
    """Update the score of an existing questionnaire and return the updated record."""
    questionnaire.score = score
    db.commit()
    db.refresh(questionnaire)
    return questionnaire


def delete_questionnaire(db: Session, questionnaire: Questionnaire) -> None:
    """Remove a questionnaire record from the database."""
    db.delete(questionnaire)
    db.commit()
