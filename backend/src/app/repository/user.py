"""CRUD operations for the User model."""

from datetime import date

from sqlalchemy.orm import Session

from app.models.user import User


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """Return a user by primary key, or None if not found."""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> User | None:
    """Return a user by email address, or None if not found."""
    return db.query(User).filter(User.email == email).first()


def create_user(
    db: Session,
    username: str,
    email: str,
    hashed_password: str,
) -> User:
    """Insert a new user into the database and return the created record."""
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
    """Update a user's hashed password and return the updated record."""
    user.hashed_password = new_hashed_password
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> None:
    """Remove a user from the database."""
    db.delete(user)
    db.commit()
