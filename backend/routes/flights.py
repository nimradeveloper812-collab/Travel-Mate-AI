from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from backend.database import get_db
from backend.models import models, schemas
from backend.routes.auth import get_current_user
from backend.services.skyscraper_service import search_flights as sky_search_flights

router = APIRouter(prefix="/flights", tags=["flights"])

@router.post("/search")
def find_flights(
    request: schemas.FlightSearchRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        flights_data = sky_search_flights(
            origin=request.origin,
            destination=request.destination,
            date=request.date,
            return_date=request.return_date,
            adults=request.adults
        )
        
        # Save search to DB
        new_search = models.Search(
            user_id=current_user.id,
            search_type="flight",
            query_json=json.dumps(request.dict()),
            result_json=json.dumps(flights_data)
        )
        db.add(new_search)
        db.commit()
        db.refresh(new_search)
        
        return flights_data
    except HTTPException:
        raise
    except Exception as e:
        err_str = str(e).lower()
        if "rate limit" in err_str or "limit reached" in err_str:
            raise HTTPException(status_code=429, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))
