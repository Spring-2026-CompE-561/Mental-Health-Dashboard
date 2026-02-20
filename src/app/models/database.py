from sqlalchemy import Column, Date, Float, ForeignKey, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

# 1. Setup the Database Connection (SQLite for development)
DATABASE_URL = "sqlite:///./mental_health_tracker.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# 2. Database Table Definitions


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


class Journal(Base):
    """Journals Table Definition"""

    __tablename__ = "journals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    body = Column(String, nullable=False)
    created_at = Column(Date)

    # Links back to the User model
    owner = relationship("User", back_populates="journals")


class Questionnaire(Base):
    """Questionnaires Table Definition"""

    __tablename__ = "questionnaires"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Float)  # Matches schema float type
    created_at = Column(Date)

    # Links back to the User model
    owner = relationship("User", back_populates="questionnaires")


def create_tables():
    Base.metadata.create_all(bind=engine)
