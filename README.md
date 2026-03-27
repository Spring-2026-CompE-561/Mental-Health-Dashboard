# Mental Health Dashboard

A comprehensive full-stack web application designed to help users track and analyze their daily emotional well-being. The application allows users to log mood scores, record qualitative notes about their mental state, and visualize trends over time. Key features include secure user authentication, a historical mood log, and an interactive dashboard for personal wellness insights.

---

## Setup & Installation

This project uses [uv](https://docs.astral.sh/uv/) for modern dependency management and environment isolation.

### 1. Prerequisites

Ensure you have `uv` installed on your machine:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. Project Initialization

Clone the repository and run the following command to create a virtual environment and install all dependencies:

```bash
uv sync
```

### 3. Development Setup

To ensure code quality and consistent formatting across the team, you must install the git pre-commit hooks. This will automatically run the linter (Ruff) every time you try to commit code.

```bash
uv run pre-commit install
```

### 4. Environment Configuration

Create a `.env` file in the `backend/` directory to override default settings:

```env
SECRET_KEY=your-long-random-secret-key
DATABASE_URL=sqlite:///./mental_health_tracker.db
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALGORITHM=HS256
```

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | `change-me-to-a-long-random-string` | Secret key used for signing JWT tokens |
| `DATABASE_URL` | `sqlite:///./mental_health_tracker.db` | SQLAlchemy database connection string |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | JWT token expiration time in minutes |
| `ALGORITHM` | `HS256` | Algorithm used for JWT encoding |

### 5. Running the Development Server

To start the FastAPI backend with auto-reload enabled:

```bash
uv run dev
```

The API will be available at `http://127.0.0.1:8000`.

### 6. Interactive Documentation

Once the server is running, you can explore and test the API endpoints directly via Swagger UI:

- **Swagger UI:** http://127.0.0.1:8000/docs
- **Redoc:** http://127.0.0.1:8000/redoc

---

## Running Tests

Tests are written with `pytest` and use an isolated SQLite database so they never touch your development data.

```bash
uv run pytest
```

To run with verbose output:

```bash
uv run pytest -v
```

To run a specific test file:

```bash
uv run pytest tests/test_auth.py
```

---

## API Endpoints

All endpoints are prefixed with `/api`. Protected routes require a `Bearer` token in the `Authorization` header.

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/create-account` | Register a new user | No |
| POST | `/api/login` | Log in and receive a JWT token | No |
| POST | `/api/logout` | Log out (client-side token invalidation) | No |
| GET | `/api/auth/google/callback` | Google OAuth callback | No |

### Users

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/users/me` | Get the currently authenticated user | Yes |
| GET | `/api/users/{id}` | Get a user by ID | No |
| PUT | `/api/users/{id}` | Change password | Yes |
| DELETE | `/api/users/{id}` | Delete account | Yes |

### Journals

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/journals/create` | Create a journal entry | Yes |
| GET | `/api/journals/` | Get all journal entries | Yes |
| GET | `/api/journals/{id}` | Get a single journal entry | Yes |
| PUT | `/api/journals/{id}` | Update a journal entry | Yes |
| DELETE | `/api/journals/{id}` | Delete a journal entry | Yes |

### Questionnaires

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/questionnaires/` | Submit a daily questionnaire score | Yes |
| GET | `/api/questionnaires/` | Get all scores for the logged-in user | Yes |
| GET | `/api/questionnaires/{id}` | Get a single questionnaire entry | Yes |
| GET | `/api/questionnaires/average` | Get average score (optional date filtering) | Yes |
| PUT | `/api/questionnaires/{id}` | Update a questionnaire score | Yes |
| DELETE | `/api/questionnaires/{id}` | Delete a questionnaire entry | Yes |

---

## Project Structure

```
backend/
├── pyproject.toml
├── requirements.txt
├── README.md
├── src/
│   └── app/
│       ├── __init__.py
│       ├── main.py
│       ├── api/
│       │   ├── __init__.py
│       │   ├── deps.py
│       │   └── endpoints/
│       │       ├── auth.py
│       │       ├── journal.py
│       │       ├── questionnaires.py
│       │       └── users.py
│       ├── core/
│       │   ├── __init__.py
│       │   ├── auth.py
│       │   ├── database.py
│       │   └── settings.py
│       ├── models/
│       │   ├── __init__.py
│       │   ├── journal.py
│       │   ├── questionnaire.py
│       │   └── user.py
│       ├── repository/
│       │   ├── __init__.py
│       │   ├── journal.py
│       │   ├── questionnaire.py
│       │   └── user.py
│       ├── schemas/
│       │   ├── __init__.py
│       │   ├── journal.py
│       │   ├── questionnaire.py
│       │   ├── token.py
│       │   └── user.py
│       └── services/
│           ├── __init__.py
│           ├── journal_service.py
│           ├── questionnaire_service.py
│           └── user_service.py
└── tests/
    ├── conftest.py
    ├── test_auth.py
    ├── test_endpoints.py
    ├── test_questionnaire_crud.py
    ├── test_questionnaire_endpoints.py
    └── test_user_crud.py
```

---

## Team Members

- Christian Byars
- Aswathi Ravishankar Ram
- Nisha Ravankar
- Surender Varma Bollampally
- Bryan Stahman