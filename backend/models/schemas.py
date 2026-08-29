from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

# Auth Schemas
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    home_city: Optional[str] = ""
    preferred_currency: Optional[str] = "USD"
    travel_style: Optional[str] = "Adventure"
    bio: Optional[str] = ""
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    home_city: Optional[str] = None
    preferred_currency: Optional[str] = None
    travel_style: Optional[str] = None
    bio: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# Itinerary Schemas
class ItineraryRequest(BaseModel):
    destination: str
    start_date: str
    end_date: str
    budget: float
    travel_style: str

class DailyPlan(BaseModel):
    day: int
    title: str
    morning: str
    afternoon: str
    evening: str
    estimated_cost: float

class ItineraryResponse(BaseModel):
    destination: str
    total_days: int
    daily_plan: List[DailyPlan]
    total_estimated_cost: float
    travel_tips: List[str]

# Chat Schemas
class ChatMessage(BaseModel):
    message: str
    history: List[dict] = []
    trip_id: Optional[int] = None

# Search Schemas
class SearchCreate(BaseModel):
    search_type: str
    query_json: str
    result_json: str

class SearchResponse(BaseModel):
    id: int
    user_id: int
    search_type: str
    query_json: str
    result_json: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class FlightSearchRequest(BaseModel):
    origin: str
    destination: str
    date: str
    return_date: Optional[str] = None
    adults: int = 1

class HotelSearchRequest(BaseModel):
    city: str
    checkin: str
    checkout: str
    adults: int = 1

class WeatherSearchRequest(BaseModel):
    city: str

class TripCreate(BaseModel):
    destination: str
    start_date: str
    end_date: str
    budget: float
    travel_style: str
    itinerary_json: str
    flights_json: Optional[str] = None
    hotels_json: Optional[str] = None
    weather_json: Optional[str] = None
    notes_json: Optional[str] = None

class TripUpdate(BaseModel):
    destination: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    budget: Optional[float] = None
    travel_style: Optional[str] = None
    itinerary_json: Optional[str] = None
    flights_json: Optional[str] = None
    hotels_json: Optional[str] = None
    weather_json: Optional[str] = None
    notes_json: Optional[str] = None

class TripResponse(BaseModel):
    id: int
    user_id: int
    destination: str
    start_date: str
    end_date: str
    budget: float
    travel_style: str
    itinerary_json: str
    flights_json: Optional[str] = None
    hotels_json: Optional[str] = None
    weather_json: Optional[str] = None
    notes_json: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_trips: int
    total_budget: float
    favorite_destination: Optional[str]
    trips_per_month: dict
    travel_styles: dict
    recent_trip: Optional[TripResponse]



