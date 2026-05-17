import os
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib

MODEL_PATH = "landslide_model.joblib"
_model = None

def _train_initial_model():
    """Trains a synthetic dataset if no model exists."""
    print("[SYS] Training Predictive AI Model (Random Forest)...")
    
    # Synthetic Dataset: [moisture, shake, tilt, temperature]
    X = np.array([
        [20, 0, 0, 25],  # Safe
        [30, 0, 1, 26],  # Safe
        [40, 1, 2, 24],  # Safe
        [60, 2, 5, 22],  # Warning (High moisture, slight tilt)
        [65, 3, 6, 21],  # Warning
        [85, 6, 15, 20], # Landslide Risk (Very wet, shaking, tilted)
        [90, 8, 20, 18], # Landslide Risk
        [95, 10, 25, 17] # Landslide Risk
    ])
    
    # Labels: 0 = SAFE, 1 = WARNING, 2 = LANDSLIDE RISK
    y = np.array([0, 0, 0, 1, 1, 2, 2, 2])
    
    clf = RandomForestClassifier(n_estimators=50, random_state=42)
    clf.fit(X, y)
    
    joblib.dump(clf, MODEL_PATH)
    print(f"[SYS] Predictive AI Model saved to {MODEL_PATH}")
    return clf

def _get_model():
    global _model
    if _model is None:
        if os.path.exists(MODEL_PATH):
            _model = joblib.load(MODEL_PATH)
        else:
            _model = _train_initial_model()
    return _model

def analyze_landslide_risk(moisture: float, shake: int, tilt: float, temperature: float = 25.0):
    """
    Analyzes sensor data using a trained Machine Learning model.
    """
    model = _get_model()
    
    # Prepare feature vector
    X_input = np.array([[moisture, shake, abs(tilt), temperature]])
    
    # Predict probabilities for each class (0: SAFE, 1: WARNING, 2: DANGER)
    probs = model.predict_proba(X_input)[0]
    
    # Calculate a risk score (0-100) based on weighted probabilities
    # 0 class gets 0 weight, 1 class gets 50, 2 class gets 100
    risk_score = (probs[1] * 50) + (probs[2] * 100)
    
    # Cap score
    risk_score = min(max(risk_score, 0.0), 100.0)
    
    prediction = model.predict(X_input)[0]
    
    if prediction == 2:
        severity = "LANDSLIDE RISK"
        ai_action = "Triggering Evacuation Alarms, Dispatching Emergency Services"
    elif prediction == 1:
        severity = "WARNING"
        ai_action = "Increasing Telemetry Frequency, Alerting Local Authorities"
    else:
        severity = "SAFE"
        ai_action = "Monitoring Normal"
        
    return risk_score, severity, ai_action
