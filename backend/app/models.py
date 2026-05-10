from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from app.database import Base
from datetime import datetime

class Node(Base):
    __tablename__ = "nodes"
    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(String, unique=True, index=True)
    status = Column(String, default="trusted") # trusted, suspicious, blocked
    last_seen = Column(DateTime, default=datetime.utcnow)

class SensorData(Base):
    __tablename__ = "sensor_data"
    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(String, index=True)
    motion = Column(Integer)
    moisture = Column(Float)
    shake = Column(Integer)
    tilt = Column(Float)
    sound = Column(Float)
    risk_score = Column(Float, default=0.0)
    alert_severity = Column(String, default="SAFE")
    timestamp = Column(DateTime, default=datetime.utcnow)

class SecurityLog(Base):
    __tablename__ = "security_logs"
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, index=True)
    node_id = Column(String, index=True, nullable=True)
    event_type = Column(String) # e.g., "invalid_api_key", "spoofing", "flooding", "invalid_range"
    description = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class BlockedIP(Base):
    __tablename__ = "blocked_ips"
    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, unique=True, index=True)
    reason = Column(String)
    blocked_at = Column(DateTime, default=datetime.utcnow)
