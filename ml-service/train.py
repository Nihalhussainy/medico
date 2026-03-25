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


def main(real_data_path=None):
    os.makedirs(DATA_DIR, exist_ok=True)
    start = time.time()

    # ── 1. Generate synthetic data ──────────────────────────────────────
    print("=" * 60)
    print("STEP 1 - Generating synthetic medical records...")
    print("=" * 60)
    records_list = generate_records(n=50000, output_path=CSV_PATH)
    import pandas as pd
    df = pd.read_csv(CSV_PATH)
    print(f"  [OK] {len(df)} records saved to {CSV_PATH}")
    print(f"    Diseases: {df['disease'].nunique()}")
    print(f"    Outcomes - CURED: {(df['outcome']=='CURED').sum()}, "
        f"IMPROVED: {(df['outcome']=='IMPROVED').sum()}, "
        f"NO_CHANGE: {(df['outcome']=='NO_CHANGE').sum()}, "
        f"WORSENED: {(df['outcome']=='WORSENED').sum()}")
    print()

    # ── 1b. Merge real-world data if provided ──────────────────────────
    if real_data_path is not None:
      print("=" * 60)
      print(f"STEP 1b - Merging real-world data from {real_data_path} ...")
      print("=" * 60)
      real_df = pd.read_csv(real_data_path)
      before = len(df)
      df = pd.concat([df, real_df], ignore_index=True)
      print(f"  [OK] Added {len(df)-before} real records. Total: {len(df)}")
      print()

    # ── 2. Train Medicine Recommender ───────────────────────────────────
    print("=" * 60)
    print("STEP 2 - Training Medicine Recommender (KNN)...")
    print("=" * 60)
    recommender = MedicineRecommender()
    recommender.train(df)
    recommender.save()
    # Print disease-level cure rates for realism
    print("Top 10 Disease Cure Rates (Recommender):")
    stats = recommender.disease_stats
    top_stats = sorted(stats.items(), key=lambda x: (x[1]['cured'] + x[1]['improved']*0.7)/max(x[1]['total_cases'],1), reverse=True)[:10]
    for disease, s in top_stats:
        cure_rate = (s['cured'] + s['improved']*0.7)/max(s['total_cases'],1)*100
        print(f"  {disease}: {cure_rate:.1f}% (n={s['total_cases']})")
    print()

    # ── 3. Train Risk Predictor ─────────────────────────────────────────
    print("=" * 60)
    print("STEP 3 - Training Health Risk Predictor (Gradient Boosting + SHAP)...")
    print("=" * 60)
    predictor = HealthRiskPredictor()
    predictor.train(df)
    predictor.save()
    # Print accuracy metrics for risk predictor
    print("Top 10 Risk Predictor Accuracies:")
    acc = predictor.accuracy_report
    top_acc = sorted(acc.items(), key=lambda x: x[1], reverse=True)[:10]
    for disease, score in top_acc:
        print(f"  {disease}: {score:.1f}% accuracy")
    print()
def retrain_models(new_data_path=None):
    """Retrain models after new records are added. Optionally provide a new CSV path."""
    import pandas as pd
    path = new_data_path or CSV_PATH
    df = pd.read_csv(path)
    recommender = MedicineRecommender()
    recommender.train(df)
    recommender.save()
    predictor = HealthRiskPredictor()
    predictor.train(df)
    predictor.save()
    print("Retraining complete. Models updated with new data.")


if __name__ == "__main__":
    # To use real data, run: python train.py path/to/real_data.csv
    import sys
    real_data_path = sys.argv[1] if len(sys.argv) > 1 else None
    main(real_data_path)
