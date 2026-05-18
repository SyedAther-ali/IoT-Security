import json
import threading
import paho.mqtt.client as mqtt
from datetime import datetime
from app.database import SessionLocal
from app import models, schemas
from app.engines import security_ai, landslide_ai

MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883
TOPIC_TELEMETRY = "gaia/syedather/telemetry"
TOPIC_COMMAND = "gaia/syedather/command"

def on_connect(client, userdata, flags, rc):
    print(f"[MQTT] Connected with result code {rc}")
    client.subscribe(TOPIC_TELEMETRY)
    print(f"[MQTT] Subscribed to {TOPIC_TELEMETRY}")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        db = SessionLocal()
        
        # 1. Zero Trust Pipeline
        node_id = payload.get("node_id")
        api_key = payload.get("api_key")
        # Use an internal IP for MQTT bypass since it's pub-sub, but we can rate limit based on node_id
        client_ip = f"mqtt-{node_id}" 
        
        is_allowed, reason, event_type = security_ai.check_security(
            db=db,
            ip_address=client_ip,
            payload_node_id=node_id,
            payload_api_key=api_key
        )
        
        if not is_allowed:
            if event_type not in ["blocked_ip_access", "isolated_node"]:
                security_ai.log_security_event(db, client_ip, node_id, event_type, reason)
            client.publish(f"{TOPIC_COMMAND}/{node_id}", "BLOCKED")
            db.close()
            return
            
        # 2. Extract Data
        moisture = float(payload.get("moisture", 0))
        shake = int(payload.get("shake", 0))
        tilt = float(payload.get("tilt", 0))
        tampered = bool(payload.get("tampered", False))
        
        # 3. Check for Impossible Data or Tampering
        if moisture < 0 or moisture > 100 or tilt < -180 or tilt > 180:
            security_ai.handle_impossible_data(db, client_ip, node_id, moisture, tilt)
            client.publish(f"{TOPIC_COMMAND}/{node_id}", "BLOCKED")
            db.close()
            return
            
        if tampered:
            security_ai.handle_tampering(db, client_ip, node_id)
            client.publish(f"{TOPIC_COMMAND}/{node_id}", "BLOCKED")
            db.close()
            return
            
        # 4. Landslide AI (Scikit-Learn)
        temperature = payload.get("temperature", 25.0)
        risk_score, severity, ai_action = landslide_ai.analyze_landslide_risk(
            moisture=moisture,
            shake=shake,
            tilt=tilt,
            temperature=temperature
        )
        
        # 5. DB Ops
        node = db.query(models.Node).filter(models.Node.node_id == node_id).first()
        if not node:
            node = models.Node(node_id=node_id, status="trusted")
            db.add(node)
        
        node.last_seen = datetime.utcnow()
        
        sensor_entry = models.SensorData(
            node_id=node_id,
            motion=payload.get("motion", 0),
            temperature=temperature,
            moisture=moisture,
            shake=shake,
            tilt=tilt,
            sound=payload.get("sound", 0),
            tampered=tampered,
            risk_score=risk_score,
            alert_severity=severity
        )
        db.add(sensor_entry)
        db.commit()
        
        # 6. Publish Instant Status Back to Node!
        response_status = "BLOCKED" if node.status in ["suspicious", "isolated"] else severity
        client.publish(f"{TOPIC_COMMAND}/{node_id}", response_status)
        db.close()
        
    except Exception as e:
        print(f"[MQTT] Error parsing message: {e}")

def start_mqtt_client():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    
    # Run in background
    def run_client():
        print(f"[SYS] Initializing MQTT Pub-Sub Service on {MQTT_BROKER}...")
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_forever()
        
    thread = threading.Thread(target=run_client, daemon=True)
    thread.start()
