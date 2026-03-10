from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Mental Health Dashboard"
    VERSION: str = "0.1.0"
    DATABASE_URL: str = "sqlite:///./mental_health_tracker.db"

settings = Settings()
