from sqlalchemy import Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class Journal(Base):
    """Journals Table Definition"""

    __tablename__ = "journals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    body = Column(String, nullable=False)
    created_at = Column(Date)

    # Links back to the User model
    owner = relationship("User", back_populates="journals")