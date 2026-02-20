import uvicorn
from fastapi import FastAPI

from app.api.endpoints import auth, journal, questionnaires

app = FastAPI(
    title="Mental Health Dashboard",
    description="Backend for tracking mood and wellness metrics.",
    version="0.1.0",
)

# Include routers for different API endpoints
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(journal.router, prefix="/api", tags=["Journal"])
app.include_router(questionnaires.router, prefix="/api", tags=["Questionnaires"])
app.include_router(auth.router, prefix="/api/users", tags=["Users"])


@app.get("/")
async def root():
    return {"message": "Welcome to the Mental Health Dashboard API"}


def start():
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
