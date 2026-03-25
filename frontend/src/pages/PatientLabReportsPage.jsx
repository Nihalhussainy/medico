import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import BackButton from "../components/BackButton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Spinner from "../components/Spinner.jsx";
import { useToast } from "../components/Toast.jsx";
import api from "../services/api.js";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
};

const profileLabel = (selected, profile, familyMembers) => {
  if (selected.type === "patient") {
    return profile?.fullName || "Self";
  }
  const member = familyMembers.find((item) => item.id === selected.id);
  return member ? `${member.firstName} ${member.lastName}` : "Family Member";
};

export default function PatientLabReportsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [patientProfile, setPatientProfile] = useState(null);
  const [labReports, setLabReports] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState({ type: "patient", id: null });
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.phoneNumber) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const [reportsRes, profileRes] = await Promise.all([
          api.get("/lab-reports/mine"),
          api.get(`/patients/phone/${user.phoneNumber}`)
        ]);

        setLabReports(reportsRes.data || []);
        setPatientProfile(profileRes.data || null);

        try {
          const familyRes = await api.get("/family/group");
          setFamilyMembers(familyRes.data?.members || []);
        } catch {
          setFamilyMembers([]);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load lab reports");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.phoneNumber]);

  const filteredLabFiles = useMemo(() => {
    if (selectedProfile.type === "patient") {
      return (labReports || []).filter((file) => !file.familyMemberId);
    }
    return (labReports || []).filter((file) => file.familyMemberId === selectedProfile.id);
  }, [labReports, selectedProfile]);

  const latestReport = filteredLabFiles[0] || null;
  const reportsThisYear = filteredLabFiles.filter((file) => {
    const year = new Date(file.recordDate).getFullYear();
    return year === new Date().getFullYear();
  }).length;

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error("Select a lab report file first");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      await api.post("/lab-reports/mine", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const reportsRes = await api.get("/lab-reports/mine");
      setLabReports(reportsRes.data || []);
      setUploadFile(null);
      toast.success("Lab report uploaded successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload lab report");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return <Spinner label="Loading lab reports..." />;
  }

  if (!user?.phoneNumber) {
    return (
      <div className="space-y-6">
        <BackButton to="/patient" label="Back to dashboard" />
        <EmptyState
          title="Phone number missing"
          description="Please complete your profile with a valid phone number to access lab reports."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton to="/patient" label="Back to dashboard" />

      <div className="card fade-up">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-600">Diagnostics</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">Lab Reports</h1>
            <p className="mt-2 text-sm text-gray-600">
              Review uploaded lab files and track report activity over time.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:w-72">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Total Reports</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{filteredLabFiles.length}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">This Year</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{reportsThisYear}</p>
            </div>
          </div>
        </div>

        {familyMembers.length > 0 && (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">View reports for</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  selectedProfile.type === "patient"
                    ? "bg-teal-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setSelectedProfile({ type: "patient", id: null })}
              >
                {patientProfile?.fullName || "Self"} (Self)
              </button>
              {familyMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    selectedProfile.type === "family" && selectedProfile.id === member.id
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedProfile({ type: "family", id: member.id })}
                >
                  {member.firstName} {member.lastName} ({member.relationship})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card fade-up-delay-1 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Upload Lab Report</p>
            <p className="mt-1 text-sm text-gray-600">
              Upload reports yourself and keep them available for your doctor.
            </p>
          </div>
          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">Patient Upload</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Lab File (PDF or image)</label>
            <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-gray-300 transition-all duration-200 hover:border-teal-500 hover:bg-teal-50/30">
              <input
                className="absolute inset-0 cursor-pointer opacity-0"
                type="file"
                accept=".pdf,image/*"
                onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                disabled={isUploading}
              />
              <div className="flex items-center justify-center gap-2 px-4 py-6 text-center">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-700">
                    {uploadFile ? uploadFile.name : "Choose file or drag & drop"}
                  </p>
                  <p className="text-xs text-gray-500">PDF or image (max 10MB)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-teal-700 hover:to-teal-800 hover:shadow-xl hover:scale-105 active:scale-95 disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none disabled:hover:scale-100"
            onClick={handleUpload}
            disabled={!uploadFile || isUploading}
          >
            <svg
              className={`h-5 w-5 transition-transform duration-200 ${isUploading ? 'animate-spin' : 'group-hover:translate-y-0.5'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {isUploading ? (
              <>
                <span className="inline-block">Uploading...</span>
              </>
            ) : (
              <>
                <span>Upload Report</span>
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
          {uploadFile && <p className="text-xs text-gray-500">Selected: {uploadFile.name}</p>}
        </div>
      </div>

      {latestReport && (
        <div className="card fade-up-delay-1 border border-blue-200 bg-blue-50/60">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Latest report</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-900">{latestReport.originalFileName}</p>
              <p className="text-xs text-blue-700">
                {formatDate(latestReport.recordDate || latestReport.createdAt)} - {latestReport.doctorName || "Doctor not listed"}
              </p>
              <p className="mt-1 text-xs text-blue-700">
                {latestReport.uploadedByRole === "DOCTOR" ? "Doctor uploaded" : latestReport.uploadedByRole === "PATIENT" ? "Patient uploaded" : "Uploader unknown"}
                {latestReport.uploadedByName ? ` by ${latestReport.uploadedByName}` : ""}
              </p>
            </div>
            <a
              className="button-outline"
              href={latestReport.url}
              target="_blank"
              rel="noreferrer"
            >
              Open latest
            </a>
          </div>
        </div>
      )}

      {filteredLabFiles.length === 0 ? (
        <EmptyState
          title="No lab reports found"
          description={`No lab reports are available for ${profileLabel(selectedProfile, patientProfile, familyMembers)} yet.`}
        />
      ) : (
        <div className="card fade-up-delay-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Report Timeline</h2>
            <p className="text-xs text-gray-500">
              {profileLabel(selectedProfile, patientProfile, familyMembers)}
            </p>
          </div>

          <div className="space-y-3">
            {filteredLabFiles.map((file) => (
              <div key={file.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{file.originalFileName}</p>
                    <p className="mt-1 text-xs text-gray-600">
                      Report date: {formatDate(file.recordDate || file.createdAt)}
                      {file.diagnosis ? ` | Diagnosis: ${file.diagnosis}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {file.doctorName || "Independent upload"}
                      {file.familyMemberId
                        ? ` | For: ${file.familyMemberFirstName || ""} ${file.familyMemberLastName || ""} (${file.familyMemberRelationship || "Family"})`
                        : " | For: Self"}
                    </p>
                    <p className="mt-2 text-xs">
                      <span className={`rounded-full px-2 py-1 font-semibold ${file.uploadedByRole === "DOCTOR" ? "bg-blue-100 text-blue-700" : file.uploadedByRole === "PATIENT" ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-700"}`}>
                        {file.uploadedByRole === "DOCTOR" ? "Doctor uploaded" : file.uploadedByRole === "PATIENT" ? "Patient uploaded" : "Uploader unknown"}
                      </span>
                      {file.uploadedByName ? <span className="ml-2 text-gray-500">{file.uploadedByName}</span> : null}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <a
                      className="button-outline"
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </a>
                    <a
                      className="button"
                      href={file.url}
                      download
                    >
                      Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
