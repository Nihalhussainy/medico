import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import PatientBloodNotifications from "../components/PatientBloodNotifications.jsx";

export default function PatientDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="card fade-up">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="pill">Personal vault</div>
            <h1 className="mt-4 text-2xl font-semibold">Patient portal</h1>
            <p className="text-slate-600">Hello, {user?.firstName || user?.email}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-700">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Secure session
            </div>
          </div>
        </div>
      </div>
      
      {/* Blood Donation Notifications */}
      <PatientBloodNotifications />

      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/patient/profile" className="card card-hover fade-up-delay-1 group">
          <div className="flex items-center justify-between">
            <span className="text-2xl">👤</span>
            <svg className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h2 className="mt-3 text-lg font-semibold">My Health Profile</h2>
          <p className="mt-1 text-sm text-slate-600">View and complete your profile with medical details.</p>
        </Link>
        <div className="card card-hover fade-up-delay-2">
          <span className="text-2xl">🔐</span>
          <h2 className="mt-3 text-lg font-semibold">Share OTP with doctor</h2>
          <p className="mt-1 text-sm text-slate-600">Give the OTP you receive to the doctor to unlock your records.</p>
        </div>
        <Link to={`/history/${user?.phoneNumber || '0'}`} className="card card-hover fade-up-delay-3 group">
          <div className="flex items-center justify-between">
            <span className="text-2xl">📋</span>
            <svg className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h2 className="mt-3 text-lg font-semibold">My medical history</h2>
          <p className="mt-1 text-sm text-slate-600">View your records timeline and clinical updates.</p>
        </Link>
      </div>
    </div>
  );
}
