"""Backward-compatibility re-exports so legacy imports still work."""
from app.core.database import Base, SessionLocal, create_tables, engine
from app.models.journal import Journal
from app.models.questionnaire import Questionnaire
from app.models.user import User

__all__ = [
    "Base",
    "SessionLocal",
    "create_tables",
    "engine",
    "User",
    "Journal",
    "Questionnaire",
]
