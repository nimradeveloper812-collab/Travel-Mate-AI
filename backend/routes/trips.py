from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
from backend.models import models, schemas
from backend.routes.auth import get_current_user
from backend.services.trips_service import get_dashboard_stats

router = APIRouter(prefix="/trips", tags=["trips"])

@router.post("/save", response_model=schemas.TripResponse)
def save_trip(
    request: schemas.TripCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        new_trip = models.Trip(
            user_id=current_user.id,
            destination=request.destination,
            start_date=request.start_date,
            end_date=request.end_date,
            budget=request.budget,
            travel_style=request.travel_style,
            itinerary_json=request.itinerary_json,
            flights_json=request.flights_json,
            hotels_json=request.hotels_json,
            weather_json=request.weather_json
        )
        db.add(new_trip)
        db.commit()
        db.refresh(new_trip)
        return new_trip
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-trips", response_model=List[schemas.TripResponse])
def get_my_trips(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        trips = db.query(models.Trip).filter(models.Trip.user_id == current_user.id).order_by(models.Trip.created_at.desc()).all()
        return trips
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=schemas.DashboardStats)
def get_stats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        stats = get_dashboard_stats(current_user.id, db)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{trip_id}", response_model=schemas.TripResponse)
def get_trip(
    trip_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id, models.Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

@router.delete("/{trip_id}")
def delete_trip(
    trip_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id, models.Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    db.delete(trip)
    db.commit()
    return {"message": "Trip deleted successfully"}
