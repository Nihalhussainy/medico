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
  const [pendingVerifications, setPendingVerifications] = useState(0);
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

      const pending = (doctorsResponse.data || []).filter(
        (doctor) => doctor.verificationStatus === "PENDING"
      ).length;
      setPendingVerifications(pending);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-teal-600">Administration</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">Command Center</h1>
            <p className="mt-1 text-sm text-gray-500">Welcome, {user?.email}</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-medium">System Online</span>
          </div>
        </div>
      </div>

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

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="card fade-up-delay-1">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-2xl font-semibold text-gray-900">{doctors.length}</span>
          </div>
          <p className="mt-3 font-medium text-gray-900">Doctors</p>
          <p className="text-sm text-gray-500">Registered medical staff</p>
        </div>

        <Link to="/admin/doctor-verifications" className="card card-hover group fade-up-delay-2">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <span className="text-2xl font-semibold text-gray-900">{pendingVerifications}</span>
          </div>
          <p className="mt-3 font-medium text-gray-900">Doctor Verification</p>
          <p className="text-sm text-gray-500">Pending approvals</p>
        </Link>

        <Link to="/admin/blood-donation" className="card card-hover group fade-up-delay-3">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <svg className="h-5 w-5 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="mt-3 font-medium text-gray-900">Blood Requests</p>
          <p className="text-sm text-gray-500">Manage donation alerts</p>
        </Link>

        <div className="card fade-up-delay-4">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-2xl font-semibold text-gray-900">{patients.length}</span>
          </div>
          <p className="mt-3 font-medium text-gray-900">Patients</p>
          <p className="text-sm text-gray-500">Active patient accounts</p>
        </div>
      </div>

      {/* Data Tables */}
      {isLoading ? (
        <Spinner label="Loading data..." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Doctors Table */}
          <div className="card fade-up-delay-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Doctors</h2>
              <span className="pill">{doctors.length} total</span>
            </div>
            <div className="overflow-x-auto -mx-6 px-6">
              {doctors.length === 0 ? (
                <EmptyState title="No doctors found" description="No doctors have registered yet." />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      <th className="pb-3 pr-4">Name</th>
                      <th className="pb-3 pr-4">Specialization</th>
                      <th className="pb-3 pr-4 hide-mobile">Hospital</th>
                      <th className="pb-3">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {doctors.map((doctor) => (
                      <tr key={doctor.id} className="table-row">
                        <td className="py-3 pr-4 font-medium text-gray-900">{doctor.fullName}</td>
                        <td className="py-3 pr-4">
                          <span className="pill">{doctor.specialization}</span>
                        </td>
                        <td className="py-3 pr-4 hide-mobile text-gray-500">
                          {doctor.hospitalName || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3 text-gray-500">{doctor.phoneNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Patients Table */}
          <div className="card fade-up-delay-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Patients</h2>
              <span className="pill">{patients.length} total</span>
            </div>
            <div className="overflow-x-auto -mx-6 px-6">
              {patients.length === 0 ? (
                <EmptyState title="No patients found" description="No patients have registered yet." />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      <th className="pb-3 pr-4">Name</th>
                      <th className="pb-3 pr-4">Age</th>
                      <th className="pb-3 pr-4">Blood Group</th>
                      <th className="pb-3">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {patients.map((patient) => (
                      <tr key={patient.id} className="table-row">
                        <td className="py-3 pr-4 font-medium text-gray-900">{patient.fullName}</td>
                        <td className="py-3 pr-4">{patient.age ?? <span className="text-gray-300">—</span>}</td>
                        <td className="py-3 pr-4">
                          {patient.bloodGroup ? (
                            <span className="pill-red">{patient.bloodGroup}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="py-3 text-gray-500">{patient.phoneNumber}</td>
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
