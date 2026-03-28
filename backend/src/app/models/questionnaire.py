"""SQLAlchemy model for the questionnaires table."""

from datetime import date

from sqlalchemy import Column, Date, Float, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.core.database import Base


class Questionnaire(Base):
    __tablename__ = "questionnaires"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Float)
    created_at = Column(Date, default=date.today)

    owner = relationship("User", back_populates="questionnaires")
