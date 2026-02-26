import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import Spinner from "../components/Spinner.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setError(null);
    try {
      const [doctorsResponse, patientsResponse] = await Promise.all([
        api.get("/admin/doctors"),
        api.get("/admin/patients")
      ]);
      setDoctors(doctorsResponse.data);
      setPatients(patientsResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin overview");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card fade-up">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="pill">Governance</div>
            <h1 className="mt-4 text-2xl font-semibold">Admin command center</h1>
            <p className="mt-2 text-slate-600">Welcome, {user?.email}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-700">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Compliance dashboard
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 fade-in">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card card-hover fade-up-delay-1">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">Doctors</p>
            <span className="text-2xl font-bold text-emerald-600">{doctors.length}</span>
          </div>
          <p className="mt-3 text-lg font-semibold">Medical staff</p>
          <p className="mt-1 text-sm text-slate-600">Registered doctors & specialists.</p>
        </div>
        <Link to="/admin/blood-donation" className="card card-hover fade-up-delay-2 group">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-red-600">🩸 Blood</p>
            <svg className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="mt-3 text-lg font-semibold">Blood donation requests</p>
          <p className="mt-1 text-sm text-slate-600">Create urgent blood requests and manage donors.</p>
        </Link>
        <div className="card card-hover fade-up-delay-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">Patients</p>
            <span className="text-2xl font-bold text-emerald-600">{patients.length}</span>
          </div>
          <p className="mt-3 text-lg font-semibold">Registered patients</p>
          <p className="mt-1 text-sm text-slate-600">Active patient accounts in system.</p>
        </div>
      </div>

      {/* Data Tables */}
      {isLoading ? (
        <Spinner label="Loading admin data..." />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Doctors Table */}
          <div className="card fade-up-delay-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Doctors</h2>
              <span className="pill">{doctors.length} total</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              {doctors.length === 0 ? (
                <EmptyState title="No doctors found" description="No doctors have registered yet." />
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Specialization</th>
                      <th className="py-2 pr-4 hide-mobile">Hospital</th>
                      <th className="py-2 pr-4">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700">
                    {doctors.map((doctor) => (
                      <tr key={doctor.id} className="table-row">
                        <td className="py-2.5 pr-4 font-medium">{doctor.fullName}</td>
                        <td className="py-2.5 pr-4">
                          <span className="pill">{doctor.specialization}</span>
                        </td>
                        <td className="py-2.5 pr-4 hide-mobile">{doctor.hospitalName || <span className="text-slate-400">-</span>}</td>
                        <td className="py-2.5 pr-4 text-slate-500">{doctor.phoneNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Patients Table */}
          <div className="card fade-up-delay-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Patients</h2>
              <span className="pill">{patients.length} total</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              {patients.length === 0 ? (
                <EmptyState title="No patients found" description="No patients have registered yet." />
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Age</th>
                      <th className="py-2 pr-4">Blood Group</th>
                      <th className="py-2 pr-4">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700">
                    {patients.map((patient) => (
                      <tr key={patient.id} className="table-row">
                        <td className="py-2.5 pr-4 font-medium">{patient.fullName}</td>
                        <td className="py-2.5 pr-4">{patient.age ?? <span className="text-slate-400">-</span>}</td>
                        <td className="py-2.5 pr-4">
                          {patient.bloodGroup ? (
                            <span className="pill-red">{patient.bloodGroup}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-slate-500">{patient.phoneNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
