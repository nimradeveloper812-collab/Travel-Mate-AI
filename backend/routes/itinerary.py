from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import json

from backend.database import get_db
from backend.models import models, schemas
from backend.routes.auth import get_current_user
from backend.services.gemini_service import generate_itinerary

router = APIRouter(prefix="/itinerary", tags=["itinerary"])

@router.post("/generate")
def create_itinerary(
    request: schemas.ItineraryRequest, 
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        start = datetime.strptime(request.start_date, "%Y-%m-%d")
        end = datetime.strptime(request.end_date, "%Y-%m-%d")
        days = (end - start).days + 1
        
        if days <= 0:
            raise HTTPException(status_code=400, detail="End date must be after start date")
            
        itinerary_json_str = generate_itinerary(
            destination=request.destination,
            days=days,
            budget=request.budget,
            travel_style=request.travel_style
        )
        
        # Save to DB
        new_itinerary = models.Itinerary(
            user_id=current_user.id,
            destination=request.destination,
            start_date=request.start_date,
            end_date=request.end_date,
            budget=request.budget,
            travel_style=request.travel_style,
            itinerary_json=itinerary_json_str
        )
        db.add(new_itinerary)
        db.commit()
        db.refresh(new_itinerary)
        
        return json.loads(itinerary_json_str)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
