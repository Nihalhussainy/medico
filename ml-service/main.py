"""
FastAPI ML Microservice – Medico AI

Endpoints:
  POST /recommend-medicine   → medicine recommendation for a diagnosis
  POST /predict-risks        → health risk prediction from patient history
  POST /check-interactions   → drug interaction check
  GET  /health               → health check + model status
  GET  /diseases             → list of known diseases
"""

import os, sys

sys.path.insert(0, os.path.dirname(__file__))

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

from models.recommender import MedicineRecommender
from models.risk_predictor import HealthRiskPredictor
from models.drug_interactions import check_interactions

try:
    from rapidfuzz import process, fuzz
except ImportError:
    fuzz = None
    process = None


# ── Input Validation Constants ────────────────────────────────────────────

VALID_GENDERS = {"Male", "Female"}
VALID_BLOOD_GROUPS = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}
VALID_SEVERITIES = {"MILD", "MODERATE", "SEVERE"}
VALID_OUTCOMES = {"CURED", "IMPROVED", "MONITORING", "WORSENED", "UNKNOWN"}

# Valid vitals ranges (reasonable medical bounds)
VITAL_RANGES = {
    "age": (0, 120),  # years
    "bp_systolic": (60, 250),  # mmHg
    "bp_diastolic": (30, 150),  # mmHg
    "heart_rate": (30, 200),  # bpm
    "temperature": (32.0, 42.0),  # Celsius
    "spo2": (50.0, 100.0),  # percent
}

# ── Globals ─────────────────────────────────────────────────────────────────

recommender: MedicineRecommender | None = None
risk_predictor: HealthRiskPredictor | None = None


# ── Validation Helper Functions ──────────────────────────────────────────────

def _fuzzy_match_disease(input_disease: str, disease_list: list) -> tuple[str, int]:
    """
    Fuzzy match a disease name against the list of known diseases.
    
    Returns:
        (matched_disease_name, confidence_score)
        or (None, 0) if no match above threshold
    """
    if not input_disease or not disease_list:
        return None, 0

    # Common aliases used by end users; map them before fuzzy matching.
    aliases = {
        "diabetes": "Type 2 Diabetes",
        "diabetes mellitus": "Type 2 Diabetes",
        "high bp": "Hypertension",
        "high blood pressure": "Hypertension",
        "bp": "Hypertension",
        "low bp": "Hypotension",
        "sugar": "Type 2 Diabetes",
        "thyroid": "Hypothyroidism",
    }
    input_normalized = input_disease.strip()
    alias_match = aliases.get(input_normalized.lower())
    if alias_match and alias_match in disease_list:
        return alias_match, 100
    
    # If exact match exists, return immediately
    if input_normalized in disease_list:
        return input_normalized, 100
    
    # Try fuzzy matching if rapidfuzz available
    if process is not None and fuzz is not None:
        try:
            match, score, _ = process.extractOne(
                input_normalized,
                disease_list,
                scorer=fuzz.token_set_ratio
            )
            if score >= 60:  # permit partial matches like "diabetes" -> "Type 2 Diabetes"
                return match, int(score)
        except Exception:
            pass
    
    # Fallback: case-insensitive exact match
    input_lower = input_normalized.lower()
    for disease in disease_list:
        if disease.lower() == input_lower:
            return disease, 100
    
    return None, 0


def _validate_disease(disease: str, recommender_obj: MedicineRecommender | None) -> str:
    """Validate and fuzzy-match disease against known diseases in the recommender."""
    if not disease or not isinstance(disease, str):
        raise HTTPException(400, "Disease must be a non-empty string.")
    disease = disease.strip()
    if not disease:
        raise HTTPException(400, "Disease cannot be whitespace-only.")
    if recommender_obj is None or not recommender_obj.is_trained:
        raise HTTPException(503, "Recommender model not loaded. Run train.py first.")
    
    # Try fuzzy matching
    matched_disease, score = _fuzzy_match_disease(disease, list(recommender_obj.disease_encoder.classes_))
    
    if matched_disease:
        return matched_disease
    
    # No match found
    available = ", ".join(sorted(recommender_obj.disease_encoder.classes_)[:10])
    raise HTTPException(400, f"Unknown disease '{disease}'. Available: {available}... (Use GET /diseases for full list)")


def _validate_medication(medication: str) -> str:
    """Validate medication is a non-empty string."""
    if not medication or not isinstance(medication, str):
        raise HTTPException(400, "Medication must be a non-empty string.")
    med = medication.strip()
    if not med:
        raise HTTPException(400, "Medication cannot be whitespace-only.")
    # Medication names are flexible (could be brand name or generic)
    # Just validate format, not against a hardcoded list
    if len(med) > 100:
        raise HTTPException(400, "Medication name too long (max 100 characters).")
    return med



@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load saved models at startup."""
    global recommender, risk_predictor
    model_dir = os.path.join(os.path.dirname(__file__), "data", "saved_models")

    rec_path = os.path.join(model_dir, "recommender.joblib")
    rp_path = os.path.join(model_dir, "risk_predictor.joblib")

    if os.path.exists(rec_path):
        recommender = MedicineRecommender.load(rec_path)
    else:
        print("WARNING: Recommender model not found. Run train.py first.")

    if os.path.exists(rp_path):
        risk_predictor = HealthRiskPredictor.load(rp_path)
    else:
        print("WARNING: Risk Predictor model not found. Run train.py first.")

    yield  # app runs
    # cleanup if needed


app = FastAPI(
    title="Medico AI Service",
    version="1.0.0",
    description="ML-powered medicine recommendation, health risk prediction, and drug interaction checking.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request / Response Schemas ──────────────────────────────────────────────


class RecommendRequest(BaseModel):
    disease: str = Field(..., description="Diagnosis / disease name", min_length=1, max_length=100)
    age: int = Field(..., ge=1, le=120, description="Patient age in years")
    gender: str = Field(..., description="Male or Female")
    blood_group: str = Field(default="O+", description="Blood group (A+, A-, B+, B-, AB+, AB-, O+, O-)")
    allergies: List[str] = Field(default=[], description="List of known allergies")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of recommendations to return")

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v):
        if v not in VALID_GENDERS:
            raise ValueError(f"Gender must be one of {VALID_GENDERS}")
        return v

    @field_validator("blood_group")
    @classmethod
    def validate_blood_group(cls, v):
        if v not in VALID_BLOOD_GROUPS:
            raise ValueError(f"Blood group must be one of {VALID_BLOOD_GROUPS}")
        return v

    @field_validator("allergies")
    @classmethod
    def validate_allergies(cls, v):
        if not isinstance(v, list):
            raise ValueError("Allergies must be a list")
        if len(v) > 20:
            raise ValueError("Maximum 20 allergies allowed")
        for allergy in v:
            if not isinstance(allergy, str) or not allergy.strip():
                raise ValueError("Each allergy must be a non-empty string")
            if len(allergy) > 100:
                raise ValueError("Allergy name too long (max 100 characters)")
        return v


class HistoryRecord(BaseModel):
    disease: str = Field(..., min_length=1, max_length=100, description="Disease name")
    severity: str = Field(default="MODERATE", description="MILD, MODERATE, or SEVERE")
    bp_systolic: float = Field(default=120, ge=60, le=250, description="Systolic blood pressure (mmHg)")
    bp_diastolic: float = Field(default=80, ge=30, le=150, description="Diastolic blood pressure (mmHg)")
    heart_rate: float = Field(default=80, ge=30, le=200, description="Heart rate (bpm)")
    temperature: float = Field(default=98.6, ge=32.0, le=42.0, description="Body temperature (Celsius)")
    spo2: float = Field(default=97, ge=50.0, le=100.0, description="Oxygen saturation (%)")
    risk_factors: str = Field(default="", max_length=500, description="Comma-separated risk factors")
    is_chronic: bool = Field(default=False, description="Is this a chronic condition?")

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, v):
        if v not in VALID_SEVERITIES:
            raise ValueError(f"Severity must be one of {VALID_SEVERITIES}")
        return v

    @field_validator("disease")
    @classmethod
    def validate_disease_format(cls, v):
        if not v or not isinstance(v, str):
            raise ValueError("Disease must be a non-empty string")
        if len(v.strip()) == 0:
            raise ValueError("Disease cannot be whitespace-only")
        return v.strip()

    @field_validator("bp_systolic", "bp_diastolic")
    @classmethod
    def validate_blood_pressure(cls, v):
        if v < 0:
            raise ValueError("Blood pressure cannot be negative")
        return v


class RiskRequest(BaseModel):
    patient_history: List[HistoryRecord] = Field(..., min_length=1, description="Patient medical history")
    age: int = Field(..., ge=1, le=120, description="Current age in years")
    gender: str = Field(..., description="Male or Female")
    blood_group: str = Field(default="O+", description="Blood group (A+, A-, B+, B-, AB+, AB-, O+, O-)")

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v):
        if v not in VALID_GENDERS:
            raise ValueError(f"Gender must be one of {VALID_GENDERS}")
        return v

    @field_validator("blood_group")
    @classmethod
    def validate_blood_group(cls, v):
        if v not in VALID_BLOOD_GROUPS:
            raise ValueError(f"Blood group must be one of {VALID_BLOOD_GROUPS}")
        return v

    @field_validator("patient_history")
    @classmethod
    def validate_history_length(cls, v):
        if len(v) > 100:
            raise ValueError("Maximum 100 history records allowed per request")
        return v


class InteractionRequest(BaseModel):
    medications: List[str] = Field(..., min_length=2, max_length=20, description="List of medications to check (min 2)")

    @field_validator("medications")
    @classmethod
    def validate_medications(cls, v):
        if not isinstance(v, list):
            raise ValueError("Medications must be a list")
        if len(v) < 2:
            raise ValueError("At least 2 medications required for interaction checking")
        if len(v) > 20:
            raise ValueError("Maximum 20 medications per request")
        
        # Validate each medication
        for med in v:
            if not isinstance(med, str) or not med.strip():
                raise ValueError("Each medication must be a non-empty string")
            if len(med) > 100:
                raise ValueError(f"Medication name too long: '{med}' (max 100 characters)")
        
        # Check for duplicates (case-insensitive)
        normalized = [m.strip().lower() for m in v]
        if len(normalized) != len(set(normalized)):
            raise ValueError("Duplicate medications detected (ignoring case)")
        
        return [m.strip() for m in v]



# ── Endpoints ───────────────────────────────────────────────────────────────


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "recommender_loaded": recommender is not None and recommender.is_trained,
        "risk_predictor_loaded": risk_predictor is not None and risk_predictor.is_trained,
    }


@app.head("/health")
async def health_head():
    # Some uptime monitors probe with HEAD; mirror health availability via 200.
    return


@app.get("/diseases")
async def list_diseases():
    if recommender is None or not recommender.is_trained:
        raise HTTPException(503, "Model not loaded. Run train.py first.")
    return {"diseases": list(recommender.disease_encoder.classes_)}


@app.post("/recommend-medicine")
async def recommend_medicine(req: RecommendRequest):
    """
    Recommend medicines for a given disease and patient profile.
    
    Validates:
    - Disease exists in training data
    - Age is in valid range (1-120)
    - Gender is Male or Female
    - Blood group is valid
    - top_k is reasonable (1-20)
    """
    if recommender is None or not recommender.is_trained:
        raise HTTPException(503, "Recommender model not loaded. Run train.py first.")

    # Validate disease and normalize to a trained label.
    normalized_disease = _validate_disease(req.disease, recommender)

    try:
        result = recommender.recommend(
            disease=normalized_disease,
            age=req.age,
            gender=req.gender,
            blood_group=req.blood_group,
            allergies=req.allergies,
            top_k=req.top_k,
        )
        return result
    except Exception as e:
        raise HTTPException(500, f"Recommendation failed: {str(e)}")



@app.post("/predict-risks")
async def predict_risks(req: RiskRequest):
    """
    Predict health risks based on patient history.
    
    Validates:
    - Patient history is not empty (min 1 record)
    - All diseases in history exist in training data
    - Age is in valid range (1-120)
    - Gender is Male or Female
    - Blood group is valid
    - All vitals are in reasonable medical ranges
    """
    if risk_predictor is None or not risk_predictor.is_trained:
        raise HTTPException(503, "Risk Predictor model not loaded. Run train.py first.")

    # Validate all diseases in history
    if not req.patient_history:
        raise HTTPException(400, "Patient history cannot be empty")
    normalized_history = []
    try:
        for i, record in enumerate(req.patient_history):
            normalized_disease = _validate_disease(record.disease, recommender)
            normalized_history.append({
                "disease": normalized_disease,
                "severity": record.severity,
                "bp_systolic": record.bp_systolic,
                "bp_diastolic": record.bp_diastolic,
                "heart_rate": record.heart_rate,
                "temperature": record.temperature,
                "spo2": record.spo2,
                "risk_factors": record.risk_factors,
                "is_chronic": record.is_chronic,
            })
    except HTTPException as e:
        raise HTTPException(400, f"History record {i}: {str(e)}")

    try:
        result = risk_predictor.predict_risks(
            patient_history=normalized_history,
            current_age=req.age,
            gender=req.gender,
            blood_group=req.blood_group,
        )
        return result
    except Exception as e:
        raise HTTPException(500, f"Risk prediction failed: {str(e)}")



@app.post("/check-interactions")
async def check_drug_interactions(req: InteractionRequest):
    """
    Check for known drug interactions between medications.
    
    Validates:
    - At least 2 medications provided
    - No more than 20 medications
    - Each medication is a non-empty string
    - No duplicate medications
    """
    if not req.medications or len(req.medications) < 2:
        raise HTTPException(400, "Provide at least 2 medications for interaction checking")
    
    try:
        # Validate each medication
        for med in req.medications:
            _validate_medication(med)
        
        result = check_interactions(req.medications)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(500, f"Interaction check failed: {str(e)}")


# ── Main ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
