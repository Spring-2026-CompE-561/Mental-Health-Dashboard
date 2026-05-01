# Mental Health Dashboard - Setup Guide

## Prerequisites

- **Docker Desktop** (v4.0+) — [download](https://www.docker.com/products/docker-desktop/)
- **Git**
- **Node.js 18+** (only needed if running frontend without Docker)
- **Python 3.9+** (only needed if running backend without Docker)

---

## Option 1: Docker (Recommended - One Command Setup)

### 1. Clone and switch to the PR branch

```bash
git clone https://github.com/Spring-2026-CompE-561/Mental-Health-Dashboard.git
cd Mental-Health-Dashboard
git checkout feature/nextjs-docker-frontendfix
```

### 2. Create the `.env` file

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```
DATABASE_URL=postgresql://mhd_user:mhd_pass@localhost:5432/mental_health_db
SECRET_KEY=any-random-string-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_URL=http://localhost:3000

# SMTP (for password reset emails - optional for testing)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_USE_TLS=true

# Google OAuth (optional - only needed for Google Sign In)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
```

> **Note:** SMTP and Google OAuth are optional. The app works fine without them — you just won't be able to use password reset emails or Google Sign In.

### 3. Start everything

```bash
docker compose up -d --build
```

This starts 3 containers:
- **PostgreSQL** on port `5432`
- **FastAPI backend** on port `8000`
- **Next.js frontend** on port `3000`

### 4. Open the app

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 5. Stop the app

```bash
docker compose down
```

To also wipe the database:

```bash
docker compose down -v
```

---

## Option 2: Run Without Docker (Manual Setup)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # macOS/Linux
# .venv\Scripts\activate         # Windows

pip install -e ".[dev]"
python -c "import nltk; nltk.download('vader_lexicon', quiet=True)"
```

Create a `.env` file in the **project root** (same as Option 1 above), but change the DATABASE_URL if using SQLite:

```
DATABASE_URL=sqlite:///./mental_health_tracker.db
```

Start the backend:

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at [http://localhost:3000](http://localhost:3000).

---

## Running Tests

### Backend tests (126 tests)

With Docker running:

```bash
docker compose exec backend pytest
```

Without Docker:

```bash
cd backend
source .venv/bin/activate
pytest
```

---

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, ShadCN UI
- **Backend:** FastAPI, SQLAlchemy, Pydantic v2, NLTK (VADER sentiment)
- **Database:** PostgreSQL 16 (Docker) or SQLite (local dev)
- **Auth:** JWT (HS256) + bcrypt + Google OAuth2
