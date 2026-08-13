from fastapi import APIRouter, Depends, HTTPException
from backend.models import schemas, models
from backend.routes.auth import get_current_user
from backend.services.gemini_service import chat_with_ai

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/message")
def send_message(
    request: schemas.ChatMessage,
    current_user: models.User = Depends(get_current_user)
):
    try:
        response = chat_with_ai(request.message, request.history)
        return {"response": response}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
