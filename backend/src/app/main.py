from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# Import Routers
from app.routes import auth, users, journals, questionnaires

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend for tracking mood and wellness metrics."
)

# Middleware configuration for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(journals.router, prefix="/api")
app.include_router(questionnaires.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to the Mental Health Dashboard API"}
