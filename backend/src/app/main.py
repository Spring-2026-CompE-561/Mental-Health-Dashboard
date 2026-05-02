"""FastAPI application entry point with middleware, routing, and lifespan setup."""

from __future__ import annotations

import logging
import time
from collections import defaultdict
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import app.models  # noqa: F401  — force all ORM models to register with Base
from app.core.database import create_tables
from app.core.settings import settings
from app.routes import auth, journal, questionnaires, users

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mental_health_api")


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Create database tables on startup."""
    create_tables()
    yield


app = FastAPI(
    title="Mental Health Dashboard",
    description="Backend for tracking mood and wellness metrics.",
    version="0.1.0",
    lifespan=lifespan,
    redirect_slashes=False,
)

# CORS middleware — allow the Next.js dev server (default 3000) and legacy 5173 for flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────────────────
# Security headers middleware
# ──────────────────────────────────────────────────────────

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Attach security-hardening headers to every response."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


# ──────────────────────────────────────────────────────────
# Rate limiting middleware (in-memory, per-IP)
# ──────────────────────────────────────────────────────────

# Stores {ip: [timestamp1, timestamp2, ...]} — cleaned up lazily
_rate_limit_store: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_MAX = 60  # max requests per window
RATE_LIMIT_WINDOW = 60  # window in seconds


@app.middleware("http")
async def rate_limiter(request: Request, call_next):
    """Simple per-IP rate limiter. Returns 429 if the client exceeds the threshold."""
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    cutoff = now - RATE_LIMIT_WINDOW

    # prune old timestamps
    timestamps = _rate_limit_store[client_ip]
    _rate_limit_store[client_ip] = [t for t in timestamps if t > cutoff]

    if len(_rate_limit_store[client_ip]) >= RATE_LIMIT_MAX:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Too many requests. Please try again later."},
        )

    _rate_limit_store[client_ip].append(now)
    return await call_next(request)


# ──────────────────────────────────────────────────────────
# HTTP logging middleware
# ──────────────────────────────────────────────────────────

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log every HTTP request with method, path, status code, and duration."""
    start_time = time.time()
    response = await call_next(request)
    duration = round(time.time() - start_time, 4)
    logger.info(
        "%s %s -> %s (%.4fs)",
        request.method,
        request.url.path,
        response.status_code,
        duration,
    )
    return response


# Routers
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(journal.router, prefix="/api/journals", tags=["Journals"])
app.include_router(questionnaires.router, prefix="/api/questionnaires", tags=["Questionnaires"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {"status": "ok", "message": "Mental Health Dashboard API"}


@app.get("/api/health")
async def health_check():
    """Health-check endpoint used by Docker and monitoring."""
    return {"status": "healthy"}


def start():
    """Launch the development server with hot-reload."""
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
