import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.user import User
from app.models.journal import Journal
from app.models.questionnaire import Questionnaire


engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(bind=engine)


@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


def test_create_user(db):
    user = User(username="testuser", email="test@example.com", hashed_password="hashed123")
    db.add(user)
    db.commit()

    result = db.query(User).filter_by(email="test@example.com").first()
    assert result is not None
    assert result.username == "testuser"


def test_user_email_unique(db):
    db.add(User(username="user1", email="dup@example.com", hashed_password="hash1"))
    db.commit()

    db.add(User(username="user2", email="dup@example.com", hashed_password="hash2"))
    with pytest.raises(Exception):
        db.commit()


def test_create_journal(db):
    user = User(username="journaluser", email="journal@example.com", hashed_password="hash")
    db.add(user)
    db.commit()

    journal = Journal(user_id=user.id, body="Today was a good day.")
    db.add(journal)
    db.commit()

    result = db.query(Journal).filter_by(user_id=user.id).first()
    assert result is not None
    assert result.body == "Today was a good day."


def test_create_questionnaire(db):
    user = User(username="quizuser", email="quiz@example.com", hashed_password="hash")
    db.add(user)
    db.commit()

    questionnaire = Questionnaire(user_id=user.id, score=7.5)
    db.add(questionnaire)
    db.commit()

    result = db.query(Questionnaire).filter_by(user_id=user.id).first()
    assert result is not None
    assert result.score == 7.5


def test_user_journal_relationship(db):
    user = User(username="reluser", email="rel@example.com", hashed_password="hash")
    db.add(user)
    db.commit()

    db.add_all([
        Journal(user_id=user.id, body="Entry 1"),
        Journal(user_id=user.id, body="Entry 2"),
    ])
    db.commit()
    db.refresh(user)

    assert len(user.journals) == 2


def test_user_cascade_delete(db):
    user = User(username="deluser", email="del@example.com", hashed_password="hash")
    db.add(user)
    db.commit()

    db.add(Journal(user_id=user.id, body="Will be deleted"))
    db.commit()

    db.delete(user)
    db.commit()

    assert db.query(Journal).filter_by(user_id=user.id).count() == 0
