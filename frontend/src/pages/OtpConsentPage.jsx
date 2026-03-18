import { useState } from "react";
import api from "../services/api.js";
import { useToast } from "../components/Toast.jsx";

export default function OtpConsentPage() {
  const toast = useToast();
  const [patientPhone, setPatientPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const verify = async () => {
    setIsVerifying(true);
    try {
      const response = await api.post("/consent/verify", {
        patientPhoneNumber: patientPhone,
        otpCode
      });
      toast.success(`Consent status: ${response.data.status}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="card fade-up space-y-6">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-600 mb-4">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Verify Consent</h1>
          <p className="mt-1 text-sm text-gray-500">Enter patient details to confirm access</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Patient Phone Number</label>
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
          <div>
            <label className="label">OTP Code</label>
            <input
              className="input text-center tracking-widest font-mono text-lg"
              placeholder="Enter 4-digit OTP"
              inputMode="numeric"
              maxLength={4}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
            />
          </div>
          <button
            className="button w-full justify-center"
            onClick={verify}
            type="button"
            disabled={isVerifying || !patientPhone.trim() || !otpCode.trim()}
          >
            {isVerifying && <span className="spinner" />}
            {isVerifying ? "Verifying..." : "Verify OTP"}
          </button>
        </div>
      </div>
    </div>
  );
}
