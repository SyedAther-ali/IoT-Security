from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models, schemas
from app.database import get_db
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/dashboard-data")
def get_dashboard_data(db: Session = Depends(get_db)):
    # Get latest 50 sensor readings
    recent_data = db.query(models.SensorData).order_by(models.SensorData.timestamp.desc()).limit(50).all()
    
    # Get stats
    total_nodes = db.query(models.Node).count()
    suspicious_nodes = db.query(models.Node).filter(models.Node.status == "suspicious").count()
    blocked_ips = db.query(models.BlockedIP).count()
    
    # Calculate online nodes (seen in last 30 seconds)
    thirty_seconds_ago = datetime.utcnow() - timedelta(seconds=30)
    online_nodes = db.query(models.Node).filter(models.Node.last_seen >= thirty_seconds_ago).count()
    
    # Latest logs
    security_logs = db.query(models.SecurityLog).order_by(models.SecurityLog.timestamp.desc()).limit(10).all()

    return {
        "stats": {
            "total_nodes": total_nodes,
            "suspicious_nodes": suspicious_nodes,
            "blocked_ips": blocked_ips,
            "online_nodes": online_nodes
        },
        "recent_telemetry": recent_data,
        "recent_logs": security_logs
    }

@router.get("/nodes", response_model=list[schemas.NodeResponse])
def get_nodes(db: Session = Depends(get_db)):
    nodes = db.query(models.Node).all()
    thirty_seconds_ago = datetime.utcnow() - timedelta(seconds=30)
    
    # Dynamically update status for response
    for node in nodes:
        if node.status == "suspicious":
            node.status = "Compromised"
        elif node.last_seen < thirty_seconds_ago:
            node.status = "Offline"
        else:
            node.status = "Active"
    return nodes

@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    alerts = db.query(models.SensorData).filter(
        models.SensorData.alert_severity.in_(["WARNING", "LANDSLIDE RISK"])
    ).order_by(models.SensorData.timestamp.desc()).limit(20).all()
    return alerts

@router.get("/threats")
def get_threats(db: Session = Depends(get_db)):
    # Get aggregate counts of event types
    event_counts = db.query(
        models.SecurityLog.event_type, 
        func.count(models.SecurityLog.id).label('count')
    ).group_by(models.SecurityLog.event_type).all()
    
    vectors = [{"name": e.event_type, "attacks": e.count, "color": "#ef4444"} for e in event_counts]
    
    # Recent blocked IPs or security incidents
    recent_logs = db.query(models.SecurityLog).order_by(models.SecurityLog.timestamp.desc()).limit(20).all()
    
    return {
        "vectors": vectors,
        "recent_incidents": recent_logs
    }

@router.get("/telemetry")
def get_telemetry(db: Session = Depends(get_db)):
    # Return historical data (e.g. last 100)
    data = db.query(models.SensorData).order_by(models.SensorData.timestamp.desc()).limit(100).all()
    return data

@router.get("/settings", response_model=schemas.SystemSettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(models.SystemSettings).first()
    if not settings:
        settings = models.SystemSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.post("/settings", response_model=schemas.SystemSettingsResponse)
def update_settings(new_settings: schemas.SystemSettingsBase, db: Session = Depends(get_db)):
    settings = db.query(models.SystemSettings).first()
    if not settings:
        settings = models.SystemSettings(**new_settings.dict())
        db.add(settings)
    else:
        for key, value in new_settings.dict().items():
            setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings
