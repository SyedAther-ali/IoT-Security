from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db

router = APIRouter()

@router.get("/dashboard-data")
def get_dashboard_data(db: Session = Depends(get_db)):
    # Get latest 50 sensor readings
    recent_data = db.query(models.SensorData).order_by(models.SensorData.timestamp.desc()).limit(50).all()
    
    # Get stats
    total_nodes = db.query(models.Node).count()
    suspicious_nodes = db.query(models.Node).filter(models.Node.status == "suspicious").count()
    blocked_ips = db.query(models.BlockedIP).count()
    
    # Latest logs
    security_logs = db.query(models.SecurityLog).order_by(models.SecurityLog.timestamp.desc()).limit(10).all()

    return {
        "stats": {
            "total_nodes": total_nodes,
            "suspicious_nodes": suspicious_nodes,
            "blocked_ips": blocked_ips
        },
        "recent_telemetry": recent_data,
        "recent_logs": security_logs
    }

@router.get("/nodes", response_model=list[schemas.NodeResponse])
def get_nodes(db: Session = Depends(get_db)):
    nodes = db.query(models.Node).all()
    return nodes

@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    alerts = db.query(models.SensorData).filter(
        models.SensorData.alert_severity.in_(["WARNING", "LANDSLIDE RISK"])
    ).order_by(models.SensorData.timestamp.desc()).limit(20).all()
    return alerts
