"""Pytest fixtures shared across the backend test suite.

Tests run against an isolated SQLite database by default so they don't require
a running PostgreSQL server. To run tests against a real PostgreSQL instance,
set the TEST_DATABASE_URL environment variable, e.g.:

    TEST_DATABASE_URL=postgresql://mhd_user:mhd_pass@localhost:5432/mental_health_test_db pytest
"""

import os

# Configure environment BEFORE importing app modules so settings are resolved correctly.
TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL", "sqlite:///./test_mental_health.db"
)
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests")
os.environ.setdefault("SMTP_USERNAME", "test@example.com")
os.environ.setdefault("SMTP_PASSWORD", "test-password")
os.environ.setdefault("SMTP_FROM_EMAIL", "test@example.com")

# Imports below intentionally come after os.environ setup above so that
# `app.core.settings` reads the test DB URL on first import.
import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.core.auth import create_access_token  # noqa: E402
from app.core.database import Base  # noqa: E402
from app.core.dependencies import get_db  # noqa: E402
from app.main import app as fastapi_app  # noqa: E402

# SQLite needs `check_same_thread=False` so the same in-memory connection can
# be reused across the request thread and the test thread.
engine_kwargs: dict = {}
if TEST_DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
    engine_kwargs["poolclass"] = StaticPool

test_engine = create_engine(TEST_DATABASE_URL, **engine_kwargs)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


fastapi_app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    import app.models  # noqa: F401  — registers ORM models with Base

    Base.metadata.create_all(bind=test_engine)

    # Reset rate limiter so tests aren't throttled
    from app.main import _rate_limit_store
    _rate_limit_store.clear()

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
    assert resp.status_code == 201, f"User registration failed: {resp.status_code} {resp.text}"
    return resp.json()


@pytest.fixture()
def auth_token(registered_user):
    return create_access_token(data={"sub": str(registered_user["id"])})


@pytest.fixture()
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}
