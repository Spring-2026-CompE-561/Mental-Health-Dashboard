# Backend

FastAPI REST API handling authentication, journal entries with NLP sentiment analysis, and daily mood questionnaires.

## Architecture



| Layer | Directory | Responsibility |
|---|---|---|
| Routes | `src/app/routes/` | HTTP request handling, input/output serialization |
| Services | `src/app/services/` | Business logic and authorization checks |
| Repository | `src/app/repository/` | Database queries via SQLAlchemy |
| Models | `src/app/models/` | SQLAlchemy ORM table definitions |
| Schemas | `src/app/schemas/` | Pydantic request/response validation |
| Core | `src/app/core/` | Auth, database session, settings, dependency injection |
