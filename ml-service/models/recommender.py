"""
Medicine Recommendation Engine

Uses K-Nearest Neighbors on patient features (disease, age, gender) to find
similar past cases with successful outcomes, then aggregates and ranks the
medicines that worked best.
"""

import os
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.neighbors import NearestNeighbors
import joblib

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "saved_models")


class MedicineRecommender:
    def __init__(self):
        self.knn = None
        self.scaler = StandardScaler()
        self.disease_encoder = LabelEncoder()
        self.gender_encoder = LabelEncoder()
        self.blood_encoder = LabelEncoder()
        self.df = None          # keep reference to training data
        self.is_trained = False

    # ── Training ────────────────────────────────────────────────────────

    def train(self, df: pd.DataFrame):
        """Train the recommender on historical data."""
        # Keep only successful outcomes for recommendation
        self.df = df.copy()
        self.df_success = df[df["outcome"].isin(["CURED", "IMPROVED"])].copy()

        if len(self.df_success) < 10:
            raise ValueError("Not enough successful outcomes to train")

        # Encode categoricals
        self.disease_encoder.fit(df["disease"])
        self.gender_encoder.fit(df["gender"])
        self.blood_encoder.fit(df["blood_group"])

        # Build feature matrix from successful cases
        X = self._build_features(self.df_success)
        self.scaler.fit(X)
        X_scaled = self.scaler.transform(X)

        # Fit KNN
        self.knn = NearestNeighbors(n_neighbors=min(50, len(X_scaled)), metric="euclidean")
        self.knn.fit(X_scaled)

        self.is_trained = True
        print(f"  Recommender trained on {len(self.df_success)} successful cases")

    def _build_features(self, data):
        """Build numeric feature matrix from dataframe."""
        features = np.column_stack([
            self.disease_encoder.transform(data["disease"]),
            data["age"].values,
            self.gender_encoder.transform(data["gender"]),
            self.blood_encoder.transform(data["blood_group"]),
            data["bp_systolic"].values,
            data["bp_diastolic"].values,
            data["heart_rate"].values,
            data["temperature"].values,
            data["spo2"].values,
        ])
        return features.astype(float)

    # ── Prediction ──────────────────────────────────────────────────────

    def recommend(self, disease: str, age: int, gender: str,
                  blood_group: str = "O+", allergies: str = "",
                  top_k: int = 5) -> dict:
        """
        Return medicine recommendations for the given patient profile.
        """
        if not self.is_trained:
            return {"error": "Model not trained yet"}

        # Handle unknown disease
        if disease not in self.disease_encoder.classes_:
            # Fuzzy match: find closest disease name
            disease = self._fuzzy_match_disease(disease)
            if disease is None:
                return {"recommendations": [], "similar_cases": 0,
                        "message": "Disease not found in training data"}

        # Build query feature vector with dummy vitals (average)
        query = np.array([[
            self.disease_encoder.transform([disease])[0],
            age,
            self.gender_encoder.transform([gender])[0] if gender in self.gender_encoder.classes_ else 0,
            self.blood_encoder.transform([blood_group])[0] if blood_group in self.blood_encoder.classes_ else 0,
            130, 80, 80, 99.0, 97  # reasonable defaults for vitals
        ]], dtype=float)

        query_scaled = self.scaler.transform(query)
        distances, indices = self.knn.kneighbors(query_scaled)

        # Get the matching records
        neighbors = self.df_success.iloc[indices[0]]

        # Filter to same disease for primary recommendations
        same_disease = neighbors[neighbors["disease"] == disease]
        if len(same_disease) < 3:
            same_disease = neighbors  # fallback to all neighbors

        # Aggregate medicines
        med_stats = {}
        for _, row in same_disease.iterrows():
            meds = str(row["medications"]).split("|")
            outcome = row["outcome"]
            for med in meds:
                med = med.strip()
                if not med:
                    continue
                if med not in med_stats:
                    med_stats[med] = {"count": 0, "cured": 0, "improved": 0}
                med_stats[med]["count"] += 1
                if outcome == "CURED":
                    med_stats[med]["cured"] += 1
                elif outcome == "IMPROVED":
                    med_stats[med]["improved"] += 1

        # Calculate success rate and rank
        recommendations = []
        allergy_list = []
        if isinstance(allergies, list):
            allergy_list = [a.strip().lower() for a in allergies if a.strip()]
        elif isinstance(allergies, str):
            allergy_list = [a.strip().lower() for a in allergies.split(",") if a.strip()]

        for med, stats in med_stats.items():
            success_rate = (stats["cured"] + stats["improved"] * 0.7) / stats["count"]
            # Check allergy conflict
            is_allergen = any(a in med.lower() for a in allergy_list)
            recommendations.append({
                "medicine": med,
                "success_rate": round(success_rate * 100, 1),
                "cases_used": stats["count"],
                "cured_count": stats["cured"],
                "improved_count": stats["improved"],
                "allergy_warning": is_allergen,
            })

        # Sort by success rate descending
        recommendations.sort(key=lambda x: (-x["success_rate"], -x["cases_used"]))

        # Determine age group stats
        age_group_cases = same_disease[
            (same_disease["age"] >= age - 10) & (same_disease["age"] <= age + 10)
        ]

        return {
            "recommendations": recommendations[:top_k],
            "similar_cases": len(same_disease),
            "age_matched_cases": len(age_group_cases),
            "disease": disease,
            "patient_age": age,
            "patient_gender": gender,
        }

    def _fuzzy_match_disease(self, query: str):
        """Simple fuzzy matching on disease names."""
        query_lower = query.lower().strip()
        for d in self.disease_encoder.classes_:
            if query_lower in d.lower() or d.lower() in query_lower:
                return d
        # Try partial word match
        query_words = set(query_lower.split())
        best_match = None
        best_overlap = 0
        for d in self.disease_encoder.classes_:
            d_words = set(d.lower().replace("(", "").replace(")", "").split())
            overlap = len(query_words & d_words)
            if overlap > best_overlap:
                best_overlap = overlap
                best_match = d
        return best_match if best_overlap > 0 else None

    # ── Persistence ─────────────────────────────────────────────────────

    def save(self, path=None):
        if path is None:
            path = os.path.join(MODEL_DIR, "recommender.joblib")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump(self, path)
        print(f"  Recommender saved → {path}")

    @staticmethod
    def load(path=None):
        if path is None:
            path = os.path.join(MODEL_DIR, "recommender.joblib")
        model = joblib.load(path)
        print(f"  Recommender loaded ← {path}")
        return model
