from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.settings import settings

url = make_url(settings.database_url)
connect_args = {"check_same_thread": False} if url.get_backend_name() == "sqlite" else {}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def create_tables():
    Base.metadata.create_all(bind=engine)
