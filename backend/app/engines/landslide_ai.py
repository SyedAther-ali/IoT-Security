def analyze_landslide_risk(moisture: float, shake: int, tilt: float):
    \"\"\"
    Analyzes sensor data to determine landslide risk.
    Returns a tuple of (risk_score (0-100), alert_severity (SAFE, WARNING, LANDSLIDE RISK), ai_action)
    \"\"\"
    risk_score = 0.0
    severity = "SAFE"
    ai_action = "None"

    # Moisture contribution (0-40)
    if moisture > 80:
        risk_score += 40
    elif moisture > 60:
        risk_score += 20
    elif moisture > 40:
        risk_score += 10

    # Shake contribution (0-40)
    if shake > 5:
        risk_score += 40
    elif shake > 2:
        risk_score += 20
    elif shake > 0:
        risk_score += 10

    # Tilt anomaly contribution (0-20)
    # Assuming normal tilt is around 0, significant absolute tilt indicates shifting
    abs_tilt = abs(tilt)
    if abs_tilt > 15:
        risk_score += 20
    elif abs_tilt > 5:
        risk_score += 10

    # Cap risk score
    risk_score = min(risk_score, 100.0)

    # Determine severity
    if risk_score >= 70:
        severity = "LANDSLIDE RISK"
        ai_action = "Triggering Evacuation Alarms, Dispatching Emergency Services"
    elif risk_score >= 40:
        severity = "WARNING"
        ai_action = "Increasing Telemetry Frequency, Alerting Local Authorities"
    else:
        severity = "SAFE"
        ai_action = "Monitoring Normal"

    return risk_score, severity, ai_action
