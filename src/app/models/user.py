from sqlalchemy import Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    """Users Table Definition"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    oauth_provider = Column(String, nullable=True)
    google_oauth_id = Column(String, nullable=True)
    created_at = Column(Date)

    # Relationships: One user can have many journals and questionnaires
    journals = relationship("Journal", back_populates="owner", cascade="all, delete-orphan")
    questionnaires = relationship("Questionnaire", back_populates="owner", cascade="all, delete-orphan")

