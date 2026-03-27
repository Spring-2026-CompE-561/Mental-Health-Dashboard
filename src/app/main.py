import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import auth, journal, questionnaires, users
from app.models.database import create_tables

app = FastAPI(
    title="Mental Health Dashboard",
    description="Backend for tracking mood and wellness metrics.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(journal.router, prefix="/api/journals", tags=["Journals"])
app.include_router(questionnaires.router, prefix="/api/questionnaires", tags=["Questionnaires"])


@app.on_event("startup")
def on_startup():
    create_tables()


@app.get("/")
async def root():
    return {"status": "ok", "message": "Mental Health Dashboard API"}


def start():
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
