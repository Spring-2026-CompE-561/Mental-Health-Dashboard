from fastapi import APIRouter

router = APIRouter()


@router.post("/save-questionnaire")
async def save_questionnaire():
    """Save questionnaire answers"""
    return {"success": True}


@router.get("/avg-questionnaire")
async def get_avg_questionnaire():
    """Calculate average Score results"""
    return {"id": "id", "avg": "avg"}


@router.get("/visualize-avg")
async def visualize_avg():
    """Get average questionnaire Scores for a specified time period"""
    return {"id": "id", "scoreList": []}
