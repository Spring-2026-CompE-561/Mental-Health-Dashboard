"""FastAPI application entry point with middleware, routing, and lifespan setup."""

import logging
import time
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401  — force all ORM models to register with Base
from app.core.database import create_tables
from app.core.settings import settings
from app.routes import auth, journal, questionnaires, users

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mental_health_api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup."""
    create_tables()
    yield


app = FastAPI(
    title="Mental Health Dashboard",
    description="Backend for tracking mood and wellness metrics.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware — allow the Vite dev server (default 5173) plus CRA-style 3000 for flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# HTTP logging middleware
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
    """Health-check endpoint."""
    return {"status": "ok", "message": "Mental Health Dashboard API"}


def start():
    """Launch the development server with hot-reload."""
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
