"""SQLAlchemy model for the journals table."""

from datetime import date

from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Journal(Base):
    __tablename__ = "journals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    body = Column(String, nullable=False)
    created_at = Column(Date, default=date.today)
    sentiment_score = Column(Float, nullable=True)

    owner = relationship("User", back_populates="journals")
