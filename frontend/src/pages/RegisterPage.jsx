import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";

const initialForm = {
  role: "PATIENT",
  email: "",
  phoneNumber: "",
  password: "",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  specialization: "",
  licenseNumber: "",
  hospitalName: ""
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long");
      toast.warning("Please use a stronger password (minimum 6 characters)");
      return;
    }

    setIsLoading(true);
    try {
      await register({
        ...form,
        dateOfBirth: form.dateOfBirth || null
      });
      toast.success("Registration successful! Your account has been created.");
      toast.info("Please sign in to continue.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-4">
      <div className="card fade-up">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">
            Join Medico to manage your healthcare records securely.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Role Selection */}
          <div>
            <label className="label">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, role: "PATIENT" }))}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                  form.role === "PATIENT"
                    ? "border-teal-600 bg-teal-50 text-teal-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Patient
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, role: "DOCTOR" }))}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                  form.role === "DOCTOR"
                    ? "border-teal-600 bg-teal-50 text-teal-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Doctor
              </button>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">First name</label>
              <input
                className="input"
                placeholder="John"
                value={form.firstName}
                onChange={update("firstName")}
                required
              />
            </div>
            <div>
              <label className="label">Last name</label>
              <input
                className="input"
                placeholder="Doe"
                value={form.lastName}
                onChange={update("lastName")}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                placeholder="you@example.com"
                type="email"
                value={form.email}
                onChange={update("email")}
                required
              />
            </div>
            <div>
              <label className="label">Phone number</label>
              <input
                className="input"
                placeholder="10-digit number"
                inputMode="numeric"
                pattern="\d{10}"
                maxLength={10}
                value={form.phoneNumber}
                onChange={update("phoneNumber")}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="Create a strong password"
              value={form.password}
              onChange={update("password")}
              required
            />
          </div>

          {/* Patient-specific fields */}
          {form.role === "PATIENT" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Date of birth</label>
                <input
                  className="input"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={update("dateOfBirth")}
                />
              </div>
              <div>
                <label className="label">Gender</label>
                <select className="input" value={form.gender} onChange={update("gender")}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* Doctor-specific fields */}
          {form.role === "DOCTOR" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Specialization</label>
                  <input
                    className="input"
                    placeholder="e.g., Cardiology"
                    value={form.specialization}
                    onChange={update("specialization")}
                    required
                  />
                </div>
                <div>
                  <label className="label">License number</label>
                  <input
                    className="input"
                    placeholder="Medical license #"
                    value={form.licenseNumber}
                    onChange={update("licenseNumber")}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Hospital name <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  className="input"
                  placeholder="Your hospital or clinic"
                  value={form.hospitalName}
                  onChange={update("hospitalName")}
                />
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="alert alert-error fade-in">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Already have an account?
            </Link>
            <button className="button" type="submit" disabled={isLoading}>
              {isLoading && <span className="spinner" />}
              {isLoading ? "Creating..." : "Create account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
