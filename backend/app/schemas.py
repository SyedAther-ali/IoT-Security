from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class SensorDataCreate(BaseModel):
    node_id: str
    api_key: str
    motion: int = Field(ge=0, le=1) # 0 or 1
    temperature: Optional[float] = None # Added for DHT11
    moisture: float # Removed constraints so we can simulate impossible ranges
    shake: int = Field(ge=0) 
    tilt: float # Removed constraints so we can simulate impossible ranges
    sound: float = Field(ge=0.0) # dB
    tampered: bool = False
    timestamp: Optional[datetime] = None

class SensorDataResponse(BaseModel):
    id: int
    node_id: str
    motion: int
    temperature: Optional[float]
    moisture: float
    shake: int
    tilt: float
    sound: float
    tampered: bool
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

class SystemSettingsBase(BaseModel):
    sensitivity: int = Field(ge=0, le=100)
    auto_ban: bool
    deep_inspect: bool

class SystemSettingsResponse(SystemSettingsBase):
    id: int

    class Config:
        from_attributes = True

class BlockedIPResponse(BaseModel):
    ip_address: str
    reason: str
    blocked_at: datetime

    class Config:
        from_attributes = True
