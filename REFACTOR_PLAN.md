# Mental Health Dashboard — Comprehensive Refactor Plan

## 1. Current State Summary

### Architecture
- **Frontend**: Next.js 16.2.4, React 19.2.4, JavaScript (no TypeScript), Tailwind CSS v4, ShadCN UI (individual `@radix-ui/react-*` packages)
- **Backend**: FastAPI ≥0.115.0, SQLAlchemy, SQLite (default), NLTK/VADER for sentiment analysis
- **Database**: SQLite locally / PostgreSQL via Docker Compose
- **Tests**: Backend has ~1,383 lines across 10 test files (SQLite-backed); Frontend has **zero** tests

### File Inventory
| Layer | Files | Lines of Code |
|-------|-------|---------------|
| Backend source (`src/app/`) | 20 `.py` files | ~1,622 |
| Backend tests (`tests/`) | 11 `.py` files | ~1,383 |
| Frontend source (`src/`) | 22 `.js` files | ~3,348 |
| Frontend tests | 0 | 0 |

---

## 2. Latest Version Targets (Verified May 2026)

| Technology | Current in Repo | Latest Stable | Action |
|------------|----------------|---------------|--------|
| **Next.js** | 16.2.4 | **16.2.4** | ✅ Already latest |
| **React** | 19.2.4 | **19.2.4** | ✅ Already latest |
| **Tailwind CSS** | ^4 | **4.2.4** | ⬆️ Pin to `4.2.4` |
| **@tailwindcss/postcss** | ^4 | **4.2.4** | ⬆️ Pin to `4.2.4` |
| **ShadCN CLI** | not installed | **4.6.0** | ⬆️ Re-init with `npx shadcn@latest` |
| **FastAPI** | ≥0.115.0 | **0.136.1** | ⬆️ Pin to `>=0.136.0,<0.137.0` |
| **Uvicorn** | ≥0.30.0 | latest | ⬆️ Update |
| **Pydantic** | ≥2.12.5 | latest v2 | ⬆️ Update |
| **SQLAlchemy** | ≥2.0.46 | latest 2.x | ⬆️ Update |

---

## 3. Change Requests — Detailed Plan

### 3.1 Remove Journal Positivity Score & NLP Logic

**Goal**: Strip out VADER/NLTK sentiment analysis from both frontend and backend.

#### Backend Changes

| File | Change |
|------|--------|
| `services/sentiment.py` | **DELETE** entire file |
| `repository/journal.py` | Remove `from app.services.sentiment import compute_positivity_score`; remove `sentiment_score=compute_positivity_score(body)` from `create_journal()` and `update_journal()` |
| `models/journal.py` | Remove `sentiment_score = Column(Float, nullable=True)` |
| `schemas/journal.py` | Remove `sentiment_score: Optional[float] = None` from `JournalResponse` |
| `requirements.txt` | Remove `nltk>=3.8.0` |
| `pyproject.toml` | Remove `nltk>=3.8.0` from dependencies |
| `tests/test_journal.py` | Remove any assertions referencing `sentiment_score` |
| `tests/test_models.py` | Remove sentiment-related model tests |
| Database migration | Create an Alembic migration to drop the `sentiment_score` column from `journals` table |

#### Frontend Changes

| File | Change |
|------|--------|
| `dashboard/page.js` → `.tsx` | Remove the entire "Journal Positivity Score" card section (~100 lines); remove `buildPositivityWeek()`, `buildPositivityMonth()`, `buildPositivityYear()`, `buildPositivityChart()` functions; remove `positivityPeriod` state and `positivityChart` memo; remove `positivityRangeLabel` memo |
| `services/api.js` → `.ts` | No change needed (no sentiment-specific API calls) |

**Net effect**: ~200 lines removed from dashboard, ~50 lines removed from backend, `nltk` dependency eliminated.

---

### 3.2 Refactor Frontend to TypeScript

**Goal**: Convert all `.js` files under `frontend/src/` to `.tsx`/`.ts` with strict typing.

#### Setup Steps
1. Install TypeScript and type definitions:
   ```
   npm install -D typescript @types/react @types/react-dom @types/node
   ```
2. Create `tsconfig.json` (Next.js 16 auto-generates one via `npx next --ts`, but we configure manually for strict mode):
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "target": "ES2017",
       "lib": ["dom", "dom.iterable", "esnext"],
       "jsx": "preserve",
       "module": "esnext",
       "moduleResolution": "bundler",
       "resolveJsonModule": true,
       "isolatedModules": true,
       "noEmit": true,
       "incremental": true,
       "esModuleInterop": true,
       "allowJs": false,
       "paths": { "@/*": ["./src/*"] },
       "plugins": [{ "name": "next" }]
     },
     "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
     "exclude": ["node_modules"]
   }
   ```
3. Remove `jsconfig.json` (replaced by `tsconfig.json`)

#### File-by-File Conversion (22 files)

**Pages** (rename `.js` → `.tsx`, add types):
| File | Key Typing Work |
|------|----------------|
| `app/layout.tsx` | Type `children: React.ReactNode` props |
| `app/page.tsx` | Minimal — static landing page |
| `app/login/page.tsx` | Type form state, event handlers (`React.ChangeEvent<HTMLInputElement>`, `React.FormEvent`) |
| `app/create-account/page.tsx` | Same as login |
| `app/dashboard/page.tsx` | Type `Questionnaire`, `Journal` interfaces; type chart builder return types; type `MoodChart` props |
| `app/journals/page.tsx` | Type `Journal` interface, `JournalModal` props, modal state shape |
| `app/questionnaire/page.tsx` | Type slider values, submission payload |
| `app/settings/page.tsx` | Type form state for password change, account deletion |
| `app/forgot-password/page.tsx` | Type form state |
| `app/reset-password/page.tsx` | Type form state, URL search params |
| `app/auth/google/callback/page.tsx` | Type URL params handling |

**Components** (rename `.js` → `.tsx`):
| File | Key Typing Work |
|------|----------------|
| `components/AppHeader.tsx` | Type props (`{ title?: string; logout?: boolean }`) |
| `components/GoogleButton.tsx` | Type click handler props |
| `components/GradientStrip.tsx` | No props — minimal |
| `components/Logo.tsx` | No props — minimal |
| `components/Providers.tsx` | Type `children: React.ReactNode` |
| `components/ui/button.tsx` | Already typed by ShadCN (re-generate) |
| `components/ui/card.tsx` | Already typed by ShadCN (re-generate) |
| `components/ui/input.tsx` | Already typed by ShadCN (re-generate) |
| `components/ui/label.tsx` | Already typed by ShadCN (re-generate) |
| `components/ui/slider.tsx` | Already typed by ShadCN (re-generate) |

**Contexts** (rename `.js` → `.tsx`):
| File | Key Typing Work |
|------|----------------|
| `contexts/AuthContext.tsx` | Define `AuthContextType` interface with `token`, `user`, `loading`, `signIn`, `signOut`, `isAuthenticated`; type `User` interface |
| `contexts/ThemeContext.tsx` | Define `ThemeContextType` with `theme`, `toggleTheme` |

**Services** (rename `.js` → `.ts`):
| File | Key Typing Work |
|------|----------------|
| `services/api.ts` | Define request/response interfaces for all API calls: `LoginRequest`, `CreateAccountRequest`, `JournalCreateRequest`, `JournalResponse`, `QuestionnaireResponse`, etc. |

**Utilities** (rename `.js` → `.ts`):
| File | Key Typing Work |
|------|----------------|
| `lib/utils.ts` | Already minimal (`cn` function) — add types |

#### Shared Type Definitions (new file)
Create `src/types/index.ts`:
```typescript
export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface Journal {
  id: number;
  user_id: number;
  body: string;
  created_at: string;
}

export interface Questionnaire {
  id: number;
  user_id: number;
  mood: number;
  anxiety: number;
  depression: number;
  score: number | null;
  created_at: string;
}

export interface ApiError {
  detail: string;
}
```

#### ShadCN UI Components
Re-generate all ShadCN components using the CLI with TypeScript:
```bash
npx shadcn@latest init  # re-initialize with TS
npx shadcn@latest add button card input label slider
```

#### Config Files
| File | Change |
|------|--------|
| `eslint.config.mjs` | Update to use `@typescript-eslint` parser and rules |
| `next.config.mjs` | No change needed (Next.js handles TS natively) |
| `postcss.config.mjs` | No change |

---

### 3.3 Migrate Database to Locally Hosted PostgreSQL

**Goal**: Replace SQLite default with PostgreSQL as the primary and only database target.

#### Backend Changes

1. **`core/settings.py`**: Change default `database_url` from SQLite to PostgreSQL:
   ```python
   database_url: str = "postgresql://mhd_user:mhd_pass@localhost:5432/mental_health_db"
   ```

2. **`core/database.py`**: Remove SQLite-specific `check_same_thread` logic:
   ```python
   # Remove the conditional connect_args for sqlite
   engine = create_engine(settings.database_url)
   ```

3. **Add Alembic for migrations**:
   - `pip install alembic`
   - `alembic init alembic`
   - Configure `alembic/env.py` to use the app's `Base` and `settings.database_url`
   - Create initial migration from existing models
   - Create migration to drop `sentiment_score` column

4. **`requirements.txt`**: Ensure `psycopg2-binary>=2.9.0` is present (already in `pyproject.toml`); remove SQLite-only comments

5. **`pyproject.toml`**: Add `alembic>=1.13.0` to dependencies

6. **`docker-compose.yml`**: Already has PostgreSQL configured — no changes needed

7. **Update `.env.example`**: Remove SQLite option, make PostgreSQL the only documented option

8. **Test configuration** (`tests/conftest.py`): Update to use a test PostgreSQL database:
   - Option A: Use a separate PostgreSQL test database (`mental_health_test_db`)
   - Option B: Use `testcontainers-python` to spin up a disposable PostgreSQL container for tests
   - Recommended: **Option A** for simplicity with a Docker Compose override for CI

#### Migration Steps (for existing data)
1. Stand up PostgreSQL via `docker compose up db`
2. Run `alembic upgrade head` to create tables
3. If existing SQLite data exists, provide a one-time migration script

---

### 3.4 Testing — ≥50% Code Coverage

#### 3.4.1 Backend Unit Tests

**Current state**: ~1,383 lines across 10 test files, SQLite-backed. Existing tests cover auth, endpoints, journal CRUD, questionnaire CRUD, Google OAuth, and models.

**Required changes**:
- Update `conftest.py` to use PostgreSQL test database
- Remove/update sentiment-related test assertions
- Add missing unit tests for uncovered modules

**New tests needed**:

| Module | Tests to Add | Priority |
|--------|-------------|----------|
| `services/journal_service.py` | Test `get_journal` (not found, forbidden), `get_all_journals`, `create_journal`, `update_journal`, `delete_journal` — all service-layer logic with mocked repos | High |
| `services/user_service.py` | Test user creation, password hashing, duplicate email handling | High |
| `services/password_reset_service.py` | Test token generation, expiry, consumption | High |
| `services/email_service.py` | Test email sending (mocked SMTP) | Medium |
| `services/questionnaire_service.py` | Test score calculation, date filtering | High |
| `core/auth.py` | Test `hash_password`, `verify_password`, `create_access_token` (already partially covered) | Medium |
| `core/dependencies.py` | Test `get_current_user` with valid/invalid/expired tokens | High |
| `routes/auth.py` | Test login, create-account, logout, forgot-password, reset-password endpoints | Already covered |
| `routes/users.py` | Test get-me, update-password, delete-account | Medium |
| Middleware | Test rate limiter, security headers | Low |

**Coverage target**: ≥50% of backend source lines. With ~1,622 source lines, need ≥811 lines covered. Existing tests likely already achieve this; verify with `pytest --cov=app --cov-report=term-missing`.

#### 3.4.2 Frontend Unit Tests

**Current state**: Zero tests.

**Setup**:
1. Install testing dependencies:
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react
   ```
2. Create `vitest.config.ts`:
   ```typescript
   import { defineConfig } from 'vitest/config'
   import react from '@vitejs/plugin-react'
   import path from 'path'

   export default defineConfig({
     plugins: [react()],
     test: {
       environment: 'jsdom',
       setupFiles: './src/test/setup.ts',
       globals: true,
       coverage: {
         provider: 'v8',
         reporter: ['text', 'lcov'],
         thresholds: { lines: 50 }
       }
     },
     resolve: {
       alias: { '@': path.resolve(__dirname, './src') }
     }
   })
   ```
3. Create `src/test/setup.ts` with `@testing-library/jest-dom` matchers

**Tests to write**:

| Component/Module | Tests | Lines Est. |
|------------------|-------|-----------|
| `services/api.ts` | Mock axios; test all API functions return correct shapes, handle errors, attach auth headers | ~150 |
| `contexts/AuthContext.tsx` | Test `signIn` stores token, `signOut` clears token, `ProtectedRoute` redirects unauthenticated users, `PublicOnlyRoute` redirects authenticated users | ~120 |
| `contexts/ThemeContext.tsx` | Test toggle between light/dark, persistence | ~40 |
| `components/AppHeader.tsx` | Test renders title, logout button triggers signOut, navigation links present | ~60 |
| `components/Logo.tsx` | Test renders SVG | ~15 |
| `components/GoogleButton.tsx` | Test renders, click handler fires | ~30 |
| `app/login/page.tsx` | Test form renders, validation, submit calls API, error display | ~80 |
| `app/create-account/page.tsx` | Test form renders, validation, submit | ~80 |
| `app/journals/page.tsx` | Test journal list renders, create modal opens, search filters | ~100 |
| `app/dashboard/page.tsx` | Test renders welcome message, metric charts render, period toggle works | ~100 |
| `app/questionnaire/page.tsx` | Test sliders render, submission | ~60 |
| `app/settings/page.tsx` | Test password change form, delete account form | ~60 |
| `lib/utils.ts` | Test `cn()` function | ~15 |

**Total estimated**: ~910 lines of test code. With ~3,348 source lines (minus ~200 from positivity removal ≈ 3,148), need ≥1,574 lines covered. Focus on utility functions, API service, contexts, and core page logic.

#### 3.4.3 Integration Tests (Frontend ↔ Backend)

**Goal**: Demonstrate that the frontend and backend connect properly end-to-end.

**Setup**: Use Playwright or Cypress for E2E integration tests against a running dev stack.

**Recommended approach**: Playwright (lightweight, TypeScript-native).

```bash
npm install -D @playwright/test
npx playwright install
```

**Integration test scenarios**:

| Test | Description |
|------|-------------|
| **Health Check** | Frontend loads; backend `/api/health` returns `{ status: "healthy" }` |
| **User Registration Flow** | Fill create-account form → submit → verify account created via API → redirect to login |
| **Login Flow** | Register → login with credentials → verify redirect to dashboard → verify JWT stored |
| **Journal CRUD Flow** | Login → navigate to journals → create entry → verify it appears in list → edit entry → verify update → delete entry → verify removal |
| **Questionnaire Flow** | Login → navigate to questionnaire → submit mood scores → verify data appears on dashboard charts |
| **Protected Route** | Attempt to access `/dashboard` without auth → verify redirect to `/login` |
| **Logout Flow** | Login → click logout → verify redirect to login → verify protected routes inaccessible |

**Test infrastructure**:
- `docker compose up` to run PostgreSQL + backend
- `npm run dev` for frontend (or `npm run build && npm start` for production mode)
- Playwright config points to `http://localhost:3000`
- CI: GitHub Actions workflow runs `docker compose up -d`, waits for health, runs Playwright

---

### 3.5 Upgrade to Latest Versions

#### Frontend (`package.json`)

```json
{
  "dependencies": {
    "next": "16.2.4",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "radix-ui": "^1.0.0",
    "axios": "^1.15.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^1.14.0",
    "tailwind-merge": "^3.5.0"
  },
  "devDependencies": {
    "typescript": "^5.8.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/node": "^22.0.0",
    "tailwindcss": "^4.2.4",
    "@tailwindcss/postcss": "^4.2.4",
    "eslint": "^9",
    "eslint-config-next": "16.2.4",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "vitest": "^3.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jsdom": "^25.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "@playwright/test": "^1.50.0"
  }
}
```

**ShadCN migration**: Switch from individual `@radix-ui/react-*` packages to the unified `radix-ui` package per the February 2026 ShadCN update.

#### Backend (`requirements.txt`)

```
# Runtime
fastapi>=0.136.0,<0.137.0
uvicorn[standard]>=0.34.0
pydantic[email]>=2.12.5
pydantic-settings>=2.9.0
sqlalchemy>=2.0.46
alembic>=1.15.0
psycopg2-binary>=2.9.0
bcrypt>=4.3.0
python-jose[cryptography]>=3.3.0
python-dotenv>=1.0.0
httpx>=0.28.0

# Testing
pytest>=8.3.0
pytest-cov>=6.0.0
httpx>=0.28.0
```

**Removed**: `nltk>=3.8.0`, `pyyaml` (unused)

---

## 4. Execution Order

The refactor should be executed in this specific order to minimize conflicts and ensure each step builds on a stable foundation:

### Phase 1: Foundation (Backend database + cleanup)
1. **Migrate database to PostgreSQL** — update `settings.py`, `database.py`, add Alembic, create initial migration
2. **Remove sentiment/NLP** — delete `sentiment.py`, strip `sentiment_score` from model/schema/repo, create Alembic migration to drop column, remove `nltk` dependency
3. **Upgrade backend dependencies** — bump FastAPI to 0.136.1, update all pinned versions
4. **Update backend tests** — fix conftest for PostgreSQL, remove sentiment test assertions, verify existing tests pass

### Phase 2: Frontend TypeScript Migration
5. **Set up TypeScript** — install deps, create `tsconfig.json`, remove `jsconfig.json`
6. **Create shared types** — `src/types/index.ts` with all interfaces
7. **Convert utility/service files** — `lib/utils.ts`, `services/api.ts` (no JSX, easiest to convert)
8. **Convert contexts** — `AuthContext.tsx`, `ThemeContext.tsx`
9. **Convert components** — all files under `components/`
10. **Re-generate ShadCN components** — `npx shadcn@latest init` then `npx shadcn@latest add` for all used components (with unified `radix-ui` package)
11. **Convert pages** — all files under `app/` (biggest step, do one at a time)
12. **Remove positivity score from dashboard** — strip ~200 lines during the `dashboard/page.tsx` conversion
13. **Upgrade frontend dependencies** — pin Tailwind 4.2.4, update eslint config

### Phase 3: Testing
14. **Set up frontend test infrastructure** — Vitest, Testing Library, coverage config
15. **Write frontend unit tests** — API service, contexts, components, pages
16. **Verify backend test coverage** — run `pytest --cov`, add tests to reach 50%
17. **Set up Playwright** — install, configure
18. **Write integration tests** — all E2E scenarios listed above
19. **Verify coverage thresholds** — both frontend and backend ≥50%

### Phase 4: Finalize
20. **Update Docker configuration** — ensure Dockerfiles work with TypeScript frontend and PostgreSQL-only backend
21. **Update documentation** — README, .env.example, setup instructions
22. **Final verification** — full `docker compose up`, run all tests, verify clean build

---

## 5. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| TypeScript migration introduces runtime bugs | Medium | Convert file-by-file, run build after each conversion |
| PostgreSQL migration loses data | Low | This is a dev/test app; provide migration script just in case |
| ShadCN re-generation changes component styling | Medium | Visual regression testing; compare screenshots before/after |
| Test coverage target hard to reach on frontend | Medium | Focus on testable logic (API service, contexts, utilities); exclude generated ShadCN UI from coverage |
| Breaking changes in FastAPI 0.136.x | Low | FastAPI 0.136.x is a minor update from 0.115.x; check release notes for deprecations |
| Tailwind 4.2.x breaking changes from 4.0 | Low | Project already uses v4 syntax; 4.2 is additive |

---

## 6. Estimated Effort

| Phase | Estimated Effort |
|-------|-----------------|
| Phase 1: Foundation | ~3-4 hours |
| Phase 2: TypeScript Migration | ~6-8 hours |
| Phase 3: Testing | ~8-10 hours |
| Phase 4: Finalize | ~2-3 hours |
| **Total** | **~19-25 hours** |
