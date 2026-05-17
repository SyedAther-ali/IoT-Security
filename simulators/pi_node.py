import time
import random
import requests
import json

# ==========================================
# GAIA - Hardware Sensor Node Simulator
# ==========================================

# THIS IS THE RENDER CLOUD BACKEND URL!
API_URL = "https://iot-security-068d.onrender.com/sensors/data"

# Valid API keys for testing: "secret123", "secret456", "secret789"
# Corresponding Nodes: "pi-node-1", "pi-node-2", "pi-node-3"
API_KEY = "secret123"
NODE_ID = "pi-node-1"

def simulate_sensor_reading():
    """Generates realistic landslide telemetry data"""
    # 95% chance of normal data, 5% chance of dangerous spike (landslide)
    if random.random() > 0.95:
        # DANGER SPIKE!
        return {
            "node_id": NODE_ID,
            "moisture": round(random.uniform(70.0, 95.0), 2),  # Heavy rain
            "shake": random.randint(6, 12),                   # Earth moving
            "tilt": round(random.uniform(15.0, 30.0), 2),     # Post slipping
            "api_key": API_KEY
        }
    else:
        # NORMAL
        return {
            "node_id": NODE_ID,
            "moisture": round(random.uniform(20.0, 45.0), 2),
            "shake": random.randint(0, 1),
            "tilt": round(random.uniform(-2.0, 2.0), 2),
            "api_key": API_KEY
        }

if __name__ == "__main__":
    print(f"[*] Starting GAIA Hardware Simulator (Node: {NODE_ID})")
    print(f"[*] Connecting to Command Center: {API_URL}")
    print("[*] Press Ctrl+C to stop.\n")

    try:
        while True:
            payload = simulate_sensor_reading()
            print(f"> Sending telemetry: {json.dumps(payload)}")
            
            try:
                response = requests.post(API_URL, json=payload, timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    print(f"< Status: {data.get('status')} | Alert: {data.get('alert_severity')}\n")
                else:
                    print(f"< ERROR {response.status_code}: {response.text}\n")
            except requests.exceptions.RequestException as e:
                print(f"< Connection Failed: {e}\n")

            # Wait 2 seconds before next reading
            time.sleep(2.0)
            
    except KeyboardInterrupt:
        print("\n[*] Hardware Node Disconnected. Shutting down.")
