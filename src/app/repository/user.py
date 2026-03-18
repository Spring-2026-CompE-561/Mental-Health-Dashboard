from datetime import date

from sqlalchemy.orm import Session

from app.models.database import User


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def create_user(
    db: Session,
    username: str,
    email: str,
    hashed_password: str,
) -> User:
    new_user = User(
        username=username,
        email=email,
        hashed_password=hashed_password,
        created_at=date.today(),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def update_user_password(db: Session, user: User, new_hashed_password: str) -> User:
    user.hashed_password = new_hashed_password
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> None:
    db.delete(user)
    db.commit()
