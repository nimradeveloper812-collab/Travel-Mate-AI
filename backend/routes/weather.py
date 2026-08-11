from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from backend.database import get_db
from backend.models import models, schemas
from backend.routes.auth import get_current_user
from backend.services.weather_service import get_weather_forecast

router = APIRouter(prefix="/weather", tags=["weather"])

@router.post("/search")
def find_weather(
    request: schemas.WeatherSearchRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        weather_data = get_weather_forecast(city=request.city)
        
        # Save search to DB
        new_search = models.Search(
            user_id=current_user.id,
            search_type="weather",
            query_json=json.dumps(request.dict()),
            result_json=json.dumps(weather_data)
        )
        db.add(new_search)
        db.commit()
        db.refresh(new_search)
        
        return weather_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
