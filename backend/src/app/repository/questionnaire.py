from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.questionnaire import Questionnaire


def create_questionnaire(db: Session, user_id: int, score: float) -> Questionnaire:
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
    return db.query(Questionnaire).filter(Questionnaire.id == questionnaire_id).first()


def get_questionnaires_by_user(db: Session, user_id: int) -> list[Questionnaire]:
    return (
        db.query(Questionnaire).filter(Questionnaire.user_id == user_id).order_by(Questionnaire.created_at.desc()).all()
    )


def get_average_score(
    db: Session,
    user_id: int,
    from_date: date | None = None,
    to_date: date | None = None,
) -> float | None:
    query = db.query(func.avg(Questionnaire.score)).filter(Questionnaire.user_id == user_id)
    if from_date:
        query = query.filter(Questionnaire.created_at >= from_date)
    if to_date:
        query = query.filter(Questionnaire.created_at <= to_date)
    result = query.scalar()
    return round(result, 2) if result is not None else None


def update_questionnaire(db: Session, questionnaire: Questionnaire, score: float) -> Questionnaire:
    questionnaire.score = score
    db.commit()
    db.refresh(questionnaire)
    return questionnaire


def delete_questionnaire(db: Session, questionnaire: Questionnaire) -> None:
    db.delete(questionnaire)
    db.commit()
