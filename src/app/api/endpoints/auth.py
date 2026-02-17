from fastapi import APIRouter

router = APIRouter()


@router.post("/create-account")
async def create_account():
    """Create account"""
    return {"success": True, "Message": "Account created Successfully"}


@router.post("/user-login")
async def user_login():
    """User Login"""
    return {"success": True, "user": {"id": "", "Name": "", "email": ""}, "token": ""}


@router.post("/forgot-password")
async def forgot_password():
    """Forgot password"""
    return {"message": "A password reset link has been sent"}


@router.post("/logout")
async def logout():
    """Log out user"""
    return {"success": True, "Message": "User logged out successfully"}
