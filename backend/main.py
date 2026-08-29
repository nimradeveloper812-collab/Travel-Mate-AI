import sys
import os
from pathlib import Path

# Add project root and backend dir to sys.path so it runs seamlessly from anywhere
current_dir = Path(__file__).resolve().parent
parent_dir = current_dir.parent
sys.path.insert(0, str(parent_dir))
sys.path.insert(0, str(current_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from backend.database import engine, Base, init_db
    from backend.routes import auth, itinerary, chat, flights, hotels, weather, trips
except ImportError:
    from database import engine, Base, init_db
    from routes import auth, itinerary, chat, flights, hotels, weather, trips

# Initialize and auto-migrate tables
init_db()


app = FastAPI(
    title="TravelMate AI Backend API",
    description="Production-grade API for TravelMate AI intelligent travel planner",
    version="1.0.0"
)

# CORS setup — allow any origin, headers, and methods
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(itinerary.router)
app.include_router(chat.router)
app.include_router(flights.router)
app.include_router(hotels.router)
app.include_router(weather.router)
app.include_router(trips.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "TravelMate AI Backend",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

