import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import BackButton from "../components/BackButton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Spinner from "../components/Spinner.jsx";
import { useToast } from "../components/Toast.jsx";
import api from "../services/api.js";
import { buildRiskPatientHistory, getPatientOwnRecords } from "../services/riskPrediction.js";

const quickPrompts = [
  "How can I improve my sleep schedule?",
  "What should I do to reduce health risks?",
  "Give me a simple weekly fitness plan",
  "Suggest a healthy daily routine"
];

const normalizeText = (value) => (value || "").toLowerCase();

const generateRuleBasedAdvice = (question, profile, records, riskSummary) => {
  const text = normalizeText(question);
  const latest = records[0];
  const list = [];

  if (text.includes("sleep")) {
    list.push("Maintain a consistent sleep and wake time, even on weekends.");
    list.push("Avoid screens and caffeine for at least 1 hour before bedtime.");
  }

  if (text.includes("diet") || text.includes("food") || text.includes("nutrition")) {
    list.push("Use a plate plan: half vegetables, quarter protein, quarter whole grains.");
    list.push("Limit processed sugar and increase water intake through the day.");
  }

  if (text.includes("exercise") || text.includes("fitness") || text.includes("workout")) {
    list.push("Target 150 minutes of moderate activity per week plus two light strength sessions.");
    list.push("Start with brisk walking for 20-30 minutes if you are restarting activity.");
  }

  if (text.includes("risk") || text.includes("prevent") || text.includes("health")) {
    list.push("Track blood pressure, weight, and sleep each week to spot early trends.");
    list.push("Keep regular follow-ups and discuss any new symptoms early.");
  }

  if (latest?.advice) {
    list.push(`From your latest consultation: ${latest.advice}`);
  }

  if (profile?.bloodGroup) {
    list.push(`Profile context noted: blood group ${profile.bloodGroup}. Keep your emergency details updated.`);
  }

  if (riskSummary?.length > 0) {
    const highRisks = riskSummary.filter((risk) => risk.risk_level === "HIGH");
    if (highRisks.length > 0) {
      list.push(`Priority focus: ${highRisks.map((item) => item.disease).join(", ")}. Follow preventive guidance from your doctor.`);
    }
  }

  if (list.length === 0) {
    list.push("Build a sustainable routine: balanced meals, daily movement, hydration, and consistent sleep.");
    list.push("If symptoms persist, schedule a doctor follow-up with your recent reports.");
  }

  return list;
};

export default function PatientLifestyleChatPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [patientProfile, setPatientProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [mlOnline, setMlOnline] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskResult, setRiskResult] = useState(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi, I am your Health Assistant. Ask me about sleep, diet, fitness, or prevention and I will tailor tips to your profile and records."
    }
  ]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.phoneNumber) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const [recordsRes, profileRes] = await Promise.all([
          api.get(`/records/patient/${user.phoneNumber}`),
          api.get(`/patients/phone/${user.phoneNumber}`)
        ]);

        setRecords(getPatientOwnRecords(recordsRes.data || []));
        setPatientProfile(profileRes.data || null);

        try {
          const healthRes = await api.get("/ml/health");
          setMlOnline(healthRes.data?.status === "ok");
        } catch {
          setMlOnline(false);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load health assistant");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.phoneNumber]);

  const summary = useMemo(() => {
    const latest = records[0];
    return {
      totalConsultations: records.length,
      latestDiagnosis: latest?.diagnosis || "No diagnosis recorded yet",
      latestAdvice: latest?.advice || "No consultation advice available yet"
    };
  }, [records]);

  const runRiskAnalysis = async () => {
    if (!mlOnline) {
      toast.error("ML service is currently offline");
      return;
    }

    if (records.length === 0) {
      toast.error("No consultation history found for risk analysis");
      return;
    }

    setRiskLoading(true);
    try {
      const payload = {
        patientHistory: buildRiskPatientHistory(records),
        age: patientProfile?.age ?? 30,
        gender: patientProfile?.gender === "Female" ? "Female" : "Male",
        bloodGroup: patientProfile?.bloodGroup || "O+"
      };

      const { data } = await api.post("/ml/predict-risks", payload);
      setRiskResult(data || null);
      toast.success("Risk analysis updated");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to run risk analysis");
    } finally {
      setRiskLoading(false);
    }
  };

  const submitQuestion = () => {
    if (!question.trim()) return;

    const tips = generateRuleBasedAdvice(question, patientProfile, records, riskResult?.risks || []);
    const answer = tips.map((tip, index) => `${index + 1}. ${tip}`).join("\n");

    setMessages((prev) => [
      ...prev,
      { role: "user", text: question.trim() },
      { role: "assistant", text: answer }
    ]);
    setQuestion("");
  };

  if (isLoading) {
    return <Spinner label="Loading health assistant..." />;
  }

  if (!user?.phoneNumber) {
    return (
      <div className="space-y-6">
        <BackButton to="/patient" label="Back to dashboard" />
        <EmptyState
          title="Phone number missing"
          description="Please complete your profile with a valid phone number to use Health Assistant."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton to="/patient" label="Back to dashboard" />

      <div className="card fade-up">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">Personal Wellness</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">Health Assistant</h1>
            <p className="mt-2 text-sm text-gray-600">
              Ask practical health questions and get guidance tailored to your profile and records.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
            ML status: <span className={`font-semibold ${mlOnline ? "text-emerald-700" : "text-amber-700"}`}>{mlOnline ? "Online" : "Offline"}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card fade-up-delay-1 space-y-3 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Assistant Chat</p>

          <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "ml-auto max-w-[90%] bg-teal-600 text-white"
                    : "mr-auto max-w-[90%] bg-white text-gray-800"
                }`}
              >
                <pre className="whitespace-pre-wrap font-sans">{message.text}</pre>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-gray-500">Quick prompts</p>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="button-outline px-3 py-1.5 text-xs"
                  onClick={() => setQuestion(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="input"
              placeholder="Ask about sleep, diet, stress, exercise, or preventive care"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  submitQuestion();
                }
              }}
            />
            <button type="button" className="button" onClick={submitQuestion}>
              Ask
            </button>
          </div>
        </div>

        <div className="card fade-up-delay-2 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Health Snapshot</p>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Consultations</p>
            <p className="text-xl font-semibold text-gray-900">{summary.totalConsultations}</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Latest diagnosis</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{summary.latestDiagnosis}</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Latest doctor advice</p>
            <p className="mt-1 text-sm text-gray-700">{summary.latestAdvice}</p>
          </div>

          <button type="button" className="button w-full" onClick={runRiskAnalysis} disabled={riskLoading || !mlOnline}>
            {riskLoading ? "Analyzing..." : "Run AI Risk Check"}
          </button>

          {riskResult?.risks?.length > 0 && (
            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Risk Focus</p>
              {riskResult.risks.slice(0, 3).map((risk, index) => (
                <div key={`${risk.disease}-${index}`} className="rounded-md bg-white p-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{risk.disease}</p>
                    <span className="text-xs font-semibold text-amber-700">{risk.risk_level}</span>
                  </div>
                  <p className="text-xs text-gray-600">{risk.probability}% probability</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
