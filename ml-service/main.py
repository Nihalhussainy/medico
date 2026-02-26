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
from pydantic import BaseModel, Field
from typing import List, Optional

from models.recommender import MedicineRecommender
from models.risk_predictor import HealthRiskPredictor
from models.drug_interactions import check_interactions

# ── Globals ─────────────────────────────────────────────────────────────────

recommender: MedicineRecommender | None = None
risk_predictor: HealthRiskPredictor | None = None


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
    disease: str = Field(..., description="Diagnosis / disease name")
    age: int = Field(..., ge=1, le=120)
    gender: str = Field(..., pattern="^(Male|Female)$")
    blood_group: str = Field(default="O+")
    allergies: List[str] = Field(default=[])
    top_k: int = Field(default=5, ge=1, le=20)


class HistoryRecord(BaseModel):
    disease: str
    severity: str = "MODERATE"
    bp_systolic: float = 120
    bp_diastolic: float = 80
    heart_rate: float = 80
    temperature: float = 98.6
    spo2: float = 97
    risk_factors: str = ""
    is_chronic: bool = False


class RiskRequest(BaseModel):
    patient_history: List[HistoryRecord]
    age: int = Field(..., ge=1, le=120)
    gender: str
    blood_group: str = "O+"


class InteractionRequest(BaseModel):
    medications: List[str] = Field(..., min_length=2)


# ── Endpoints ───────────────────────────────────────────────────────────────


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "recommender_loaded": recommender is not None and recommender.is_trained,
        "risk_predictor_loaded": risk_predictor is not None and risk_predictor.is_trained,
    }


@app.get("/diseases")
async def list_diseases():
    if recommender is None or not recommender.is_trained:
        raise HTTPException(503, "Model not loaded. Run train.py first.")
    return {"diseases": list(recommender.disease_encoder.classes_)}


@app.post("/recommend-medicine")
async def recommend_medicine(req: RecommendRequest):
    if recommender is None or not recommender.is_trained:
        raise HTTPException(503, "Recommender model not loaded. Run train.py first.")

    result = recommender.recommend(
        disease=req.disease,
        age=req.age,
        gender=req.gender,
        blood_group=req.blood_group,
        allergies=req.allergies,
        top_k=req.top_k,
    )
    return result


@app.post("/predict-risks")
async def predict_risks(req: RiskRequest):
    if risk_predictor is None or not risk_predictor.is_trained:
        raise HTTPException(503, "Risk Predictor model not loaded. Run train.py first.")

    history_dicts = [h.model_dump() for h in req.patient_history]
    result = risk_predictor.predict_risks(
        patient_history=history_dicts,
        current_age=req.age,
        gender=req.gender,
        blood_group=req.blood_group,
    )
    return result


@app.post("/check-interactions")
async def check_drug_interactions(req: InteractionRequest):
    result = check_interactions(req.medications)
    return result


# ── Main ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
