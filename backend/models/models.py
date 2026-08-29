from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.sql import func
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    home_city = Column(String, nullable=True, default="")
    preferred_currency = Column(String, nullable=True, default="USD")
    travel_style = Column(String, nullable=True, default="Adventure")
    bio = Column(String, nullable=True, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    token = Column(String, unique=True, index=True)
    used = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Itinerary(Base):
    __tablename__ = "itineraries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    destination = Column(String, index=True)
    start_date = Column(String)
    end_date = Column(String)
    budget = Column(Float)
    travel_style = Column(String)
    itinerary_json = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Search(Base):
    __tablename__ = "searches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    search_type = Column(String, index=True) # flight/hotel/weather
    query_json = Column(Text)
    result_json = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    destination = Column(String, index=True)
    start_date = Column(String)
    end_date = Column(String)
    budget = Column(Float)
    travel_style = Column(String)
    itinerary_json = Column(Text)
    flights_json = Column(Text, nullable=True)
    hotels_json = Column(Text, nullable=True)
    weather_json = Column(Text, nullable=True)
    notes_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

