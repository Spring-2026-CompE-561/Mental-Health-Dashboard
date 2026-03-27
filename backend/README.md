# Mental Health Dashboard — Backend

FastAPI backend for the Mental Health Dashboard application.

## Setup

### Using uv (recommended)
```bash
cd backend
uv sync
```

### Using pip
```bash
cd backend
pip install -r requirements.txt
```

### Environment Variables
Create a `.env` file in `backend/`:
```
DATABASE_URL=sqlite:///./mental_health_tracker.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Running the Server
```bash
cd backend
PYTHONPATH=src uvicorn app.main:app --reload
```
API docs available at `http://127.0.0.1:8000/docs`

## Running Tests
```bash
cd backend
PYTHONPATH=src python -m pytest tests/ -v
```

## Project Structure
```
backend/
├── src/app/
│   ├── api/
│   │   ├── deps.py              # DB session + JWT get_current_user
│   │   └── endpoints/
│   │       ├── auth.py          # POST /create-account, /login, /logout
│   │       ├── users.py         # GET /me, GET/PUT/DELETE /{user_id}
│   │       ├── journal.py       # Journal CRUD endpoints
│   │       └── questionnaires.py# Questionnaire endpoints
│   ├── core/
│   │   ├── auth.py              # Pure bcrypt hashing + JWT creation
│   │   ├── database.py          # SQLAlchemy engine, session, Base
│   │   └── settings.py          # Pydantic BaseSettings config
│   ├── models/
│   │   ├── user.py              # User ORM model
│   │   ├── journal.py           # Journal ORM model
│   │   └── questionnaire.py     # Questionnaire ORM model
│   ├── repository/
│   │   └── user.py              # Thin CRUD operations
│   ├── services/
│   │   └── user_service.py      # Business logic (register, login, etc.)
│   └── main.py                  # FastAPI app with CORS + logging middleware
├── tests/
│   ├── conftest.py              # Test fixtures and DB setup
│   ├── test_auth.py             # Password hashing + JWT tests
│   ├── test_user_crud.py        # Repository layer tests
│   └── test_endpoints.py        # API integration tests
├── requirements.txt
└── pyproject.toml
```

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/create-account | Register new user | No |
| POST | /api/login | Login, returns JWT | No |
| POST | /api/logout | Logout | No |
| GET | /api/users/me | Get current user | Bearer |
| GET | /api/users/{id} | Get user by ID | No |
| PUT | /api/users/{id} | Change password | Bearer |
| DELETE | /api/users/{id} | Delete account | Bearer |
