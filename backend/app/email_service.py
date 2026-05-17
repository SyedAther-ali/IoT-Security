import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import threading

# Add these to your .env file in production
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = os.getenv("GAIA_ALERT_EMAIL", "")
APP_PASSWORD = os.getenv("GAIA_ALERT_PASSWORD", "") 
RECIPIENT_EMAIL = os.getenv("GAIA_RECIPIENT_EMAIL", SENDER_EMAIL)

def _send_email_async(subject: str, body: str):
    if not SENDER_EMAIL or not APP_PASSWORD:
        print(f"\n[EMAIL SIMULATION] Would have sent email:\nSUBJECT: {subject}\nBODY:\n{body}\n")
        return
        
    try:
        msg = MIMEMultipart()
        msg['From'] = f"GAIA Command Center <{SENDER_EMAIL}>"
        msg['To'] = RECIPIENT_EMAIL
        msg['Subject'] = f"[URGENT] {subject}"
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, APP_PASSWORD)
        text = msg.as_string()
        server.sendmail(SENDER_EMAIL, RECIPIENT_EMAIL, text)
        server.quit()
        print(f"[SYS] Security Alert Email successfully sent to {RECIPIENT_EMAIL}")
    except Exception as e:
        print(f"[SYS] Failed to send email alert: {e}")

def send_security_alert(node_id: str, ip_address: str, event_type: str, reason: str):
    """Fires an asynchronous email alert for a security incident."""
    subject = f"GAIA Security Incident: Node {node_id} Compromised"
    
    body = f"""
    GLOBAL AUTONOMOUS INTEGRITY AGENT (GAIA)
    ----------------------------------------
    CRITICAL SECURITY ALERT
    
    A severe security incident has been detected and autonomously neutralized by the Security Integrity Module (SIM).
    
    INCIDENT DETAILS:
    - Node ID: {node_id}
    - Attacker IP: {ip_address}
    - Threat Classification: {event_type.upper()}
    - Reason: {reason}
    
    SYSTEM ACTION TAKEN:
    The attacker's IP address has been permanently banned from the API Gateway.
    The compromised hardware node has been locked down and isolated from the Telemetry Data Lake.
    
    No further manual intervention is required. The network is secure.
    
    - GAIA Security Operations Center
    """
    
    # Run in background to prevent blocking the API
    threading.Thread(target=_send_email_async, args=(subject, body), daemon=True).start()
