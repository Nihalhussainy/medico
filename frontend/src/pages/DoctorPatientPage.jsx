import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api.js";
import RecordTimeline from "../components/RecordTimeline.jsx";
import RecentPatientsSidebar from "../components/RecentPatientsSidebar.jsx";
import StructuredMedicinesInput from "../components/StructuredMedicinesInput.jsx";
import { generatePrescriptionPDF } from "../services/pdfGenerator.js";
import { addRecentPatient, getRecentPatients } from "../services/recentPatientsManager.js";
import { useToast } from "../components/Toast.jsx";
import BackButton from "../components/BackButton.jsx";
import Spinner from "../components/Spinner.jsx";
import EmptyState from "../components/EmptyState.jsx";
import AiInsightsPanel from "../components/AiInsightsPanel.jsx";

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
  recordDate: getTodayDate()
};

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
  const [consentMessage, setConsentMessage] = useState(null);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const load = async () => {
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
        // Auto-set hospital name from doctor's profile
        if (doctorResponse.data.hospitalName) {
          setDoctorHospitalName(doctorResponse.data.hospitalName);
        }
        // Track this patient as recently accessed (valid until end of day)
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        addRecentPatient(patientPhoneNumber, patientResponse.data.fullName, endOfDay.toISOString());
      } catch (err) {
        const errorMessage = err.response?.data?.message || "Failed to load patient data";
        if (errorMessage.includes("Consent required")) {
          setConsentRequired(true);
          setConsentMessage("Patient consent required. Request OTP to proceed.");
        } else {
          setHistoryError(errorMessage);
        }
      }
    };
    load();
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
    try {
      const response = await api.post("/consent/request", { patientPhoneNumber });
      setConsentMessage(`OTP sent to patient. Expires at ${response.data.expiresAt}`);
    } catch (err) {
      setConsentMessage(err.response?.data?.message || "Failed to request consent");
    } finally {
      setIsRequestingConsent(false);
    }
  };

  const verifyConsent = async () => {
    setConsentMessage(null);
    setIsRequestingConsent(true);
    try {
      const response = await api.post("/consent/verify", {
        patientPhoneNumber,
        otpCode
      });
      if (response.data.status === "VERIFIED") {
        setConsentRequired(false);
        setConsentMessage("Consent verified! Reloading patient data...");
        // Reload the page data
        window.location.reload();
      } else {
        setConsentMessage(`Consent status: ${response.data.status}`);
      }
    } catch (err) {
      setConsentMessage(err.response?.data?.message || "Invalid OTP");
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
    setRecordData({
      title: record.title || '',
      description: record.description || '',
      hospitalName: record.hospitalName || '',
      diagnosis: record.diagnosis || '',
      vitals: record.vitals || '',
      medications: parseMedicationsString(record.medications),
      allergies: record.allergies || '',
      followUpDate: record.followUpDate || '',
      recordDate: record.recordDate || getTodayDate()
    });
    setShowCreateForm(true);
    toast.info('Editing record. Make changes and click "Update Record"');
    // Scroll to form
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
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
    setRecordData({
      ...initialRecord,
      hospitalName: doctorHospitalName,
      recordDate: getTodayDate()
    });
  };

  const createRecord = async () => {
    setIsCreating(true);
    try {
      const medicationsString = formatMedicinesForAPI(recordData.medications);
      
      if (editingRecordId) {
        // Update existing record
        await api.put(`/records/${editingRecordId}`, {
          title: recordData.title || recordData.diagnosis,
          description: recordData.description,
          hospitalName: recordData.hospitalName,
          diagnosis: recordData.diagnosis,
          vitals: recordData.vitals,
          medications: medicationsString,
          allergies: recordData.allergies,
          followUpDate: recordData.followUpDate || null,
          recordDate: recordData.recordDate || null
        });
        toast.success('Record updated successfully');
        setEditingRecordId(null);
      } else {
        // Create new record
        const response = await api.post("/records", {
          patientPhoneNumber,
          title: recordData.title || recordData.diagnosis,
          description: recordData.description,
          hospitalName: recordData.hospitalName,
          diagnosis: recordData.diagnosis,
          vitals: recordData.vitals,
          medications: medicationsString,
          allergies: recordData.allergies,
          followUpDate: recordData.followUpDate || null,
          recordDate: recordData.recordDate || null
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
      setPrescriptionFile(null);
      setLabReportFile(null);
      setOtherReports([]);
      setShowCreateForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create record");
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
        recordData.followUpDate
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
        record.followUpDate
      );
      toast.success("Record PDF generated!");
    } catch (err) {
      toast.error("Failed to generate PDF: " + err.message);
    }
  };

  return (
    <>
      <RecentPatientsSidebar />
      <div className="space-y-6">
      <BackButton to="/doctor" label="Back to workspace" />
      
      {/* Consent Required Screen */}
      {consentRequired && (
        <div className="card fade-up">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-50 p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🔒</div>
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
                    disabled={isRequestingConsent}
                  >
                    {isRequestingConsent ? "Requesting..." : "Send OTP to Patient"}
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
      {!consentRequired && (
      <>
      <div className="card fade-up">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="pill">Patient profile</div>
            <h1 className="mt-4 text-2xl font-semibold">{patient?.fullName || "Patient"}</h1>
            <p className="text-slate-700">
              {patient?.age != null ? `Age ${patient.age}` : "Age unavailable"}
              {patient?.gender ? ` • ${patient.gender}` : ""}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-700">
            Phone {patient?.phoneNumber || patientPhoneNumber}
          </div>
        </div>
      </div>

      {/* AI Medical Insights */}
      <AiInsightsPanel patient={patient} history={history} />

      {/* Action Buttons */}
      <div className="card fade-up">
        <div className="flex gap-3 flex-wrap">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`px-4 py-2 rounded-lg border font-medium transition-all ${
              showHistory
                ? "bg-blue-500 text-white border-blue-600"
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {showHistory ? "Hide Medical History" : "Show Medical History"}
          </button>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={`px-4 py-2 rounded-lg border font-medium transition-all ${
              showCreateForm
                ? "bg-emerald-500 text-white border-emerald-600"
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {showCreateForm ? "Hide Form" : "Create a New Record"}
          </button>
        </div>
      </div>

      {/* Medical History */}
      {showHistory && (
      <div className="card fade-up">
        <h2 className="text-xl font-semibold">Patient history</h2>
        {historyError && <div className="mt-3 text-sm text-red-500">{historyError}</div>}
        <div className="mt-4">
          <RecordTimeline 
            records={history} 
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
      <div className="card space-y-4 fade-up">
        <h2 className="text-xl font-semibold">
          {editingRecordId ? "Edit Medical Record" : "Create a New Medical Record"}
        </h2>
        
        {/* Hospital & Key Info - Simplified */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Hospital/Clinic</label>
            <input 
              className="input" 
              placeholder="Hospital name" 
              value={recordData.hospitalName} 
              onChange={(e) => setRecordData({ ...recordData, hospitalName: e.target.value })} 
            />
          </div>
          <div>
            <label className="label">Vitals</label>
            <input 
              className="input" 
              placeholder="e.g. BP 120/80, HR 72" 
              value={recordData.vitals} 
              onChange={(e) => setRecordData({ ...recordData, vitals: e.target.value })} 
            />
          </div>
        </div>

        {/* Diagnosis - Main field */}
        <div>
          <label className="label">Chief Complaint / Diagnosis</label>
          <textarea 
            className="input" 
            rows="2" 
            placeholder="e.g., Hypertension, Cough & Cold, Diabetic Review" 
            value={recordData.diagnosis} 
            onChange={(e) => setRecordData({ ...recordData, diagnosis: e.target.value })} 
          />
        </div>

        {/* Notes */}
        <div>
          <label className="label">Clinical Notes (optional)</label>
          <textarea 
            className="input" 
            rows="3" 
            placeholder="Additional observations, findings, etc." 
            value={recordData.description} 
            onChange={(e) => setRecordData({ ...recordData, description: e.target.value })} 
          />
        </div>

        {/* Structured Medications */}
        <StructuredMedicinesInput 
          value={recordData.medications} 
          onChange={(meds) => setRecordData({ ...recordData, medications: meds })} 
        />

        {/* Allergies */}
        <div>
          <label className="label">Known Allergies (optional)</label>
          <input 
            className="input" 
            placeholder="e.g., Penicillin, Peanuts" 
            value={recordData.allergies} 
            onChange={(e) => setRecordData({ ...recordData, allergies: e.target.value })} 
          />
        </div>

        {/* Record Date - Read-only (today) */}
        <div>
          <label className="label">Record Date</label>
          <div className="px-4 py-2 bg-slate-100 rounded-lg border border-slate-300 text-slate-700 font-medium">
            {new Date(recordData.recordDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Follow-up Date - Presets */}
        <div>
          <label className="label">Follow-up Date</label>
          <div className="space-y-2">
            <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
              <button
                type="button"
                onClick={() => setRecordData({ ...recordData, followUpDate: getFollowUpDate(3) })}
                className={`px-3 py-2 rounded-lg border transition-all text-sm ${
                  recordData.followUpDate === getFollowUpDate(3)
                    ? "bg-emerald-500 text-white border-emerald-600"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                After 3 days
              </button>
              <button
                type="button"
                onClick={() => setRecordData({ ...recordData, followUpDate: getFollowUpDate(7) })}
                className={`px-3 py-2 rounded-lg border transition-all text-sm ${
                  recordData.followUpDate === getFollowUpDate(7)
                    ? "bg-emerald-500 text-white border-emerald-600"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                1 week
              </button>
              <button
                type="button"
                onClick={() => setRecordData({ ...recordData, followUpDate: getFollowUpDate(10) })}
                className={`px-3 py-2 rounded-lg border transition-all text-sm ${
                  recordData.followUpDate === getFollowUpDate(10)
                    ? "bg-emerald-500 text-white border-emerald-600"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                10 days
              </button>
              <button
                type="button"
                onClick={() => setRecordData({ ...recordData, followUpDate: getFollowUpDate(30) })}
                className={`px-3 py-2 rounded-lg border transition-all text-sm ${
                  recordData.followUpDate === getFollowUpDate(30)
                    ? "bg-emerald-500 text-white border-emerald-600"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                1 month
              </button>
            </div>
            <input 
              className="input" 
              type="date" 
              value={recordData.followUpDate} 
              onChange={(e) => setRecordData({ ...recordData, followUpDate: e.target.value })}
              placeholder="Or select custom date"
            />
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-800">Prescription (optional)</label>
            <input className="input" type="file" onChange={(e) => setPrescriptionFile(e.target.files?.[0] || null)} />
          </div>
          <div>
            <label className="text-sm text-slate-800">Lab report (optional)</label>
            <input className="input" type="file" onChange={(e) => setLabReportFile(e.target.files?.[0] || null)} />
          </div>
          <div>
            <label className="text-sm text-slate-800">Other reports (optional)</label>
            <input
              className="input"
              type="file"
              multiple
              onChange={(e) => setOtherReports(Array.from(e.target.files || []))}
            />
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button className="button" onClick={createRecord} type="button" disabled={isCreating}>
            {isCreating && <span className="spinner" />}
            {isCreating ? (editingRecordId ? "Updating..." : "Creating...") : (editingRecordId ? "Update Record" : "Create Record")}
          </button>
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
        </div>
      </div>
      )}
      </>
      )}
      </div>
    </>
  );
}