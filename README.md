# 🌍 Project GAIA: Secure, Zero-Trust AI-Powered Geotechnical IoT Platform

> **Predictive Natural Disaster Modeling meets Autonomous Cyber-Defense Security.**

Project GAIA is a secure, industrial-grade IoT platform built to address two critical challenges of modern environmental sensor networks: **accurate real-time prediction of natural disasters (landslides)** and **autonomous cyber-defense (SOAR) at the edge** to secure exposed sensor hardware against data poisoning, spoofing, and DDoS flooding attacks.

Unlike passive data monitoring pipelines, GAIA features a **Zero-Trust Security integrity Module (SIM)** gateway that autonomously isolates compromised sensors and forces attacker hosts to self-terminate without human intervention.

---

## 📸 System Architecture & Data Flow

GAIA operates on a logical **Three-Zone Topology** that guarantees data integrity and network resilience:

```mermaid
graph TD
    subgraph Zone 1: The Physical Edge (Field Sensors)
        A[pi-node-1: Physical Pi Node]
        B[pi-node-2: Simulated Backup]
        C[pi-node-3: Simulated Backup]
    end

    subgraph Zone 2: Zero-Trust Secure Gateway
        GW[GAIA Secure Firewall Gateway]
        SIM[7-Stage SIM Decision Pipeline]
    end

    subgraph Zone 3: Enterprise SOC Command Center
        DB[(SQL Database Data Lake)]
        ML[Predictive Random Forest AI]
        Web[React SOC Web Panel]
    end

    Zone 1 -->|Secure MQTT JSON Telemetry| GW
    GW -->|Cryptographic Verification| SIM
    SIM -->|Verified Ingestion| DB
    DB -->|Continuous Learning| ML
    SIM -->|SOAR Control Signals| Zone 1
    Web -->|Live Command Panel & Kill Switch| Zone 3
```

---

## ⚡ Key Innovations & Solved Challenges

### 🧠 1. Predictive Landslide AI (Scikit-Learn Random Forest)
*   **Machine Learning Core:** Uses a multi-class **Random Forest Classifier** trained on high-fidelity features: `[moisture, vibration/shake, absolute tilt, temperature]`.
*   **Dynamic Probability Scoring:** Computes dynamic probability weights ($0\%$ to $100\%$) to generate a weighted risk score instead of relying on static thresholds.
*   **Autonomous Remediation:** Translates risk levels directly to actionable emergency behaviors:
    *   `SAFE` $\rightarrow$ Nominal environmental monitoring.
    *   `WARNING` $\rightarrow$ Increases edge reporting frequencies, alerts emergency contact groups.
    *   `LANDSLIDE RISK` $\rightarrow$ Instantly flashes sirens and triggers visual strobe alerts for local evacuations.

### 🛡️ 2. Zero-Trust Cyber Security Integrity Module (SIM Engine)
Implements a strict **7-Stage SOAR Decision Pipeline** (Ingest, Enrich, Detect, Analyze, Contain, Eradicate, Recover) to intercept edge anomalies:
*   **DDoS Flooding Mitigation:** Rate limits nodes. If requests exceed 20 packets per 10 seconds, the IP is blacklisted, and the node is isolated.
*   **Node Identity Spoofing Protection:** Validates cryptographic API keys against expected node identifiers. An identity mismatch triggers instant firewall isolation.
*   **Physical Tamper Interception:** Detects hardware lid switches. A breach events triggers a high-priority sub-0.5s quarantine command.
*   **Data Poisoning Prevention:** Discards physically impossible ranges (e.g. moisture > 100%, tilt > 180°), quarantining the node at the database border.

### 🤖 3. Fully Autonomous Containment Loop
*   Once an attack is identified, the backend gateway blocks the attacker's IP and changes the sensor's status to `"isolated"`.
*   It responds to the attacking client with a `403 Forbidden: Node ISOLATED` signal.
*   The attacker simulator script (`mitm_attack.py`) intercepts this blocked state and **safely terminates execution autonomously (`sys.exit(0)`)**, simulating remote eradication of the hacker's server.
*   The gateway simultaneously broadcasts a `"BLOCKED"` MQTT signal to the Pi, triggering local strobe lights and buzzers.

### 🕒 4. Universal Browser Timezone Alignment (IST Conversion)
*   Solves the 5.5-hour UTC timezone drift. Telemetry is saved in standardized UTC globally. The frontend automatically parses naive datetimes and converts them dynamically to the **user's local browser timezone (e.g. Indian Standard Time - IST)**, ensuring real-time chart and log consistency.

---

## 📂 Codebase Structure

```
├── /backend
│   ├── /app
│   │   ├── /engines
│   │   │   ├── landslide_ai.py  # Random Forest ML predictor
│   │   │   └── security_ai.py   # 7-stage SIM security pipeline
│   │   ├── /routers
│   │   │   ├── sensors.py       # Listeners for edge telemetry
│   │   │   └── dashboard.py     # Stats, seeders, and manual recover routes
│   │   ├── models.py            # SQLite/PostgreSQL ORM schemas
│   │   └── main.py              # Application entry, MQTT setup, CORS
├── /frontend
│   ├── /src
│   │   ├── /pages
│   │   │   ├── Dashboard.jsx    # Real-time GAIA dials & alerts
│   │   │   ├── ThreatIntelligence.jsx # Dynamic Cyber Threat Topology Map
│   │   │   ├── NodeNetwork.jsx  # 5-node topology admin control
│   │   │   └── DataLake.jsx     # Telemetry database SQL query console
├── /pi-client
│   ├── real_pi_node.py          # Script for physical Raspberry Pi hardware
│   └── pi_node.py               # Edge socket connector script
├── /simulators
│   └── pi_node.py               # 5-node network simulation script
└── /attacker-simulator
    └── mitm_attack.py           # Self-terminating exploit simulator script
```

---

## 🚀 Installation & Setup Guide

### 1. Backend Setup (FastAPI)
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the local development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *   Swagger API docs will be available live at `http://126.0.0.1:8000/docs`.

### 2. Frontend Setup (React + Vite)
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Boot the local dashboard server:
   ```bash
   npm run dev
   ```
   *   Open your browser to the local address displayed (usually `http://localhost:5173`).

### 3. Running the Edge Raspberry Pi Node
If deploying on a physical Raspberry Pi:
1. Wire up the sensors (Moisture on Pin 17, Shake on Pin 27, PIR on Pin 22, Tamper switch on Pin 26, Strobe LEDs, passive buzzer, and RGB LCD).
2. Execute the edge client:
   ```bash
   python pi-client/real_pi_node.py
   ```

### 4. Running the Multi-Node Simulator
To test the 5-node enterprise setup without physical Pi hardware:
1. Run the simulator script:
   ```bash
   python simulators/pi_node.py
   ```

### 5. Running the Attacker Exploit Simulation
To test the autonomous SOAR defense loop:
1. Boot up the backend and frontend.
2. Run the attacker script:
   ```bash
   python attacker-simulator/mitm_attack.py
   ```
3. **Observe the Magic:** The script will launch the flooding/poisoning attack, the gateway will instantly isolate the target node, and the script will automatically disconnect and self-terminate. The frontend Threat Map will visually sever the connection path in real-time!

---

## 🏆 Project Accomplishments Summary
*   **100% Autonomous Remediation:** Remote exploits automatically cause targeted hacker scripts to disconnect and exit.
*   **IST Timezone Alignment:** Real-time logging matching the localized laptop clock.
*   **Scale-Up ready:** Fully handles a multi-node enterprise environment with modular status reporting.
*   **Interactive Visualizations:** Premium CSS/SVG Logical cyber threat mapping displaying active laser routes and isolated containment lines.
