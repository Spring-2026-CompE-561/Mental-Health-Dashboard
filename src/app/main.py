import uvicorn
from fastapi import FastAPI

app = FastAPI(
    title="Mental Health Dashboard",
    description="Backend for tracking mood and wellness metrics.",
    version="0.1.0",
)


@app.get("/")
async def root():
    return {"message": "Welcome to the Mental Health Dashboard API"}


def start():
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
