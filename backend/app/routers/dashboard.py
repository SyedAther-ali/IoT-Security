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
    
    thirty_seconds_ago = datetime.utcnow() - timedelta(seconds=30)
    
    # --- ACTIVE AUTO-RECOVERY TRIGGER ---
    # Clear any blocked IPs that are older than 30 seconds
    expired_blocks = db.query(models.BlockedIP).filter(models.BlockedIP.blocked_at < thirty_seconds_ago).all()
    for block in expired_blocks:
        db.delete(block)
    
    if expired_blocks:
        # Also reset any nodes that were stuck in "suspicious" or "isolated"
        suspicious = db.query(models.Node).filter(models.Node.status.in_(["suspicious", "isolated"])).all()
        for node in suspicious:
            node.status = "trusted"
            # Auto-publish SAFE MQTT command to reset the physical hardware
            try:
                publish.single(f"{TOPIC_COMMAND}/{node.node_id}", "SAFE", hostname=MQTT_BROKER)
            except Exception as e:
                print(f"Failed to auto-recover MQTT command for {node.node_id}: {e}")
        db.commit()
    # ------------------------------------

    # Get stats
    total_nodes = db.query(models.Node).count()
    suspicious_nodes = db.query(models.Node).filter(models.Node.status == "suspicious").count()
    blocked_ips = db.query(models.BlockedIP).count()
    
    # Calculate online nodes (seen in last 30 seconds)
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
        elif node.status == "isolated":
            node.status = "Isolated"
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

import paho.mqtt.publish as publish
MQTT_BROKER = "broker.hivemq.com"
TOPIC_COMMAND = "gaia/syedather/command"

@router.post("/nodes/{node_id}/isolate")
def isolate_node(node_id: str, db: Session = Depends(get_db)):
    node = db.query(models.Node).filter(models.Node.node_id == node_id).first()
    if not node:
        return {"error": "Node not found"}
        
    node.status = "isolated"
    db.commit()
    
    # Instantly trigger MQTT response
    try:
        publish.single(f"{TOPIC_COMMAND}/{node_id}", "BLOCKED", hostname=MQTT_BROKER)
    except Exception as e:
        print(f"Failed to publish MQTT block command: {e}")
        
    # Log it
    from app.engines.security_ai import log_security_event, log_pipeline_stage
    log_pipeline_stage(db, "CONTAIN", f"Admin manually initiated Kill Switch for {node_id}")
    log_pipeline_stage(db, "ERADICATE", f"Hardware isolated. Zero-Trust lockdown complete.")
    log_security_event(db, "ADMIN_DASHBOARD", node_id, "manual_isolation", "Node manually isolated by admin kill switch.")
    
    return {"message": f"Node {node_id} isolated"}

@router.post("/nodes/{node_id}/recover")
def recover_node(node_id: str, db: Session = Depends(get_db)):
    node = db.query(models.Node).filter(models.Node.node_id == node_id).first()
    if not node:
        return {"error": "Node not found"}
        
    node.status = "trusted"
    db.commit()
    
    # Instantly trigger MQTT response to recover hardware
    try:
        publish.single(f"{TOPIC_COMMAND}/{node_id}", "SAFE", hostname=MQTT_BROKER)
    except Exception as e:
        print(f"Failed to publish MQTT recover command: {e}")
        
    # Log it
    from app.engines.security_ai import log_security_event, log_pipeline_stage
    log_pipeline_stage(db, "RECOVER", f"Admin manually recovered node {node_id}")
    log_security_event(db, "ADMIN_DASHBOARD", node_id, "manual_recovery", "Node manually recovered by admin.")
    
    return {"message": f"Node {node_id} recovered"}

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
