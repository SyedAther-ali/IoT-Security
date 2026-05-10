from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app import schemas, models
from app.database import get_db
from app.engines import landslide_ai, security_ai
from datetime import datetime

router = APIRouter()

@router.post("/sensor-data", response_model=schemas.SensorDataResponse)
async def receive_sensor_data(data: schemas.SensorDataCreate, request: Request, db: Session = Depends(get_db)):
    # 1. Cybersecurity Check
    client_ip = request.client.host
    
    is_allowed, reason, event_type = security_ai.check_security(
        db=db,
        ip_address=client_ip,
        payload_node_id=data.node_id,
        payload_api_key=data.api_key
    )

    if not is_allowed:
        security_ai.log_security_event(db, client_ip, data.node_id, event_type, reason)
        raise HTTPException(status_code=403, detail="Access Denied: " + reason)

    # Validate physical impossibility (Impossible Ranges Attack)
    if data.moisture < 0 or data.moisture > 100 or data.tilt < -180 or data.tilt > 180:
        security_ai._block_ip(db, client_ip, "Impossible Sensor Range Detected")
        security_ai._mark_node_suspicious(db, data.node_id)
        security_ai.log_security_event(db, client_ip, data.node_id, "invalid_range", "Impossible Sensor Range")
        raise HTTPException(status_code=400, detail="Invalid Sensor Data Range")

    # 2. Landslide AI Analysis
    risk_score, severity, ai_action = landslide_ai.analyze_landslide_risk(
        moisture=data.moisture,
        shake=data.shake,
        tilt=data.tilt
    )

    # 3. Ensure Node Exists
    node = db.query(models.Node).filter(models.Node.node_id == data.node_id).first()
    if not node:
        node = models.Node(node_id=data.node_id, status="trusted")
        db.add(node)
    
    node.last_seen = datetime.utcnow()

    # 4. Save Data
    sensor_entry = models.SensorData(
        node_id=data.node_id,
        motion=data.motion,
        moisture=data.moisture,
        shake=data.shake,
        tilt=data.tilt,
        sound=data.sound,
        risk_score=risk_score,
        alert_severity=severity,
        timestamp=data.timestamp or datetime.utcnow()
    )
    db.add(sensor_entry)
    db.commit()
    db.refresh(sensor_entry)

    # If action required, log it (can be added to a separate table, but returning it is good for now)

    return sensor_entry
