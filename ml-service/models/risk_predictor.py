"""
Health Risk Prediction Model

Uses Random Forest multi-label classification to predict future disease risks
based on patient demographics, current diagnosis, vitals, and risk factors.
Also provides precautions and advice for each predicted risk.
"""

import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder, MultiLabelBinarizer, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "saved_models")

# ── Precautions & Advice Knowledge Base ─────────────────────────────────────

RISK_PRECAUTIONS = {
    "Heart Disease": {
        "precautions": [
            "Regular cardiac checkups every 6 months",
            "Monitor blood pressure daily",
            "Maintain cholesterol under 200 mg/dL",
            "Limit saturated fat and sodium intake",
        ],
        "advice": "Engage in 30 minutes of moderate exercise 5 days a week. Avoid smoking and limit alcohol.",
    },
    "Stroke": {
        "precautions": [
            "Keep blood pressure below 140/90 mmHg",
            "Take prescribed blood thinners regularly",
            "Monitor for warning signs (sudden numbness, confusion, trouble speaking)",
        ],
        "advice": "Manage stress, maintain healthy weight, and follow a Mediterranean diet.",
    },
    "Kidney Disease": {
        "precautions": [
            "Regular kidney function tests (creatinine, GFR)",
            "Limit salt intake to under 2g/day",
            "Stay well hydrated (8-10 glasses of water)",
            "Control blood sugar if diabetic",
        ],
        "advice": "Avoid NSAIDs (ibuprofen, diclofenac) without doctor supervision. Monitor urine changes.",
    },
    "Neuropathy": {
        "precautions": [
            "Strict blood sugar control (HbA1c < 7%)",
            "Daily foot inspection for cuts or sores",
            "Wear comfortable, well-fitting shoes",
        ],
        "advice": "Vitamin B12 supplementation may help. Report any numbness or tingling immediately.",
    },
    "Retinopathy": {
        "precautions": [
            "Annual dilated eye examination",
            "Strict blood sugar and blood pressure control",
            "Report any vision changes immediately",
        ],
        "advice": "Maintain HbA1c below 7%. Avoid smoking which worsens retinal damage.",
    },
    "COPD": {
        "precautions": [
            "Stop smoking immediately",
            "Annual lung function tests",
            "Get flu and pneumonia vaccinations",
            "Avoid air pollutants and chemical fumes",
        ],
        "advice": "Pulmonary rehabilitation can improve quality of life. Use inhalers as prescribed.",
    },
    "Pneumonia": {
        "precautions": [
            "Get annual flu vaccination",
            "Practice good hand hygiene",
            "Avoid close contact with sick individuals",
        ],
        "advice": "Strengthen immunity with adequate rest, nutrition, and exercise.",
    },
    "Depression": {
        "precautions": [
            "Regular mental health check-ins",
            "Maintain social connections",
            "Establish consistent sleep schedule",
            "Limit alcohol consumption",
        ],
        "advice": "Exercise releases endorphins and is as effective as medication for mild depression.",
    },
    "Anxiety": {
        "precautions": [
            "Practice daily relaxation techniques",
            "Limit caffeine intake",
            "Maintain regular sleep patterns",
        ],
        "advice": "Cognitive behavioral therapy (CBT) is highly effective. Consider mindfulness meditation.",
    },
    "Type 2 Diabetes": {
        "precautions": [
            "Monitor blood glucose regularly (fasting + post-meal)",
            "HbA1c test every 3 months",
            "Annual eye, kidney, and foot examinations",
            "Maintain BMI under 25",
        ],
        "advice": "Follow a low-glycemic diet. 150 minutes of moderate exercise per week reduces risk by 58%.",
    },
    "Hypertension": {
        "precautions": [
            "Monitor blood pressure twice daily",
            "Reduce sodium intake to under 1500mg/day",
            "Maintain healthy weight (BMI 18.5-24.9)",
            "Limit alcohol to 1 drink/day",
        ],
        "advice": "DASH diet significantly lowers blood pressure. Practice stress management techniques.",
    },
    "Peptic Ulcer": {
        "precautions": [
            "Avoid NSAIDs (ibuprofen, aspirin)",
            "Stop smoking",
            "Limit spicy and acidic foods",
            "Eat smaller, more frequent meals",
        ],
        "advice": "H. pylori testing recommended. Complete full course of prescribed antibiotics if positive.",
    },
    "Foot Ulcer": {
        "precautions": [
            "Daily foot inspection",
            "Keep feet clean and moisturized",
            "Never walk barefoot",
            "Trim toenails carefully",
        ],
        "advice": "Specialized diabetic footwear can prevent 50% of foot ulcers.",
    },
    "Osteoporosis": {
        "precautions": [
            "Calcium 1000-1200mg and Vitamin D 800IU daily",
            "Regular bone density scans after age 50",
            "Weight-bearing exercises 3-4 times/week",
        ],
        "advice": "Avoid smoking and excessive alcohol which weaken bones.",
    },
    "Insomnia": {
        "precautions": [
            "Maintain consistent sleep-wake schedule",
            "Avoid screens 1 hour before bed",
            "Limit caffeine after 2 PM",
        ],
        "advice": "Sleep hygiene and CBT-I are first-line treatments before medication.",
    },
    "Kidney Infection": {
        "precautions": [
            "Stay well hydrated",
            "Complete full antibiotic courses",
            "Urinate frequently, don't hold",
        ],
        "advice": "Seek immediate care for fever with back pain or blood in urine.",
    },
    "GERD": {
        "precautions": [
            "Avoid lying down within 3 hours of eating",
            "Elevate head of bed 6-8 inches",
            "Avoid trigger foods (spicy, fatty, acidic)",
        ],
        "advice": "Maintain healthy weight. Loose clothing can reduce abdominal pressure.",
    },
}

# Default precaution for unknown risks
DEFAULT_PRECAUTION = {
    "precautions": ["Regular health checkups", "Maintain healthy lifestyle", "Consult specialist if symptoms appear"],
    "advice": "Early detection improves outcomes. Stay vigilant about new symptoms.",
}


class HealthRiskPredictor:
    def __init__(self):
        self.models = {}          # one classifier per risk disease
        self.scaler = StandardScaler()
        self.disease_encoder = LabelEncoder()
        self.gender_encoder = LabelEncoder()
        self.blood_encoder = LabelEncoder()
        self.risk_factor_encoder = None
        self.all_risk_diseases = []
        self.is_trained = False
        self.accuracy_report = {}

    # ── Training ────────────────────────────────────────────────────────

    def train(self, df: pd.DataFrame):
        """Train risk prediction models."""
        # Identify all possible follow-up diagnoses
        all_followups = set()
        for val in df["follow_up_diagnosis"].dropna():
            if val and str(val).strip():
                all_followups.add(str(val).strip())
        self.all_risk_diseases = sorted(all_followups)

        if not self.all_risk_diseases:
            print("  WARNING: No follow-up diagnoses found in data")
            return

        # Encode features
        self.disease_encoder.fit(df["disease"])
        self.gender_encoder.fit(df["gender"])
        self.blood_encoder.fit(df["blood_group"])

        # Parse risk factors into binary columns
        all_rf = set()
        for val in df["risk_factors"].dropna():
            for rf in str(val).split("|"):
                if rf.strip():
                    all_rf.add(rf.strip())
        self.all_risk_factors = sorted(all_rf)

        # Build feature matrix
        X = self._build_features(df)
        self.scaler.fit(X)
        X_scaled = self.scaler.transform(X)

        # Train a binary classifier for each risk disease
        for risk_disease in self.all_risk_diseases:
            y = (df["follow_up_diagnosis"].fillna("") == risk_disease).astype(int)
            positive_count = y.sum()

            if positive_count < 5:
                continue  # skip diseases with too few examples

            # Use Gradient Boosting for better accuracy
            clf = GradientBoostingClassifier(
                n_estimators=100, max_depth=4, learning_rate=0.1,
                random_state=42, min_samples_leaf=5
            )

            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y, test_size=0.2, random_state=42, stratify=y
            )

            clf.fit(X_train, y_train)
            accuracy = clf.score(X_test, y_test)
            self.models[risk_disease] = clf
            self.accuracy_report[risk_disease] = round(accuracy * 100, 1)

        self.is_trained = True
        print(f"  Risk Predictor trained for {len(self.models)} conditions")
        for disease, acc in self.accuracy_report.items():
            print(f"    {disease}: {acc}% accuracy")

    def _build_features(self, data):
        """Build numeric feature matrix."""
        disease_encoded = self.disease_encoder.transform(data["disease"])
        gender_encoded = self.gender_encoder.transform(data["gender"])
        blood_encoded = self.blood_encoder.transform(data["blood_group"])

        # Risk factor binary columns
        rf_matrix = np.zeros((len(data), len(self.all_risk_factors)))
        for idx, val in enumerate(data["risk_factors"].fillna("")):
            patient_rfs = set(str(val).split("|"))
            for j, rf in enumerate(self.all_risk_factors):
                if rf in patient_rfs:
                    rf_matrix[idx, j] = 1

        features = np.column_stack([
            disease_encoded,
            data["age"].values,
            gender_encoded,
            blood_encoded,
            data["bp_systolic"].values,
            data["bp_diastolic"].values,
            data["heart_rate"].values,
            data["temperature"].values,
            data["spo2"].values,
            (data["severity"] == "SEVERE").astype(int).values,
            (data["severity"] == "MODERATE").astype(int).values,
            data["is_chronic"].astype(int).values,
            rf_matrix,
        ])
        return features.astype(float)

    # ── Prediction ──────────────────────────────────────────────────────

    def predict_risks(self, patient_history: list, current_age: int,
                      gender: str, blood_group: str = "O+") -> dict:
        """
        Predict health risks for a patient based on their medical history.

        patient_history: list of dicts with keys:
            disease, severity, bp_systolic, bp_diastolic, heart_rate,
            temperature, spo2, risk_factors, is_chronic
        """
        if not self.is_trained or not self.models:
            return {"error": "Model not trained yet", "risks": []}

        # Aggregate patient history into a single feature vector
        agg = self._aggregate_history(patient_history, current_age, gender, blood_group)
        if agg is None:
            return {"risks": [], "message": "Could not process patient history"}

        X = self.scaler.transform([agg])

        risks = []
        for disease, clf in self.models.items():
            proba = clf.predict_proba(X)
            # Get probability of positive class
            if len(proba[0]) > 1:
                risk_prob = proba[0][1]
            else:
                risk_prob = 0.0

            if risk_prob > 0.05:  # only include non-trivial risks
                level = "LOW"
                if risk_prob > 0.4:
                    level = "HIGH"
                elif risk_prob > 0.2:
                    level = "MODERATE"

                precaution_info = RISK_PRECAUTIONS.get(disease, DEFAULT_PRECAUTION)
                risks.append({
                    "disease": disease,
                    "probability": round(risk_prob * 100, 1),
                    "risk_level": level,
                    "precautions": precaution_info["precautions"],
                    "advice": precaution_info["advice"],
                })

        # Sort by probability descending
        risks.sort(key=lambda x: -x["probability"])

        return {
            "risks": risks,
            "patient_age": current_age,
            "patient_gender": gender,
            "history_records_analyzed": len(patient_history),
        }

    def _aggregate_history(self, history, age, gender, blood_group):
        """Convert patient history list into a single feature vector."""
        if not history:
            return None

        # Use the most recent record's disease as primary
        latest = history[0]

        disease = latest.get("disease", "")
        if disease not in self.disease_encoder.classes_:
            # Try fuzzy
            for d in self.disease_encoder.classes_:
                if disease.lower() in d.lower() or d.lower() in disease.lower():
                    disease = d
                    break
            else:
                disease = self.disease_encoder.classes_[0]

        gender_val = gender if gender in self.gender_encoder.classes_ else self.gender_encoder.classes_[0]
        blood_val = blood_group if blood_group in self.blood_encoder.classes_ else self.blood_encoder.classes_[0]

        # Average vitals across history
        avg_bp_s = np.mean([h.get("bp_systolic", 120) for h in history])
        avg_bp_d = np.mean([h.get("bp_diastolic", 80) for h in history])
        avg_hr = np.mean([h.get("heart_rate", 80) for h in history])
        avg_temp = np.mean([h.get("temperature", 98.6) for h in history])
        avg_spo2 = np.mean([h.get("spo2", 97) for h in history])

        # Aggregate risk factors across history
        all_rfs = set()
        has_severe = False
        has_moderate = False
        has_chronic = False
        for h in history:
            for rf in str(h.get("risk_factors", "")).split("|"):
                if rf.strip():
                    all_rfs.add(rf.strip())
            if h.get("severity") == "SEVERE":
                has_severe = True
            if h.get("severity") == "MODERATE":
                has_moderate = True
            if h.get("is_chronic"):
                has_chronic = True

        rf_vec = [1 if rf in all_rfs else 0 for rf in self.all_risk_factors]

        feature_vec = [
            self.disease_encoder.transform([disease])[0],
            age,
            self.gender_encoder.transform([gender_val])[0],
            self.blood_encoder.transform([blood_val])[0],
            avg_bp_s, avg_bp_d, avg_hr, avg_temp, avg_spo2,
            int(has_severe), int(has_moderate), int(has_chronic),
            *rf_vec,
        ]
        return feature_vec

    # ── Persistence ─────────────────────────────────────────────────────

    def save(self, path=None):
        if path is None:
            path = os.path.join(MODEL_DIR, "risk_predictor.joblib")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump(self, path)
        print(f"  Risk Predictor saved → {path}")

    @staticmethod
    def load(path=None):
        if path is None:
            path = os.path.join(MODEL_DIR, "risk_predictor.joblib")
        model = joblib.load(path)
        print(f"  Risk Predictor loaded ← {path}")
        return model
