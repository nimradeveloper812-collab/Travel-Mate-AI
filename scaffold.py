import os

def create_file(path, content):
    dirname = os.path.dirname(path)
    if dirname:
        os.makedirs(dirname, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

files = {
    ".env.example": """DATABASE_URL=postgresql://user:password@localhost/dbname
SECRET_KEY=your-jwt-secret-key-change-me
GEMINI_API_KEY=your-gemini-key
RAPIDAPI_KEY=your-rapidapi-key
""",
    "backend/requirements.txt": """fastapi[standard]==0.115.0
pydantic==2.9.2
pydantic-settings==2.5.2
sqlalchemy==2.0.35
psycopg2-binary==2.9.9
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.12
google-generativeai==0.8.2
""",
    "frontend/requirements.txt": """streamlit==1.39.0
requests==2.32.3
python-dotenv==1.0.1
""",
    "backend/database.py": """from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
""",
    "backend/models/schemas.py": """from pydantic import BaseModel, EmailStr
from typing import List, Optional
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
    
    class Config:
        from_attributes = True

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
""",
    "backend/models/models.py": """from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
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
""",
    "backend/services/gemini_service.py": """import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-3.5-flash')

def generate_itinerary(destination: str, days: int, budget: float, travel_style: str) -> str:
    prompt = f\"\"\"Create a detailed {days}-day travel itinerary for {destination}. 
Budget: ${budget} USD. Travel style: {travel_style}.
Return ONLY valid JSON in this format:
{{
  "destination": "",
  "total_days": 0,
  "daily_plan": [
    {{
      "day": 1,
      "title": "",
      "morning": "",
      "afternoon": "",
      "evening": "",
      "estimated_cost": 0
    }}
  ],
  "total_estimated_cost": 0,
  "travel_tips": []
}}
\"\"\"
    response = model.generate_content(prompt)
    
    # Clean up the response to get just the JSON
    text = response.text.strip()
    if text.startswith('```json'):
        text = text[7:]
    if text.startswith('```'):
        text = text[3:]
    if text.endswith('```'):
        text = text[:-3]
        
    return text.strip()

def chat_with_ai(message: str, history: list) -> str:
    system_prompt = "You are TravelMate AI, an expert travel assistant. Provide helpful, concise, and accurate travel advice."
    
    chat_history = []
    for msg in history:
        chat_history.append({"role": msg["role"], "parts": [msg["content"]]})
        
    chat = model.start_chat(history=chat_history)
    response = chat.send_message(f"System: {system_prompt}\\n\\nUser: {message}")
    return response.text
""",
    "backend/services/skyscraper_service.py": """import os
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
RAPIDAPI_HOST = "sky-scrapper.p.rapidapi.com"

def search_flights():
    # TODO: Implement in Phase 2
    pass

def search_hotels():
    # TODO: Implement in Phase 2
    pass
""",
    "backend/routes/auth.py": """from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

from backend.database import get_db
from backend.models import models, schemas

load_dotenv()

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/signup", response_model=schemas.UserResponse)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(email=user.email, name=user.name, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
""",
    "backend/routes/itinerary.py": """from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import json

from backend.database import get_db
from backend.models import models, schemas
from backend.routes.auth import get_current_user
from backend.services.gemini_service import generate_itinerary

router = APIRouter(prefix="/itinerary", tags=["itinerary"])

@router.post("/generate")
def create_itinerary(
    request: schemas.ItineraryRequest, 
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        start = datetime.strptime(request.start_date, "%Y-%m-%d")
        end = datetime.strptime(request.end_date, "%Y-%m-%d")
        days = (end - start).days + 1
        
        if days <= 0:
            raise HTTPException(status_code=400, detail="End date must be after start date")
            
        itinerary_json_str = generate_itinerary(
            destination=request.destination,
            days=days,
            budget=request.budget,
            travel_style=request.travel_style
        )
        
        # Save to DB
        new_itinerary = models.Itinerary(
            user_id=current_user.id,
            destination=request.destination,
            start_date=request.start_date,
            end_date=request.end_date,
            budget=request.budget,
            travel_style=request.travel_style,
            itinerary_json=itinerary_json_str
        )
        db.add(new_itinerary)
        db.commit()
        db.refresh(new_itinerary)
        
        return json.loads(itinerary_json_str)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
""",
    "backend/routes/chat.py": """from fastapi import APIRouter, Depends, HTTPException
from backend.models import schemas, models
from backend.routes.auth import get_current_user
from backend.services.gemini_service import chat_with_ai

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/message")
def send_message(
    request: schemas.ChatMessage,
    current_user: models.User = Depends(get_current_user)
):
    try:
        response = chat_with_ai(request.message, request.history)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
""",
    "backend/main.py": """from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base
from backend.routes import auth, itinerary, chat

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="TravelMate AI Backend")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(itinerary.router)
app.include_router(chat.router)

@app.get("/")
def root():
    return {"message": "Welcome to TravelMate AI API"}
""",
    "frontend/app.py": """import streamlit as st
import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_URL = "http://localhost:8000"

st.set_page_config(page_title="TravelMate AI", page_icon="✈️", layout="wide")

if "token" not in st.session_state:
    st.session_state.token = None

st.title("✈️ TravelMate AI")

if st.session_state.token:
    st.sidebar.success("Logged in successfully!")
    if st.sidebar.button("Logout"):
        st.session_state.token = None
        st.rerun()
    st.write("Welcome to TravelMate AI! Please navigate using the sidebar.")
else:
    tab1, tab2 = st.tabs(["Login", "Sign Up"])
    
    with tab1:
        st.subheader("Login")
        email = st.text_input("Email", key="login_email")
        password = st.text_input("Password", type="password", key="login_password")
        if st.button("Login"):
            try:
                response = requests.post(f"{API_URL}/auth/login", json={"email": email, "password": password})
                if response.status_code == 200:
                    st.session_state.token = response.json()["access_token"]
                    st.rerun()
                else:
                    st.error(f"Error: {response.json().get('detail', 'Unknown error')}")
            except Exception as e:
                st.error(f"Failed to connect to backend: {e}")
                
    with tab2:
        st.subheader("Sign Up")
        new_name = st.text_input("Name")
        new_email = st.text_input("Email", key="signup_email")
        new_password = st.text_input("Password", type="password", key="signup_password")
        if st.button("Sign Up"):
            try:
                response = requests.post(
                    f"{API_URL}/auth/signup", 
                    json={"name": new_name, "email": new_email, "password": new_password}
                )
                if response.status_code == 200:
                    st.success("Signed up successfully! Please login.")
                else:
                    st.error(f"Error: {response.json().get('detail', 'Unknown error')}")
            except Exception as e:
                st.error(f"Failed to connect to backend: {e}")
""",
    "frontend/pages/1_Plan_Trip.py": """import streamlit as st
import requests

API_URL = "http://localhost:8000"

st.set_page_config(page_title="Plan Trip - TravelMate AI", page_icon="🗺️", layout="wide")

if "token" not in st.session_state or not st.session_state.token:
    st.warning("Please log in from the home page first.")
    st.stop()

st.title("🗺️ Plan Your Next Adventure")

with st.form("itinerary_form"):
    destination = st.text_input("Destination")
    col1, col2 = st.columns(2)
    start_date = col1.date_input("Start Date")
    end_date = col2.date_input("End Date")
    budget = st.number_input("Budget (USD)", min_value=100, step=100, value=1000)
    travel_style = st.selectbox("Travel Style", ["adventure", "relaxed", "cultural", "family", "luxury"])
    
    submit_button = st.form_submit_button("Generate Itinerary")

if submit_button:
    if start_date > end_date:
        st.error("End date must be after start date.")
    else:
        with st.spinner("Generating your personalized itinerary with AI..."):
            headers = {"Authorization": f"Bearer {st.session_state.token}"}
            payload = {
                "destination": destination,
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
                "budget": budget,
                "travel_style": travel_style
            }
            try:
                response = requests.post(f"{API_URL}/itinerary/generate", json=payload, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    st.success("Itinerary generated successfully!")
                    
                    st.header(f"Trip to {data.get('destination')}")
                    st.write(f"**Total Days:** {data.get('total_days')} | **Estimated Cost:** ${data.get('total_estimated_cost')}")
                    
                    st.subheader("Daily Plan")
                    for day in data.get("daily_plan", []):
                        with st.expander(f"Day {day.get('day')}: {day.get('title')} (Est. ${day.get('estimated_cost')})"):
                            st.write(f"**Morning:** {day.get('morning')}")
                            st.write(f"**Afternoon:** {day.get('afternoon')}")
                            st.write(f"**Evening:** {day.get('evening')}")
                            
                    st.subheader("Travel Tips")
                    for tip in data.get("travel_tips", []):
                        st.write(f"- {tip}")
                else:
                    st.error(f"Error: {response.json().get('detail', 'Failed to generate itinerary')}")
            except Exception as e:
                st.error(f"Failed to connect to backend: {e}")
""",
    "frontend/pages/2_AI_Chat.py": """import streamlit as st
import requests

API_URL = "http://localhost:8000"

st.set_page_config(page_title="AI Chat - TravelMate AI", page_icon="💬", layout="wide")

if "token" not in st.session_state or not st.session_state.token:
    st.warning("Please log in from the home page first.")
    st.stop()

st.title("💬 Chat with TravelMate AI")

if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat history
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# Chat input
if prompt := st.chat_input("Ask about your trip, destinations, or packing tips..."):
    # Add user message to UI
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)
        
    # Get AI response
    with st.chat_message("assistant"):
        with st.spinner("Thinking..."):
            headers = {"Authorization": f"Bearer {st.session_state.token}"}
            # Only send previous messages for history (excluding current prompt)
            history_for_api = st.session_state.messages[:-1]
            payload = {
                "message": prompt,
                "history": history_for_api
            }
            try:
                response = requests.post(f"{API_URL}/chat/message", json=payload, headers=headers)
                if response.status_code == 200:
                    ai_response = response.json().get("response", "No response")
                    st.markdown(ai_response)
                    st.session_state.messages.append({"role": "model", "content": ai_response})
                else:
                    error_msg = f"Error: {response.json().get('detail', 'Failed to get response')}"
                    st.error(error_msg)
            except Exception as e:
                st.error(f"Failed to connect to backend: {e}")
"""
}

for path, content in files.items():
    create_file(path, content)

print("Scaffolded project files.")
