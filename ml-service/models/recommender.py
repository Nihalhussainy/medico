"""
Medicine Recommendation Engine - Enhanced Version

Uses K-Nearest Neighbors on patient features (disease, age, gender, vitals) to find
similar past cases, then aggregates and ranks medicines by their success rates
across ALL cases (not just successful ones) for realistic accuracy metrics.
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
        self.df = None
        self.df_success = None
        self.is_trained = False
        self.med_global_stats = {}
        self.disease_stats = {}

    # ---- Training ----

    def train(self, df: pd.DataFrame):
        """Train the recommender on historical data."""
        self.df = df.copy()
        self.df_success = df[df["outcome"].isin(["CURED", "IMPROVED"])].copy()

        if len(self.df_success) < 10:
            raise ValueError("Not enough successful outcomes to train")

        # Encode categoricals
        self.disease_encoder.fit(df["disease"])
        self.gender_encoder.fit(df["gender"])
        self.blood_encoder.fit(df["blood_group"])

        # Pre-compute medicine efficacy stats across ALL cases
        self._compute_medicine_stats()

        # Pre-compute disease-level statistics
        self._compute_disease_stats()

        # Build feature matrix from ALL data for comprehensive matching
        X = self._build_features(self.df)
        self.scaler.fit(X)
        X_scaled = self.scaler.transform(X)

        # Use more neighbors for better case analysis (up to 500 or 10% of data)
        n_neighbors = min(500, max(100, len(X_scaled) // 10))
        self.knn = NearestNeighbors(n_neighbors=n_neighbors, metric="euclidean")
        self.knn.fit(X_scaled)

        self.is_trained = True
        print(f"  Recommender trained on {len(df)} total cases ({len(self.df_success)} successful)")
        print(f"  KNN neighbors: {n_neighbors}, Diseases: {len(self.disease_encoder.classes_)}")

    def _compute_medicine_stats(self):
        """Pre-compute medicine success rates across ALL cases including failures."""
        self.med_global_stats = {}

        for _, row in self.df.iterrows():
            disease = row["disease"]
            meds = str(row["medications"]).split("|")
            outcome = row["outcome"]
            age = row["age"]
            severity = row.get("severity", "MODERATE")

            for med in meds:
                med = med.strip()
                if not med:
                    continue

                key = (disease, med)
                if key not in self.med_global_stats:
                    self.med_global_stats[key] = {
                        "total": 0,
                        "cured": 0,
                        "improved": 0,
                        "no_change": 0,
                        "worsened": 0,
                        "age_groups": {"child": 0, "teen": 0, "adult": 0, "middle": 0, "senior": 0},
                        "severity_outcomes": {"MILD": [], "MODERATE": [], "SEVERE": []}
                    }

                stats = self.med_global_stats[key]
                stats["total"] += 1

                if outcome == "CURED":
                    stats["cured"] += 1
                elif outcome == "IMPROVED":
                    stats["improved"] += 1
                elif outcome == "NO_CHANGE":
                    stats["no_change"] += 1
                else:
                    stats["worsened"] += 1

                # Track age group
                if age < 12:
                    stats["age_groups"]["child"] += 1
                elif age < 20:
                    stats["age_groups"]["teen"] += 1
                elif age < 40:
                    stats["age_groups"]["adult"] += 1
                elif age < 60:
                    stats["age_groups"]["middle"] += 1
                else:
                    stats["age_groups"]["senior"] += 1

                # Track severity outcomes
                if severity in stats["severity_outcomes"]:
                    outcome_score = 1.0 if outcome == "CURED" else (0.7 if outcome == "IMPROVED" else (0.3 if outcome == "NO_CHANGE" else 0.0))
                    stats["severity_outcomes"][severity].append(outcome_score)

    def _compute_disease_stats(self):
        """Pre-compute disease-level statistics."""
        self.disease_stats = {}

        for disease in self.disease_encoder.classes_:
            disease_df = self.df[self.df["disease"] == disease]

            self.disease_stats[disease] = {
                "total_cases": len(disease_df),
                "cured": len(disease_df[disease_df["outcome"] == "CURED"]),
                "improved": len(disease_df[disease_df["outcome"] == "IMPROVED"]),
                "no_change": len(disease_df[disease_df["outcome"] == "NO_CHANGE"]),
                "worsened": len(disease_df[disease_df["outcome"] == "WORSENED"]),
                "avg_age": disease_df["age"].mean(),
                "age_range": (disease_df["age"].min(), disease_df["age"].max()),
            }

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

    # ---- Prediction ----

    def recommend(self, disease: str, age: int, gender: str,
                  blood_group: str = "O+", allergies: str = "",
                  top_k: int = 5) -> dict:
        """Return medicine recommendations for the given patient profile."""
        if not self.is_trained:
            return {"error": "Model not trained yet"}

        # Handle unknown disease
        original_disease = disease
        if disease not in self.disease_encoder.classes_:
            disease = self._fuzzy_match_disease(disease)
            if disease is None:
                return {"recommendations": [], "similar_cases": 0,
                        "message": f"Disease '{original_disease}' not found in training data"}

        # Build query feature vector
        query = np.array([[
            self.disease_encoder.transform([disease])[0],
            age,
            self.gender_encoder.transform([gender])[0] if gender in self.gender_encoder.classes_ else 0,
            self.blood_encoder.transform([blood_group])[0] if blood_group in self.blood_encoder.classes_ else 0,
            130, 80, 80, 99.0, 97  # reasonable defaults for vitals
        ]], dtype=float)

        query_scaled = self.scaler.transform(query)
        distances, indices = self.knn.kneighbors(query_scaled)

        # Get all matching records
        neighbors = self.df.iloc[indices[0]]

        # Filter to same disease - this is our primary analysis pool
        same_disease_all = neighbors[neighbors["disease"] == disease]

        # Also get disease-specific cases from full dataset for better stats
        full_disease_cases = self.df[self.df["disease"] == disease]

        # Use the larger pool for analysis
        analysis_pool = full_disease_cases if len(full_disease_cases) > len(same_disease_all) else same_disease_all

        # Further filter by age group for age-matched analysis
        age_matched = analysis_pool[
            (analysis_pool["age"] >= age - 15) & (analysis_pool["age"] <= age + 15)
        ]

        # Aggregate medicines from analysis pool
        med_analysis = {}
        for _, row in analysis_pool.iterrows():
            meds = str(row["medications"]).split("|")
            outcome = row["outcome"]
            patient_age = row["age"]
            severity = row.get("severity", "MODERATE")

            for med in meds:
                med = med.strip()
                if not med:
                    continue
                if med not in med_analysis:
                    med_analysis[med] = {
                        "total": 0, "cured": 0, "improved": 0, "no_change": 0, "worsened": 0,
                        "age_matched": 0, "age_matched_success": 0
                    }

                stats = med_analysis[med]
                stats["total"] += 1

                if outcome == "CURED":
                    stats["cured"] += 1
                elif outcome == "IMPROVED":
                    stats["improved"] += 1
                elif outcome == "NO_CHANGE":
                    stats["no_change"] += 1
                else:
                    stats["worsened"] += 1

                # Track age-matched success
                if abs(patient_age - age) <= 15:
                    stats["age_matched"] += 1
                    if outcome in ["CURED", "IMPROVED"]:
                        stats["age_matched_success"] += 1

        # Build recommendations with realistic success rates
        recommendations = []
        allergy_list = self._parse_allergies(allergies)

        for med, stats in med_analysis.items():
            if stats["total"] < 2:  # Skip medicines with too few cases
                continue

            # Calculate success rate: weighted by outcome quality
            # CURED = 1.0, IMPROVED = 0.7, NO_CHANGE = 0.2, WORSENED = 0.0
            weighted_success = (
                stats["cured"] * 1.0 +
                stats["improved"] * 0.7 +
                stats["no_change"] * 0.2 +
                stats["worsened"] * 0.0
            )
            success_rate = weighted_success / stats["total"]

            # Calculate age-matched success rate
            age_matched_rate = None
            if stats["age_matched"] >= 3:
                age_matched_rate = stats["age_matched_success"] / stats["age_matched"]

            # Check allergy conflict
            is_allergen = any(a in med.lower() for a in allergy_list)

            recommendations.append({
                "medicine": med,
                "success_rate": round(success_rate * 100, 1),
                "cases_used": stats["total"],
                "cured_count": stats["cured"],
                "improved_count": stats["improved"],
                "no_change_count": stats["no_change"],
                "worsened_count": stats["worsened"],
                "age_matched_cases": stats["age_matched"],
                "age_matched_rate": round(age_matched_rate * 100, 1) if age_matched_rate else None,
                "allergy_warning": is_allergen,
            })

        # Sort by success rate, then by number of cases
        recommendations.sort(key=lambda x: (-x["success_rate"], -x["cases_used"]))

        # Get disease statistics
        disease_info = self.disease_stats.get(disease, {})

        return {
            "recommendations": recommendations[:top_k],
            "similar_cases": len(analysis_pool),
            "age_matched_cases": len(age_matched),
            "total_disease_cases": disease_info.get("total_cases", len(full_disease_cases)),
            "disease": disease,
            "patient_age": age,
            "patient_gender": gender,
            "disease_cure_rate": round(
                (disease_info.get("cured", 0) + disease_info.get("improved", 0) * 0.7) /
                max(disease_info.get("total_cases", 1), 1) * 100, 1
            ) if disease_info else None,
        }

    def _parse_allergies(self, allergies):
        """Parse allergies input into a list."""
        if isinstance(allergies, list):
            return [a.strip().lower() for a in allergies if a.strip()]
        elif isinstance(allergies, str):
            return [a.strip().lower() for a in allergies.split(",") if a.strip()]
        return []

    def _fuzzy_match_disease(self, query: str):
        """Fuzzy matching on disease names."""
        query_lower = query.lower().strip()

        # Exact substring match
        for d in self.disease_encoder.classes_:
            if query_lower in d.lower() or d.lower() in query_lower:
                return d

        # Word overlap match
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

    # ---- Persistence ----

    def save(self, path=None):
        if path is None:
            path = os.path.join(MODEL_DIR, "recommender.joblib")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump(self, path)
        print(f"  Recommender saved -> {path}")

    @staticmethod
    def load(path=None):
        if path is None:
            path = os.path.join(MODEL_DIR, "recommender.joblib")
        model = joblib.load(path)
        print(f"  Recommender loaded <- {path}")
        return model
