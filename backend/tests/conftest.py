import os

os.environ["DATABASE_URL"] = "sqlite:////tmp/test_mental_health.db"
os.environ["SECRET_KEY"] = "test-secret-key-for-unit-tests"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.deps import get_db
from app.core.auth import create_access_token, hash_password
from app.core.database import Base
from app.main import app as fastapi_app

TEST_DATABASE_URL = "sqlite:////tmp/test_mental_health.db"

test_engine = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=test_engine
)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


fastapi_app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def client():
    return TestClient(fastapi_app)


@pytest.fixture()
def db_session():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture()
def registered_user(client):
    resp = client.post(
        "/api/create-account",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "SecurePass123",
        },
    )
    return resp.json()


@pytest.fixture()
def auth_token(registered_user):
    token = create_access_token(data={"sub": str(registered_user["id"])})
    return token


@pytest.fixture()
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}
