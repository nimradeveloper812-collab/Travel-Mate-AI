import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# Default to local SQLite database if DATABASE_URL is not provided
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL") or "sqlite:///./travelmate.db"

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300
    )

from sqlalchemy import text

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def init_db():
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        # Migrate users table columns if missing
        for col, col_type in [
            ("role", "VARCHAR DEFAULT 'user'"),
            ("home_city", "VARCHAR DEFAULT ''"),
            ("preferred_currency", "VARCHAR DEFAULT 'USD'"),
            ("travel_style", "VARCHAR DEFAULT 'Adventure'"),
            ("bio", "TEXT DEFAULT ''")
        ]:
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type}"))
                conn.commit()
            except Exception:
                pass
        
        # Migrate trips table columns if missing
        try:
            conn.execute(text("ALTER TABLE trips ADD COLUMN notes_json TEXT DEFAULT '[]'"))
            conn.commit()
        except Exception:
            pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


