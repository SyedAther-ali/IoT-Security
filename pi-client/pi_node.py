import time
import requests
import random
import json

# ==========================================
# CONFIGURATION
# ==========================================
# Replace this with your Render deployment URL once deployed, e.g. "https://iot-secure-backend.onrender.com"
# For local testing, leave it as "http://127.0.0.1:8000"
BACKEND_URL = "http://127.0.0.1:8000"

NODE_ID = "pi-node-1"
API_KEY = "secret123"

def read_sensor_data():
    \"\"\"
    Simulates reading data from Raspberry Pi sensors.
    In a real scenario, you would import RPi.GPIO or specific sensor libraries here.
    \"\"\"
    # Simulating safe/normal conditions most of the time
    return {
        "node_id": NODE_ID,
        "api_key": API_KEY,
        "motion": random.choice([0, 0, 0, 1]), # Occasional motion
        "moisture": round(random.uniform(10.0, 30.0), 2), # Normal moisture 10-30%
        "shake": random.choice([0, 0, 0, 1, 2]), # Normal minor vibrations
        "tilt": round(random.uniform(-2.0, 2.0), 2), # Relatively flat
        "sound": round(random.uniform(30.0, 50.0), 2), # Ambient noise
        "timestamp": None # Backend will generate this if null
    }

def send_telemetry():
    print(f"[*] Starting Pi Node: {NODE_ID}")
    print(f"[*] Targeting Backend: {BACKEND_URL}/sensor-data")
    
    while True:
        try:
            payload = read_sensor_data()
            print(f"\\n[>] Sending Payload: {json.dumps(payload)}")
            
            # Send POST request to backend
            response = requests.post(f"{BACKEND_URL}/sensor-data", json=payload, timeout=5)
            
            if response.status_code == 200:
                print(f"[<] Success! Risk Score: {response.json().get('risk_score')} | Severity: {response.json().get('alert_severity')}")
            else:
                print(f"[!] Error {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"[-] Connection Error: {e}")
            print("[-] Retrying in 5 seconds...")
            
        # Send data every 5 seconds
        time.sleep(5)

if __name__ == "__main__":
    send_telemetry()
