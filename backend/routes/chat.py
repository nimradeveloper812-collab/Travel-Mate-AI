from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import schemas, models
from backend.routes.auth import get_current_user
from backend.services.gemini_service import chat_with_ai

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/message")
def send_message(
    request: schemas.ChatMessage,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        trip_context = ""
        if request.trip_id:
            trip = db.query(models.Trip).filter(models.Trip.id == request.trip_id, models.Trip.user_id == current_user.id).first()
            if trip:
                trip_context = (
                    f"CONTEXT ON ACTIVE SAVED TRIP:\n"
                    f"Destination: {trip.destination}\n"
                    f"Dates: {trip.start_date} to {trip.end_date}\n"
                    f"Budget: ${trip.budget} USD\n"
                    f"Travel Style: {trip.travel_style}\n"
                    f"Flights booked: {trip.flights_json or 'None yet'}\n"
                    f"Hotels booked: {trip.hotels_json or 'None yet'}\n"
                    f"Please tailor your responses, recommendations, tips, and guidelines directly based on this active trip context."
                )
        
        response = chat_with_ai(request.message, request.history, trip_context=trip_context)
        return {"response": response}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
