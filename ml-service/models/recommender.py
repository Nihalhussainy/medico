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
    def set_algorithm(self, algorithm="knn"):
        """Set the algorithm for recommendations: 'knn', 'random_forest', or 'xgboost'."""
        self.algorithm = algorithm

    # Common symptom/synonym mapping for robust disease matching
    _SYMPTOM_TO_DISEASE = {
        "pain": "Body Pain",
        "body pain": "Body Pain",
        "muscle pain": "Body Pain",
        "ache": "Body Pain",
        "muscle ache": "Body Pain",
        "headache": "Headache",
        "migraine": "Migraine",
        "fever": "Fever (Viral)",
        "cold": "Common Cold",
        "cough": "Common Cold",
        "sore throat": "Common Cold",
        "back pain": "Body Pain",
        "joint pain": "Body Pain",
        "throbbing": "Migraine",
        "forehead pain": "Headache",
        "temple pain": "Headache",
        # Add more as needed
    }

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
        self.feedback_log = []
        self.algorithm = "knn"
        self.feedback_retrain_threshold = 25
        self.online_retrain_mode = "fast"
        self.max_online_history = 20000
        self.full_retrain_every = 8
        self._online_retrain_count = 0

    # ---- Training ----

    def train(self, df: pd.DataFrame, algorithm="knn"):
        """Train the recommender on historical data."""
        self.df = df.copy()
        self.df_success = df[df["outcome"].isin(["CURED", "IMPROVED"])].copy()

        self.set_algorithm(algorithm)

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

        if self.algorithm == "knn":
            n_neighbors = min(500, max(100, len(X_scaled) // 10))
            self.knn = NearestNeighbors(n_neighbors=n_neighbors, metric="euclidean")
            self.knn.fit(X_scaled)
            print(f"  KNN neighbors: {n_neighbors}, Diseases: {len(self.disease_encoder.classes_)}")
        elif self.algorithm == "random_forest":
            try:
                from sklearn.ensemble import RandomForestClassifier
                self.rf = RandomForestClassifier(n_estimators=100, random_state=42)
                y = self.disease_encoder.transform(self.df["disease"])
                self.rf.fit(X_scaled, y)
                print(f"  Random Forest trained for disease prediction.")
            except ImportError:
                print("RandomForestClassifier not available. Falling back to KNN.")
                self.algorithm = "knn"
                n_neighbors = min(500, max(100, len(X_scaled) // 10))
                self.knn = NearestNeighbors(n_neighbors=n_neighbors, metric="euclidean")
                self.knn.fit(X_scaled)
        elif self.algorithm == "xgboost":
            try:
                import xgboost as xgb  # type: ignore[import-not-found]
                y = self.disease_encoder.transform(self.df["disease"])
                self.xgb = xgb.XGBClassifier(n_estimators=100, random_state=42, use_label_encoder=False, eval_metric='mlogloss')
                self.xgb.fit(X_scaled, y)
                print(f"  XGBoost trained for disease prediction.")
            except ImportError:
                print("XGBoost not available. Falling back to KNN.")
                self.algorithm = "knn"
                n_neighbors = min(500, max(100, len(X_scaled) // 10))
                self.knn = NearestNeighbors(n_neighbors=n_neighbors, metric="euclidean")
                self.knn.fit(X_scaled)
        else:
            raise ValueError(f"Unknown algorithm: {self.algorithm}")

        self.is_trained = True
        print(f"  Recommender trained on {len(df)} total cases ({len(self.df_success)} successful)")

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
                  top_k: int = 5, patient_history: list = None,
                  comorbidities=None) -> dict:
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

        # Patient-specific context used for personalization.
        history_profile = self._build_history_profile(patient_history)
        comorbidity_set = self._normalize_comorbidities(comorbidities)

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

            base_score = success_rate * 100.0
            personalization_boost, reasons = self._compute_personalization_adjustment(
                med=med,
                disease=disease,
                history_profile=history_profile,
                comorbidity_set=comorbidity_set,
            )
            final_score = max(0.0, min(100.0, base_score + personalization_boost))
            confidence = self._calculate_recommendation_confidence(
                total_cases=stats["total"],
                age_matched_cases=stats["age_matched"],
                disease_cases=len(analysis_pool),
            )

            recommendations.append({
                "medicine": med,
                "success_rate": round(success_rate * 100, 1),
                "personalized_score": round(final_score, 1),
                "cases_used": stats["total"],
                "cured_count": stats["cured"],
                "improved_count": stats["improved"],
                "no_change_count": stats["no_change"],
                "worsened_count": stats["worsened"],
                "age_matched_cases": stats["age_matched"],
                "age_matched_rate": round(age_matched_rate * 100, 1) if age_matched_rate else None,
                "allergy_warning": is_allergen,
                "confidence": confidence,
                "explanation": self._build_recommendation_explanation(
                    med=med,
                    base_score=base_score,
                    final_score=final_score,
                    reasons=reasons,
                    stats=stats,
                ),
            })

        # Sort by personalized score, then by confidence and number of cases.
        recommendations.sort(key=lambda x: (-x["personalized_score"], -x["confidence"], -x["cases_used"]))

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
            "personalization_used": bool(history_profile["med_success"] or comorbidity_set),
            "disease_cure_rate": round(
                (disease_info.get("cured", 0) + disease_info.get("improved", 0) * 0.7) /
                max(disease_info.get("total_cases", 1), 1) * 100, 1
            ) if disease_info else None,
        }

    def _calculate_recommendation_confidence(self, total_cases: int, age_matched_cases: int, disease_cases: int) -> float:
        """Compute confidence score in range [0, 1] from support size and patient similarity."""
        case_factor = min(total_cases / 30.0, 1.0)
        age_factor = min(age_matched_cases / 10.0, 1.0)
        disease_factor = min(disease_cases / 100.0, 1.0)
        confidence = 0.35 + 0.4 * case_factor + 0.15 * age_factor + 0.1 * disease_factor
        return round(min(confidence, 0.98), 3)

    def _build_history_profile(self, patient_history):
        """Summarize medicine outcomes from patient history for personalization."""
        med_success = {}
        med_failures = {}
        if not patient_history:
            return {"med_success": med_success, "med_failures": med_failures}

        for row in patient_history:
            meds = str(row.get("medications", "")).split("|")
            outcome = str(row.get("outcome", "")).upper().strip()
            score = 1.0 if outcome == "CURED" else (0.7 if outcome == "IMPROVED" else (0.2 if outcome == "NO_CHANGE" else 0.0))
            for med in meds:
                med = med.strip()
                if not med:
                    continue
                if score >= 0.7:
                    med_success[med] = med_success.get(med, 0.0) + score
                else:
                    med_failures[med] = med_failures.get(med, 0.0) + (1.0 - score)

        return {"med_success": med_success, "med_failures": med_failures}

    def _normalize_comorbidities(self, comorbidities):
        if comorbidities is None:
            return set()
        if isinstance(comorbidities, str):
            return {c.strip().lower() for c in comorbidities.split("|") if c.strip()} | {
                c.strip().lower() for c in comorbidities.split(",") if c.strip()
            }
        if isinstance(comorbidities, list):
            return {str(c).strip().lower() for c in comorbidities if str(c).strip()}
        return set()

    def _compute_personalization_adjustment(self, med, disease, history_profile, comorbidity_set):
        """Return score delta and reasons for personalized ranking."""
        delta = 0.0
        reasons = []

        if med in history_profile["med_success"]:
            bonus = min(history_profile["med_success"][med] * 1.5, 8.0)
            delta += bonus
            reasons.append("matched previous positive response")

        if med in history_profile["med_failures"]:
            penalty = min(history_profile["med_failures"][med] * 1.5, 10.0)
            delta -= penalty
            reasons.append("penalized due to prior weak outcome")

        med_l = med.lower()
        if "kidney" in " ".join(comorbidity_set) and "ibuprofen" in med_l:
            delta -= 6.0
            reasons.append("reduced for kidney comorbidity")
        if "liver" in " ".join(comorbidity_set) and "paracetamol" in med_l:
            delta -= 6.0
            reasons.append("reduced for liver comorbidity")
        if "heart" in " ".join(comorbidity_set) and "decongest" in med_l:
            delta -= 4.0
            reasons.append("reduced for cardiac comorbidity")

        return delta, reasons

    def _build_recommendation_explanation(self, med, base_score, final_score, reasons, stats):
        reason_text = "; ".join(reasons) if reasons else "ranked by observed outcomes and case support"
        return (
            f"{med}: base success {base_score:.1f}% from {stats['total']} similar cases; "
            f"personalized score {final_score:.1f}. {reason_text}."
        )

    def online_update(self, new_records):
        """Append new records and retrain model to incorporate latest outcomes."""
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
            "heart_rate", "temperature", "spo2", "medications", "outcome"
        ]
        missing = [c for c in required_cols if c not in new_df.columns]
        if missing:
            return {"updated": False, "message": f"Missing columns for online update: {missing}"}

        if self.df is None:
            merged = new_df
        else:
            merged = pd.concat([self.df, new_df], ignore_index=True)

        self._online_retrain_count += 1
        full_retrain_due = (self._online_retrain_count % self.full_retrain_every == 0)
        use_fast_mode = (self.online_retrain_mode == "fast" and not full_retrain_due)

        train_df = merged
        if use_fast_mode and len(merged) > self.max_online_history:
            train_df = merged.tail(self.max_online_history).copy()

        self.train(train_df, algorithm=self.algorithm)

        # Keep full data snapshot for future periodic full retrains.
        self.df = merged

        return {
            "updated": True,
            "new_records": len(new_df),
            "total_records": len(merged),
            "train_records": len(train_df),
            "mode": "full" if not use_fast_mode else "fast-window",
        }

    def add_feedback(self, recommendation_context: dict, chosen_medicine: str, outcome: str):
        """Store clinician/patient feedback and periodically retrain the model."""
        entry = {
            "disease": recommendation_context.get("disease", ""),
            "age": recommendation_context.get("age", 40),
            "gender": recommendation_context.get("gender", "Male"),
            "blood_group": recommendation_context.get("blood_group", "O+"),
            "bp_systolic": recommendation_context.get("bp_systolic", 130),
            "bp_diastolic": recommendation_context.get("bp_diastolic", 80),
            "heart_rate": recommendation_context.get("heart_rate", 80),
            "temperature": recommendation_context.get("temperature", 98.6),
            "spo2": recommendation_context.get("spo2", 97),
            "medications": chosen_medicine,
            "outcome": str(outcome).upper().strip(),
            "severity": recommendation_context.get("severity", "MODERATE"),
            "is_chronic": bool(recommendation_context.get("is_chronic", False)),
            "risk_factors": recommendation_context.get("risk_factors", ""),
        }
        self.feedback_log.append(entry)

        should_retrain = len(self.feedback_log) >= self.feedback_retrain_threshold
        if should_retrain:
            self.online_update(self.feedback_log)
            consumed = len(self.feedback_log)
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

        # 1. Direct mapping from symptom/synonym
        mapped = self._SYMPTOM_TO_DISEASE.get(query_lower)
        if mapped and mapped in self.disease_encoder.classes_:
            return mapped

        # 2. Substring match
        for d in self.disease_encoder.classes_:
            if query_lower in d.lower() or d.lower() in query_lower:
                return d

        # 3. Word overlap match
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
