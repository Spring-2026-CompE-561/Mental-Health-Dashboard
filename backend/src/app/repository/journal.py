from datetime import date

from sqlalchemy.orm import Session

from app.models.journal import Journal

def get_journal_by_id(db: Session, journal_id: int) -> Journal | None:
    return db.query(Journal).filter(Journal.id == journal_id).first()


def get_all_journals_by_user(db: Session, user_id: int) -> list[Journal]:
    return db.query(Journal).filter(Journal.user_id == user_id).order_by(Journal.created_at.desc()).all()


def create_journal(db: Session, user_id: int, body: str) -> Journal:
    new_journal = Journal(
        user_id=user_id,
        body=body,
        created_at=date.today(),
    )
    db.add(new_journal)
    db.commit()
    db.refresh(new_journal)
    return new_journal


def update_journal(db: Session, journal: Journal, body: str) -> Journal:
    journal.body = body
    db.commit()
    db.refresh(journal)
    return journal


def delete_journal(db: Session, journal: Journal) -> None:
    db.delete(journal)
    db.commit()
