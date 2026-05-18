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
GPIO.setup(TAMPER_PIN, GPIO.IN, pull_up_down=GPIO.PUD_DOWN) # Active high touch sensor (high = touched)

# Setup Outputs
GPIO.setup(LED_GREEN, GPIO.OUT)
GPIO.setup(LED_BLUE, GPIO.OUT)
GPIO.setup(LED_WHITE, GPIO.OUT)
GPIO.setup(BUZZER_PIN, GPIO.OUT)

# Initialize PWM on buzzer pin at 2000Hz (highly audible pitch for passive buzzers)
buzzer_pwm = GPIO.PWM(BUZZER_PIN, 2000)

def turn_buzzer_on():
    """Starts the physical siren using PWM for maximum passive volume."""
    try:
        buzzer_pwm.start(50) # 50% duty cycle creates maximum volume square wave
    except Exception:
        pass

def turn_buzzer_off():
    """Stops the physical siren."""
    try:
        buzzer_pwm.stop()
    except Exception:
        pass

# --- I2C LCD1602 RGB DISPLAY SETUP (FAIL-SAFE) ---
lcd = None

try:
    from dfrgblcdpy import DFRRGBLCDPY
    # Initialize the RGB LCD
    lcd = DFRRGBLCDPY()
    lcd.set_color_white()
    lcd.clear()
    lcd.print_out("GAIA BOOTING...")
    print("[SYS] Fail-safe: DFRobot LCD1602 RGB Display successfully initialized!")
except Exception as e:
    print(f"[WARNING] DFRobot LCD1602 RGB Display failed to load (Plug it in later!): {e}")

def update_lcd_screen(line1, line2="", r=255, g=255, b=255):
    """Safely writes 2 lines of text (max 16 chars) and sets the RGB backlight color using the library's set_RGB method."""
    if lcd is None:
        return
    try:
        lcd.clear()
        
        # Set RGB color using correct case-sensitive library method
        lcd.set_RGB(r, g, b)
        
        # Write Line 1 (Truncated to 16 chars)
        lcd.set_cursor(0, 0)
        lcd.print_out(line1[:16])
        
        # Write Line 2 (Truncated to 16 chars)
        if line2:
            lcd.set_cursor(0, 1)
            lcd.print_out(line2[:16])
    except Exception as e:
        print(f"[LCD ERR] Failed to write to display: {e}")


def set_hardware_alert_status(status):
    """Sets the LED state and Buzzer based on MQTT Commands from Cloud."""
    GPIO.output(LED_GREEN, GPIO.LOW)
    GPIO.output(LED_BLUE, GPIO.LOW)
    GPIO.output(LED_WHITE, GPIO.LOW)
    turn_buzzer_off()
    
    if status == "SAFE":
        GPIO.output(LED_GREEN, GPIO.HIGH)
        update_lcd_screen(
            "STATUS: SECURE",
            "GAIA ACTIVE",
            r=0, g=255, b=0 # Bright Green!
        )
    elif status == "WARNING" or status == "LANDSLIDE RISK":
        GPIO.output(LED_BLUE, GPIO.HIGH)
        if status == "LANDSLIDE RISK":
            # Pulse buzzer for early warning
            turn_buzzer_on()
            time.sleep(0.2)
            turn_buzzer_off()
            update_lcd_screen(
                "STATUS: CRITICAL",
                "EVACUATE AREA!",
                r=255, g=0, b=0 # Bright Red!
            )
        else:
            update_lcd_screen(
                "STATUS: WARNING",
                "SUSPICIOUS DATA",
                r=255, g=128, b=0 # Bright Orange/Yellow!
            )
    elif status == "DANGER" or status == "BLOCKED":
        GPIO.output(LED_WHITE, GPIO.HIGH)  # Turn on bright White strobe
        turn_buzzer_on()                   # Turn on Siren (LOUD PWM!)
        update_lcd_screen(
            "!!! QUARANTINE !!!",
            "SYSTEM BLOCKED",
            r=255, g=0, b=0 # Bright Red!
        )

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
            
            # If screen is active and node is secure (Green LED is on), display live telemetry
            if lcd is not None and GPIO.input(LED_GREEN) == GPIO.HIGH:
                update_lcd_screen(
                    f"T:{payload['temperature']}C  M:{payload['moisture']}%",
                    f"Tilt:{payload['tilt']} deg",
                    r=0, g=255, b=0 # Bright Green!
                )

        time.sleep(0.01)

except KeyboardInterrupt:
    print("\nTest stopped by user.")
finally:
    client.loop_stop()
    GPIO.cleanup() 
    print("GPIO Cleaned up. LEDs and Buzzer turned off. Goodbye!")
