import { useEffect, useMemo, useState } from "react";
import api from "../services/api.js";
import Spinner from "../components/Spinner.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { useToast } from "../components/Toast.jsx";
import { useConfirm } from "../components/ConfirmDialog.jsx";

export default function AdminDoctorVerificationPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [noteByDoctor, setNoteByDoctor] = useState({});
  const [doctors, setDoctors] = useState([]);

  const pendingCount = useMemo(
    () => doctors.filter((d) => d.verificationStatus === "PENDING").length,
    [doctors]
  );

  const loadQueue = async () => {
    setError(null);
    try {
      setIsLoading(true);
      const query = statusFilter === "ALL" ? "" : `?status=${statusFilter}`;
      const response = await api.get(`/admin/doctor-verifications${query}`);
      setDoctors(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load verification queue");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [statusFilter]);

  const handleAction = async (doctor, action) => {
    const note = (noteByDoctor[doctor.id] || "").trim();
    const actionLabel = action === "approve" ? "approve" : "reject";
    const title = action === "approve" ? "Approve Doctor" : "Reject Doctor";
    const confirmed = await confirm(
      `Are you sure you want to ${actionLabel} Dr. ${doctor.fullName}?`,
      title
    );
    if (!confirmed) return;

    try {
      setIsActing(true);
      await api.post(`/admin/doctor-verifications/${doctor.id}/${action}`, {
        note: note || null
      });
      toast.success(`Doctor ${actionLabel}d successfully.`);
      await loadQueue();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${actionLabel} doctor`);
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card fade-up">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-600">Admin Verification</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">Doctor Verification Queue</h1>
            <p className="mt-1 text-sm text-gray-500">Review doctor credentials and approve or reject access.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Pending: <span className="font-semibold">{pendingCount}</span>
            </div>
            <select
              className="input !w-44"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              disabled={isLoading || isActing}
            >
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="ALL">All</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <Spinner label="Loading doctor verification queue..." />
      ) : doctors.length === 0 ? (
        <EmptyState
          title="No doctors in this queue"
          description="No doctor accounts match the selected verification status."
        />
      ) : (
        <div className="space-y-4">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="card space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Dr. {doctor.fullName}</h2>
                  <p className="mt-1 text-sm text-gray-600">{doctor.email} | {doctor.phoneNumber}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="pill">{doctor.specialization || "No specialization"}</span>
                    <span className="pill-blue">License: {doctor.licenseNumber || "N/A"}</span>
                    <span className="pill-amber">Status: {doctor.verificationStatus || "LEGACY"}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  <p>Hospital: {doctor.hospitalName || "Not provided"}</p>
                  <p>Registered: {doctor.registeredAt ? new Date(doctor.registeredAt).toLocaleString() : "N/A"}</p>
                  <p>Verified by: {doctor.verifiedByEmail || "N/A"}</p>
                  <p>Verified at: {doctor.verifiedAt ? new Date(doctor.verifiedAt).toLocaleString() : "N/A"}</p>
                </div>
              </div>

              {(doctor.verificationStatus === "REJECTED" || doctor.verificationStatus === "APPROVED") && doctor.verificationNote && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                  <span className="font-medium">Admin note:</span> {doctor.verificationNote}
                </div>
              )}

              <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                <textarea
                  className="input min-h-24"
                  placeholder="Optional note for approval/rejection"
                  value={noteByDoctor[doctor.id] || ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setNoteByDoctor((prev) => ({ ...prev, [doctor.id]: value }));
                  }}
                  disabled={isActing}
                />
                <button
                  type="button"
                  className="button"
                  onClick={() => handleAction(doctor, "approve")}
                  disabled={isActing}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="button-danger"
                  onClick={() => handleAction(doctor, "reject")}
                  disabled={isActing}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
