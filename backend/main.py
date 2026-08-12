from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base
from backend.routes import auth, itinerary, chat, flights, hotels, weather, trips

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="TravelMate AI Backend")

# CORS setup
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
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
    return {"message": "Welcome to TravelMate AI API"}
