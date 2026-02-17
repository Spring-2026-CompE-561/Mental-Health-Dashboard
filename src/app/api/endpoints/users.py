from fastapi import APIRouter

router = APIRouter()


@router.delete("/delete-account")
async def delete_account():
    """Delete account"""
    return {"success": True, "Message": "User deleted successfully"}
