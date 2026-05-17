import RPi.GPIO as GPIO
import time
import json
import paho.mqtt.client as mqtt

# ==========================================
# CONFIGURATION
# ==========================================
NODE_ID = "pi-node-1"
API_KEY = "secret123"

MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883
TOPIC_TELEMETRY = "gaia/syedather/telemetry"
TOPIC_COMMAND = f"gaia/syedather/command/{NODE_ID}"

# --- Sensor Pins ---
MOISTURE_PIN = 17 
SHAKE_PIN = 27    
PIR_MOTION_PIN = 22
TEMP_PIN = 4      
TAMPER_PIN = 26   # New: Lid Open Switch

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
GPIO.setup(TAMPER_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP) # Active low (pressed = ground)

# Setup Outputs
GPIO.setup(LED_GREEN, GPIO.OUT)
GPIO.setup(LED_BLUE, GPIO.OUT)
GPIO.setup(LED_WHITE, GPIO.OUT)
GPIO.setup(BUZZER_PIN, GPIO.OUT)

def set_hardware_alert_status(status):
    """Sets the LED state and Buzzer based on MQTT Commands from Cloud."""
    GPIO.output(LED_GREEN, GPIO.LOW)
    GPIO.output(LED_BLUE, GPIO.LOW)
    GPIO.output(LED_WHITE, GPIO.LOW)
    GPIO.output(BUZZER_PIN, GPIO.LOW) 
    
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
    return 24.5 # Mock temp fallback

# ==========================================
# MQTT CALLBACKS
# ==========================================
def on_connect(client, userdata, flags, rc):
    print(f"\n>>> [MQTT] Connected to {MQTT_BROKER} (Code: {rc})")
    client.subscribe(TOPIC_COMMAND)
    print(f">>> [MQTT] Subscribed to commands on: {TOPIC_COMMAND}\n")

def on_message(client, userdata, msg):
    command = msg.payload.decode()
    print(f"\n[!] INSTANT CLOUD COMMAND RECEIVED: {command}")
    set_hardware_alert_status(command)

client = mqtt.Client(client_id=NODE_ID)
client.on_connect = on_connect
client.on_message = on_message
print("Connecting to GAIA Cloud via MQTT...")
client.connect(MQTT_BROKER, MQTT_PORT, 60)
client.loop_start() # Run MQTT in background thread

print("Starting Project GAIA Advanced Sensor Logic (MQTT Edition)")
print("-" * 50)

# ==========================================
# AUTO-CALIBRATION
# ==========================================
print("\n>>> INITIALIZING AUTO-CALIBRATION <<<")
time.sleep(1)

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
        raw_moisture = GPIO.input(MOISTURE_PIN)
        raw_shake = GPIO.input(SHAKE_PIN)
        raw_pir = GPIO.input(PIR_MOTION_PIN)
        
        # Tamper logic: PUD_UP means normally 1. If pressed (ground), it goes 0. 
        # If the lid opens, it releases the button, going back to 1.
        is_tampered = (GPIO.input(TAMPER_PIN) == GPIO.HIGH) 
        
        if raw_shake != BASELINE_SHAKE:
            last_shake_time = time.time()
            
        is_wet = (raw_moisture != BASELINE_MOISTURE)
        is_motion = (raw_pir != BASELINE_PIR)
        is_shaking = (time.time() - last_shake_time) < SHAKE_COOLDOWN
        
        current_time = time.time()
        
        # Immediate physical interrupt if tampered
        if is_tampered and (current_time - last_upload_time) >= 0.5:
             # Fast publish for tamper
             last_upload_time = current_time
             print(f"CRITICAL: HARDWARE TAMPERING DETECTED!")
             payload = {
                "node_id": NODE_ID,
                "api_key": API_KEY,
                "moisture": 0.0,
                "temperature": 0.0,
                "shake": 0,       
                "tilt": 0.0,    
                "motion": 0,
                "sound": 0.0,
                "tampered": True,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
             }
             client.publish(TOPIC_TELEMETRY, json.dumps(payload))
             
        elif current_time - last_upload_time >= 2.0:
            last_upload_time = current_time
            
            moisture_text = "WET (Risk)" if is_wet else "DRY (Safe)"
            shake_text = "SHAKING! (Risk)" if is_shaking else "Still (Safe)"
            pir_text = "MOTION DETECTED" if is_motion else "No Motion"
            
            print(f"Moisture: {moisture_text:12} | Shake: {shake_text:15} | PIR: {pir_text:15}")
            
            payload = {
                "node_id": NODE_ID,
                "api_key": API_KEY,
                "moisture": 85.0 if is_wet else 20.0,
                "temperature": read_temperature(),
                "shake": 8 if is_shaking else 0,       
                "tilt": 20.0 if is_motion else 0.0,    
                "motion": 1 if is_motion else 0,
                "sound": 45.0, 
                "tampered": False,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }
            
            # Fire and forget over MQTT
            client.publish(TOPIC_TELEMETRY, json.dumps(payload))
            print(f"--> MQTT Published")

        time.sleep(0.01)

except KeyboardInterrupt:
    print("\nTest stopped by user.")
finally:
    client.loop_stop()
    GPIO.cleanup() 
    print("GPIO Cleaned up. LEDs and Buzzer turned off. Goodbye!")
