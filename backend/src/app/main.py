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

# Per-bucket counters: {(ip, bucket): [timestamps]}. Pruned lazily.
_rate_limit_store: dict[tuple[str, str], list[float]] = defaultdict(list)

# Sliding-window limits: (max_requests, window_seconds)
RATE_LIMITS = {
    "global": (120, 60),   # safety net for a single IP across the whole API
    "auth":   (5,   60),   # login / create-account / forgot-password / reset-password
    "ai":     (10,  60),   # AI prompt suggestion endpoint (Groq calls cost money)
}

# Path → bucket mapping. Order matters: first match wins.
_AUTH_PATHS = (
    "/api/login",
    "/api/create-account",
    "/api/forgot-password",
    "/api/reset-password",
)
_AI_PATHS = ("/api/journals/ai-prompt",)


def _bucket_for(path: str) -> str:
    if path.startswith(_AI_PATHS):
        return "ai"
    if path in _AUTH_PATHS:
        return "auth"
    return "global"


def _allowed(client_ip: str, bucket: str, now: float) -> bool:
    max_req, window = RATE_LIMITS[bucket]
    cutoff = now - window
    key = (client_ip, bucket)
    fresh = [t for t in _rate_limit_store[key] if t > cutoff]
    if len(fresh) >= max_req:
        _rate_limit_store[key] = fresh
        return False
    fresh.append(now)
    _rate_limit_store[key] = fresh
    return True


@app.middleware("http")
async def rate_limiter(request: Request, call_next):
    """Sliding-window per-IP rate limiter with stricter buckets for auth + AI routes."""
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    bucket = _bucket_for(request.url.path)

    # Always enforce the global bucket too — the per-route bucket is on top of it.
    if not _allowed(client_ip, "global", now):
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Too many requests. Please try again later."},
        )
    if bucket != "global" and not _allowed(client_ip, bucket, now):
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "detail": (
                    "Too many sensitive requests. "
                    "Please wait a minute before trying again."
                ),
            },
        )
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
