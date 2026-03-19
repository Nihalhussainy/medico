import { useState, useEffect, useCallback } from "react";
import api from "../services/api.js";
import Spinner from "./Spinner.jsx";
import { buildRiskPatientHistory } from "../services/riskPrediction.js";

/* SVG Icons */
const PillIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const FlaskIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WarningIcon = () => (
  <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const AiIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

/* Colour helpers */
const riskColour = {
  HIGH:     { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700",    badge: "bg-red-500"    },
  MODERATE: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700",  badge: "bg-amber-500"  },
  LOW:      { bg: "bg-emerald-50",border: "border-emerald-200",text: "text-emerald-700", badge: "bg-emerald-500"},
};

const sevColour = {
  SEVERE:   { bg: "bg-red-100",    text: "text-red-800",    dot: "bg-red-500"    },
  MODERATE: { bg: "bg-amber-100",  text: "text-amber-800",  dot: "bg-amber-500"  },
  MILD:     { bg: "bg-emerald-100",text: "text-emerald-800",dot: "bg-emerald-500"},
};

export default function AiInsightsPanel({ patient, history }) {
  const [activeTab, setActiveTab] = useState("recommend");
  const [collapsed, setCollapsed] = useState(false);

  /* Recommendation state */
  const [recDisease, setRecDisease]       = useState("");
  const [recommendations, setRecs]        = useState(null);
  const [recLoading, setRecLoading]       = useState(false);
  const [recError, setRecError]           = useState(null);

  /* Risk prediction state */
  const [risks, setRisks]                 = useState(null);
  const [riskLoading, setRiskLoading]     = useState(false);
  const [riskError, setRiskError]         = useState(null);

  /* Drug interaction state */
  const [intMeds, setIntMeds]             = useState("");
  const [interactions, setInteractions]   = useState(null);
  const [intLoading, setIntLoading]       = useState(false);
  const [intError, setIntError]           = useState(null);

  /* ML health */
  const [mlOnline, setMlOnline]           = useState(null);

  useEffect(() => {
    api.get("/ml/health").then(r => setMlOnline(r.data?.status === "ok")).catch(() => setMlOnline(false));
  }, []);

  /* Medicine Recommendation */
  const fetchRecommendations = useCallback(async () => {
    if (!recDisease.trim()) return;
    setRecLoading(true); setRecError(null); setRecs(null);
    try {
      const age = patient?.age ?? 30;
      const gender = patient?.gender === "Female" ? "Female" : "Male";
      const bloodGroup = patient?.bloodGroup || "O+";
      const allergies = [];
      const { data } = await api.post("/ml/recommend", {
        disease: recDisease.trim(),
        age, gender, bloodGroup, allergies, topK: 6
      });
      setRecs(data);
    } catch (e) {
      setRecError(e.response?.data?.detail || e.message || "Failed to fetch recommendations");
    } finally { setRecLoading(false); }
  }, [recDisease, patient]);

  /* Risk Prediction */
  const fetchRisks = useCallback(async () => {
    if (!history || history.length === 0) { setRiskError("No medical history available"); return; }
    setRiskLoading(true); setRiskError(null); setRisks(null);
    try {
      const patientHistory = buildRiskPatientHistory(history);
      const age = patient?.age ?? 30;
      const gender = patient?.gender === "Female" ? "Female" : "Male";
      const { data } = await api.post("/ml/predict-risks", {
        patientHistory, age, gender, bloodGroup: patient?.bloodGroup || "O+"
      });
      setRisks(data);
    } catch (e) {
      setRiskError(e.response?.data?.detail || e.message || "Failed to predict risks");
    } finally { setRiskLoading(false); }
  }, [history, patient]);

  /* Drug Interaction */
  const fetchInteractions = useCallback(async () => {
    const meds = intMeds.split(",").map(m => m.trim()).filter(Boolean);
    if (meds.length < 2) { setIntError("Enter at least 2 medicines separated by commas"); return; }
    setIntLoading(true); setIntError(null); setInteractions(null);
    try {
      const { data } = await api.post("/ml/check-interactions", { medications: meds });
      setInteractions(data);
    } catch (e) {
      setIntError(e.response?.data?.detail || e.message || "Failed to check interactions");
    } finally { setIntLoading(false); }
  }, [intMeds]);

  /* Render */
  if (mlOnline === null) return null;

  const tabs = [
    { id: "recommend",    label: "Medicine AI",       icon: <PillIcon /> },
    { id: "risks",        label: "Risk Prediction",   icon: <AlertIcon /> },
    { id: "interactions", label: "Drug Interactions", icon: <FlaskIcon /> },
  ];

  return (
    <div className="card fade-up overflow-hidden border border-gray-200 bg-white">
      {/* Header */}
      <button onClick={() => setCollapsed(c => !c)} className="flex w-full items-center justify-between text-left">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white">
            <AiIcon />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">AI Medical Insights</h2>
            <p className="text-xs text-gray-500">
              ML-powered recommendations - Trained on 5,000+ medical records
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${mlOnline ? "bg-emerald-400" : "bg-red-400"}`} />
          <span className="text-xs text-gray-500">{mlOnline ? "Online" : "Offline"}</span>
          <svg className={`h-5 w-5 text-gray-400 transition-transform ${collapsed ? "-rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {!collapsed && (
        <div className="mt-4 space-y-4">
          {!mlOnline && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              ML service is offline. Start the Python service with <code className="mx-1 rounded bg-amber-200 px-1 font-mono text-xs">python main.py</code> in the ml-service directory.
            </div>
          )}

          {/* Tab bar */}
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                  activeTab === t.id
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab: Medicine Recommendation */}
          {activeTab === "recommend" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Enter a diagnosis to get AI-recommended medicines based on similar past cases, patient age, and treatment outcomes.
              </p>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="e.g. Hypertension, Diabetes, Asthma"
                  value={recDisease}
                  onChange={e => setRecDisease(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && fetchRecommendations()}
                />
                <button
                  className="button whitespace-nowrap"
                  onClick={fetchRecommendations}
                  disabled={recLoading || !recDisease.trim() || !mlOnline}
                >
                  {recLoading ? <span className="spinner" /> : "Get Recommendations"}
                </button>
              </div>
              {recError && <p className="text-sm text-red-500">{recError}</p>}

              {recLoading && <div className="flex justify-center py-6"><Spinner /></div>}

              {recommendations && !recLoading && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Analyzed <strong>{recommendations.similar_cases || 0}</strong> similar cases</span>
                    <span>-</span>
                    <span>Age-matched: <strong>{recommendations.age_matched_cases || 0}</strong></span>
                  </div>

                  {recommendations.recommendations?.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {recommendations.recommendations.map((med, i) => (
                        <div key={i} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                          <div className="flex items-start justify-between">
                            <h4 className="font-semibold text-gray-800">{med.medicine}</h4>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-bold text-white ${
                              med.success_rate >= 80 ? "bg-emerald-500" :
                              med.success_rate >= 60 ? "bg-amber-500" : "bg-red-500"
                            }`}>
                              {med.success_rate}%
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {med.cases_used} cases - {med.cured_count} cured - {med.improved_count} improved
                          </p>
                          {med.allergy_warning && (
                            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                              <WarningIcon /> Allergy conflict detected
                            </p>
                          )}
                          {/* Success bar */}
                          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full transition-all ${
                                med.success_rate >= 80 ? "bg-emerald-400" :
                                med.success_rate >= 60 ? "bg-amber-400" : "bg-red-400"
                              }`}
                              style={{ width: `${med.success_rate}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No recommendations found for this diagnosis.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab: Risk Prediction */}
          {activeTab === "risks" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Analyzes the patient's complete medical history to predict future health risks with precautions.
              </p>
              <button
                className="button"
                onClick={fetchRisks}
                disabled={riskLoading || !history?.length || !mlOnline}
              >
                {riskLoading ? <span className="spinner" /> : "Analyze Patient Risks"}
              </button>
              {!history?.length && (
                <p className="text-sm text-amber-600">No medical history available to analyze.</p>
              )}
              {riskError && <p className="text-sm text-red-500">{riskError}</p>}

              {riskLoading && <div className="flex justify-center py-6"><Spinner /></div>}

              {risks && !riskLoading && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">
                    {risks.history_records_analyzed || 0} records analyzed for {risks.patient_gender}, age {risks.patient_age}
                  </p>

                  {risks.risks?.length > 0 ? (
                    risks.risks.map((r, i) => {
                      const c = riskColour[r.risk_level] || riskColour.LOW;
                      return (
                        <div key={i} className={`rounded-lg border p-4 ${c.bg} ${c.border}`}>
                          <div className="flex items-center justify-between">
                            <h4 className={`font-semibold ${c.text}`}>{r.disease}</h4>
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-bold text-white ${c.badge}`}>
                                {r.risk_level}
                              </span>
                              <span className={`text-lg font-bold ${c.text}`}>{r.probability}%</span>
                            </div>
                          </div>

                          {/* Risk bar */}
                          <div className="mt-2 h-2 w-full rounded-full bg-white/60">
                            <div
                              className={`h-full rounded-full ${c.badge}`}
                              style={{ width: `${Math.min(r.probability, 100)}%` }}
                            />
                          </div>

                          {/* Precautions */}
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Precautions</p>
                            <ul className="mt-1 space-y-0.5">
                              {r.precautions?.map((p, j) => (
                                <li key={j} className="flex items-start gap-1.5 text-sm text-gray-700">
                                  <span className="mt-1 text-xs">-</span>{p}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {r.advice && (
                            <div className="mt-2 rounded-lg bg-white/50 p-2 text-sm text-gray-700">
                              <strong>Advice:</strong> {r.advice}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
                      <div className="flex justify-center">
                        <CheckCircleIcon />
                      </div>
                      <p className="mt-1 font-medium text-emerald-700">No significant risks detected</p>
                      <p className="text-sm text-emerald-600">Continue regular checkups and healthy lifestyle.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab: Drug Interactions */}
          {activeTab === "interactions" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Check if a combination of medicines has any known dangerous interactions.
              </p>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="e.g. Warfarin, Aspirin, Metformin"
                  value={intMeds}
                  onChange={e => setIntMeds(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && fetchInteractions()}
                />
                <button
                  className="button whitespace-nowrap"
                  onClick={fetchInteractions}
                  disabled={intLoading || !intMeds.trim() || !mlOnline}
                >
                  {intLoading ? <span className="spinner" /> : "Check"}
                </button>
              </div>
              {intError && <p className="text-sm text-red-500">{intError}</p>}

              {intLoading && <div className="flex justify-center py-6"><Spinner /></div>}

              {interactions && !intLoading && (
                <div className="space-y-3">
                  {interactions.safe ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
                      <div className="flex justify-center">
                        <CheckCircleIcon />
                      </div>
                      <p className="mt-1 font-medium text-emerald-700">No interactions found</p>
                      <p className="text-sm text-emerald-600">
                        {interactions.pairs_checked} pairs checked - all safe.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Summary badges */}
                      <div className="flex gap-2 flex-wrap">
                        {interactions.severe_count > 0 && (
                          <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                            {interactions.severe_count} Severe
                          </span>
                        )}
                        {interactions.moderate_count > 0 && (
                          <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">
                            {interactions.moderate_count} Moderate
                          </span>
                        )}
                        {interactions.mild_count > 0 && (
                          <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
                            {interactions.mild_count} Mild
                          </span>
                        )}
                      </div>

                      {interactions.interactions.map((ix, i) => {
                        const c = sevColour[ix.severity] || sevColour.MILD;
                        return (
                          <div key={i} className={`rounded-lg border border-gray-200 p-4 ${c.bg}`}>
                            <div className="flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
                              <span className={`text-xs font-bold uppercase ${c.text}`}>{ix.severity}</span>
                            </div>
                            <h4 className="mt-1 font-semibold text-gray-800">
                              {ix.drug_a} + {ix.drug_b}
                            </h4>
                            <p className="mt-1 text-sm text-gray-700">{ix.effect}</p>
                            <p className="mt-1 text-xs text-gray-500"><strong>Mechanism:</strong> {ix.mechanism}</p>
                            <div className="mt-2 rounded-lg bg-white/80 p-2 text-sm text-gray-700">
                              <strong>Recommendation:</strong> {ix.recommendation}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
