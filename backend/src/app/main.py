import logging
import time
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import auth, journal, questionnaires, users
from app.core.database import create_tables
import app.models  # noqa: F401  — force all ORM models to register with Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mental_health_api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield


app = FastAPI(
    title="Mental Health Dashboard",
    description="Backend for tracking mood and wellness metrics.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# HTTP logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
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
    return {"status": "ok", "message": "Mental Health Dashboard API"}


def start():
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
