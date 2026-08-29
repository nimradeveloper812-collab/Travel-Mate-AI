from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json

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
            weather_json=request.weather_json,
            notes_json=request.notes_json
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

@router.put("/{trip_id}", response_model=schemas.TripResponse)
def update_trip(
    trip_id: int,
    request: schemas.TripUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id, models.Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if request.destination is not None:
        trip.destination = request.destination
    if request.start_date is not None:
        trip.start_date = request.start_date
    if request.end_date is not None:
        trip.end_date = request.end_date
    if request.budget is not None:
        trip.budget = request.budget
    if request.travel_style is not None:
        trip.travel_style = request.travel_style
    if request.itinerary_json is not None:
        trip.itinerary_json = request.itinerary_json
    if request.flights_json is not None:
        trip.flights_json = request.flights_json
    if request.hotels_json is not None:
        trip.hotels_json = request.hotels_json
    if request.weather_json is not None:
        trip.weather_json = request.weather_json
    if request.notes_json is not None:
        trip.notes_json = request.notes_json

    db.commit()
    db.refresh(trip)
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

@router.post("/{trip_id}/flights")
def add_flight_to_trip(
    trip_id: int,
    payload: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id, models.Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    existing_flights = []
    if trip.flights_json:
        try:
            existing_flights = json.loads(trip.flights_json)
            if not isinstance(existing_flights, list):
                existing_flights = [existing_flights]
        except Exception:
            existing_flights = []
            
    existing_flights.append(payload)
    trip.flights_json = json.dumps(existing_flights)
    db.commit()
    db.refresh(trip)
    return {"message": "Flight added to trip successfully", "flights": existing_flights}

@router.post("/{trip_id}/hotels")
def add_hotel_to_trip(
    trip_id: int,
    payload: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id, models.Trip.user_id == current_user.id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    existing_hotels = []
    if trip.hotels_json:
        try:
            existing_hotels = json.loads(trip.hotels_json)
            if not isinstance(existing_hotels, list):
                existing_hotels = [existing_hotels]
        except Exception:
            existing_hotels = []
            
    existing_hotels.append(payload)
    trip.hotels_json = json.dumps(existing_hotels)
    db.commit()
    db.refresh(trip)
    return {"message": "Hotel added to trip successfully", "hotels": existing_hotels}

