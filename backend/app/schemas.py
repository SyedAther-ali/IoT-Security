from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class SensorDataCreate(BaseModel):
    node_id: str
    api_key: str
    motion: int = Field(ge=0, le=1) # 0 or 1
    moisture: float = Field(ge=0.0, le=100.0) # percentage
    shake: int = Field(ge=0) 
    tilt: float = Field(ge=-180.0, le=180.0) # degrees
    sound: float = Field(ge=0.0) # dB
    timestamp: datetime

class SensorDataResponse(BaseModel):
    id: int
    node_id: str
    motion: int
    moisture: float
    shake: int
    tilt: float
    sound: float
    risk_score: float
    alert_severity: str
    timestamp: datetime

    class Config:
        from_attributes = True

class NodeResponse(BaseModel):
    node_id: str
    status: str
    last_seen: datetime

    class Config:
        from_attributes = True

class SecurityLogResponse(BaseModel):
    ip_address: str
    node_id: Optional[str]
    event_type: str
    description: str
    timestamp: datetime

    class Config:
        from_attributes = True
