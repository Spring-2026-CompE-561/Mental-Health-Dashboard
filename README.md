# Mental Health Dashboard

A comprehensive full-stack web application designed to help users track and analyze their daily emotional well-being. The application allows users to log mood scores, record qualitative notes about their mental state, and visualize trends over time. Key features include secure user authentication, a historical mood log, and an interactive dashboard for personal wellness insights.

---

## Setup & Installation

### Prerequisites

- [uv](https://docs.astral.sh/uv/) — Python package manager (backend)
- [Node.js](https://nodejs.org/) — for the frontend
- [Docker](https://www.docker.com/) — optional, for containerized setup

### Option A: Docker (Recommended)

```bash
docker compose up --build
```

This starts three services:
- **PostgreSQL** on port 5432
- **Backend API** on port 8000
- **Frontend** on port 3000

### Option B: Local Development

**Backend:**
```bash
cd backend
uv sync
uv run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Development Setup

Install the git pre-commit hooks to automatically run the backend linter (Ruff) on every commit:

```bash
cd backend
uv run pre-commit install
```

For frontend linting:

```bash
cd frontend
npm run lint
```

### Environment Configuration

Create a `backend/.env` file (see `.env.example` for a full template). Minimum required for local dev:

```env
SECRET_KEY=your-long-random-secret-key
DATABASE_URL=sqlite:///./mental_health_tracker.db
FRONTEND_URL=http://localhost:3000
```

Full reference:

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | `change-me-to-a-long-random-string` | JWT signing secret |
| `DATABASE_URL` | `sqlite:///./mental_health_tracker.db` | SQLAlchemy connection string |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | JWT token TTL in minutes |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `FRONTEND_URL` | `http://localhost:3000` | Frontend origin for CORS and redirects |
| `GOOGLE_CLIENT_ID` | | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | `http://localhost:8000/api/auth/google/callback` | OAuth callback URL |
| `SMTP_HOST` | `smtp.gmail.com` | Mail server for password reset emails |
| `SMTP_PORT` | `587` | Mail server port |
| `SMTP_USERNAME` | | Mail account login |
| `SMTP_PASSWORD` | | Mail account password |
| `SMTP_FROM_EMAIL` | | Sender email address |
| `SMTP_USE_TLS` | `true` | Enable STARTTLS |

### Interactive API Documentation

Once the backend is running, API docs are available at:

- **Swagger UI:** http://127.0.0.1:8000/docs
- **ReDoc:** http://127.0.0.1:8000/redoc

---

## Running Tests

Tests use an isolated SQLite database and never touch development data.

```bash
cd backend
uv run pytest                          # run all tests
uv run pytest -v                       # verbose output
uv run pytest tests/test_auth.py       # run a specific file
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
| POST | `/api/forgot-password` | Request a password reset email | No |
| POST | `/api/reset-password` | Reset password using a token | No |
| GET | `/api/auth/google/login` | Get Google OAuth consent URL | No |
| GET | `/api/auth/google/callback` | Google OAuth callback (redirects to frontend) | No |

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
| POST | `/api/journals/create` | Create a journal entry (sentiment auto-computed) | Yes |
| GET | `/api/journals/` | Get all journal entries for the logged-in user | Yes |
| GET | `/api/journals/{id}` | Get a single journal entry | Yes |
| PUT | `/api/journals/{id}` | Update a journal entry | Yes |
| DELETE | `/api/journals/{id}` | Delete a journal entry | Yes |

### Questionnaires

POST body requires `mood`, `depression`, and `anxiety` fields, each a float between 0 and 10.

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/questionnaires/` | Submit daily mood, depression, and anxiety scores | Yes |
| GET | `/api/questionnaires/` | Get all entries for the logged-in user | Yes |
| GET | `/api/questionnaires/today` | Get today's entry, or null if none submitted | Yes |
| GET | `/api/questionnaires/average` | Get average score (optional `from_date`/`to_date` params) | Yes |
| GET | `/api/questionnaires/{id}` | Get a single entry | Yes |
| PUT | `/api/questionnaires/{id}` | Update an entry | Yes |
| DELETE | `/api/questionnaires/{id}` | Delete an entry | Yes |

---

## Project Structure

```
Mental-Health-Dashboard/
├── backend/
│   ├── src/app/
│   │   ├── main.py                     
│   │   ├── core/
│   │   │   ├── auth.py                 
│   │   │   ├── database.py            
│   │   │   ├── dependencies.py         
│   │   │   └── settings.py             
│   │   ├── models/                     
│   │   │   ├── journal.py
│   │   │   ├── password_reset.py
│   │   │   ├── questionnaire.py
│   │   │   └── user.py
│   │   ├── schemas/                  
│   │   │   ├── journal.py
│   │   │   ├── password_reset.py
│   │   │   ├── questionnaire.py
│   │   │   ├── token.py
│   │   │   └── user.py
│   │   ├── repository/               
│   │   │   ├── journal.py
│   │   │   ├── questionnaire.py
│   │   │   └── user.py
│   │   ├── routes/                 
│   │   │   ├── auth.py
│   │   │   ├── journal.py
│   │   │   ├── questionnaires.py
│   │   │   └── users.py
│   │   └── services/                 
│   │       ├── email_service.py
│   │       ├── google_oauth_service.py
│   │       ├── journal_service.py
│   │       ├── password_reset_service.py
│   │       ├── questionnaire_service.py
│   │       ├── sentiment.py
│   │       └── user_service.py
│   └── tests/
│       ├── conftest.py
│       ├── test_auth.py
│       ├── test_endpoints.py
│       ├── test_google_oauth.py
│       ├── test_integration.py
│       ├── test_journal.py
│       ├── test_models.py
│       ├── test_questionnaire_crud.py
│       ├── test_questionnaire_endpoints.py
│       └── test_user_crud.py
├── frontend/
│   └── src/
│       ├── app/                       
│       │   ├── page.js                 
│       │   ├── layout.js               
│       │   ├── dashboard/page.js
│       │   ├── journals/page.js
│       │   ├── questionnaire/page.js
│       │   ├── login/page.js
│       │   ├── create-account/page.js
│       │   ├── forgot-password/page.js
│       │   ├── reset-password/page.js
│       │   └── auth/google/callback/page.js
│       ├── components/                
│       │   ├── AppHeader.js
│       │   ├── GoogleButton.js
│       │   ├── Logo.js
│       │   └── Providers.js
│       ├── contexts/                
│       │   ├── AuthContext.js
│       │   └── ThemeContext.js
│       └── services/
│           └── api.js               
├── docker-compose.yml
├── .env.example
└── .pre-commit-config.yaml
```

---

## Team Members

- Christian Byars
- Aswathi Ravishankar Ram
- Nisha Ravankar
- Surender Varma Bollampally
- Bryan Stahman
