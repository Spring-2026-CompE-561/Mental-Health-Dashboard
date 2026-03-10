from fastapi import APIRouter, Depends, Header, Query
from sqlalchemy.orm import Session

# Import Database Dependency
from app.api.deps import get_db

# Import Schemas
from app.models.schemas import LoginResponse, SuccessResponse, UserCreate, UserLogin, UserResponse

router = APIRouter()


@router.post("/create-account", response_model=UserResponse)
async def create_account(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create account with username/email/password"""
    return {"id": 1, "username": user_data.username, "email": user_data.email}


@router.post("/login", response_model=LoginResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Log in with credentials and receive a JWT token"""
    return {"token": "jwt-token-here", "userId": "user-uuid"}


@router.get("/auth/google/callback")
async def google_callback(code: str = Query(...), db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    return {"message": "Google account connected", "userId": "user-uuid"}


@router.post("/logout", response_model=SuccessResponse)
async def logout(authorization: str = Header(...), db: Session = Depends(get_db)):
    """Logout and invalidate current session"""
    return {"success": True, "message": "Logged out successfully"}


@router.get("/{id}", response_model=UserResponse)
async def get_user(id: int, authorization: str = Header(...), db: Session = Depends(get_db)):
    """Get user details by ID"""
    return {"id": id, "email": "user@example.com"}


@router.put("/{id}", response_model=UserResponse)
async def update_user(id: int, user_data: UserCreate, authorization: str = Header(...), db: Session = Depends(get_db)):
    """Update user details"""
    return {"id": id, "email": user_data.email}


@router.delete("/{id}", response_model=SuccessResponse)
async def delete_user(id: int, authorization: str = Header(...), db: Session = Depends(get_db)):
    """Delete a user account"""
    return {"success": True, "message": "User deleted successfully"}
