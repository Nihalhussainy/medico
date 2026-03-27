"""
Health Risk Prediction Model with SHAP Explainability

Uses Gradient Boosting classification to predict future disease risks
based on patient demographics, current diagnosis, vitals, and risk factors.
Also provides precautions, advice, and SHAP-based explanations for each prediction.
"""

import os
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.calibration import CalibratedClassifierCV
import joblib
shap = None

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
    "Anxiety Disorder": {
        "precautions": [
            "Practice daily relaxation and breathing exercises",
            "Limit caffeine and stimulant intake",
            "Maintain consistent sleep schedule",
            "Engage in regular physical activity",
        ],
        "advice": "CBT is the gold standard treatment. Mindfulness meditation reduces symptoms by 30-40%.",
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
    # ─── EXPANDED PRECAUTIONS ─────────────────────────────────────
    "Coronary Artery Disease": {
        "precautions": [
            "Take Aspirin and Statin as prescribed daily",
            "Regular stress tests and ECGs",
            "Monitor cholesterol and triglycerides every 3 months",
            "Avoid strenuous exertion without medical clearance",
        ],
        "advice": "Cardiac rehabilitation improves survival by 20-25%. Follow Mediterranean diet strictly.",
    },
    "Heart Failure": {
        "precautions": [
            "Weigh yourself daily — report 2+ lb gain in 24 hours",
            "Limit fluid intake to 1.5-2 liters/day",
            "Restrict sodium to under 2g/day",
            "Take all medications exactly as prescribed",
        ],
        "advice": "Avoid NSAIDs which worsen fluid retention. Report increased shortness of breath immediately.",
    },
    "Heart Failure (CHF)": {
        "precautions": [
            "Daily weight monitoring — notify doctor for >1kg gain overnight",
            "Strict sodium restriction (<2g/day)",
            "Fluid restriction (1.5-2L/day)",
            "Never miss doses of heart failure medications",
        ],
        "advice": "Cardiac rehabilitation significantly improves exercise tolerance and quality of life.",
    },
    "Atrial Fibrillation": {
        "precautions": [
            "Take anticoagulant medication on time daily",
            "Check pulse regularly for irregularity",
            "Monitor INR if on Warfarin (target 2-3)",
            "Report any unusual bleeding immediately",
        ],
        "advice": "Avoid excessive caffeine and alcohol which trigger episodes. Maintain healthy weight.",
    },
    "Hyperlipidemia": {
        "precautions": [
            "Annual lipid panel testing",
            "Take statins at bedtime for maximum effect",
            "Reduce saturated fat intake to <7% of calories",
            "Limit dietary cholesterol to <200mg/day",
        ],
        "advice": "Omega-3 fatty acids (fish oil) lower triglycerides. Exercise 150 min/week raises HDL.",
    },
    "Bronchitis": {
        "precautions": [
            "Avoid smoking and secondhand smoke",
            "Practice good respiratory hygiene",
            "Complete prescribed antibiotics if bacterial",
        ],
        "advice": "Stay well-hydrated. Use humidifier for symptom relief. Get annual flu vaccine.",
    },
    "Asthma": {
        "precautions": [
            "Always carry rescue inhaler",
            "Identify and avoid personal triggers",
            "Use peak flow meter to monitor control",
            "Get annual flu vaccination",
        ],
        "advice": "Preventive inhalers must be used daily even when feeling well. Avoid cold air exposure.",
    },
    "Liver Damage": {
        "precautions": [
            "Complete alcohol abstinence",
            "Avoid Paracetamol (use alternatives)",
            "Regular liver function tests every 3 months",
            "Hepatitis vaccination if not immune",
        ],
        "advice": "High-protein diet supports liver regeneration. Silymarin (milk thistle) may help.",
    },
    "Liver Cirrhosis": {
        "precautions": [
            "Absolute alcohol abstinence",
            "Regular liver ultrasound every 6 months",
            "Monitor for signs of portal hypertension",
            "Hepatitis B/C screening and treatment",
        ],
        "advice": "Low-sodium diet prevents ascites. Protein intake 1-1.5g/kg/day unless encephalopathy present.",
    },
    "Kidney Stones": {
        "precautions": [
            "Drink 2.5-3 liters of water daily",
            "Limit oxalate-rich foods (spinach, nuts, chocolate)",
            "Reduce sodium intake",
            "Moderate protein consumption",
        ],
        "advice": "Lemon juice (citrate) helps prevent calcium stones. 24-hour urine analysis guides prevention.",
    },
    "Sinusitis": {
        "precautions": [
            "Use saline nasal irrigation daily",
            "Avoid allergens and irritants",
            "Treat underlying allergies",
        ],
        "advice": "Steam inhalation helps drainage. Complete antibiotic courses to prevent chronic sinusitis.",
    },
    "Chronic Sinusitis": {
        "precautions": [
            "Daily saline nasal rinse",
            "Allergy testing and treatment",
            "Avoid smoking and air pollutants",
            "Consider nasal corticosteroid spray long-term",
        ],
        "advice": "ENT referral if symptoms persist >12 weeks. Surgery may be needed for structural issues.",
    },
    "IBS": {
        "precautions": [
            "Identify trigger foods (keep food diary)",
            "Eat regular, smaller meals",
            "Manage stress through relaxation techniques",
            "Increase soluble fiber gradually",
        ],
        "advice": "Low FODMAP diet reduces symptoms in 70% of patients. Probiotics may help.",
    },
    "Barrett's Esophagus": {
        "precautions": [
            "Endoscopy surveillance every 1-3 years",
            "Continue PPI therapy as prescribed",
            "Aggressive GERD management",
        ],
        "advice": "Small but real cancer risk — regular surveillance is essential.",
    },
    "Sepsis": {
        "precautions": [
            "Seek immediate emergency care for suspected infection with confusion/rapid breathing",
            "Complete all prescribed antibiotic courses",
            "Vaccinations as recommended",
        ],
        "advice": "Early recognition saves lives. Remember TIME: Temperature, Infection, Mental decline, Extremely ill.",
    },
    "Anemia": {
        "precautions": [
            "Regular CBC blood tests",
            "Iron-rich diet (red meat, spinach, lentils, fortified cereals)",
            "Vitamin C with iron supplements to boost absorption",
            "Avoid tea/coffee with meals (inhibits iron absorption)",
        ],
        "advice": "Identify and treat underlying cause. B12 and folate levels should also be checked.",
    },
    "Dehydration": {
        "precautions": [
            "Drink at least 2-3 liters of fluids daily",
            "Monitor urine color (pale yellow = hydrated)",
            "Use ORS during illness",
            "Increase fluids during hot weather and exercise",
        ],
        "advice": "Watermelon, cucumber, and soups count toward fluid intake. Avoid sugary drinks.",
    },
    "Lung Fibrosis": {
        "precautions": [
            "Avoid respiratory irritants and dust",
            "Oxygen therapy as prescribed",
            "Pulmonary rehabilitation program",
            "Annual flu and pneumonia vaccination",
        ],
        "advice": "Early referral to lung transplant center if progressive. Anti-fibrotic drugs may slow progression.",
    },
    "Lung Cancer": {
        "precautions": [
            "Annual low-dose CT scan if high-risk",
            "Immediate smoking cessation",
            "Avoid occupational carcinogens (asbestos, radon)",
        ],
        "advice": "Early detection dramatically improves survival. Report persistent cough or hemoptysis.",
    },
    "Gastric Cancer": {
        "precautions": [
            "H. pylori eradication if positive",
            "Endoscopic surveillance for high-risk patients",
            "Reduce processed/smoked food consumption",
        ],
        "advice": "Fresh fruits and vegetables are protective. Report unexplained weight loss early.",
    },
    "Disc Herniation": {
        "precautions": [
            "Avoid heavy lifting and bending",
            "Core strengthening exercises",
            "Maintain good posture",
            "Ergonomic workplace setup",
        ],
        "advice": "Physical therapy is effective in 80% of cases without surgery. Swimming is ideal exercise.",
    },
    "Sciatica": {
        "precautions": [
            "Avoid prolonged sitting",
            "Gentle stretching exercises daily",
            "Apply ice/heat alternately for pain",
            "Strengthen core muscles",
        ],
        "advice": "Most cases resolve in 6-12 weeks. Seek urgent care if bladder/bowel control is affected.",
    },
    "Chronic Pain Syndrome": {
        "precautions": [
            "Multidisciplinary pain management approach",
            "Regular physical therapy",
            "Psychological support (CBT for pain)",
            "Avoid opioid dependence",
        ],
        "advice": "Mindfulness-based stress reduction reduces chronic pain by 30-40%. Stay active within limits.",
    },
    "Cognitive Decline": {
        "precautions": [
            "Mental stimulation (puzzles, reading, learning)",
            "Regular physical exercise",
            "Social engagement",
            "Mediterranean diet",
        ],
        "advice": "Control cardiovascular risk factors — they are linked to 40% of dementia cases.",
    },
    "Substance Abuse": {
        "precautions": [
            "Seek professional addiction counseling",
            "Support groups (AA, NA) attendance",
            "Remove access to substances",
            "Address underlying mental health issues",
        ],
        "advice": "Recovery is possible. Medication-assisted treatment improves success rates significantly.",
    },
    "Postpartum Depression": {
        "precautions": [
            "Screen with Edinburgh Postnatal Depression Scale",
            "Ensure adequate sleep and support",
            "Maintain social connections",
        ],
        "advice": "Affects 1 in 7 mothers. Early treatment with therapy/medication is highly effective.",
    },
    "Shingles": {
        "precautions": [
            "Shingrix vaccine for adults >50",
            "Keep rash clean and covered",
            "Avoid contact with immunocompromised individuals",
        ],
        "advice": "Early antiviral treatment (within 72 hours) reduces postherpetic neuralgia risk.",
    },
    "Hip Fracture": {
        "precautions": [
            "Fall prevention — remove tripping hazards at home",
            "Bone density screening",
            "Calcium and Vitamin D supplementation",
            "Balance and strength exercises",
        ],
        "advice": "Hip protectors reduce fracture risk in high-risk elderly. Post-surgery rehab is critical.",
    },
    "Vertebral Fracture": {
        "precautions": [
            "Avoid heavy lifting and twisting",
            "Bone density treatment (bisphosphonates)",
            "Fall prevention measures",
        ],
        "advice": "Back braces may help during healing. Physical therapy restores function.",
    },
    "Pulmonary Edema": {
        "precautions": [
            "Strict fluid and sodium restriction",
            "Take diuretics exactly as prescribed",
            "Seek emergency care for sudden breathlessness",
        ],
        "advice": "Sleep with head elevated. Monitor weight daily for fluid accumulation signs.",
    },
    "GI Bleeding": {
        "precautions": [
            "Avoid NSAIDs and Aspirin (unless cardiologist-prescribed)",
            "Seek emergency care for black/bloody stools",
            "Use PPIs if on anticoagulants",
        ],
        "advice": "Iron supplementation may be needed. Endoscopy can identify and treat the bleeding source.",
    },
    "Esophageal Stricture": {
        "precautions": [
            "Aggressive GERD treatment with PPIs",
            "Eat slowly and chew thoroughly",
            "Report progressive difficulty swallowing",
        ],
        "advice": "Endoscopic dilation is safe and effective. Maintain lifelong PPI therapy.",
    },
    "Syncope": {
        "precautions": [
            "Avoid prolonged standing",
            "Increase salt and fluid intake if appropriate",
            "Rise slowly from sitting/lying position",
        ],
        "advice": "Tilt-table testing can identify the cause. Counter-pressure maneuvers prevent episodes.",
    },
    "Obesity": {
        "precautions": [
            "Caloric deficit of 500-750 kcal/day for safe weight loss",
            "Regular physical activity (150-300 min/week)",
            "Behavioral counseling",
            "Avoid crash diets",
        ],
        "advice": "Even 5-10% weight loss dramatically improves metabolic health. Structured programs work best.",
    },
    "Liver Disease (Fatty Liver / NAFLD)": {
        "precautions": [
            "Weight loss of 7-10% reduces liver fat by 80%",
            "Avoid alcohol completely",
            "Regular liver enzyme monitoring",
            "Control diabetes and cholesterol",
        ],
        "advice": "There is no approved drug for NAFLD. Lifestyle changes are the primary treatment.",
    },
    "Intestinal Perforation": {
        "precautions": [
            "Seek immediate emergency care for sudden severe abdominal pain",
            "Post-surgical wound care and monitoring",
            "Gradual return to normal diet",
        ],
        "advice": "This is a surgical emergency. Early diagnosis and treatment saves lives.",
    },
    "Eczema": {
        "precautions": [
            "Moisturize 2-3 times daily with fragrance-free emollients",
            "Avoid harsh soaps and detergents",
            "Identify and avoid triggers",
            "Keep nails short to prevent scratching damage",
        ],
        "advice": "Cotton clothing is least irritating. Wet wrap therapy helps severe flares.",
    },
    "Falls/Fractures": {
        "precautions": [
            "Remove home hazards (loose rugs, poor lighting)",
            "Balance and strength exercises",
            "Vision correction and hearing aids if needed",
            "Review medications that cause dizziness",
        ],
        "advice": "Tai Chi reduces fall risk by 40% in elderly. Install grab bars in bathroom.",
    },
}

# Default precaution for unknown risks
DEFAULT_PRECAUTION = {
    "precautions": ["Regular health checkups", "Maintain healthy lifestyle", "Consult specialist if symptoms appear"],
    "advice": "Early detection improves outcomes. Stay vigilant about new symptoms.",
}


class HealthRiskPredictor:
    def set_algorithm(self, algorithm="gb"):
        """Set the algorithm for risk prediction: 'gb', 'random_forest', or 'xgboost'."""
        self.algorithm = algorithm

    def __init__(self):
        self.models = {}          # one classifier per risk disease
        self.explainers = {}      # SHAP explainer per model
        self.scaler = StandardScaler()
        self.disease_encoder = LabelEncoder()
        self.gender_encoder = LabelEncoder()
        self.blood_encoder = LabelEncoder()
        self.risk_factor_encoder = None
        self.all_risk_diseases = []
        self.all_risk_factors = []
        self.feature_names = []   # human-readable feature names for SHAP
        self.is_trained = False
        self.accuracy_report = {}
        self.df = None
        self.algorithm = "gb"
        self.feedback_log = []
        self.feedback_retrain_threshold = 25
        self.followup_transition = {}
        self.risk_factor_transition = {}

    def _get_shap_module(self):
        """Lazy-load SHAP so service startup is fast when explainability is not used yet."""
        global shap
        if shap is not None:
            return shap
        try:
            import shap as shap_module  # type: ignore[import-not-found]
            shap = shap_module
        except Exception:
            shap = None
        return shap

    # ── Training ────────────────────────────────────────────────────────

    def train(self, df: pd.DataFrame, algorithm="gb"):
        """Train risk prediction models with SHAP explainability."""
        self.df = df.copy()
        self.models = {}
        self.explainers = {}
        self.accuracy_report = {}
        self.followup_transition = {}
        self.risk_factor_transition = {}

        # Identify all possible follow-up diagnoses
        all_followups = set()
        for val in df["follow_up_diagnosis"].dropna():
            if val and str(val).strip():
                all_followups.add(str(val).strip())
        self.all_risk_diseases = sorted(all_followups)

        self.set_algorithm(algorithm)

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

        # Learn prior transition probabilities to improve relevance at inference time.
        self._build_transition_priors(df)

        # Build human-readable feature names for SHAP
        self._build_feature_names()

        # Build feature matrix
        X = self._build_features(df)
        self.scaler.fit(X)
        X_scaled = self.scaler.transform(X)

        # Train a binary classifier for each risk disease
        print(f"  Training models for {len(self.all_risk_diseases)} conditions...")
        for risk_disease in self.all_risk_diseases:
            y = (df["follow_up_diagnosis"].fillna("") == risk_disease).astype(int)
            positive_count = y.sum()

            if positive_count < 5:
                continue  # skip diseases with too few examples

            # Select algorithm
            if self.algorithm == "random_forest":
                try:
                    from sklearn.ensemble import RandomForestClassifier
                    base_clf = RandomForestClassifier(n_estimators=100, random_state=42)
                except ImportError:
                    print("RandomForestClassifier not available. Falling back to Gradient Boosting.")
                    base_clf = GradientBoostingClassifier(n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42, min_samples_leaf=5)
            elif self.algorithm == "xgboost":
                try:
                    import xgboost as xgb  # type: ignore[import-not-found]
                    base_clf = xgb.XGBClassifier(n_estimators=100, random_state=42, use_label_encoder=False, eval_metric='logloss')
                except ImportError:
                    print("XGBoost not available. Falling back to Gradient Boosting.")
                    base_clf = GradientBoostingClassifier(n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42, min_samples_leaf=5)
            else:
                base_clf = GradientBoostingClassifier(n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42, min_samples_leaf=5)

            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y, test_size=0.2, random_state=42, stratify=y
            )

            # Calibrate the classifier for better probability estimates
            try:
                clf = CalibratedClassifierCV(base_clf, method='isotonic', cv=3)
                clf.fit(X_train, y_train)
            except Exception:
                # Some classifiers (e.g., XGBoost) may not support calibration
                clf = base_clf
                clf.fit(X_train, y_train)

            accuracy = clf.score(X_test, y_test)
            self.models[risk_disease] = clf
            self.accuracy_report[risk_disease] = round(accuracy * 100, 1)

            # Create SHAP explainer using the base estimator
            try:
                if hasattr(clf, 'calibrated_classifiers_'):
                    base_estimator = clf.calibrated_classifiers_[0].estimator
                else:
                    base_estimator = clf
                shap_module = self._get_shap_module()
                if shap_module is not None:
                    self.explainers[risk_disease] = shap_module.TreeExplainer(base_estimator)
            except Exception as e:
                print(f"    Warning: Could not create SHAP explainer for {risk_disease}: {e}")

        self.is_trained = True
        print(f"  Risk Predictor trained for {len(self.models)} conditions")
        print(f"  SHAP explainers created for {len(self.explainers)} conditions")
        for disease, acc in list(self.accuracy_report.items())[:5]:
            print(f"    {disease}: {acc}% accuracy")
        if len(self.accuracy_report) > 5:
            print(f"    ... and {len(self.accuracy_report) - 5} more conditions")

    def _ensure_transition_priors(self):
        """Backfill transition priors for models loaded from older joblib snapshots."""
        if not hasattr(self, "followup_transition") or self.followup_transition is None:
            self.followup_transition = {}
        if not hasattr(self, "risk_factor_transition") or self.risk_factor_transition is None:
            self.risk_factor_transition = {}

        if (not self.followup_transition or not self.risk_factor_transition) and self.df is not None:
            try:
                self._build_transition_priors(self.df)
            except Exception:
                # Keep prediction available even if prior extraction fails.
                self.followup_transition = self.followup_transition or {}
                self.risk_factor_transition = self.risk_factor_transition or {}

    def _build_transition_priors(self, df: pd.DataFrame):
        """Build disease->followup and risk-factor->followup priors from training data."""
        valid = df[df["follow_up_diagnosis"].notna() & (df["follow_up_diagnosis"].astype(str).str.strip() != "")].copy()
        if valid.empty:
            return

        # Disease transition priors: P(follow_up | primary disease)
        for disease, grp in valid.groupby("disease"):
            total = len(grp)
            counts = grp["follow_up_diagnosis"].value_counts()
            self.followup_transition[disease] = {
                followup: float(count / total)
                for followup, count in counts.items()
            }

        # Risk-factor priors: P(follow_up | risk factor)
        rf_counts = {}
        rf_totals = {}
        for _, row in valid.iterrows():
            follow = str(row["follow_up_diagnosis"]).strip()
            factors = [f.strip() for f in str(row.get("risk_factors", "")).split("|") if f.strip()]
            for rf in factors:
                rf_totals[rf] = rf_totals.get(rf, 0) + 1
                key = (rf, follow)
                rf_counts[key] = rf_counts.get(key, 0) + 1

        for rf, total in rf_totals.items():
            transitions = {}
            for (rf_name, follow), cnt in rf_counts.items():
                if rf_name == rf:
                    transitions[follow] = float(cnt / total)
            if transitions:
                self.risk_factor_transition[rf] = transitions

    def online_update(self, new_records):
        """Append newly observed records and retrain risk models."""
        if new_records is None:
            return {"updated": False, "message": "No new records provided"}

        if isinstance(new_records, list):
            new_df = pd.DataFrame(new_records)
        elif isinstance(new_records, pd.DataFrame):
            new_df = new_records.copy()
        else:
            return {"updated": False, "message": "new_records must be list or DataFrame"}

        required_cols = [
            "disease", "age", "gender", "blood_group", "bp_systolic", "bp_diastolic",
            "heart_rate", "temperature", "spo2", "severity", "is_chronic",
            "risk_factors", "follow_up_diagnosis"
        ]
        missing = [c for c in required_cols if c not in new_df.columns]
        if missing:
            return {"updated": False, "message": f"Missing columns for online update: {missing}"}

        if self.df is None:
            merged = new_df
        else:
            merged = pd.concat([self.df, new_df], ignore_index=True)

        self.train(merged, algorithm=self.algorithm)
        return {"updated": True, "new_records": len(new_df), "total_records": len(merged)}

    def add_feedback(self, patient_snapshot: dict, realized_diagnosis: str):
        """Store follow-up diagnosis feedback and periodically retrain."""
        entry = {
            "disease": patient_snapshot.get("disease", ""),
            "age": patient_snapshot.get("age", 40),
            "gender": patient_snapshot.get("gender", "Male"),
            "blood_group": patient_snapshot.get("blood_group", "O+"),
            "bp_systolic": patient_snapshot.get("bp_systolic", 130),
            "bp_diastolic": patient_snapshot.get("bp_diastolic", 80),
            "heart_rate": patient_snapshot.get("heart_rate", 80),
            "temperature": patient_snapshot.get("temperature", 98.6),
            "spo2": patient_snapshot.get("spo2", 97),
            "severity": patient_snapshot.get("severity", "MODERATE"),
            "is_chronic": bool(patient_snapshot.get("is_chronic", False)),
            "risk_factors": patient_snapshot.get("risk_factors", ""),
            "follow_up_diagnosis": realized_diagnosis,
        }
        self.feedback_log.append(entry)

        if len(self.feedback_log) >= self.feedback_retrain_threshold:
            consumed = len(self.feedback_log)
            self.online_update(self.feedback_log)
            self.feedback_log = []
            return {
                "feedback_saved": True,
                "retrained": True,
                "consumed_feedback_count": consumed,
            }

        return {
            "feedback_saved": True,
            "retrained": False,
            "pending_feedback_count": len(self.feedback_log),
            "retrain_threshold": self.feedback_retrain_threshold,
        }

    def _build_feature_names(self):
        """Build human-readable feature names for SHAP explanations."""
        self.feature_names = [
            "Primary Diagnosis",
            "Age",
            "Gender",
            "Blood Group",
            "Systolic BP",
            "Diastolic BP",
            "Heart Rate",
            "Temperature",
            "SpO2 Level",
            "Severe Condition",
            "Moderate Condition",
            "Chronic Condition",
        ]
        # Add risk factor names
        for rf in self.all_risk_factors:
            self.feature_names.append(rf)

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

    def _severity_weight(self, severity: str) -> float:
        sev = str(severity or "MODERATE").upper()
        if sev == "SEVERE":
            return 1.6
        if sev == "MILD":
            return 0.9
        return 1.2

    def _history_model_probability(self, disease: str, clf, history: list, current_age: int,
                                   gender: str, blood_group: str) -> float:
        """Estimate model probability using all history records with severity/chronic weighting."""
        if not history:
            return 0.0

        weighted_sum = 0.0
        total_weight = 0.0

        # Use up to the last 20 records to keep inference responsive.
        for h in history[:20]:
            vec = self._aggregate_history([h], current_age, gender, blood_group)
            if vec is None:
                continue

            x_scaled = self.scaler.transform([vec])
            proba = clf.predict_proba(x_scaled)
            p = proba[0][1] if len(proba[0]) > 1 else 0.0

            w = self._severity_weight(h.get("severity", "MODERATE"))
            if h.get("is_chronic"):
                w += 0.3

            weighted_sum += float(p) * w
            total_weight += w

        if total_weight <= 0:
            return 0.0
        return float(weighted_sum / total_weight)

    # ── Prediction ──────────────────────────────────────────────────────

    def predict_risks(self, patient_history: list, current_age: int,
                      gender: str, blood_group: str = "O+") -> dict:
        """
        Predict health risks for a patient based on their medical history.
        Returns predictions with SHAP-based explanations.

        patient_history: list of dicts with keys:
            disease, severity, bp_systolic, bp_diastolic, heart_rate,
            temperature, spo2, risk_factors, is_chronic
        """
        if not self.is_trained or not self.models:
            return {"error": "Model not trained yet", "risks": []}

        self._ensure_transition_priors()

        # Aggregate patient history into a single feature vector
        agg = self._aggregate_history(patient_history, current_age, gender, blood_group)
        if agg is None:
            return {"risks": [], "message": "Could not process patient history"}

        X_scaled = self.scaler.transform([agg])
        X_unscaled = np.array([agg])  # Keep unscaled for SHAP

        # Context used for relevance-aware filtering
        history_diseases = {str(h.get("disease", "")).strip() for h in patient_history if str(h.get("disease", "")).strip()}
        history_rf = set()
        for h in patient_history:
            for rf in str(h.get("risk_factors", "")).split("|"):
                rf = rf.strip()
                if rf:
                    history_rf.add(rf)

        risks = []
        for disease, clf in self.models.items():
            proba = clf.predict_proba(X_scaled)
            # Aggregate-history probability
            agg_prob = proba[0][1] if len(proba[0]) > 1 else 0.0
            # Per-record weighted probability (uses full history signal)
            hist_prob = self._history_model_probability(
                disease=disease,
                clf=clf,
                history=patient_history,
                current_age=current_age,
                gender=gender,
                blood_group=blood_group,
            )
            # Blend both so risk reflects complete longitudinal history.
            risk_prob = (0.65 * float(agg_prob)) + (0.35 * float(hist_prob))

            # Relevance from observed transitions in training data
            disease_relevance = 0.0
            for hd in history_diseases:
                disease_relevance = max(
                    disease_relevance,
                    self.followup_transition.get(hd, {}).get(disease, 0.0),
                )

            rf_relevance = 0.0
            for rf in history_rf:
                rf_relevance = max(
                    rf_relevance,
                    self.risk_factor_transition.get(rf, {}).get(disease, 0.0),
                )

            prior_relevance = max(disease_relevance, rf_relevance)

            # Blend model confidence with learned clinical transition relevance.
            adjusted_prob = (0.75 * float(risk_prob)) + (0.25 * float(prior_relevance))

            # Filter noisy unrelated candidates while keeping strong model signals.
            if adjusted_prob > 0.12 and (prior_relevance >= 0.03 or risk_prob >= 0.35):
                level = "LOW"
                if adjusted_prob > 0.4:
                    level = "HIGH"
                elif adjusted_prob > 0.2:
                    level = "MODERATE"

                precaution_info = RISK_PRECAUTIONS.get(disease, DEFAULT_PRECAUTION)

                # Get SHAP-based top contributing factors
                top_factors = self._get_shap_factors(disease, X_unscaled, top_n=5)

                risks.append({
                    "disease": disease,
                    "probability": round(adjusted_prob * 100, 1),
                    "model_probability": round(float(risk_prob) * 100, 1),
                    "aggregate_model_probability": round(float(agg_prob) * 100, 1),
                    "history_model_probability": round(float(hist_prob) * 100, 1),
                    "relevance_score": round(float(prior_relevance) * 100, 1),
                    "risk_level": level,
                    "confidence": self._calculate_confidence(adjusted_prob),
                    "top_factors": top_factors,
                    "precautions": precaution_info["precautions"],
                    "advice": precaution_info["advice"],
                })

        # Sort by probability descending
        risks.sort(key=lambda x: -x["probability"])
        risks = risks[:8]

        return {
            "risks": risks,
            "patient_age": current_age,
            "patient_gender": gender,
            "history_records_analyzed": len(patient_history),
            "explanation_method": "SHAP (SHapley Additive exPlanations)",
        }

    def _get_shap_factors(self, disease: str, X: np.ndarray, top_n: int = 5) -> list:
        """
        Calculate SHAP values and return top contributing factors.

        Returns list of dicts: [{"factor": "Smoking", "impact": 15.2, "direction": "increases"}, ...]
        """
        if disease not in self.explainers:
            return self._get_fallback_factors(X)

        try:
            explainer = self.explainers[disease]
            shap_values = explainer.shap_values(X)

            # For binary classification, shap_values might be a list [neg_class, pos_class]
            if isinstance(shap_values, list):
                shap_values = shap_values[1]  # Use positive class

            # Get SHAP values for this prediction
            shap_vals = shap_values[0] if len(shap_values.shape) > 1 else shap_values

            # Pair features with their SHAP values
            feature_impacts = []
            for i, (name, val) in enumerate(zip(self.feature_names, shap_vals)):
                if abs(val) > 0.001:  # Only include meaningful contributions
                    feature_impacts.append({
                        "factor": name,
                        "impact": round(abs(val) * 100, 1),  # Convert to percentage-like scale
                        "direction": "increases risk" if val > 0 else "decreases risk",
                        "raw_value": round(float(X[0][i]), 2) if i < len(X[0]) else None
                    })

            # Sort by absolute impact and return top N
            feature_impacts.sort(key=lambda x: -x["impact"])
            return feature_impacts[:top_n]

        except Exception as e:
            print(f"  SHAP calculation error for {disease}: {e}")
            return self._get_fallback_factors(X)

    def _get_fallback_factors(self, X: np.ndarray) -> list:
        """Fallback when SHAP is unavailable - return basic feature info."""
        factors = []
        basic_features = [
            ("Age", 1), ("Systolic BP", 4), ("Diastolic BP", 5),
            ("Heart Rate", 6), ("SpO2 Level", 8)
        ]
        for name, idx in basic_features:
            if idx < len(X[0]):
                factors.append({
                    "factor": name,
                    "impact": None,
                    "direction": "contributing factor",
                    "raw_value": round(float(X[0][idx]), 2)
                })
        return factors[:5]

    def _calculate_confidence(self, probability: float) -> str:
        """Calculate confidence level based on probability distance from 0.5."""
        distance = abs(probability - 0.5)
        if distance > 0.35:
            return "HIGH"
        elif distance > 0.2:
            return "MODERATE"
        else:
            return "LOW"

    def _aggregate_history(self, history, age, gender, blood_group):
        """Convert patient history list into a single feature vector."""
        if not history:
            return None

        # Choose a clinically meaningful primary disease from history.
        disease_scores = {}
        for h in history:
            d = str(h.get("disease", "")).strip()
            if not d:
                continue
            severity = str(h.get("severity", "MODERATE")).upper()
            weight = 1.0
            if severity == "SEVERE":
                weight = 1.8
            elif severity == "MODERATE":
                weight = 1.3
            if h.get("is_chronic"):
                weight += 0.5
            disease_scores[d] = disease_scores.get(d, 0.0) + weight

        disease = max(disease_scores, key=disease_scores.get) if disease_scores else ""
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
        print(f"  Risk Predictor saved -> {path}")

    @staticmethod
    def load(path=None):
        if path is None:
            path = os.path.join(MODEL_DIR, "risk_predictor.joblib")
        model = joblib.load(path)
        print(f"  Risk Predictor loaded <- {path}")
        return model
