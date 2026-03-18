from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Mental Health Dashboard API"
    app_version: str = "1.0.0"

    secret_key: str = Field(
        default="your_secret_key",
        description="The secret key for JWT",
    )

    algorithm: str = Field(
        default="HS256",
        description="The algorithm used for JWT",
    )

    access_token_expire_minutes: int = Field(
        default=30,
        description="Access token expiration time in minutes",
    )

    database_url: str = Field(
        default="sqlite:///./budget_buddy.db",
        description="Database connection URL",
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()