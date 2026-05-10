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
# A real system would use Redis.
request_history = {}
RATE_LIMIT = 20 # Max requests per 10 seconds

def check_security(db: Session, ip_address: str, payload_node_id: str, payload_api_key: str):
    \"\"\"
    Analyzes the request for cybersecurity threats.
    Returns (is_allowed: bool, reason: str, event_type: str)
    \"\"\"
    
    # 1. Check if IP is already blocked
    blocked = db.query(models.BlockedIP).filter(models.BlockedIP.ip_address == ip_address).first()
    if blocked:
        return False, f"IP blocked. Reason: {blocked.reason}", "blocked_ip_access"

    now = datetime.utcnow()

    # 2. Rate Limiting (Flooding Detection)
    if ip_address not in request_history:
        request_history[ip_address] = []
    
    # Clean old requests (> 10 seconds ago)
    request_history[ip_address] = [ts for ts in request_history[ip_address] if (now - ts).total_seconds() < 10]
    request_history[ip_address].append(now)

    if len(request_history[ip_address]) > RATE_LIMIT:
        _block_ip(db, ip_address, "Request Flooding Detected")
        _mark_node_suspicious(db, payload_node_id)
        return False, "Request Flooding Detected", "flooding"

    # 3. API Key Validation
    if payload_api_key not in VALID_API_KEYS:
        return False, "Invalid API Key", "invalid_api_key"

    # 4. Node ID Spoofing Detection
    expected_node_id = VALID_API_KEYS[payload_api_key]
    if expected_node_id != payload_node_id:
        _block_ip(db, ip_address, f"Node ID Spoofing. Expected {expected_node_id}, got {payload_node_id}")
        _mark_node_suspicious(db, payload_node_id)
        return False, "Node ID Spoofing Detected", "spoofing"

    return True, "Safe", "safe"

def log_security_event(db: Session, ip_address: str, node_id: str, event_type: str, description: str):
    log = models.SecurityLog(
        ip_address=ip_address,
        node_id=node_id,
        event_type=event_type,
        description=description
    )
    db.add(log)
    db.commit()

def _block_ip(db: Session, ip_address: str, reason: str):
    blocked = models.BlockedIP(ip_address=ip_address, reason=reason)
    db.add(blocked)
    db.commit()

def _mark_node_suspicious(db: Session, node_id: str):
    node = db.query(models.Node).filter(models.Node.node_id == node_id).first()
    if node:
        node.status = "suspicious"
        db.commit()
