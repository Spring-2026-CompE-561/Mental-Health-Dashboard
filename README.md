# Mental Health Dashboard

A full-stack web app for tracking and visualizing daily mental-health metrics. Users log mood/depression/anxiety scores plus journal entries, and the dashboard charts trends over weekly, monthly, and yearly windows.

---

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 16.2.4 · React 19.2.4 · TypeScript 5 · Tailwind CSS 4.2.4 · ShadCN UI v4 (March 2026) |
| Backend | FastAPI 0.136.1 · Pydantic 2 · SQLAlchemy 2 · Alembic |
| Database | PostgreSQL 16 (locally hosted) |
| Tests | Vitest + Testing Library (frontend, ≥50% coverage) · pytest + pytest-cov (backend, ≥50% coverage) |

---

## Setup

### Prerequisites

- Node.js 20+
- Python 3.12+ (or [`uv`](https://docs.astral.sh/uv/) for managed Python)
- PostgreSQL 16 running locally on port 5432, OR Docker

### Option A — Docker (recommended)

```bash
docker compose up --build
```

Brings up PostgreSQL on `:5432`, FastAPI on `:8000`, Next.js on `:3000`.

### Option B — Local

**1. Start PostgreSQL** (one-shot, via Docker):

```bash
docker compose up db
```

**2. Backend:**

```bash
cd backend
uv sync                     # or: python -m venv .venv && .venv/bin/pip install -r requirements.txt
uv run alembic upgrade head # apply migrations
uv run dev                  # runs on http://127.0.0.1:8000
```

**3. Frontend:**

```bash
cd frontend
npm install
npm run dev                 # http://localhost:3000
```

### Environment

`backend/.env`:

```env
DATABASE_URL=postgresql://mhd_user:mhd_pass@localhost:5432/mental_health_db
SECRET_KEY=change-me-to-a-long-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your@email
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your@email
SMTP_USE_TLS=true
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## Tests

### Frontend unit tests (Vitest + Testing Library)

```bash
cd frontend
npm test                  # 71 tests
npm run test:coverage     # 93%+ line coverage
```

### Backend unit tests (pytest)

Tests use an isolated SQLite DB by default so they run anywhere. Override with `TEST_DATABASE_URL=postgresql://...` to run against a real PG test DB.

```bash
cd backend
uv run pytest --cov=app   # 126 tests, 91% coverage
```

### Integration tests (frontend ↔ backend)

Spawns the real FastAPI backend on a random port and exercises every endpoint via HTTP using the same axios client the frontend uses:

```bash
cd frontend
npm run test:integration  # 14 tests covering auth, journal CRUD, questionnaire flow, CORS
```

---

## API surface

All endpoints prefixed with `/api`. Protected routes need `Authorization: Bearer <jwt>`.

| Group | Endpoint | Auth |
|---|---|---|
| Auth | `POST /create-account`, `POST /login`, `POST /logout`, `POST /forgot-password`, `POST /reset-password`, `GET /auth/google/login`, `GET /auth/google/callback` | No |
| Users | `GET /users/me`, `PUT /users/{id}`, `DELETE /users/{id}` | Yes |
| Journals | `POST /journals/create`, `GET /journals`, `GET /journals/{id}`, `PUT /journals/{id}`, `DELETE /journals/{id}` | Yes |
| Questionnaires | `POST /questionnaires`, `GET /questionnaires`, `GET /questionnaires/today`, `GET /questionnaires/average`, `GET /questionnaires/{id}`, `PUT /questionnaires/{id}`, `DELETE /questionnaires/{id}` | Yes |

Interactive docs: `http://127.0.0.1:8000/docs` and `http://127.0.0.1:8000/redoc`.

---

## Project structure

```
Mental-Health-Dashboard/
├── backend/
│   ├── alembic/                 ← DB migrations (PostgreSQL)
│   ├── src/app/
│   │   ├── core/                ← settings, db engine, auth, deps
│   │   ├── models/              ← SQLAlchemy ORM
│   │   ├── schemas/             ← Pydantic request/response models
│   │   ├── repository/          ← CRUD operations
│   │   ├── routes/              ← FastAPI routers
│   │   ├── services/            ← business logic (no NLP/sentiment)
│   │   └── main.py
│   └── tests/                   ← pytest unit + integration tests
├── frontend/
│   ├── src/
│   │   ├── app/                 ← Next.js App Router pages (.tsx)
│   │   ├── components/          ← UI components (.tsx)
│   │   ├── contexts/            ← Auth + Theme contexts (.tsx)
│   │   ├── services/api.ts      ← axios client (typed)
│   │   ├── types/index.ts       ← shared interfaces
│   │   └── lib/utils.ts
│   ├── tests/integration/       ← Vitest integration tests vs real backend
│   ├── vitest.config.ts
│   └── vitest.integration.config.ts
└── docker-compose.yml
```

The frontend is **TypeScript-only** — there are no `.js` files in `frontend/src`.

---

## Team

- Christian Byars
- Aswathi Ravishankar Ram
- Nisha Ravankar
- Surender Varma Bollampally
- Bryan Stahman
