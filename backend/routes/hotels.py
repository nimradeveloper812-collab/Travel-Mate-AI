from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from backend.database import get_db
from backend.models import models, schemas
from backend.routes.auth import get_current_user
from backend.services.skyscraper_service import search_hotels as sky_search_hotels

router = APIRouter(prefix="/hotels", tags=["hotels"])

@router.post("/search")
def find_hotels(
    request: schemas.HotelSearchRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        hotels_data = sky_search_hotels(
            city=request.city,
            checkin=request.checkin,
            checkout=request.checkout,
            adults=request.adults
        )
        
        # Save search to DB
        new_search = models.Search(
            user_id=current_user.id,
            search_type="hotel",
            query_json=json.dumps(request.dict()),
            result_json=json.dumps(hotels_data)
        )
        db.add(new_search)
        db.commit()
        db.refresh(new_search)
        
        return hotels_data
    except HTTPException:
        raise
    except Exception as e:
        err_str = str(e).lower()
        if "rate limit" in err_str or "limit reached" in err_str:
            raise HTTPException(status_code=429, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))
