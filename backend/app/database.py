from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Using SQLite for local development, easily switchable to Postgres
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./iot_secure.db")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    # check_same_thread is needed only for SQLite
    connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {},
    pool_pre_ping=True,
    pool_recycle=300
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
