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
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [cooldownPhone, setCooldownPhone] = useState("");
  const [message, setMessage] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    loadDoctorProfile();
  }, []);

  useEffect(() => {
    if (otpCooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

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
      const destinationEmail = response.data.destinationEmail;
      const targetText = destinationEmail ? ` to ${destinationEmail}` : " to patient's email";
      toast.success(`OTP sent successfully${targetText}`);
      setMessage(`OTP sent${targetText}. Expires at ${response.data.expiresAt}`);
      setOtpCooldown(60);
      setCooldownPhone(patientPhone);
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
        setOtpCode("");
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
        {/* Welcome Header */}
        <div className="card fade-up">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-teal-600">Clinical Workspace</p>
              {doctorProfile && !isLoadingProfile ? (
                <>
                  <h1 className="mt-1 text-2xl font-semibold text-gray-900">
                    Dr. {doctorProfile.firstName} {doctorProfile.lastName}
                  </h1>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    {doctorProfile.specialization && (
                      <span>{doctorProfile.specialization}</span>
                    )}
                    {doctorProfile.specialization && doctorProfile.hospitalName && (
                      <span className="text-gray-300">•</span>
                    )}
                    {doctorProfile.hospitalName && (
                      <span>{doctorProfile.hospitalName}</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="mt-1 space-y-2">
                  <div className="h-7 w-48 rounded bg-gray-200 skeleton" />
                  <div className="h-5 w-64 rounded bg-gray-200 skeleton" />
                </div>
              )}
            </div>
            <Link to="/doctor/profile" className="button-outline shrink-0">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Profile
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Patient Access Card */}
          <div className="card fade-up-delay-1 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Access Patient Records</h2>
                <p className="text-sm text-gray-500">Enter phone number and verify with OTP</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Patient Phone Number</label>
                <input
                  className="input"
                  placeholder="Enter 10-digit number"
                  inputMode="numeric"
                  pattern="\d{10}"
                  maxLength={10}
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                />
              </div>

              <button
                className="button w-full justify-center"
                onClick={requestConsent}
                type="button"
                disabled={isSending || patientPhone.length < 10 || (otpCooldown > 0 && cooldownPhone === patientPhone)}
              >
                {isSending && <span className="spinner" />}
                {isSending
                  ? "Sending..."
                  : otpCooldown > 0 && cooldownPhone === patientPhone
                    ? `Resend in ${otpCooldown}s`
                    : cooldownPhone === patientPhone
                      ? "Resend OTP"
                      : "Send OTP"}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Verify OTP
                  </span>
                </div>
              </div>

              <div>
                <label className="label">OTP Code</label>
                <input
                  className="input text-center text-lg tracking-widest font-mono"
                  placeholder="Enter 4-digit code"
                  inputMode="numeric"
                  maxLength={4}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                />
              </div>

              <button
                className="button-outline w-full justify-center"
                onClick={verifyConsent}
                type="button"
                disabled={isVerifying || !otpCode.trim()}
              >
                {isVerifying && <span className="spinner" />}
                {isVerifying ? "Verifying..." : "Verify & Open Records"}
              </button>
            </div>
          </div>

          {/* Quick Guide Card */}
          <div className="card fade-up-delay-2 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">How It Works</h2>
                <p className="text-sm text-gray-500">Patient consent verification process</p>
              </div>
            </div>

            <ol className="space-y-4">
              {[
                { step: 1, text: "Enter the patient's 10-digit phone number" },
                { step: 2, text: "Click 'Send OTP' - patient receives it via email" },
                { step: 3, text: "Ask the patient for the OTP code they received" },
                { step: 4, text: "Enter OTP and verify to access their records" }
              ].map((item) => (
                <li key={item.step} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-medium text-white">
                    {item.step}
                  </span>
                  <span className="text-sm text-gray-600 pt-0.5">{item.text}</span>
                </li>
              ))}
            </ol>

            <div className="rounded-lg bg-amber-50 p-4 border border-amber-100">
              <div className="flex gap-3">
                <svg className="h-5 w-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800">Consent Duration</p>
                  <p className="text-sm text-amber-700 mt-0.5">Valid until 11:59 PM on the day it's granted</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Link */}
        <Link to="/doctor/analytics" className="card card-hover group fade-up-delay-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Dashboard Analytics</h2>
              <p className="text-sm text-gray-500">View patient trends, demographics and insights</p>
            </div>
          </div>
          <svg className="h-5 w-5 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Status Message */}
        {message && (
          <div className="alert alert-info fade-in flex items-center gap-3">
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {message}
          </div>
        )}
      </div>
    </>
  );
}
