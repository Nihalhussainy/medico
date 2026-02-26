import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const sessionExpired = useMemo(() => {
    return new URLSearchParams(location.search).get("session") === "expired";
  }, [location.search]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.firstName || user.email}!`);
      if (user.role === "ADMIN") navigate("/admin");
      if (user.role === "DOCTOR") navigate("/doctor");
      if (user.role === "PATIENT") navigate("/patient");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[1.2fr_1fr]">
      <div className="card fade-up space-y-6">
        <div>
          <div className="pill">Secure access</div>
          <h1 className="mt-4 text-3xl font-semibold">Welcome back</h1>
          <p className="text-sm text-slate-600">Enter the secure record vault with a verified identity.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          {sessionExpired && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              You have been logged out. Please log in again.
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 fade-in">
              {error}
            </div>
          )}
          <button className="button w-full" type="submit" disabled={isLoading}>
            {isLoading && <span className="spinner" />}
            {isLoading ? "Signing in..." : "Login"}
          </button>
        </form>
        <div className="text-sm text-slate-600">
          New here?{" "}
          <Link to="/register" className="font-medium text-emerald-700 hover:text-emerald-800 transition-colors">
            Create an account
          </Link>
        </div>
      </div>
      <div className="glass fade-up-delay-1 space-y-6 border border-emerald-500/20 p-8">
        <h2 className="text-xl font-semibold">Why Medico Cloud</h2>
        <ul className="space-y-4 text-sm text-slate-700">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] text-emerald-600">✓</span>
            OTP-gated access with consent trails.
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] text-emerald-600">✓</span>
            Encrypted JWT sessions and role policies.
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] text-emerald-600">✓</span>
            Timeline view of all clinical updates.
          </li>
        </ul>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">System status</p>
          <p className="mt-3 text-2xl font-semibold">Operational</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-600">All systems normal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
