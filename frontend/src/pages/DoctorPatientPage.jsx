import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Skeleton } from "@mui/material";
import api from "../services/api.js";
import RecordTimeline from "../components/RecordTimeline.jsx";
import RecentPatientsSidebar from "../components/RecentPatientsSidebar.jsx";
import StructuredMedicinesInput from "../components/StructuredMedicinesInput.jsx";
import { generatePrescriptionPDF } from "../services/pdfGenerator.js";
import { addRecentPatient, getRecentPatients } from "../services/recentPatientsManager.js";
import { useToast } from "../components/Toast.jsx";
import BackButton from "../components/BackButton.jsx";
import AiInsightsPanel from "../components/AiInsightsPanel.jsx";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const QUICK_DIAGNOSES = [
  "Fever",
  "Viral infection",
  "Hypertension review",
  "Diabetes follow-up",
  "Gastritis",
  "Migraine"
];
const QUICK_VITALS = [
  "BP 120/80, HR 72",
  "BP 140/90, HR 88",
  "Temp 99F, SpO2 98%",
  "Temp 101F, HR 96"
];
const QUICK_ADVICE = [
  "Low salt diet",
  "Plenty of fluids",
  "Adequate rest",
  "Regular BP monitoring",
  "Avoid alcohol",
  "Light exercise"
];

const getTodayDate = () => new Date().toISOString().split('T')[0];

const getFollowUpDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const initialRecord = {
  title: "",
  description: "",
  hospitalName: "",
  diagnosis: "",
  vitals: "",
  medications: {
    breakfast: { before: [""], after: [""] },
    lunch: { before: [""], after: [""] },
    dinner: { before: [""], after: [""] }
  },
  allergies: "",
  followUpDate: "",
  recordDate: getTodayDate(),
  medicineDuration: 30,
  advice: ""
};

// SVG Icons
const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

export default function DoctorPatientPage() {
  const { patientPhoneNumber } = useParams();
  const toast = useToast();
  const [patient, setPatient] = useState(null);

  // Get patient name from recent patients if available
  const getPatientDisplayName = () => {
    const recentPatients = getRecentPatients();
    const recentPatient = recentPatients.find(p => p.phoneNumber === patientPhoneNumber);
    return recentPatient?.fullName || null;
  };
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState(null);
  const [recordData, setRecordData] = useState(initialRecord);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [labReportFile, setLabReportFile] = useState(null);
  const [otherReports, setOtherReports] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [doctorHospitalName, setDoctorHospitalName] = useState("");
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [consentRequired, setConsentRequired] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isRequestingConsent, setIsRequestingConsent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [hasSentOtp, setHasSentOtp] = useState(false);
  const [consentMessage, setConsentMessage] = useState(null);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showClinicalNotes, setShowClinicalNotes] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Family member selection for records
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState({ type: 'patient', id: null }); // { type: 'patient' | 'family', id: familyMemberId }

  const loadPatientData = async () => {
    setIsLoadingData(true);
    setHistoryError(null);
    setConsentRequired(false);
    setConsentMessage(null);
    try {
      const [patientResponse, historyResponse, doctorResponse] = await Promise.all([
        api.get(`/patients/phone/${patientPhoneNumber}`),
        api.get(`/records/patient/${patientPhoneNumber}`),
        api.get(`/doctors/me`)
      ]);
      setPatient(patientResponse.data);
      setHistory(historyResponse.data);
      setDoctorProfile(doctorResponse.data);
      if (doctorResponse.data.hospitalName) {
        setDoctorHospitalName(doctorResponse.data.hospitalName);
      }
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      addRecentPatient(patientPhoneNumber, patientResponse.data.fullName, endOfDay.toISOString());

      try {
        const familyResponse = await api.get(`/patients/phone/${patientPhoneNumber}/family-members`);
        setFamilyMembers(familyResponse.data || []);
      } catch {
        setFamilyMembers([]);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to load patient data";
      if (errorMessage.includes("Consent required")) {
        setConsentRequired(true);
        setConsentMessage("Patient consent required. Request OTP to proceed.");
      } else {
        setHistoryError(errorMessage);
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadPatientData();
  }, [patientPhoneNumber]);

  useEffect(() => {
    const draft = localStorage.getItem(`medico_record_draft_${patientPhoneNumber}`);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        // If draft has no hospital name but doctor has one, use doctor's
        if (!parsedDraft.hospitalName && doctorHospitalName) {
          parsedDraft.hospitalName = doctorHospitalName;
        }
        // Ensure recordDate is set
        if (!parsedDraft.recordDate) {
          parsedDraft.recordDate = getTodayDate();
        }
        setRecordData({ ...initialRecord, ...parsedDraft });
      } catch {
        localStorage.removeItem(`medico_record_draft_${patientPhoneNumber}`);
      }
    } else if (doctorHospitalName) {
      // If no draft exists, auto-fill with doctor's hospital name
      setRecordData(prev => ({
        ...prev,
        hospitalName: doctorHospitalName,
        recordDate: getTodayDate()
      }));
    } else {
      // Set today's date even without draft or hospital name
      setRecordData(prev => ({
        ...prev,
        recordDate: getTodayDate()
      }));
    }
  }, [patientPhoneNumber, doctorHospitalName]);

  useEffect(() => {
    localStorage.setItem(`medico_record_draft_${patientPhoneNumber}`, JSON.stringify(recordData));
  }, [patientPhoneNumber, recordData]);

  useEffect(() => {
    if (otpCooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  useEffect(() => {
    if (!showCreateForm) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape" && !isCreating) {
        handleCancelEdit();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showCreateForm, isCreating]);

  // Filter records based on selected person
  const filteredHistory = useMemo(() => {
    if (selectedPerson.type === 'patient') {
      // Show only patient's own records (familyMemberId is null or undefined)
      return history.filter(record => !record.familyMemberId);
    } else {
      // Show only the selected family member's records
      return history.filter(record => record.familyMemberId === selectedPerson.id);
    }
  }, [history, selectedPerson]);

  const formatMedicinesForAPI = (medicines) => {
    if (typeof medicines === 'string') return medicines; // Already a string

    let formatted = [];

    if (medicines.breakfast) {
      if ((medicines.breakfast.before || []).some(m => m.trim())) {
        formatted.push("BREAKFAST_BEFORE:\n" + medicines.breakfast.before.filter(m => m.trim()).map(m => `• ${m}`).join("\n"));
      }
      if ((medicines.breakfast.after || []).some(m => m.trim())) {
        formatted.push("BREAKFAST_AFTER:\n" + medicines.breakfast.after.filter(m => m.trim()).map(m => `• ${m}`).join("\n"));
      }
    }

    if (medicines.lunch) {
      if ((medicines.lunch.before || []).some(m => m.trim())) {
        formatted.push("LUNCH_BEFORE:\n" + medicines.lunch.before.filter(m => m.trim()).map(m => `• ${m}`).join("\n"));
      }
      if ((medicines.lunch.after || []).some(m => m.trim())) {
        formatted.push("LUNCH_AFTER:\n" + medicines.lunch.after.filter(m => m.trim()).map(m => `• ${m}`).join("\n"));
      }
    }

    if (medicines.dinner) {
      if ((medicines.dinner.before || []).some(m => m.trim())) {
        formatted.push("DINNER_BEFORE:\n" + medicines.dinner.before.filter(m => m.trim()).map(m => `• ${m}`).join("\n"));
      }
      if ((medicines.dinner.after || []).some(m => m.trim())) {
        formatted.push("DINNER_AFTER:\n" + medicines.dinner.after.filter(m => m.trim()).map(m => `• ${m}`).join("\n"));
      }
    }

    return formatted.join("\n\n");
  };

  const requestConsent = async () => {
    setConsentMessage(null);
    setIsRequestingConsent(true);
    toast.info("Sending OTP request to patient...");
    try {
      const response = await api.post("/consent/request", { patientPhoneNumber });
      setConsentMessage(`OTP sent to patient. Expires at ${response.data.expiresAt}`);
      setOtpCooldown(60);
      setHasSentOtp(true);
      toast.success("OTP sent to patient's registered contact.");
    } catch (err) {
      setConsentMessage(err.response?.data?.message || "Failed to request consent");
      toast.error(err.response?.data?.message || "Failed to request consent");
    } finally {
      setIsRequestingConsent(false);
    }
  };

  const verifyConsent = async () => {
    setConsentMessage(null);
    setIsRequestingConsent(true);
    toast.info("Verifying patient OTP...");
    try {
      const response = await api.post("/consent/verify", {
        patientPhoneNumber,
        otpCode
      });
      if (response.data.status === "VERIFIED") {
        setConsentRequired(false);
        setConsentMessage("Consent verified. Loading consultation workspace...");
        setOtpCode("");
        toast.success("Consent verified. Opening consultation view.");
        await loadPatientData();
      } else {
        setConsentMessage(`Consent status: ${response.data.status}`);
        toast.info(`Consent status: ${response.data.status}`);
      }
    } catch (err) {
      setConsentMessage(err.response?.data?.message || "Invalid OTP");
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setIsRequestingConsent(false);
    }
  };

  const parseMedicationsString = (medicationsString) => {
    if (!medicationsString) return initialRecord.medications;

    const parsed = {
      breakfast: { before: [], after: [] },
      lunch: { before: [], after: [] },
      dinner: { before: [], after: [] }
    };

    const sections = medicationsString.split('\n\n');
    sections.forEach(section => {
      const lines = section.trim().split('\n');
      if (lines.length < 2) return;

      const headerLine = lines[0];
      const mealMatch = headerLine.match(/(\w+)_(BEFORE|AFTER):/);
      if (!mealMatch) return;

      const meal = mealMatch[1].toLowerCase();
      const timing = mealMatch[2].toLowerCase();

      if (parsed[meal] && parsed[meal][timing]) {
        lines.slice(1).forEach(line => {
          const medicine = line.replace('• ', '').trim();
          if (medicine) {
            parsed[meal][timing].push(medicine);
          }
        });
      }
    });

    return parsed;
  };

  const handleEditRecord = (record) => {
    setEditingRecordId(record.id);
    setShowClinicalNotes(Boolean(record.description?.trim()));
    setRecordData({
      title: record.title || '',
      description: record.description || '',
      hospitalName: doctorHospitalName || record.hospitalName || '',
      diagnosis: record.diagnosis || '',
      vitals: record.vitals || '',
      medications: parseMedicationsString(record.medications),
      allergies: record.allergies || '',
      followUpDate: record.followUpDate || '',
      recordDate: record.recordDate || getTodayDate()
    });
    setShowCreateForm(true);
    toast.info('Editing record. Make changes and click "Update Record"');
  };

  const openCreateModal = () => {
    setShowClinicalNotes(Boolean(recordData.description?.trim()));
    if (doctorHospitalName) {
      setRecordData((prev) => ({
        ...prev,
        hospitalName: doctorHospitalName
      }));
    }
    setShowCreateForm(true);
  };

  const handleDeleteRecord = async (record) => {
    if (!window.confirm(`Are you sure you want to delete this record: "${record.title}"?`)) {
      return;
    }

    try {
      await api.delete(`/records/${record.id}`);
      toast.success('Record deleted successfully');
      // Refresh history
      const historyResponse = await api.get(`/records/patient/${patientPhoneNumber}`);
      setHistory(historyResponse.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete record');
    }
  };

  const handleCancelEdit = () => {
    setEditingRecordId(null);
    setShowCreateForm(false);
    setShowClinicalNotes(false);
    setRecordData({
      ...initialRecord,
      hospitalName: doctorHospitalName,
      recordDate: getTodayDate()
    });
  };

  const createRecord = async () => {
    setIsCreating(true);
    toast.info(editingRecordId ? "Updating medical record..." : "Saving medical record...");
    try {
      const resolvedHospitalName = doctorHospitalName || recordData.hospitalName;
      const allFiles = [prescriptionFile, labReportFile, ...otherReports].filter(Boolean);
      const oversizedFile = allFiles.find((file) => file.size > MAX_UPLOAD_BYTES);
      if (oversizedFile) {
        toast.error(`${oversizedFile.name} is too large. Maximum allowed file size is 15 MB.`);
        return;
      }

      const medicationsString = formatMedicinesForAPI(recordData.medications);
      const resolvedDescription = recordData.description?.trim() || "No clinical notes added.";

      if (editingRecordId) {
        // Update existing record
        await api.put(`/records/${editingRecordId}`, {
          title: recordData.title || recordData.diagnosis,
          description: resolvedDescription,
          hospitalName: resolvedHospitalName,
          diagnosis: recordData.diagnosis,
          vitals: recordData.vitals,
          medications: medicationsString,
          allergies: recordData.allergies,
          followUpDate: recordData.followUpDate || null,
          recordDate: recordData.recordDate || null,
          medicineDuration: recordData.medicineDuration || 30,
          advice: recordData.advice || null
        });
        toast.success('Record updated successfully');
        setEditingRecordId(null);
      } else {
        // Create new record
        const response = await api.post("/records", {
          patientPhoneNumber,
          title: recordData.title || recordData.diagnosis,
          description: resolvedDescription,
          hospitalName: resolvedHospitalName,
          diagnosis: recordData.diagnosis,
          vitals: recordData.vitals,
          medications: medicationsString,
          allergies: recordData.allergies,
          followUpDate: recordData.followUpDate || null,
          recordDate: recordData.recordDate || null,
          medicineDuration: recordData.medicineDuration || 30,
          advice: recordData.advice || null,
          familyMemberId: selectedPerson.type === 'family' ? selectedPerson.id : null
        });
        const recordId = response.data.id;
        if (prescriptionFile) {
          const prescriptionForm = new FormData();
          prescriptionForm.append("file", prescriptionFile);
          await api.post(`/records/${recordId}/files?category=PRESCRIPTION`, prescriptionForm, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        }
        if (labReportFile) {
          const labForm = new FormData();
          labForm.append("file", labReportFile);
          await api.post(`/records/${recordId}/files?category=LAB_REPORT`, labForm, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        }
        if (otherReports.length > 0) {
          await Promise.all(
            otherReports.map((report) => {
              const reportForm = new FormData();
              reportForm.append("file", report);
              return api.post(`/records/${recordId}/files?category=OTHER`, reportForm, {
                headers: { "Content-Type": "multipart/form-data" }
              });
            })
          );
        }
        toast.success(`Record created successfully`);
        localStorage.removeItem(`medico_record_draft_${patientPhoneNumber}`);
      }

      // Refresh history for both create and update
      const historyResponse = await api.get(`/records/patient/${patientPhoneNumber}`);
      setHistory(historyResponse.data);
      setRecordData({
        ...initialRecord,
        hospitalName: doctorHospitalName,
        recordDate: getTodayDate()
      });
      setShowClinicalNotes(false);
      setPrescriptionFile(null);
      setLabReportFile(null);
      setOtherReports([]);
      setShowCreateForm(false);
    } catch (err) {
      if (err?.response?.status === 413) {
        toast.error(err.response?.data?.message || "Uploaded file exceeds allowed size limit");
      } else {
        toast.error(err.response?.data?.message || "Failed to create record");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const printPrescription = async () => {
    setIsPrinting(true);
    try {
      if (!doctorProfile) {
        toast.error("Doctor profile not loaded. Please refresh the page.");
        return;
      }

      const medicinesObj = recordData.medications;
      const hasAnyMedicine = medicinesObj && (
        (medicinesObj.breakfast?.before?.some(m => m.trim())) ||
        (medicinesObj.breakfast?.after?.some(m => m.trim())) ||
        (medicinesObj.lunch?.before?.some(m => m.trim())) ||
        (medicinesObj.lunch?.after?.some(m => m.trim())) ||
        (medicinesObj.dinner?.before?.some(m => m.trim())) ||
        (medicinesObj.dinner?.after?.some(m => m.trim()))
      );

      if (!hasAnyMedicine) {
        toast.warning("No medications recorded. Please add medications before printing.");
        return;
      }

      const medicationsString = formatMedicinesForAPI(recordData.medications);

      await generatePrescriptionPDF(
        doctorProfile,
        patient,
        medicationsString,
        recordData.recordDate,
        recordData.diagnosis,
        recordData.followUpDate,
        recordData.medicineDuration,
        recordData.advice
      );
      toast.success("Prescription PDF generated!");
    } catch (err) {
      toast.error("Failed to generate prescription PDF: " + err.message);
    } finally {
      setIsPrinting(false);
    }
  };

  const printOldRecord = async (record) => {
    try {
      if (!doctorProfile) {
        toast.error("Doctor profile not loaded. Please refresh the page.");
        return;
      }

      await generatePrescriptionPDF(
        doctorProfile,
        patient,
        record.medications || "No medications recorded",
        record.recordDate,
        record.diagnosis,
        record.followUpDate,
        record.medicineDuration,
        record.advice
      );
      toast.success("Record PDF generated!");
    } catch (err) {
      toast.error("Failed to generate PDF: " + err.message);
    }
  };

  const appendAdviceLine = (line) => {
    const current = recordData.advice?.trim();
    const next = current ? `${current}\n${line}` : line;
    setRecordData({ ...recordData, advice: next });
  };

  return (
    <>
      <RecentPatientsSidebar />
      <div className="space-y-6">
      <BackButton to="/doctor" label="Back to workspace" />

      {isLoadingData && (
        <div className="card fade-up space-y-5 border border-gray-200 bg-white">
          <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
            <Skeleton variant="circular" width={64} height={64} />
            <div className="space-y-2">
              <Skeleton variant="text" width="45%" height={34} />
              <Skeleton variant="text" width="70%" height={24} />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Skeleton variant="rounded" height={80} />
            <Skeleton variant="rounded" height={80} />
            <Skeleton variant="rounded" height={80} />
          </div>
          <div className="space-y-3">
            <Skeleton variant="text" width="34%" height={30} />
            <Skeleton variant="rounded" height={90} />
            <Skeleton variant="rounded" height={90} />
            <Skeleton variant="rounded" height={90} />
          </div>
        </div>
      )}

      {/* Consent Required Screen */}
      {!isLoadingData && consentRequired && (
        <div className="card fade-up">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <LockIcon />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-amber-900">
                  Patient Consent Required
                  {getPatientDisplayName() && (
                    <span className="block mt-1 text-base font-medium text-amber-700">
                      {getPatientDisplayName()}
                    </span>
                  )}
                </h2>
                <p className="mt-2 text-sm text-amber-800">
                  You need patient consent to access this patient's records. Request an OTP that will be sent to the patient's phone. Consent is valid until end of day (11:59 PM).
                </p>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="label text-amber-900">Patient Phone Number</label>
                    <input
                      className="input bg-white"
                      value={patientPhoneNumber}
                      readOnly
                    />
                  </div>

                  <button
                    className="button"
                    onClick={requestConsent}
                    disabled={isRequestingConsent || otpCooldown > 0}
                  >
                    {isRequestingConsent
                      ? "Requesting..."
                      : otpCooldown > 0
                        ? `Resend OTP in ${otpCooldown}s`
                        : hasSentOtp
                          ? "Resend OTP"
                          : "Send OTP to Patient"}
                  </button>

                  <div>
                    <label className="label text-amber-900">Enter OTP from Patient</label>
                    <input
                      className="input bg-white"
                      placeholder="4-digit OTP"
                      inputMode="numeric"
                      maxLength={4}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                    />
                  </div>

                  <button
                    className="button-outline"
                    onClick={verifyConsent}
                    disabled={isRequestingConsent || !otpCode.trim()}
                  >
                    {isRequestingConsent ? "Verifying..." : "Verify OTP & Access Records"}
                  </button>

                  {consentMessage && (
                    <div className="rounded-lg border border-amber-200 bg-amber-100 p-3 text-sm text-amber-900">
                      {consentMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient Profile */}
      {!isLoadingData && !consentRequired && (
      <>
      <div className="card fade-up overflow-hidden border border-cyan-200/70 bg-white shadow-lg">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px] xl:items-start">
          <div className="flex gap-4 sm:gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-semibold text-white shadow-md">
              {(patient?.fullName || "P").trim().charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="pill-blue">Patient Care Console</div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">{patient?.fullName || "Patient"}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600">
                Review the patient timeline, open a polished consultation composer, and work directly against the hospital profile tied to this doctor account.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Hospital {doctorHospitalName || "Not set"}
                </div>
                <div className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                  {patient?.age != null ? `Age ${patient.age}` : "Age unavailable"}
                  {patient?.gender ? ` - ${patient.gender}` : ""}
                </div>
                <div className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                  Phone {patient?.phoneNumber || patientPhoneNumber}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Records</div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">{filteredHistory.length}</div>
              <p className="mt-1 text-sm text-gray-500">Available in active timeline</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Subject</div>
              <div className="mt-3 text-lg font-semibold text-gray-900">{selectedPerson.type === "patient" ? "Primary patient" : "Family member"}</div>
              <p className="mt-1 text-sm text-gray-500">Consultation target</p>
            </div>
            <div className="rounded-2xl border border-gray-900 bg-gray-900 p-4 text-white shadow-md sm:col-span-3 xl:col-span-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Workflow</div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">Consultation workspace ready</div>
                  <p className="mt-1 text-sm text-gray-300">Timeline, AI support, and record composer are tuned for this patient.</p>
                </div>
                <button
                  type="button"
                  onClick={() => (showCreateForm ? handleCancelEdit() : openCreateModal())}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
                >
                  {showCreateForm ? "Close Composer" : "Start Consultation"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Family Members Selection */}
        {familyMembers.length > 0 && (
          <div className="mt-7 border-t border-emerald-100/80 pt-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Select who this consultation is for
            </h3>
            <div className="flex flex-wrap gap-2">
              {/* Main Patient Option */}
              <button
                type="button"
                onClick={() => setSelectedPerson({ type: 'patient', id: null })}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  selectedPerson.type === 'patient'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {patient?.fullName || 'Main Patient'}
                <span className="ml-1 text-xs opacity-75">(Self)</span>
              </button>

              {/* Family Member Options */}
              {familyMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedPerson({ type: 'family', id: member.id })}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    selectedPerson.type === 'family' && selectedPerson.id === member.id
                      ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {member.firstName} {member.lastName}
                  <span className="ml-1 text-xs opacity-75">({member.relationship})</span>
                </button>
              ))}
            </div>

            {/* Show selected person indicator */}
            <div className="mt-3 text-sm text-gray-600">
              Creating records for{' '}
              <span className="font-semibold text-gray-800">
                {selectedPerson.type === 'patient'
                  ? patient?.fullName
                  : familyMembers.find(m => m.id === selectedPerson.id)?.firstName + ' ' + familyMembers.find(m => m.id === selectedPerson.id)?.lastName
                }
              </span>
            </div>
          </div>
        )}
      </div>

      {/* AI Medical Insights */}
      <AiInsightsPanel patient={patient} history={filteredHistory} patientPhoneNumber={patientPhoneNumber} />

      {/* Action Buttons */}
      <div className="card fade-up border border-cyan-200/60 bg-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Workspace actions</div>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-gray-900">Move between history review and record creation without losing context.</h3>
            <p className="mt-2 text-sm text-gray-600">The timeline stays available for review while the composer handles clean structured entry.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`rounded-2xl border px-5 py-3 font-medium transition-all ${
              showHistory
                ? "border-sky-600 bg-sky-600 text-white shadow-md"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:shadow-sm"
            }`}
          >
            {showHistory ? "Hide Medical History" : "Show Medical History"}
          </button>
          <button
            onClick={() => (showCreateForm ? handleCancelEdit() : openCreateModal())}
            className={`rounded-2xl border px-5 py-3 font-medium transition-all ${
              showCreateForm
                ? "border-emerald-700 bg-emerald-600 text-white shadow-md"
                : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:shadow-sm"
            }`}
          >
            {showCreateForm ? "Close Composer" : "Create Medical Record"}
          </button>
          </div>
        </div>
      </div>

      {/* Medical History */}
      {showHistory && (
      <div className="card fade-up border border-cyan-200/60 bg-white">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <div className="pill-blue">Medical History</div>
            <h2 className="mt-3 text-2xl font-semibold text-gray-900">
              {selectedPerson.type === 'patient'
                ? 'Patient history'
                : `${familyMembers.find(m => m.id === selectedPerson.id)?.firstName || 'Family Member'} history`
              }
            </h2>
            <p className="mt-1 text-sm text-gray-600">Clean timeline of consultations, prescriptions, files and follow-ups.</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-right text-sm text-emerald-800">
            <div className="text-xs uppercase tracking-wide text-emerald-600">Records</div>
            <div className="text-2xl font-semibold">{filteredHistory.length}</div>
          </div>
        </div>
        {historyError && <div className="mt-3 text-sm text-red-500">{historyError}</div>}
        <div className="mt-6">
          <RecordTimeline
            records={filteredHistory}
            onPrintRecord={printOldRecord}
            onEditRecord={handleEditRecord}
            onDeleteRecord={handleDeleteRecord}
            doctorProfile={doctorProfile}
          />
        </div>
      </div>
      )}

      {/* Create/Edit Record Form */}
      {showCreateForm && (
      <div className="modal-overlay">
        <div className="modal-backdrop" onClick={() => !isCreating && handleCancelEdit()} />
        <div className="modal-content w-full max-w-6xl">
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl slide-up">
            <div className="flex max-h-[88vh] flex-col bg-white">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                  <div>
                    <div className="pill-blue">Record Composer</div>
                    <h3 className="mt-2 text-2xl font-semibold text-gray-900">{editingRecordId ? "Edit consultation" : "Create consultation"}</h3>
                    <p className="mt-1 text-sm text-gray-500">Focused, fast, and clinically structured.</p>
                  </div>
                  <div className="hidden rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-right text-sm text-emerald-800 md:block">
                    <div className="text-xs uppercase tracking-wide text-emerald-600">For</div>
                    <div className="font-semibold text-emerald-900">
                      {selectedPerson.type === "patient"
                        ? patient?.fullName || "Patient"
                        : `${familyMembers.find((member) => member.id === selectedPerson.id)?.firstName || "Family"} ${familyMembers.find((member) => member.id === selectedPerson.id)?.lastName || "Member"}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 sm:block">
                      Hospital {doctorHospitalName || "Not configured"}
                    </div>
                    <button
                      type="button"
                      className="button-ghost"
                      onClick={handleCancelEdit}
                      disabled={isCreating}
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <div className="space-y-6">
                    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                      <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                        <label className="label">Chief Complaint / Diagnosis *</label>
                        <textarea
                          className="input min-h-[140px] text-base"
                          rows="5"
                          placeholder="Describe the primary complaint, suspected diagnosis, or reason for the visit"
                          value={recordData.diagnosis}
                          onChange={(e) => setRecordData({ ...recordData, diagnosis: e.target.value })}
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                          {QUICK_DIAGNOSES.map((item) => (
                            <button
                              key={item}
                              type="button"
                              className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                              onClick={() => setRecordData({ ...recordData, diagnosis: item })}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div>
                          <label className="label">Hospital / Clinic *</label>
                          <input
                            className="input"
                            placeholder="Hospital name"
                            value={recordData.hospitalName}
                            readOnly
                          />
                          <p className="mt-2 text-xs text-gray-500">Auto-filled from doctor profile.</p>
                        </div>
                        <div className="mt-4">
                          <label className="label">Follow-up Date</label>
                          <input
                            className="input"
                            type="date"
                            value={recordData.followUpDate}
                            onChange={(e) => setRecordData({ ...recordData, followUpDate: e.target.value })}
                          />
                          <div className="mt-3 flex flex-wrap gap-2">
                            {[3, 7, 10, 30].map((days) => (
                              <button
                                key={days}
                                type="button"
                                className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                onClick={() => setRecordData({ ...recordData, followUpDate: getFollowUpDate(days) })}
                              >
                                +{days} days
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                          Record date: <span className="font-medium text-gray-800">{new Date(recordData.recordDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        </div>
                      </div>
                    </div>

                    {!showClinicalNotes ? (
                      <button
                        type="button"
                        className="button-outline"
                        onClick={() => setShowClinicalNotes(true)}
                      >
                        Add Clinical Notes
                      </button>
                    ) : (
                      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <label className="label mb-0">Clinical Notes</label>
                            <p className="mt-1 text-sm text-gray-500">Optional notes for findings, examination and plan.</p>
                          </div>
                          <button
                            type="button"
                            className="button-ghost button-sm"
                            onClick={() => {
                              setShowClinicalNotes(false);
                              setRecordData({ ...recordData, description: "" });
                            }}
                          >
                            Remove
                          </button>
                        </div>
                        <textarea
                          className="input min-h-[140px]"
                          rows="5"
                          placeholder="Symptoms, examination findings, assessment and plan"
                          value={recordData.description}
                          onChange={(e) => setRecordData({ ...recordData, description: e.target.value })}
                        />
                      </div>
                    )}

                    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Medication and Duration</h3>
                          <p className="mt-1 text-sm text-gray-500">Add medicines by meal timing and define how long the prescription continues.</p>
                        </div>
                      </div>
                      <StructuredMedicinesInput
                        value={recordData.medications}
                        onChange={(meds) => setRecordData({ ...recordData, medications: meds })}
                      />

                      <div className="mt-5">
                        <label className="label">Medicine Duration (days)</label>
                        <div className="flex flex-wrap gap-2">
                          {[7, 10, 14, 15, 30, 60, 90].map((days) => (
                            <button
                              key={days}
                              type="button"
                              onClick={() => setRecordData({ ...recordData, medicineDuration: days })}
                              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                                recordData.medicineDuration === days
                                  ? "border-emerald-500 bg-emerald-500 text-white"
                                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {days} days
                            </button>
                          ))}
                          <input
                            type="number"
                            min="1"
                            max="365"
                            placeholder="Custom"
                            value={![7, 10, 14, 15, 30, 60, 90].includes(recordData.medicineDuration) ? recordData.medicineDuration : ""}
                            onChange={(e) => setRecordData({ ...recordData, medicineDuration: parseInt(e.target.value, 10) || 30 })}
                            className="input w-28"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                      <details className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm" open>
                        <summary className="cursor-pointer text-lg font-semibold text-gray-900">Vitals, Allergy and Advice</summary>
                        <div className="mt-4 space-y-5">
                          <div>
                            <label className="label">Vitals</label>
                            <input
                              className="input"
                              placeholder="e.g. BP 120/80, HR 72"
                              value={recordData.vitals}
                              onChange={(e) => setRecordData({ ...recordData, vitals: e.target.value })}
                            />
                            <div className="mt-3 flex flex-wrap gap-2">
                              {QUICK_VITALS.map((item) => (
                                <button
                                  key={item}
                                  type="button"
                                  className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                  onClick={() => setRecordData({ ...recordData, vitals: item })}
                                >
                                  {item}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="label">Known Allergies</label>
                            <input
                              className="input"
                              placeholder="e.g., Penicillin"
                              value={recordData.allergies}
                              onChange={(e) => setRecordData({ ...recordData, allergies: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="label">Advice</label>
                            <textarea
                              className="input"
                              rows="4"
                              placeholder="Lifestyle, diet and precautions"
                              value={recordData.advice}
                              onChange={(e) => setRecordData({ ...recordData, advice: e.target.value })}
                            />
                            <div className="mt-3 flex flex-wrap gap-2">
                              {QUICK_ADVICE.map((suggestion) => (
                                <button
                                  key={suggestion}
                                  type="button"
                                  onClick={() => appendAdviceLine(suggestion)}
                                  className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                >
                                  + {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </details>

                      <details className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                        <summary className="cursor-pointer text-lg font-semibold text-gray-900">Attach Reports</summary>
                        <div className="mt-4 space-y-4">
                          <div>
                            <label className="label">Prescription</label>
                            <input
                              className="input"
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setPrescriptionFile(file);
                                if (file) toast.info(`Prescription file selected: ${file.name}`);
                              }}
                            />
                          </div>
                          <div>
                            <label className="label">Lab report</label>
                            <input
                              className="input"
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setLabReportFile(file);
                                if (file) toast.info(`Lab report selected: ${file.name}`);
                              }}
                            />
                          </div>
                          <div>
                            <label className="label">Other reports</label>
                            <input
                              className="input"
                              type="file"
                              multiple
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                setOtherReports(files);
                                if (files.length > 0) toast.info(`${files.length} additional report(s) selected`);
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-500">Maximum 15 MB per file.</p>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 bg-white px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-gray-500">Diagnosis is enough to save. Everything else can stay optional.</p>
                    <div className="flex flex-wrap gap-3">
                      {editingRecordId && (
                        <button className="button-outline" onClick={handleCancelEdit} type="button" disabled={isCreating}>
                          Cancel Edit
                        </button>
                      )}
                      <button
                        className="button-outline"
                        onClick={printPrescription}
                        type="button"
                        disabled={isPrinting || !recordData.medications}
                        title={!recordData.medications ? "Add medications first" : ""}
                      >
                        {isPrinting && <span className="spinner" />}
                        {isPrinting ? "Generating PDF..." : "Print Prescription"}
                      </button>
                      <button className="button" onClick={createRecord} type="button" disabled={isCreating}>
                        {isCreating && <span className="spinner" />}
                        {isCreating ? (editingRecordId ? "Updating..." : "Creating...") : (editingRecordId ? "Update Record" : "Save Record")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
      )}
      </>
      )}
      </div>
    </>
  );
}
