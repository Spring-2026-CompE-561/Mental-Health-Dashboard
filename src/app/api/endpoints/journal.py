from fastapi import APIRouter

router = APIRouter()


@router.get("/get-journal")
async def get_journal():
    """View journal entry"""
    return {"success": True}


@router.post("/save-journal")
async def save_journal():
    """Save journal entry"""
    return {"success": True}
