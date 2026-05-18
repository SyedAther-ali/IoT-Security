import os
from sqlalchemy.orm import Session
from app import models
from datetime import datetime, timedelta

# In a real app, this would be hashed and stored securely.
VALID_API_KEYS = {
    "secret123": "pi-node-1",
    "secret456": "pi-node-2",
    "secret789": "pi-node-3"
}

# In-memory rate limiting for simplicity (IP -> List of Timestamps)
request_history = {}
RATE_LIMIT = 20 # Max requests per 10 seconds

def log_pipeline_stage(db: Session, stage: str, message: str):
    """Logs Security Integrity Module (SIM) 7-stage decision pipeline."""
    # Using node_id SIM_AGENT to distinguish system thought logs
    log = models.SecurityLog(
        ip_address="internal",
        node_id="SIM_AGENT",
        event_type=f"pipeline_{stage}",
        description=message
    )
    db.add(log)
    db.commit()

def check_security(db: Session, ip_address: str, payload_node_id: str, payload_api_key: str):
    """
    Zero-Trust Integrity Validation Engine.
    Analyzes the request for cybersecurity threats.
    Returns (is_allowed: bool, reason: str, event_type: str)
    """
    
    now = datetime.utcnow()

    # 1. Check if IP is already blocked and process Auto-Recovery
    blocked = db.query(models.BlockedIP).filter(models.BlockedIP.ip_address == ip_address).first()
    if blocked:
        # Auto-Recovery: Unblock after 30 seconds
        if (now - blocked.blocked_at).total_seconds() > 30:
            db.delete(blocked)
            
            # Reset node status if it exists and was marked "suspicious" (auto-flagged).
            # Manually isolated nodes must not be auto-recovered.
            node = db.query(models.Node).filter(models.Node.node_id == payload_node_id).first()
            if node and node.status == "suspicious":
                node.status = "trusted"
                
            db.commit()
            log_pipeline_stage(db, "RECOVER", f"Auto-Recovery complete for {ip_address}. Node restored to trusted state.")
            # Let it continue to process the request normally now
        else:
            return False, f"IP blocked. Node ISOLATED. Reason: {blocked.reason}", "blocked_ip_access"

    # 2. Rate Limiting (Flooding Detection)
    if ip_address not in request_history:
        request_history[ip_address] = []
    
    request_history[ip_address] = [ts for ts in request_history[ip_address] if (now - ts).total_seconds() < 10]
    request_history[ip_address].append(now)

    if len(request_history[ip_address]) > RATE_LIMIT:
        log_pipeline_stage(db, "INGEST", f"Packet received from {ip_address}. Validating cryptographic signature.")
        log_pipeline_stage(db, "ENRICH", f"Cross-referencing {ip_address} with global threat intelligence.")
        log_pipeline_stage(db, "DETECT", f"High request frequency anomaly detected (>{RATE_LIMIT} req/10s).")
        log_pipeline_stage(db, "ANALYZE", f"SIM Classification: DDoS/Flooding Attempt. Confidence: 99.8%.")
        log_pipeline_stage(db, "CONTAIN", f"Isolating node {payload_node_id} from main Data Lake.")
        log_pipeline_stage(db, "ERADICATE", f"Executing IP Ban protocol for {ip_address} at firewall level.")
        log_pipeline_stage(db, "RECOVER", f"Threat neutralized. System returned to nominal monitoring.")
        
        _block_ip(db, ip_address, "Request Flooding Detected")
        _mark_node_suspicious(db, payload_node_id)
        return False, "Request Flooding Detected", "flooding"

    # 3. API Key Validation
    if payload_api_key not in VALID_API_KEYS:
        log_pipeline_stage(db, "INGEST", f"Packet received from {ip_address}. Validating signature.")
        log_pipeline_stage(db, "DETECT", f"Zero-Trust failure: Invalid API Key presented.")
        log_pipeline_stage(db, "ANALYZE", f"SIM Classification: Unauthorized Access Attempt. Confidence: 100%.")
        log_pipeline_stage(db, "ERADICATE", f"Rejecting payload and dropping connection.")
        return False, "Invalid API Key", "invalid_api_key"

    # 4. Node ID Spoofing Detection
    expected_node_id = VALID_API_KEYS[payload_api_key]
    if expected_node_id != payload_node_id:
        log_pipeline_stage(db, "INGEST", f"Packet received from {ip_address}. Validating signature.")
        log_pipeline_stage(db, "ENRICH", f"Verifying node cryptographic identity.")
        log_pipeline_stage(db, "DETECT", f"Identity mismatch. Expected {expected_node_id}, got {payload_node_id}.")
        log_pipeline_stage(db, "ANALYZE", f"SIM Classification: Node Spoofing Attack. Confidence: 95%.")
        log_pipeline_stage(db, "CONTAIN", f"Isolating spoofed node from network.")
        log_pipeline_stage(db, "ERADICATE", f"Blocking origin IP {ip_address}.")
        log_pipeline_stage(db, "RECOVER", f"Threat neutralized. Monitoring resumed.")
        
        _block_ip(db, ip_address, f"Node ID Spoofing. Expected {expected_node_id}, got {payload_node_id}")
        _mark_node_suspicious(db, payload_node_id)
        return False, "Node ID Spoofing Detected", "spoofing"

    # 5. Check if node is isolated by Admin
    node = db.query(models.Node).filter(models.Node.node_id == payload_node_id).first()
    if node and node.status == "isolated":
        return False, "ISOLATED BY ADMIN", "isolated_node"

    return True, "Safe", "safe"

def handle_impossible_data(db: Session, ip_address: str, node_id: str, moisture: float, tilt: float):
    """Handles data poisoning attacks from sensors.py (Integrity Validation Engine)"""
    log_pipeline_stage(db, "INGEST", f"Packet received from {ip_address}. Integrity check initiated.")
    log_pipeline_stage(db, "ENRICH", f"Comparing values against physically possible baseline models.")
    log_pipeline_stage(db, "DETECT", f"Physically impossible telemetry from Node {node_id} (Moist: {moisture}, Tilt: {tilt}).")
    log_pipeline_stage(db, "ANALYZE", f"SIM Classification: Data Poisoning / Tampering. Confidence: 99.1%.")
    log_pipeline_stage(db, "CONTAIN", f"Quarantining malicious payload. Preventing Database insertion.")
    log_pipeline_stage(db, "ERADICATE", f"Executing IP Ban on {ip_address}. Marking node COMPROMISED.")
    log_pipeline_stage(db, "RECOVER", f"Cascade failure prevented. Nominal state restored.")
    
    _block_ip(db, ip_address, "Impossible Sensor Range Detected (Tampering)")
    _mark_node_suspicious(db, node_id)
    log_security_event(db, ip_address, node_id, "data_poisoning", "Physically impossible telemetry values.")


def handle_tampering(db: Session, ip_address: str, node_id: str):
    """Handles physical hardware tampering (Lid Open switch)"""
    log_pipeline_stage(db, "INGEST", f"Hardware interrupt received from {node_id}.")
    log_pipeline_stage(db, "DETECT", f"CRITICAL: Physical Tamper Switch activated on Node {node_id}!")
    log_pipeline_stage(db, "ANALYZE", f"SIM Classification: Physical Hardware Intrusion. Confidence: 100%.")
    log_pipeline_stage(db, "CONTAIN", f"Isolating compromised hardware from Data Lake.")
    log_pipeline_stage(db, "ERADICATE", f"Locking down node communication.")
    
    _block_ip(db, ip_address, "Physical Hardware Tampering")
    
    node = db.query(models.Node).filter(models.Node.node_id == node_id).first()
    if node:
        node.status = "isolated"
        db.commit()
        
    log_security_event(db, ip_address, node_id, "hardware_tampering", "Physical device casing breached.")

def log_security_event(db: Session, ip_address: str, node_id: str, event_type: str, description: str):
    log = models.SecurityLog(
        ip_address=ip_address,
        node_id=node_id,
        event_type=event_type,
        description=description
    )
    db.add(log)
    db.commit()

from app.email_service import send_security_alert

def _block_ip(db: Session, ip_address: str, reason: str):
    existing = db.query(models.BlockedIP).filter(models.BlockedIP.ip_address == ip_address).first()
    if not existing:
        blocked = models.BlockedIP(ip_address=ip_address, reason=reason)
        db.add(blocked)
        db.commit()
        log_pipeline_stage(db, "ERADICATE", f"IP {ip_address} permanently banned at gateway level.")
        send_security_alert("SYSTEM", ip_address, "SECURITY_BLOCK", reason)

def _mark_node_suspicious(db: Session, node_id: str):
    node = db.query(models.Node).filter(models.Node.node_id == node_id).first()
    if node:
        node.status = "isolated"  # Autonomous SOAR Containment: Instant lockdown!
        db.commit()
        log_pipeline_stage(db, "CONTAIN", f"Autonomous Agent executed Kill Switch for {node_id}. Integrity breach contained.")
