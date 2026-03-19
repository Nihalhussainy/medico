import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { useToast } from "../components/Toast.jsx";
import RecentPatientsSidebar from "../components/RecentPatientsSidebar.jsx";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [patientPhone, setPatientPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [cooldownPhone, setCooldownPhone] = useState("");
  const [message, setMessage] = useState(null);
  const [sentToEmail, setSentToEmail] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const otpInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

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
      setSentToEmail(destinationEmail || null);
      setOtpSent(true);
      toast.success(`OTP sent successfully to ${destinationEmail || "patient's email"}`);
      setOtpCooldown(60);
      setCooldownPhone(patientPhone);
      // Auto-focus to first OTP input
      setTimeout(() => {
        otpInputRefs[0].current?.focus();
      }, 100);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
      setOtpSent(false);
    } finally {
      setIsSending(false);
    }
  };

  const verifyConsent = async () => {
    const otpCode = otpDigits.join("");
    setMessage(null);
    setIsVerifying(true);
    try {
      const response = await api.post("/consent/verify", {
        patientPhoneNumber: patientPhone,
        otpCode
      });
      if (response.data.status === "VERIFIED") {
        toast.success("Consent verified!");
        setOtpDigits(["", "", "", ""]);
        setOtpSent(false);
        setSentToEmail(null);
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

  const handleOtpChange = (index, value) => {
    // Only allow single digit
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = digit;
    setOtpDigits(newOtpDigits);

    // Auto-focus to next input if digit entered
    if (digit && index < 3) {
      otpInputRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Handle backspace - move to previous input if current is empty
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
    // Handle arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
    if (e.key === "ArrowRight" && index < 3) {
      otpInputRefs[index + 1].current?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pastedData) {
      const newOtpDigits = ["", "", "", ""];
      for (let i = 0; i < pastedData.length; i++) {
        newOtpDigits[i] = pastedData[i];
      }
      setOtpDigits(newOtpDigits);
      // Focus on the appropriate input after paste
      const focusIndex = Math.min(pastedData.length, 3);
      otpInputRefs[focusIndex].current?.focus();
    }
  };

  return (
    <>
      <RecentPatientsSidebar />
      <div className="space-y-4">
        {/* Welcome Header */}
        <div className="card fade-up !py-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              {doctorProfile?.profilePictureUrl ? (
                <img
                  src={doctorProfile.profilePictureUrl}
                  alt="Doctor profile"
                  className="h-14 w-14 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xl font-semibold text-white">
                  {doctorProfile?.firstName?.charAt(0)?.toUpperCase() || "D"}
                </div>
              )}

              <div>
              <p className="text-xs font-medium text-teal-600 uppercase tracking-wider">Clinical Workspace</p>
              {doctorProfile && !isLoadingProfile ? (
                <>
                  <h1 className="mt-1 text-lg font-semibold text-gray-900">
                    Dr. {doctorProfile.firstName} {doctorProfile.lastName}
                  </h1>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {doctorProfile.specialization && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-medium">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        {doctorProfile.specialization}
                      </span>
                    )}
                    {doctorProfile.hospitalName && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {doctorProfile.hospitalName}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="mt-1 space-y-1.5">
                  <div className="h-5 w-40 rounded bg-gray-100 skeleton" />
                  <div className="flex gap-2">
                    <div className="h-5 w-20 rounded-full bg-gray-100 skeleton" />
                    <div className="h-5 w-28 rounded-full bg-gray-100 skeleton" />
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>

        {/* Patient Consent Card - Two Column Layout */}
        <div className="card fade-up-delay-1 !py-5">
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Left Side - Form */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Access Patient Records</h2>
                  <p className="text-xs text-gray-500">Enter phone number and verify with OTP</p>
                </div>
              </div>

              {/* Phone Input */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-2 block">Patient Phone Number</label>
                <div className="flex">
                  <div className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg text-sm font-medium text-gray-600">+91</div>
                  <input
                    className="flex-1 px-4 py-3 text-sm border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none rounded-r-lg"
                    placeholder="Enter 10-digit number"
                    inputMode="numeric"
                    maxLength={10}
                    value={patientPhone}
                    onChange={(e) => {
                      setPatientPhone(e.target.value.replace(/\D/g, ""));
                      if (e.target.value !== patientPhone) {
                        setOtpSent(false);
                        setSentToEmail(null);
                        setOtpDigits(["", "", "", ""]);
                      }
                    }}
                  />
                </div>
                {/* OTP Success - shown right below phone input */}
                {otpSent && sentToEmail && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1.5 animate-fade-in font-medium">
                    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    OTP sent to <span className="text-green-700">{sentToEmail}</span>
                  </p>
                )}
              </div>

              {/* Send OTP Button */}
              <button
                className="w-full px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg transition-colors"
                onClick={requestConsent}
                type="button"
                disabled={isSending || patientPhone.length < 10 || (otpCooldown > 0 && cooldownPhone === patientPhone)}
              >
                {isSending ? (
                  <span className="flex items-center justify-center gap-2"><span className="spinner" /> Sending...</span>
                ) : otpCooldown > 0 && cooldownPhone === patientPhone ? (
                  `Resend in ${otpCooldown}s`
                ) : (
                  "Send OTP"
                )}
              </button>

              {/* VERIFY OTP Section */}
              {otpSent && (
                <div className="pt-2">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Verify OTP</p>

                  {/* OTP Input - Dot Style */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-2 block">OTP from Patient</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        value={otpDigits.join("")}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").slice(0, 4).split("");
                          while (digits.length < 4) digits.push("");
                          setOtpDigits(digits);
                          if (digits.every(d => d)) {
                            otpInputRefs[3].current?.blur();
                          }
                        }}
                        className="w-full px-3 py-2 text-center text-base font-bold tracking-[5px] bg-white border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-lg outline-none transition-all"
                        style={{
                          letterSpacing: "5px"
                        }}
                        placeholder="- - - -"
                      />
                    </div>
                  </div>

                  {/* Verify Button */}
                  <button
                    className="w-full mt-4 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    onClick={verifyConsent}
                    type="button"
                    disabled={isVerifying || otpDigits.some(d => !d)}
                  >
                    {isVerifying ? (
                      <>
                        <span className="spinner" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Verify & Open Records
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Right Side - Quick Guide */}
            <div className="lg:col-span-2 lg:border-l lg:border-gray-200 lg:pl-6 space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-semibold text-gray-900">Quick Guide</p>
                </div>
                <p className="text-xs text-gray-600 mb-4">How to access patient records</p>

                <ol className="space-y-3">
                  {[
                    { num: 1, title: "Enter Phone", desc: "Patient's 10-digit number" },
                    { num: 2, title: "Click 'Send OTP'", desc: "Patient receives code via email" },
                    { num: 3, title: "Ask Patient", desc: "Request the OTP code" },
                    { num: 4, title: "Verify", desc: "Enter OTP and access records" }
                  ].map((step) => (
                    <li key={step.num} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white text-xs font-bold">{step.num}</span>
                      <div className="pt-0.5">
                        <p className="text-sm font-medium text-gray-800">{step.title}</p>
                        <p className="text-xs text-gray-600">{step.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Consent Duration Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                <div className="flex items-start gap-3">
                  <div className="text-2xl mt-0.5">⏱️</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Consent Duration</p>
                    <p className="text-xs text-gray-700 mt-1">Valid until 11:59 PM on the day granted</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className="alert alert-info fade-in flex items-center gap-2 text-sm">
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {message}
          </div>
        )}
      </div>
    </>
  );
}
