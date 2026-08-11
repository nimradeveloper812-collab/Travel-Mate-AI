from sqlalchemy.orm import Session
from backend.models import models, schemas
from sqlalchemy import func
from typing import List, Dict, Any

def get_dashboard_stats(user_id: int, db: Session) -> dict:
    trips = db.query(models.Trip).filter(models.Trip.user_id == user_id).all()
    
    total_trips = len(trips)
    total_budget = sum(t.budget for t in trips)
    
    destinations = {}
    travel_styles = {}
    trips_per_month = {}
    
    for t in trips:
        # Destinations
        destinations[t.destination] = destinations.get(t.destination, 0) + 1
        
        # Travel styles
        travel_styles[t.travel_style] = travel_styles.get(t.travel_style, 0) + 1
        
        # Trips per month (using start_date)
        try:
            # Assuming start_date is string YYYY-MM-DD
            month = t.start_date[:7]
            trips_per_month[month] = trips_per_month.get(month, 0) + 1
        except:
            pass

    favorite_destination = max(destinations, key=destinations.get) if destinations else None
    
    recent_trip = None
    if trips:
        # sort by created_at descending
        recent_trip_model = sorted(trips, key=lambda x: x.created_at, reverse=True)[0]
        recent_trip = schemas.TripResponse.from_orm(recent_trip_model)

    return {
        "total_trips": total_trips,
        "total_budget": total_budget,
        "favorite_destination": favorite_destination,
        "trips_per_month": trips_per_month,
        "travel_styles": travel_styles,
        "recent_trip": recent_trip
    }
