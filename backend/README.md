# Backend

FastAPI REST API for authentication, journal entries, and daily mood questionnaires. Backed by PostgreSQL.

## Architecture

| Layer | Directory | Responsibility |
|---|---|---|
| Routes | `src/app/routes/` | HTTP request handling, input/output serialization |
| Services | `src/app/services/` | Business logic and authorization checks |
| Repository | `src/app/repository/` | Database queries via SQLAlchemy |
| Models | `src/app/models/` | SQLAlchemy ORM table definitions |
| Schemas | `src/app/schemas/` | Pydantic request/response validation |
| Core | `src/app/core/` | Auth, database session, settings, dependency injection |
| Migrations | `alembic/versions/` | Alembic-managed schema migrations |

## Quickstart

```bash
uv sync
uv run alembic upgrade head
uv run dev                # http://127.0.0.1:8000
uv run pytest --cov=app   # tests + coverage
```
