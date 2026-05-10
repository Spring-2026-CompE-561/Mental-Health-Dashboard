"""SQLAlchemy model for caching AI-generated suggestions."""

from datetime import date

from sqlalchemy import Column, Date, ForeignKey, Integer, String, Text

from app.core.database import Base


class AiSuggestion(Base):
    __tablename__ = "ai_suggestions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    suggestion_type = Column(String(30), nullable=False)
    content = Column(Text, nullable=False)
    source = Column(String(10), nullable=False, default="ai")
    created_at = Column(Date, default=date.today)
