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
    # Use X-Forwarded-For to get the real IP if behind Render's load balancer
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    else:
        client_ip = request.client.host
    
    is_allowed, reason, event_type = security_ai.check_security(
        db=db,
        ip_address=client_ip,
        payload_node_id=data.node_id,
        payload_api_key=data.api_key
    )

    if not is_allowed:
        if event_type not in ["blocked_ip_access", "isolated_node"]:
            security_ai.log_security_event(db, client_ip, data.node_id, event_type, reason)
        try:
            from paho.mqtt import publish
            publish.single(f"gaia/syedather/command/{data.node_id}", "BLOCKED", hostname="broker.hivemq.com")
        except Exception:
            pass
        raise HTTPException(status_code=403, detail="Access Denied: " + reason)

    # Validate physical impossibility (Impossible Ranges Attack)
    if data.moisture < 0 or data.moisture > 100 or data.tilt < -180 or data.tilt > 180:
        security_ai.handle_impossible_data(db, client_ip, data.node_id, data.moisture, data.tilt)
        try:
            from paho.mqtt import publish
            publish.single(f"gaia/syedather/command/{data.node_id}", "BLOCKED", hostname="broker.hivemq.com")
        except Exception:
            pass
        raise HTTPException(status_code=400, detail="Invalid Sensor Data Range")

    # Validate physical hardware tampering
    if data.tampered:
        security_ai.handle_tampering(db, client_ip, data.node_id)
        try:
            from paho.mqtt import publish
            publish.single(f"gaia/syedather/command/{data.node_id}", "BLOCKED", hostname="broker.hivemq.com")
        except Exception:
            pass
        raise HTTPException(status_code=403, detail="HARDWARE TAMPERING DETECTED")

    # 2. Landslide AI Analysis (Now using Scikit-Learn ML)
    risk_score, severity, ai_action = landslide_ai.analyze_landslide_risk(
        moisture=data.moisture,
        shake=data.shake,
        tilt=data.tilt,
        temperature=data.temperature if data.temperature is not None else 25.0
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
        temperature=data.temperature,
        moisture=data.moisture,
        shake=data.shake,
        tilt=data.tilt,
        sound=data.sound,
        tampered=data.tampered,
        risk_score=risk_score,
        alert_severity=severity,
        timestamp=data.timestamp or datetime.utcnow()
    )
    db.add(sensor_entry)
    db.commit()
    db.refresh(sensor_entry)

    # Publish Instant Status Back to Node over MQTT
    try:
        from paho.mqtt import publish
        publish.single(f"gaia/syedather/command/{data.node_id}", severity, hostname="broker.hivemq.com")
    except Exception:
        pass

    return sensor_entry
