# Mental Health Dashboard - Testing and Verification Guide

This document walks through how to set up, run, and manually verify every feature of the Mental Health Dashboard project. It covers backend unit/integration tests, frontend verification, Docker deployment, and security checks.

---

## Prerequisites

Before you begin, make sure you have the following installed on your machine:

- **Python 3.9+** (for running backend tests locally)
- **Node.js 20+** and **npm** (for the Next.js frontend)
- **Docker** and **Docker Compose** (for containerized deployment)
- **PostgreSQL 16** (only needed if running the backend outside Docker)
- **Git** (for version control)

---

## 1. Backend Tests (pytest)

The backend has 126 automated tests covering repositories, services, endpoints, security, and integration flows. Test coverage sits at 90%.

### 1.1 Running Tests Locally

From the `backend/` directory:

```bash
cd backend

# Install dependencies (if not already done)
pip install -e ".[dev]" --break-system-packages

# Run all tests with verbose output
PYTHONPATH=src \
DATABASE_URL=sqlite:////tmp/test_mental_health.db \
SECRET_KEY=test-secret-key \
SMTP_USERNAME=x \
SMTP_PASSWORD=x \
SMTP_FROM_EMAIL=x \
python3 -m pytest tests/ -v --tb=short
```

You should see output ending with:

```
============================= 126 passed in ~22s =============================
```

### 1.2 Running Tests with Coverage Report

First install pytest-cov if you don't have it:

```bash
pip install pytest-cov --break-system-packages
```

Then run with coverage:

```bash
PYTHONPATH=src \
DATABASE_URL=sqlite:////tmp/test_mental_health.db \
SECRET_KEY=test-secret-key \
SMTP_USERNAME=x \
SMTP_PASSWORD=x \
SMTP_FROM_EMAIL=x \
python3 -m pytest tests/ --cov=app --cov-report=term-missing --no-header --override-ini="addopts="
```

Expected coverage: ~90% across all modules.

### 1.3 What the Tests Cover

| Test File | Tests | What It Validates |
|---|---|---|
| `test_user_crud.py` | 7 | User repository CRUD (create, get by id/email, update password, delete) |
| `test_user_endpoints.py` | 17 | Registration, login, logout, profile, password change, duplicate handling |
| `test_journal.py` | 15 | Journal repository CRUD + endpoint create/read/update/delete + auth checks |
| `test_questionnaire_crud.py` | 11 | Questionnaire repository CRUD + average calculation + date filtering |
| `test_questionnaire_endpoints.py` | 24 | Questionnaire endpoints: create, get all, get by id, average, update, delete + ownership checks |
| `test_google_oauth.py` | 12 | Google OAuth URL generation, token exchange, user info fetch, login flow, callback redirect |
| `test_password_reset.py` | 9 | Token generation, validation, expiry, password reset flow |
| `test_settings.py` | 5 | App settings loading from environment variables |
| `test_auth.py` | 6 | JWT creation, decoding, expiry, invalid token handling |
| `test_sentiment.py` | 5 | Sentiment scoring (positive, negative, neutral, empty input, fallback) |
| `test_integration.py` | 11 | Full user registration flow, journal CRUD integration, questionnaire integration, security headers, health check |

---

## 2. Docker Deployment

### 2.1 Starting All Services

From the project root:

```bash
docker-compose up --build
```

This starts three containers:

- **db**: PostgreSQL 16 on port 5432
- **backend**: FastAPI on port 8000
- **frontend**: Next.js on port 3000

Wait until you see logs like:

```
backend  | INFO:     Uvicorn running on http://0.0.0.0:8000
frontend | Ready in Xs
```

### 2.2 Verifying Services Are Running

```bash
# Check all containers are up
docker-compose ps

# Test backend health endpoint
curl http://localhost:8000/api/health

# Expected response:
# {"status":"healthy"}
```

### 2.3 Stopping Services

```bash
docker-compose down

# To also remove the database volume (full reset):
docker-compose down -v
```

---

## 3. Manual Frontend Verification

Open your browser and navigate to `http://localhost:3000`. Walk through each page below.

### 3.1 Landing Page (`/`)

- Page loads with the app name, tagline, and two buttons: "Login" and "Create Account"
- Both buttons navigate to the correct pages
- If you're already logged in, you should be redirected to `/dashboard`

### 3.2 Create Account (`/create-account`)

- Fill in: username, email, password, confirm password
- Click "Create Account"
- On success, you're automatically logged in and redirected to `/dashboard`
- Try submitting with mismatched passwords to verify client-side validation
- Try registering with an already-used email to verify the backend returns an error

### 3.3 Login (`/login`)

- Enter email and password from the account you just created
- Click "Login"
- On success, you're redirected to `/dashboard`
- Try incorrect credentials to verify error message appears
- The "Sign in with Google" button should redirect to Google's consent screen (only works if Google OAuth credentials are configured in `.env`)

### 3.4 Dashboard (`/dashboard`)

- Shows a mood chart (SVG-based line/area chart)
- Period selector at the top: Week, Month, Year
- Clicking each period re-renders the chart for that range
- Right sidebar shows recent journal entries
- If no data exists yet, the chart should display gracefully with an empty state

### 3.5 Journals (`/journals`)

- Click "New Entry" to create a journal
- Type a journal body in the modal, click save
- The new entry appears in the grid with a colored stripe on the left
- Click on a journal card to view/edit it
- Use the delete button to remove an entry
- Use the search bar to filter entries by text content
- Each journal shows a positivity score (1-10) derived from VADER sentiment analysis

### 3.6 Questionnaire (`/questionnaire`)

- Shows a slider from 1 to 10
- Drag the slider and click "Submit"
- First submission on a given day creates a new entry
- Subsequent submissions on the same day update the existing entry (upsert behavior)
- After submitting, you should see a confirmation message
- The score feeds into the dashboard mood chart

### 3.7 Dark Mode

- Click the moon/sun icon in the header to toggle dark mode
- All pages should switch themes cleanly (background, text, cards, inputs, chart)
- The theme preference persists across page refreshes (stored in localStorage)
- On first visit, the app respects your OS-level dark mode preference

### 3.8 Authentication Flow

- Try navigating to `/dashboard` without being logged in. You should be redirected to `/login`
- Try navigating to `/login` while logged in. You should be redirected to `/dashboard`
- Click "Logout" in the header. You should be redirected to `/` and JWT removed from localStorage

### 3.9 Forgot Password (`/forgot-password`)

- Enter an email address and submit
- The backend always returns a success message (no account enumeration)
- If SMTP is configured, a reset link email is sent

### 3.10 Reset Password (`/reset-password?token=...`)

- Only accessible via the link in the reset email
- Enter a new password and confirm it
- On success, redirected to login

---

## 4. Backend API Manual Verification

You can test every backend endpoint using `curl` or any API client (Postman, Insomnia, etc.).

### 4.1 Health Check

```bash
curl http://localhost:8000/api/health
# {"status":"healthy"}
```

### 4.2 Create Account

```bash
curl -X POST http://localhost:8000/api/create-account \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"SecurePass123"}'
```

Expected: 201 response with user object containing `id`, `username`, `email`, `created_at`.

### 4.3 Login

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123"}'
```

Expected: 200 response with `{"access_token":"...","token_type":"bearer"}`.

Save the token for authenticated requests below:

```bash
export TOKEN="<paste_your_token_here>"
```

### 4.4 Get Profile

```bash
curl http://localhost:8000/api/users/me \
  -H "Authorization: Bearer $TOKEN"
```

### 4.5 Create Journal

```bash
curl -X POST http://localhost:8000/api/journals/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"body":"Had a productive day working on the project"}'
```

Expected: 201 with journal object including `id`, `body`, `sentiment_score`, `created_at`.

### 4.6 Get All Journals

```bash
curl http://localhost:8000/api/journals \
  -H "Authorization: Bearer $TOKEN"
```

### 4.7 Submit Questionnaire

```bash
curl -X POST http://localhost:8000/api/questionnaires \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"score":8.5}'
```

Expected: 201 with questionnaire object.

### 4.8 Get Today's Questionnaire

```bash
curl http://localhost:8000/api/questionnaires/today \
  -H "Authorization: Bearer $TOKEN"
```

### 4.9 Get Average Score

```bash
curl "http://localhost:8000/api/questionnaires/average" \
  -H "Authorization: Bearer $TOKEN"
```

### 4.10 Upsert Verification

Submit a questionnaire twice on the same day:

```bash
# First submission
curl -X POST http://localhost:8000/api/questionnaires \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"score":5.0}'

# Second submission (same day, should update, not create new)
curl -X POST http://localhost:8000/api/questionnaires \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"score":9.0}'

# Verify only one entry exists
curl http://localhost:8000/api/questionnaires \
  -H "Authorization: Bearer $TOKEN"
# Should return array with 1 entry, score=9.0
```

---

## 5. Security Verification

### 5.1 Security Headers

```bash
curl -I http://localhost:8000/api/health
```

Verify these headers are present in the response:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 5.2 Rate Limiting

The backend enforces 60 requests per minute per IP address. To test:

```bash
# Quick burst test (run in bash)
for i in $(seq 1 65); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health)
  echo "Request $i: $STATUS"
done
```

Requests 1-60 should return `200`. Requests 61+ should return `429` with:

```json
{"detail": "Rate limit exceeded. Try again later."}
```

### 5.3 CORS

```bash
curl -I -X OPTIONS http://localhost:8000/api/health \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET"
```

Verify `Access-Control-Allow-Origin: http://localhost:3000` is in the response.

### 5.4 JWT Authentication

```bash
# Request without token should return 401
curl http://localhost:8000/api/users/me
# {"detail":"Not authenticated"}

# Request with invalid token should return 401
curl http://localhost:8000/api/users/me \
  -H "Authorization: Bearer invalid-token-here"
# {"detail":"Could not validate credentials"}
```

### 5.5 Authorization (Ownership Checks)

Create two accounts and try accessing one user's data with the other's token:

```bash
# Create user A and get token
curl -X POST http://localhost:8000/api/create-account \
  -H "Content-Type: application/json" \
  -d '{"username":"userA","email":"a@test.com","password":"PassA123"}'

TOKEN_A=$(curl -s -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"a@test.com","password":"PassA123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Create a journal as user A
JOURNAL_ID=$(curl -s -X POST http://localhost:8000/api/journals/create \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"body":"User A private entry"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

# Create user B and get token
curl -X POST http://localhost:8000/api/create-account \
  -H "Content-Type: application/json" \
  -d '{"username":"userB","email":"b@test.com","password":"PassB123"}'

TOKEN_B=$(curl -s -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"b@test.com","password":"PassB123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Try accessing user A's journal as user B
curl http://localhost:8000/api/journals/$JOURNAL_ID \
  -H "Authorization: Bearer $TOKEN_B"
# Should return 403 Forbidden
```

---

## 6. Database Verification

### 6.1 Connecting to PostgreSQL (Docker)

```bash
docker exec -it mental-health-dashboard-db-1 psql -U mhd_user -d mental_health_db
```

### 6.2 Checking Tables Exist

```sql
\dt
```

Expected tables: `users`, `journals`, `questionnaires`, `password_reset_tokens`.

### 6.3 Checking Data

```sql
SELECT id, username, email, created_at FROM users;
SELECT id, user_id, body, sentiment_score, created_at FROM journals ORDER BY created_at DESC LIMIT 5;
SELECT id, user_id, score, created_at FROM questionnaires ORDER BY created_at DESC LIMIT 5;
```

---

## 7. Frontend Build Verification

### 7.1 Local Dev Server

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

### 7.2 Production Build

```bash
cd frontend
npm run build
```

All routes should compile successfully:

```
Route (app)                           Size
/                                     ...
/create-account                       ...
/dashboard                            ...
/forgot-password                      ...
/journals                             ...
/login                                ...
/questionnaire                        ...
/reset-password                       ...
/auth/google/callback                 ...
```

### 7.3 Docker Build

```bash
docker build -t mhd-frontend ./frontend
```

Should complete without errors.

---

## 8. Project Structure Overview

```
Mental-Health-Dashboard/
├── docker-compose.yml          # 3 services: db, backend, frontend
├── .env                        # Environment variables (DATABASE_URL, SECRET_KEY, etc.)
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml          # Python deps including psycopg2-binary, pytest-cov
│   ├── src/app/
│   │   ├── main.py             # FastAPI app with security middleware + rate limiter
│   │   ├── core/               # auth.py, database.py, dependencies.py, settings.py
│   │   ├── models/             # SQLAlchemy ORM models (user, journal, questionnaire)
│   │   ├── repository/         # Database CRUD operations
│   │   ├── routes/             # API route handlers
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   └── services/           # Business logic + sentiment analysis
│   └── tests/                  # 126 pytest tests, 90% coverage
├── frontend/
│   ├── Dockerfile
│   ├── package.json            # Next.js 16, React 19, Tailwind, ShadCN deps
│   ├── next.config.mjs         # API proxy rewrites
│   ├── src/
│   │   ├── app/                # Next.js App Router pages
│   │   ├── components/         # Shared components + ShadCN UI (button, card, input, etc.)
│   │   ├── contexts/           # AuthContext, ThemeContext
│   │   ├── services/           # Axios API client with JWT interceptors
│   │   └── lib/                # cn() utility for class merging
```

---

## 9. Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4, ShadCN UI |
| Backend | FastAPI, SQLAlchemy ORM, Pydantic v2 |
| Database | PostgreSQL 16 (Docker), SQLite (tests) |
| Auth | JWT (HS256) + bcrypt password hashing + Google OAuth2 |
| Sentiment | NLTK VADER (compound score mapped to 1-10 scale) |
| Testing | pytest, pytest-cov (126 tests, 90% coverage) |
| Deployment | Docker Compose (3 services) |
| Security | CORS, rate limiting (60 req/min), security headers, ownership checks |

---

## 10. Environment Variables Reference

These go in the root `.env` file:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://mhd_user:mhd_pass@localhost:5432/mental_health_db` |
| `SECRET_KEY` | JWT signing secret | `Dark-Knight-5679` |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:3000` |
| `SMTP_HOST` | Email server host | `smtp.gmail.com` |
| `SMTP_PORT` | Email server port | `587` |
| `SMTP_USERNAME` | Email account | `your-email@gmail.com` |
| `SMTP_PASSWORD` | Email app password | `your-app-password` |
| `SMTP_FROM_EMAIL` | Sender address | `your-email@gmail.com` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | from Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | `http://localhost:8000/api/auth/google/callback` |
