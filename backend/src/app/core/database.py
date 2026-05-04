"""SQLAlchemy engine, session, and Base configuration.

Uses a locally hosted PostgreSQL database in production (configured via the
``DATABASE_URL`` environment variable). The conditional ``connect_args`` is
present so that the test suite — which substitutes a SQLite URL — works
without modification.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.settings import settings

_url = settings.database_url
_engine_kwargs: dict = {}
if _url.startswith("sqlite"):
    _engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(_url, **_engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def create_tables() -> None:
    """Create all tables defined by ORM models that have been registered with Base."""
    Base.metadata.create_all(bind=engine)
