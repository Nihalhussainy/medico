import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import RecentPatientsSidebar from "../components/RecentPatientsSidebar.jsx";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [patientPhone, setPatientPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    loadDoctorProfile();
  }, []);

  const loadDoctorProfile = async () => {
    try {
      const response = await api.get("/doctors/me");
      setDoctorProfile(response.data);
    } catch (err) {
      console.error("Failed to load doctor profile:", err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const requestConsent = async () => {
    setMessage(null);
    setIsSending(true);
    try {
      const response = await api.post("/consent/request", { patientPhoneNumber: patientPhone });
      toast.success("OTP sent to patient!");
      setMessage(`OTP sent. Expires at ${response.data.expiresAt}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsSending(false);
    }
  };

  const verifyConsent = async () => {
    setMessage(null);
    setIsVerifying(true);
    try {
      const response = await api.post("/consent/verify", {
        patientPhoneNumber: patientPhone,
        otpCode
      });
      if (response.data.status === "VERIFIED") {
        toast.success("Consent verified!");
        navigate(`/doctor/patient/${patientPhone}`);
        return;
      }
      const validUntil = response.data.consentValidUntil ? ` Valid until ${response.data.consentValidUntil}` : "";
      setMessage(`Consent status: ${response.data.status}.${validUntil}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      <RecentPatientsSidebar />
      <div className="space-y-6">
        <div className="card-accent fade-up">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="pill">Clinical access</div>
              <h1 className="mt-4 text-2xl font-semibold">Doctor workspace</h1>
              <p className="text-slate-600">Signed in as {user?.email}</p>
              {doctorProfile && !isLoadingProfile && (
                <p className="mt-2 text-sm text-slate-500">
                  <span className="font-medium text-slate-700">{doctorProfile.specialization}</span>
                  {doctorProfile.hospitalName && (
                    <> at <span className="font-medium text-slate-700">{doctorProfile.hospitalName}</span></>
                  )}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Link to="/doctor/profile" className="button-outline text-sm">
                My profile
              </Link>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-700">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Consent required
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="card-teal fade-up-delay-1 space-y-4">
            <h2 className="text-xl font-semibold">Access patient records</h2>
            <p className="text-sm text-slate-600">Enter the patient's phone number and verify with OTP.</p>

            <div>
              <label className="label">Patient phone number</label>
              <input
                className="input"
                placeholder="10-digit phone number"
                inputMode="numeric"
                pattern="\d{10}"
                maxLength={10}
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
              />
            </div>
            <button
              className="button w-full"
              onClick={requestConsent}
              type="button"
              disabled={isSending || patientPhone.length < 10}
            >
              {isSending && <span className="spinner" />}
              {isSending ? "Sending..." : "Send OTP request"}
            </button>

            <div className="border-t border-slate-200 pt-4">
              <label className="label">OTP from patient</label>
              <input
                className="input"
                placeholder="4-digit OTP"
                inputMode="numeric"
                maxLength={4}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
              />
            </div>
            <button
              className="button-outline w-full"
              onClick={verifyConsent}
              type="button"
              disabled={isVerifying || !otpCode.trim()}
            >
              {isVerifying && <span className="spinner" />}
              {isVerifying ? "Verifying..." : "Verify OTP & Open Records"}
            </button>
          </div>

          <div className="card-blue fade-up-delay-2 space-y-4">
            <h2 className="text-xl font-semibold">Quick guide</h2>
            <div className="space-y-3">
              {[
                { step: "1", text: "Enter the patient's 10-digit phone number" },
                { step: "2", text: "Click 'Send OTP request' - patient receives a 4-digit code" },
                { step: "3", text: "Ask the patient for the OTP and enter it above" },
                { step: "4", text: "Click 'Verify' to access their medical records" }
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {item.step}
                  </span>
                  <p className="text-sm text-slate-600 pt-1">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Consent is valid until 11:59 PM on the day it's granted.
            </div>
          </div>
        </div>

        {message && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 fade-in">
            {message}
          </div>
        )}
      </div>
    </>
  );
}
