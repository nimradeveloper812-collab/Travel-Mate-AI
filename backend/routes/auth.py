from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
import secrets
import os
from dotenv import load_dotenv

from backend.database import get_db
from backend.models import models, schemas

load_dotenv()

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "travelmate-super-secret-production-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or session expired",
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
    db_user = db.query(models.User).filter(models.User.email == user.email.lower()).first()
    if db_user:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        email=user.email.lower(),
        name=user.name.strip(),
        hashed_password=hashed_password,
        home_city="",
        preferred_currency="USD",
        travel_style="Adventure",
        bio=""
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email.lower()).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email, "name": db_user.name, "id": db_user.id},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_profile(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=schemas.UserResponse)
def update_profile(
    profile_data: schemas.UserProfileUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if profile_data.name is not None:
        current_user.name = profile_data.name.strip()
    if profile_data.home_city is not None:
        current_user.home_city = profile_data.home_city.strip()
    if profile_data.preferred_currency is not None:
        current_user.preferred_currency = profile_data.preferred_currency.strip()
    if profile_data.travel_style is not None:
        current_user.travel_style = profile_data.travel_style.strip()
    if profile_data.bio is not None:
        current_user.bio = profile_data.bio.strip()
    
    # Handle password change if requested
    if profile_data.new_password:
        if not profile_data.current_password:
            raise HTTPException(status_code=400, detail="Current password is required to set a new password.")
        if not verify_password(profile_data.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect.")
        if len(profile_data.new_password) < 6:
            raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")
        current_user.hashed_password = get_password_hash(profile_data.new_password)

    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email.lower()).first()
    if not user:
        # Avoid user enumeration for security, but return generic success
        return {
            "message": "If that email exists in our system, a password reset token has been generated.",
            "reset_token": None
        }
    
    # Generate reset token valid for 1 hour
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)
    
    reset_entry = models.PasswordResetToken(
        email=user.email,
        token=token,
        used=False,
        expires_at=expires_at
    )
    db.add(reset_entry)
    db.commit()
    
    return {
        "message": "Password reset token generated successfully.",
        "reset_token": token  # Returned directly for ease of use in demo / self-hosted environments
    }

@router.post("/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    reset_entry = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == request.token,
        models.PasswordResetToken.used == False
    ).first()
    
    if not reset_entry or reset_entry.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
    
    user = db.query(models.User).filter(models.User.email == reset_entry.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    
    user.hashed_password = get_password_hash(request.new_password)
    reset_entry.used = True
    db.commit()
    
    return {"message": "Password updated successfully. You can now log in with your new password."}

