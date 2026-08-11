# TravelMate AI

TravelMate AI is a production-grade, full-stack travel assistant application that leverages AI to generate personalized itineraries, search for flights and hotels, provide weather forecasts, and maintain your travel history through a personalized dashboard.

## 🌟 Features
- **AI-Powered Itineraries:** Generate comprehensive day-by-day travel plans based on destination, budget, and travel style.
- **AI Chatbot:** An intelligent assistant to answer your travel-related queries.
- **Flight & Hotel Search:** Real-time data integrations via RapidAPI Sky Scraper.
- **Weather Forecasts:** 5-day weather forecasts using OpenWeatherMap API.
- **Saved Trips & Dashboard:** Save your favorite itineraries and view statistics (total budget, favorite destinations, etc.) on your personal dashboard.
- **Secure Authentication:** JWT-based user authentication and secure password hashing.

## 🛠️ Technology Stack
- **Backend:** FastAPI (Python)
- **Frontend:** Streamlit
- **Database:** PostgreSQL (Neon)
- **AI Integration:** Google Gemini API (gemini-2.0-flash)
- **APIs:** 
  - Sky Scraper API (Flights & Hotels)
  - OpenWeatherMap API (Weather)
- **Deployment:** Render (Backend) & Streamlit Cloud (Frontend)

---

## 🚀 Local Setup Instructions

### 1. Prerequisites
- Python 3.11 or 3.12 (Do NOT use Python 3.14 to avoid dependency build issues)
- A free PostgreSQL database from [Neon](https://neon.tech/)

### 2. Clone and Environment Setup
Clone this repository (or copy the folder) and create an `.env` file in the root directory based on `.env.example`:

```env
DATABASE_URL=postgresql://user:password@hostname/dbname?sslmode=require
SECRET_KEY=your_secure_random_string
GEMINI_API_KEY=your_gemini_api_key
RAPIDAPI_KEY=your_rapidapi_key
OPENWEATHER_API_KEY=your_openweather_key
```

### 3. Install Dependencies
Open your terminal in the root `travelmate-ai` directory and install the requirements:
```bash
pip install -r backend/requirements.txt
pip install -r frontend/requirements.txt
```

### 4. Run the Application
You will need two terminals running simultaneously.

**Terminal 1 (Backend):**
```bash
uvicorn backend.main:app --reload
```
*The backend will be available at `http://localhost:8000`. Database tables will be created automatically on the first run.*

**Terminal 2 (Frontend):**
```bash
streamlit run frontend/app.py
```
*The Streamlit web interface will open in your browser automatically.*

---

## 🌍 Production Deployment

### Deploying the Backend on Render
1. Push your code to a GitHub repository.
2. Sign up / Log in to [Render](https://render.com/).
3. Click **New +** and select **Web Service**.
4. Connect your GitHub repository.
5. **Configuration:**
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
6. **Environment Variables:** Add all variables from your `.env` file (`DATABASE_URL`, `SECRET_KEY`, `GEMINI_API_KEY`, `RAPIDAPI_KEY`, `OPENWEATHER_API_KEY`).
7. Click **Create Web Service**. Once deployed, copy the Render URL (e.g., `https://travelmate-backend.onrender.com`).

### Deploying the Frontend on Streamlit Cloud
1. Sign up / Log in to [Streamlit Community Cloud](https://share.streamlit.io/).
2. Click **New app** and connect your GitHub repository.
3. Set the **Main file path** to `frontend/app.py`.
4. Click **Advanced settings** before deploying, and add your secrets (Environment Variables) in TOML format:
   ```toml
   BACKEND_URL="https://travelmate-backend.onrender.com"
   ```
5. Click **Deploy!**

---

## 📄 License
This project is for educational and portfolio purposes.
