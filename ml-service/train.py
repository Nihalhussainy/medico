"""
Training Pipeline

Generates synthetic data, trains all ML models, and saves them for serving.
"""

import os
import sys
import time

# so we can import from parent
sys.path.insert(0, os.path.dirname(__file__))

from data_generator import generate_records
from models.recommender import MedicineRecommender
from models.risk_predictor import HealthRiskPredictor

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CSV_PATH = os.path.join(DATA_DIR, "training_data.csv")


def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    start = time.time()

    # ── 1. Generate synthetic data ──────────────────────────────────────
    print("=" * 60)
    print("STEP 1 — Generating synthetic medical records …")
    print("=" * 60)
    records_list = generate_records(n=5000, output_path=CSV_PATH)
    import pandas as pd
    df = pd.read_csv(CSV_PATH)
    print(f"  ✔ {len(df)} records saved to {CSV_PATH}")
    print(f"    Diseases: {df['disease'].nunique()}")
    print(f"    Outcomes — CURED: {(df['outcome']=='CURED').sum()}, "
          f"IMPROVED: {(df['outcome']=='IMPROVED').sum()}, "
          f"NO_CHANGE: {(df['outcome']=='NO_CHANGE').sum()}, "
          f"WORSENED: {(df['outcome']=='WORSENED').sum()}")
    print()

    # ── 2. Train Medicine Recommender ───────────────────────────────────
    print("=" * 60)
    print("STEP 2 — Training Medicine Recommender (KNN) …")
    print("=" * 60)
    recommender = MedicineRecommender()
    recommender.train(df)
    recommender.save()
    print()

    # ── 3. Train Risk Predictor ─────────────────────────────────────────
    print("=" * 60)
    print("STEP 3 — Training Health Risk Predictor (Gradient Boosting) …")
    print("=" * 60)
    predictor = HealthRiskPredictor()
    predictor.train(df)
    predictor.save()
    print()

    elapsed = time.time() - start
    print("=" * 60)
    print(f"ALL MODELS TRAINED & SAVED in {elapsed:.1f}s")
    print("=" * 60)


if __name__ == "__main__":
    main()
