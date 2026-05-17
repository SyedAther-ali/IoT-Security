import RPi.GPIO as GPIO
import time
import requests
import json

# ==========================================
# CONFIGURATION
# ==========================================
# MUST point to your deployed backend
RENDER_URL = "https://iot-security-068d.onrender.com/sensor-data"
NODE_ID = "pi-node-1"
API_KEY = "secret123"

# --- Sensor Pins ---
MOISTURE_PIN = 17 
SHAKE_PIN = 27    
PIR_MOTION_PIN = 22
TEMP_PIN = 4      # Added for DHT11 Temperature Sensor

# --- Alert Pins (LEDs & Buzzer) ---
LED_GREEN = 13    # SAFE
LED_BLUE = 12     # WARNING / Landslide Risk
LED_WHITE = 18    # DANGER / SIM Blocked Strobe
BUZZER_PIN = 25   # Physical Siren

# ==========================================
# SETUP
# ==========================================
GPIO.setwarnings(False)
GPIO.setmode(GPIO.BCM) 

# Setup Inputs
GPIO.setup(MOISTURE_PIN, GPIO.IN)      
GPIO.setup(SHAKE_PIN, GPIO.IN)         
GPIO.setup(PIR_MOTION_PIN, GPIO.IN)  

# Setup Outputs
GPIO.setup(LED_GREEN, GPIO.OUT)
GPIO.setup(LED_BLUE, GPIO.OUT)
GPIO.setup(LED_WHITE, GPIO.OUT)
GPIO.setup(BUZZER_PIN, GPIO.OUT)

def set_hardware_alert_status(status):
    """Sets the LED state and Buzzer based on network/security status from the Cloud."""
    GPIO.output(LED_GREEN, GPIO.LOW)
    GPIO.output(LED_BLUE, GPIO.LOW)
    GPIO.output(LED_WHITE, GPIO.LOW)
    GPIO.output(BUZZER_PIN, GPIO.LOW) # Buzzer off by default
    
    if status == "SAFE":
        GPIO.output(LED_GREEN, GPIO.HIGH)
    elif status == "WARNING" or status == "LANDSLIDE RISK":
        GPIO.output(LED_BLUE, GPIO.HIGH)
        if status == "LANDSLIDE RISK":
            # Pulse buzzer for early warning
            GPIO.output(BUZZER_PIN, GPIO.HIGH)
            time.sleep(0.1)
            GPIO.output(BUZZER_PIN, GPIO.LOW)
    elif status == "DANGER" or status == "BLOCKED":
        GPIO.output(LED_WHITE, GPIO.HIGH)  # Turn on bright White strobe
        GPIO.output(BUZZER_PIN, GPIO.HIGH) # Turn on Siren

def read_temperature():
    """Reads temperature from DHT11/22 on TEMP_PIN."""
    # To use real DHT11:
    # 1. Run in terminal: pip install Adafruit_DHT
    # 2. Uncomment below:
    # import Adafruit_DHT
    # humidity, temp = Adafruit_DHT.read_retry(Adafruit_DHT.DHT11, TEMP_PIN)
    # return temp if temp is not None else 25.0
    return 24.5 # Mock temp fallback

print("Starting Project GAIA Advanced Sensor Logic & Auto-Calibration")
print("-" * 50)

# ==========================================
# AUTO-CALIBRATION
# ==========================================
print("\n>>> INITIALIZING AUTO-CALIBRATION <<<")
print("Calibrating in 3 seconds... Do not touch anything...")
time.sleep(3)

BASELINE_MOISTURE = GPIO.input(MOISTURE_PIN)
BASELINE_SHAKE = GPIO.input(SHAKE_PIN)
BASELINE_PIR = GPIO.input(PIR_MOTION_PIN)

print(">>> CALIBRATION COMPLETE! <<<")
print("-" * 50)

last_shake_time = 0
SHAKE_COOLDOWN = 2.0  
last_upload_time = 0

try:
    set_hardware_alert_status("SAFE")
    
    while True:
        # High-Frequency Polling (Checks 100 times per second!)
        raw_moisture = GPIO.input(MOISTURE_PIN)
        raw_shake = GPIO.input(SHAKE_PIN)
        raw_pir = GPIO.input(PIR_MOTION_PIN)
        
        # Shake logic: If it deviates from baseline, update the timer
        if raw_shake != BASELINE_SHAKE:
            last_shake_time = time.time()
            
        # Determine States
        is_wet = (raw_moisture != BASELINE_MOISTURE)
        is_motion = (raw_pir != BASELINE_PIR)
        is_shaking = (time.time() - last_shake_time) < SHAKE_COOLDOWN
        
        # Only print and upload to the server ONCE per 2 seconds
        current_time = time.time()
        if current_time - last_upload_time >= 2.0:
            last_upload_time = current_time
            
            moisture_text = "WET (Risk)" if is_wet else "DRY (Safe)"
            shake_text = "SHAKING! (Risk)" if is_shaking else "Still (Safe)"
            pir_text = "MOTION DETECTED" if is_motion else "No Motion"
            
            print(f"Moisture: {moisture_text:12} | Shake: {shake_text:15} | PIR: {pir_text:15}")
            
            # 🚀 FORMATTED FOR THE GAIA CLOUD BACKEND 🚀
            payload = {
                "node_id": NODE_ID,
                "api_key": API_KEY,
                "moisture": 85.0 if is_wet else 20.0,
                "temperature": read_temperature(),
                "shake": 8 if is_shaking else 0,       
                "tilt": 20.0 if is_motion else 0.0,    
                "motion": 1 if is_motion else 0,
                "sound": 45.0, # (Safe ambient noise level)
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }
            
            try:
                response = requests.post(RENDER_URL, json=payload, timeout=5)
                if response.status_code == 200:
                     data = response.json()
                     alert_status = data.get('alert_severity', 'SAFE')
                     print(f"--> CLOUD RECEIVED! Status: {alert_status} | Risk Score: {data.get('risk_score', 'N/A')}")
                     
                     # Let the cloud decide the LED and Buzzer status!
                     set_hardware_alert_status(alert_status)
                     
                elif response.status_code == 403:
                     print(f"--> CLOUD BLOCKED BY SIM: {response.text}")
                     set_hardware_alert_status("BLOCKED") # Turns on White LED and Siren
                else:
                     print(f"--> CLOUD ERROR: {response.status_code} - {response.text}")
                     set_hardware_alert_status("WARNING") # Turns on Blue LED
                     
            except Exception as e:
                print(f"--> CONNECTION FAILED: {e}")
                set_hardware_alert_status("WARNING")

        # Tiny sleep to prevent 100% CPU usage, but fast enough to catch any shake
        time.sleep(0.01)

except KeyboardInterrupt:
    print("\nTest stopped by user.")
finally:
    GPIO.cleanup() 
    print("GPIO Cleaned up. LEDs and Buzzer turned off. Goodbye!")
