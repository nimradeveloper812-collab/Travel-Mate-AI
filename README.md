# ✈️ TravelMate AI - Production-Ready Intelligent Travel Assistant

TravelMate AI is a modern, production-ready, full-stack AI travel companion that generates custom day-by-day itineraries, tracks flights and hotel rates, provides real-time weather forecasts with automated packing tips, and serves as an interactive 24/7 AI travel assistant.

---

## 🌟 Key Features

- **🔐 100% Functional JWT Authentication System**: Complete Signup, Login, Password Reset, Profile Management (`/auth/me`, `/auth/profile`), session persistence in localStorage + React Context, and protected routes with zero mock data.
- **🎨 Premium Travel Design System**: Custom travel theme (soft sky blues, warm sunset oranges, clean whites, and subtle glassmorphism), sleek desktop sidebar, mobile bottom navigation bar + drawer, toast notification system (`ToastProvider`), and smooth Framer Motion micro-interactions.
- **🧭 AI Day-by-Day Itinerary Planner**: Generates structured itineraries for any duration, budget, and travel style (Luxury, Adventure, Budget, Family, Relaxation) with morning, afternoon, and evening activity breakdowns, cost estimates, local tips, and export/print support.
- **💬 Context-Aware AI Chatbot**: ChatGPT-style travel assistant with prompt suggestion chips, conversation history, and the ability to link questions directly to active saved trips.
- **✈️ Live Flight & Hotel Search**: Search non-stop and connecting routes, compare fares and hotel star ratings, and attach bookings directly to your trip itineraries.
- **⛅ 5-Day Weather Forecast & Packing Advisor**: Real-time forecast previews with automated packing recommendations based on anticipated rain and temperature shifts.
- **📊 Interactive Dashboard & Saved Trips**: Visual stats (total trips, budget allocated, favorite destinations), upcoming trip countdowns with weather warnings, and multi-tab trip detail modals (Itinerary, Bookings, Packing Checklist, Notes).
- **🛡️ High Reliability & Graceful Fallbacks**: Intelligent built-in fallback engines for AI itineraries, chat, flights, hotels, and weather, so the application runs 100% reliably out-of-the-box even before API keys are configured.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Framer Motion, Lucide React, Axios, React Router v7
- **Backend**: FastAPI (Python 3.11 / 3.12), SQLAlchemy ORM (SQLite / PostgreSQL), Pydantic v2, `python-jose`, `bcrypt`
- **AI Engine**: Google Gemini API (`gemini-1.5-flash` / `gemini-2.0-flash` with fallback generator)
- **External APIs**: RapidAPI SkyScrapper (Flights & Hotels), OpenWeatherMap API (Weather)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+) & **npm**
- **Python** (3.11 or 3.12)

---

### 2. Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. (Optional) Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend` folder (or root) based on `backend/.env.example`:
   ```env
   # Database: Leave empty or use SQLite by default
   DATABASE_URL=sqlite:///./travelmate.db

   # JWT Secret Key
   SECRET_KEY=travelmate-super-secret-jwt-key-2026

   # (Optional) Google Gemini API Key: https://aistudio.google.com/
   GEMINI_API_KEY=

   # (Optional) OpenWeatherMap Key: https://openweathermap.org/api
   OPENWEATHER_API_KEY=

   # (Optional) RapidAPI Sky Scrapper Key: https://rapidapi.com/
   RAPIDAPI_KEY=
   ```
5. Start the FastAPI backend server:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```
   *The backend will run at `http://localhost:8000`. Swagger API docs are available at `http://localhost:8000/docs`.*

---

### 3. Frontend Setup

1. Open a second terminal and navigate to `frontend-web`:
   ```bash
   cd frontend-web
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. (Optional) Create a `.env` file in `frontend-web`:
   ```env
   VITE_BACKEND_URL=http://localhost:8000
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173`.

---

## 📂 Project Structure

```
travelmate-ai/
├── backend/
│   ├── database.py              # SQLAlchemy engine (SQLite fallback + PostgreSQL)
│   ├── main.py                  # FastAPI app & CORS configuration
│   ├── models/
│   │   ├── models.py            # User, PasswordResetToken, Trip, Itinerary, Search ORM models
│   │   └── schemas.py           # Pydantic v2 schemas for auth, trips, chat, weather
│   ├── routes/
│   │   ├── auth.py              # Signup, Login, /me, /profile, /forgot-password, /reset-password
│   │   ├── trips.py             # Save, list, update, delete trips & link flights/hotels
│   │   ├── itinerary.py         # AI Itinerary generation endpoint
│   │   ├── chat.py              # AI Chat endpoint with trip context
│   │   ├── flights.py           # Flight search endpoint
│   │   ├── hotels.py            # Hotel search endpoint
│   │   └── weather.py           # Weather forecast endpoint
│   ├── services/
│   │   ├── gemini_service.py    # Gemini LLM caller with intelligent fallback generator
│   │   ├── skyscraper_service.py # Flights & Hotels service with fallback simulation
│   │   ├── weather_service.py   # 5-day weather service with fallback simulation
│   │   └── trips_service.py     # Dashboard metrics and analytics aggregator
│   ├── requirements.txt
│   └── .env.example
│
├── frontend-web/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx       # Responsive layout (Sidebar, Mobile Bottom Nav, Profile Dropdown)
│   │   │   ├── Shimmer.tsx      # Skeleton loading states
│   │   │   └── CustomCursor.tsx # Ambient micro-interaction cursor
│   │   ├── context/
│   │   │   ├── AuthContext.tsx  # User session, login, signup, logout, profile update
│   │   │   └── ToastContext.tsx # Modern animated toast notification provider
│   │   ├── pages/
│   │   │   ├── Splash.tsx       # Modern high-converting Landing page with hero & previews
│   │   │   ├── Auth.tsx         # Login, Signup, Forgot Password, Reset Password
│   │   │   ├── Dashboard.tsx    # Greeting, stats metrics, upcoming weather alert, recent trips
│   │   │   ├── PlanTrip.tsx     # AI Itinerary builder, daily timeline, budget slider, notes
│   │   │   ├── Chat.tsx         # AI Chat with trip context, prompt chips, copy actions
│   │   │   ├── SavedTrips.tsx   # Search, filters, multi-tab modal (Itinerary, Bookings, Checklist)
│   │   │   ├── Profile.tsx      # User profile, home airport, currency, travel style preferences
│   │   │   ├── Settings.tsx     # Security password change, notification toggles, API provider info
│   │   │   ├── Flights.tsx      # Flight finder & direct trip attachment
│   │   │   ├── Hotels.tsx       # Hotel finder & star rating previews
│   │   │   └── Weather.tsx      # 5-day forecast cards & packing guidelines
│   │   ├── lib/
│   │   │   └── api.ts           # Axios instance with JWT interceptors
│   │   ├── App.tsx              # Application routing & protected route wrappers
│   │   └── main.tsx
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## 📄 License
This project is open-source under the MIT License.
