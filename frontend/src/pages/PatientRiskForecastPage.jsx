import { useEffect, useMemo, useState } from "react";
import BackButton from "../components/BackButton.jsx";
import Spinner from "../components/Spinner.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import { buildRiskPatientHistory, getPatientOwnRecords } from "../services/riskPrediction.js";

const RISK_THEME = {
  HIGH: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    badge: "bg-red-500"
  },
  MODERATE: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badge: "bg-amber-500"
  },
  LOW: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    badge: "bg-emerald-500"
  }
};

const STATUS_THEME = {
  Important: "bg-red-100 text-red-700",
  Recommended: "bg-amber-100 text-amber-700",
  Good: "bg-emerald-100 text-emerald-700"
};

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function formatMonthYear(date) {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function levelToMonths(level) {
  if (level === "HIGH") return 1;
  if (level === "MODERATE") return 3;
  return 6;
}

export default function PatientRiskForecastPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [riskResult, setRiskResult] = useState(null);

  useEffect(() => {
    const loadRiskForecast = async () => {
      if (!user?.phoneNumber) {
        setError("Unable to identify patient profile");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [profileRes, recordsRes] = await Promise.all([
          api.get(`/patients/phone/${user.phoneNumber}`),
          api.get(`/records/patient/${user.phoneNumber}`)
        ]);

        const patientProfile = profileRes.data;
        const medicalRecords = getPatientOwnRecords(recordsRes.data || []);

        setProfile(patientProfile);
        setRecords(medicalRecords);

        if (!medicalRecords.length) {
          setRiskResult({ risks: [], history_records_analyzed: 0, patient_age: patientProfile?.age, patient_gender: patientProfile?.gender });
          return;
        }

        const patientHistory = buildRiskPatientHistory(medicalRecords);

        const { data } = await api.post("/ml/predict-risks", {
          patientHistory,
          age: patientProfile?.age || 30,
          gender: patientProfile?.gender === "Female" ? "Female" : "Male",
          bloodGroup: patientProfile?.bloodGroup || "O+"
        });
        setRiskResult(data);
      } catch (err) {
        setError(err.response?.data?.detail || err.response?.data?.error || err.message || "Failed to load risk forecast");
      } finally {
        setLoading(false);
      }
    };

    loadRiskForecast();
  }, [user?.phoneNumber]);

  const risks = useMemo(() => riskResult?.risks || [], [riskResult]);

  const habits = useMemo(() => {
    if (!risks.length) return [];
    const seen = new Set();
    const topPrecautions = [];
    risks.slice(0, 3).forEach((risk) => {
      (risk.precautions || []).forEach((p) => {
        if (!seen.has(p) && topPrecautions.length < 6) {
          seen.add(p);
          topPrecautions.push({
            habit: p,
            status: risk.risk_level === "HIGH" ? "Important" : risk.risk_level === "MODERATE" ? "Recommended" : "Good"
          });
        }
      });
    });
    return topPrecautions;
  }, [risks]);

  const screenings = useMemo(() => {
    if (!risks.length) return [];
    const now = new Date();
    return risks.slice(0, 4).map((risk) => {
      const months = levelToMonths(risk.risk_level);
      return {
        name: `${risk.disease} review`,
        due: risk.risk_level === "HIGH" ? "Monthly" : risk.risk_level === "MODERATE" ? "Quarterly" : "Every 6 months",
        next: formatMonthYear(addMonths(now, months))
      };
    });
  }, [risks]);

  if (loading) {
    return <Spinner label="Analyzing your medical history..." />;
  }

  return (
    <div className="space-y-6">
      <BackButton to="/patient" label="Back to dashboard" />

      <div className="card fade-up">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-600">AI Risk Forecast</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">My Health Risk Forecast</h1>
            <p className="mt-2 text-sm text-gray-600">
              Predictions based on your medical records, vitals, and diagnosis history.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
            Records analyzed: <span className="font-semibold text-gray-900">{riskResult?.history_records_analyzed ?? records.length}</span>
          </div>
        </div>
        {profile && (
          <p className="mt-4 text-xs text-gray-500">
            Profile used: {profile.gender || "Unknown"}, age {profile.age ?? "N/A"}, blood group {profile.bloodGroup || "N/A"}
          </p>
        )}
      </div>

      {error && (
        <div className="card border border-red-200 bg-red-50">
          <p className="text-sm text-red-700">{error}</p>
          <p className="mt-1 text-xs text-red-600">Make sure backend and ML service are running.</p>
        </div>
      )}

      {!error && risks.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {risks.map((risk, idx) => {
              const theme = RISK_THEME[risk.risk_level] || RISK_THEME.LOW;
              return (
                <div key={`${risk.disease}-${idx}`} className={`rounded-xl border p-4 ${theme.bg} ${theme.border}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold text-white ${theme.badge}`}>
                      {risk.risk_level}
                    </span>
                    <span className={`text-lg font-bold ${theme.text}`}>{risk.probability}%</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{risk.disease}</h3>
                  <div className="mt-3 h-2 w-full rounded-full bg-white/70">
                    <div className={`h-2 rounded-full ${theme.badge}`} style={{ width: `${Math.min(risk.probability, 100)}%` }} />
                  </div>

                  {/* SHAP Contributing Factors */}
                  {risk.top_factors && risk.top_factors.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/50">
                      <p className="text-xs font-medium text-gray-600 mb-2">Why this risk:</p>
                      <div className="space-y-1.5">
                        {risk.top_factors.slice(0, 3).map((factor, fIdx) => (
                          <div key={fIdx} className="flex items-center justify-between text-xs">
                            <span className="text-gray-700 truncate flex-1">{factor.factor}</span>
                            <span className={`ml-2 px-1.5 py-0.5 rounded text-white text-[10px] font-medium ${
                              factor.direction === "increases risk" ? "bg-red-500" : "bg-green-500"
                            }`}>
                              {factor.direction === "increases risk" ? "+" : "-"}{Math.abs(factor.impact).toFixed(0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {risk.confidence && (
                    <p className="mt-2 text-xs text-gray-500">Confidence: {risk.confidence}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="card">
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3v2H7l5 5 5-5h-2v-2c0-1.657-1.343-3-3-3z" />
                  </svg>
                </span>
                <h2 className="text-lg font-semibold text-gray-900">Recommended Habits</h2>
              </div>
              <div className="space-y-3">
                {habits.map((item, index) => (
                  <div key={`${item.habit}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3">
                    <p className="text-sm font-medium text-gray-800">{item.habit}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_THEME[item.status] || STATUS_THEME.Recommended}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z" />
                  </svg>
                </span>
                <h2 className="text-lg font-semibold text-gray-900">Screening Schedule</h2>
              </div>
              <div className="space-y-3">
                {screenings.map((screening, index) => (
                  <div key={`${screening.name}-${index}`} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{screening.name}</p>
                      <p className="text-xs text-gray-500">{screening.due}</p>
                    </div>
                    <span className="rounded-full border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700">
                      {screening.next}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {risks[0]?.advice && (
            <div className="card border border-amber-200 bg-amber-50">
              <p className="text-sm font-semibold text-amber-800">Priority Advice</p>
              <p className="mt-1 text-sm text-amber-700">{risks[0].advice}</p>
            </div>
          )}
        </>
      )}

      {!error && risks.length === 0 && (
        <div className="card">
          <div className="text-center py-10">
            <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">No significant risk detected</h2>
            <p className="mt-2 text-sm text-gray-600">
              {records.length === 0
                ? "Add medical records to generate your personalized risk forecast."
                : "Your latest records show low immediate risk. Continue routine checkups and healthy habits."}
            </p>
          </div>
        </div>
      )}

      <div className="card border border-yellow-200 bg-yellow-50">
        <div className="flex items-start gap-3">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-yellow-800">AI-Generated Insights</p>
            <p className="mt-1 text-sm text-yellow-700">
              These predictions are informational and should not replace professional medical advice. Please consult your doctor for diagnosis and treatment decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
