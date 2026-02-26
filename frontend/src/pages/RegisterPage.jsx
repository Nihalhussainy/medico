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
    setIsLoading(true);
    try {
      await register({
        ...form,
        dateOfBirth: form.dateOfBirth || null
      });
      toast.success("Account created! Please log in.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="card fade-up">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="pill">Identity creation</div>
            <h1 className="mt-4 text-2xl font-semibold">Create your Medico profile</h1>
            <p className="text-sm text-slate-600">Choose a role to shape the workspace experience.</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-700">
            HIPAA-ready consent flow
          </div>
        </div>
        <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label">Role</label>
            <div className="grid grid-cols-2 gap-3">
              {["PATIENT", "DOCTOR"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, role: r }))}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                    form.role === r
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {r === "PATIENT" ? "🧑 Patient" : "🩺 Doctor"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">First name</label>
            <input className="input" placeholder="John" value={form.firstName} onChange={update("firstName")} required />
          </div>
          <div>
            <label className="label">Last name</label>
            <input className="input" placeholder="Doe" value={form.lastName} onChange={update("lastName")} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" placeholder="you@example.com" type="email" value={form.email} onChange={update("email")} required />
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
          <div className={form.role === "PATIENT" ? "" : "md:col-span-2"}>
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={update("password")} required />
          </div>

          {form.role === "PATIENT" && (
            <>
              <div>
                <label className="label">Date of birth</label>
                <input className="input" type="date" value={form.dateOfBirth} onChange={update("dateOfBirth")} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Gender</label>
                <select className="input" value={form.gender} onChange={update("gender")}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </>
          )}

          {form.role === "DOCTOR" && (
            <>
              <div>
                <label className="label">Specialization</label>
                <input className="input" placeholder="e.g., Cardiology" value={form.specialization} onChange={update("specialization")} required />
              </div>
              <div>
                <label className="label">License number</label>
                <input className="input" placeholder="Medical license #" value={form.licenseNumber} onChange={update("licenseNumber")} required />
              </div>
              <div className="md:col-span-2">
                <label className="label">Hospital name (optional)</label>
                <input className="input" placeholder="Your hospital or clinic" value={form.hospitalName} onChange={update("hospitalName")} />
              </div>
            </>
          )}

          {error && (
            <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 fade-in">
              {error}
            </div>
          )}
          <div className="md:col-span-2 flex items-center justify-between pt-2">
            <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
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
