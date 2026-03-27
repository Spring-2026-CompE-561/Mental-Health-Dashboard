from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class Questionnaire(Base):
    """Questionnaires Table Definition"""

    __tablename__ = "questionnaires"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Float)  # Matches schema float type
    created_at = Column(Date)

    # Links back to the User model
    owner = relationship("User", back_populates="questionnaires")