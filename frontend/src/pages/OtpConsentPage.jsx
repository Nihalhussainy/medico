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
    <div className="mx-auto max-w-md space-y-6">
      <div className="card fade-up space-y-4">
        <div className="pill">Consent verify</div>
        <h1 className="text-2xl font-semibold">Confirm patient access</h1>
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
        <div>
          <label className="label">OTP code</label>
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
          className="button w-full"
          onClick={verify}
          type="button"
          disabled={isVerifying || !patientPhone.trim() || !otpCode.trim()}
        >
          {isVerifying && <span className="spinner" />}
          {isVerifying ? "Verifying..." : "Verify OTP"}
        </button>
      </div>
    </div>
  );
}
