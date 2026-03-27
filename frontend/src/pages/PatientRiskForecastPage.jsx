import { useEffect, useMemo, useState } from "react";
import BackButton from "../components/BackButton.jsx";
import Spinner from "../components/Spinner.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";
import { buildRiskPatientHistory, getPatientOwnRecords } from "../services/riskPrediction.js";
import { filterRecordsByProfile } from "../services/familyInsights.js";

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

function calculateAgeFromDOB(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

function selectedProfileName(selectedProfile, patientProfile, familyMembers) {
  if (selectedProfile.type === "patient") {
    return patientProfile?.fullName || "Self";
  }
  const member = familyMembers.find((item) => String(item.id) === String(selectedProfile.id));
  return member ? `${member.firstName} ${member.lastName}` : "Family Member";
}

function parseSystolic(vitals) {
  if (!vitals) return null;
  const match = String(vitals).match(/(\d{2,3})\s*\//);
  return match ? Number(match[1]) : null;
}

function getFactorEvidence(factor, selectedEntity, latestRecord) {
  const factorName = factor?.factor;
  const factorKey = String(factorName || "").toLowerCase();
  const rawValue = factor?.raw_value;
  const age = selectedEntity?.age ?? calculateAgeFromDOB(selectedEntity?.dateOfBirth);

  if (factorKey.includes("gender")) {
    return selectedEntity?.gender ? `Current value: ${selectedEntity.gender}` : null;
  }
  if (factorKey.includes("age")) {
    return age ? `Current value: ${age} years` : null;
  }
  if (factorKey.includes("blood")) {
    return selectedEntity?.bloodGroup ? `Current value: ${selectedEntity.bloodGroup}` : null;
  }
  if (factorKey.includes("systolic")) {
    const sys = parseSystolic(latestRecord?.vitals);
    return sys ? `Latest reading: ${sys} mmHg` : null;
  }
  if (factorKey.includes("primary diagnosis")) {
    return latestRecord?.diagnosis ? `Latest diagnosis: ${latestRecord.diagnosis}` : null;
  }
  if (factorKey.includes("chronic")) {
    if (rawValue && Number(rawValue) > 0) {
      return "Detected from long-term/chronic terms in record history";
    }
    return null;
  }

  if (typeof rawValue === "number") {
    return `Model value: ${rawValue}`;
  }

  return null;
}

export default function PatientRiskForecastPage() {
  const { user } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [riskLoading, setRiskLoading] = useState(false);
  const [error, setError] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState({ type: "patient", id: null });
  const [records, setRecords] = useState([]);
  const [riskResult, setRiskResult] = useState(null);

  useEffect(() => {
    const loadRiskData = async () => {
      if (!user?.phoneNumber) {
        setError("Unable to identify patient profile");
        setDataLoading(false);
        return;
      }

      try {
        setDataLoading(true);
        setError(null);

        const [profileRes, recordsRes] = await Promise.all([
          api.get(`/patients/phone/${user.phoneNumber}`),
          api.get(`/records/patient/${user.phoneNumber}`)
        ]);

        const loadedPatientProfile = profileRes.data;
        const allRecords = recordsRes.data || [];

        setPatientProfile(loadedPatientProfile);
        setRecords(allRecords);

        try {
          const familyRes = await api.get("/family/group");
          setFamilyMembers(familyRes.data?.members || []);
        } catch {
          setFamilyMembers([]);
        }
      } catch (err) {
        setError(err.response?.data?.detail || err.response?.data?.error || err.message || "Failed to load risk forecast");
      } finally {
        setDataLoading(false);
      }
    };

    loadRiskData();
  }, [user?.phoneNumber]);

  useEffect(() => {
    if (selectedProfile.type === "family") {
      const exists = familyMembers.some((member) => String(member.id) === String(selectedProfile.id));
      if (!exists) {
        setSelectedProfile({ type: "patient", id: null });
      }
    }
  }, [familyMembers, selectedProfile]);

  const filteredRecords = useMemo(() => filterRecordsByProfile(records, selectedProfile), [records, selectedProfile]);

  const latestRecord = useMemo(() => {
    if (!filteredRecords.length) return null;
    return [...filteredRecords].sort((a, b) => {
      const aDate = new Date(a?.recordDate || a?.createdAt || 0).getTime();
      const bDate = new Date(b?.recordDate || b?.createdAt || 0).getTime();
      return bDate - aDate;
    })[0];
  }, [filteredRecords]);

  const selectedEntity = useMemo(() => {
    if (selectedProfile.type === "patient") return patientProfile;
    return familyMembers.find((member) => String(member.id) === String(selectedProfile.id)) || null;
  }, [selectedProfile, patientProfile, familyMembers]);

  useEffect(() => {
    const loadRiskForecast = async () => {
      if (!selectedEntity) {
        setRiskResult({ risks: [], history_records_analyzed: 0, patient_age: null, patient_gender: null });
        return;
      }

      const derivedAge = selectedEntity?.age ?? calculateAgeFromDOB(selectedEntity?.dateOfBirth);
      const normalizedGender = selectedEntity?.gender === "Female" ? "Female" : "Male";
      const normalizedBloodGroup = selectedEntity?.bloodGroup || "O+";

      if (!filteredRecords.length) {
        setRiskResult({
          risks: [],
          history_records_analyzed: 0,
          patient_age: derivedAge,
          patient_gender: normalizedGender
        });
        return;
      }

      try {
        setRiskLoading(true);
        setError(null);

        const historyBase = selectedProfile.type === "patient"
          ? getPatientOwnRecords(filteredRecords)
          : filteredRecords;

        const patientHistory = buildRiskPatientHistory(historyBase);
        const { data } = await api.post("/ml/predict-risks", {
          patientHistory,
          age: derivedAge || 30,
          gender: normalizedGender,
          bloodGroup: normalizedBloodGroup
        });
        setRiskResult(data);
      } catch (err) {
        setError(err.response?.data?.detail || err.response?.data?.error || err.message || "Failed to load risk forecast");
      } finally {
        setRiskLoading(false);
      }
    };

    if (!dataLoading) {
      loadRiskForecast();
    }
  }, [dataLoading, filteredRecords, selectedEntity, selectedProfile.type]);

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

  if (dataLoading || riskLoading) {
    return <Spinner label="Analyzing medical history for risk forecast..." />;
  }

  return (
    <div className="space-y-6">
      <BackButton to="/patient" label="Back to dashboard" />

      <div className="card fade-up">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-600">AI Risk Forecast</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">
              {selectedProfile.type === "patient"
                ? "My Health Risk Forecast"
                : `${selectedProfileName(selectedProfile, patientProfile, familyMembers)}'s Health Risk Forecast`}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Predictions based on your medical records, vitals, and diagnosis history.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
            Records analyzed: <span className="font-semibold text-gray-900">{riskResult?.history_records_analyzed ?? filteredRecords.length}</span>
          </div>
        </div>

        {familyMembers.length > 0 && (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">View forecast for</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  selectedProfile.type === "patient"
                    ? "bg-teal-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setSelectedProfile({ type: "patient", id: null })}
              >
                {patientProfile?.fullName || "Self"} (Self)
              </button>
              {familyMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    selectedProfile.type === "family" && String(selectedProfile.id) === String(member.id)
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedProfile({ type: "family", id: member.id })}
                >
                  {member.firstName} {member.lastName} ({member.relationship})
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedEntity && (
          <p className="mt-4 text-xs text-gray-500">
            Profile used: {selectedEntity.gender || "Unknown"}, age {selectedEntity.age ?? calculateAgeFromDOB(selectedEntity.dateOfBirth) ?? "N/A"}, blood group {selectedEntity.bloodGroup || "N/A"}
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
                      <p className="mb-2 text-xs font-medium text-gray-600">Model signals from your data:</p>
                      <div className="space-y-2">
                        {risk.top_factors
                          .filter((factor) => factor?.direction !== "decreases risk")
                          .slice(0, 3)
                          .map((factor, fIdx) => (
                          <div key={fIdx} className="rounded-md bg-white/50 px-2 py-1.5 text-xs">
                            <p className="font-medium text-gray-800">{factor.factor}</p>
                            {getFactorEvidence(factor, selectedEntity, latestRecord) && (
                              <p className="mt-0.5 text-gray-600">{getFactorEvidence(factor, selectedEntity, latestRecord)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] text-gray-500">
                        These are contributing signals, not guaranteed causes.
                      </p>
                    </div>
                  )}

                  {risk.reasoning && risk.reasoning.length > 0 && (
                    <div className="mt-3 rounded-md bg-white/60 p-2 text-xs text-gray-700">
                      <p className="font-medium text-gray-800">Why this risk appears:</p>
                      <ul className="mt-1 list-disc pl-4">
                        {risk.reasoning.slice(0, 3).map((reason, ridx) => (
                          <li key={ridx}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {risk.confidence && (
                    <p className="mt-2 text-xs text-gray-500">
                      Confidence: {risk.confidence} (based on consistency of similar records)
                    </p>
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
              {filteredRecords.length === 0
                ? `Add medical records for ${selectedProfileName(selectedProfile, patientProfile, familyMembers)} to generate a personalized risk forecast.`
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
