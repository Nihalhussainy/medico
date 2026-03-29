import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import RecordTimeline from "../components/RecordTimeline.jsx";
import { useToast } from "../components/Toast.jsx";
import { useConfirm } from "../components/ConfirmDialog.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import BackButton from "../components/BackButton.jsx";
import Spinner from "../components/Spinner.jsx";
import { deriveFamilyMembersFromRecords } from "../services/familyInsights.js";
import { generatePrescriptionPDF } from "../services/pdfGenerator.js";

const calculateAgeFromDOB = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const resolveMemberAge = (member) => member?.age ?? calculateAgeFromDOB(member?.dateOfBirth);

export default function DoctorPatientHistoryPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { patientPhoneNumber } = useParams();
  const [searchParams] = useSearchParams();
  const familyMemberId = searchParams.get('familyMemberId');

  const [records, setRecords] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(() => {
    if (familyMemberId) {
      // Parse as number if it's numeric for proper comparison
      const parsedId = !isNaN(familyMemberId) ? parseInt(familyMemberId, 10) : familyMemberId;
      return { type: 'family', id: parsedId };
    }
    return { type: 'patient', id: null };
  });
  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [recordsResponse, patientResponse, doctorResponse] = await Promise.all([
          api.get(`/records/patient/${patientPhoneNumber}`),
          api.get(`/patients/phone/${patientPhoneNumber}`),
          api.get(`/doctors/me`)
        ]);
        const loadedRecords = recordsResponse.data || [];
        setRecords(loadedRecords);
        setPatient(patientResponse.data);
        setDoctorProfile(doctorResponse.data);

        try {
          const familyRes = await api.get(`/patients/phone/${patientPhoneNumber}/family-members`);
          setFamilyMembers(familyRes.data || []);
        } catch {
          setFamilyMembers(deriveFamilyMembersFromRecords(loadedRecords));
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load records");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [patientPhoneNumber]);

  // Update selected person when URL changes
  useEffect(() => {
    if (familyMemberId) {
      // Parse as number if it's numeric for proper comparison
      const parsedId = !isNaN(familyMemberId) ? parseInt(familyMemberId, 10) : familyMemberId;
      setSelectedPerson({ type: 'family', id: parsedId });
    } else {
      setSelectedPerson({ type: 'patient', id: null });
    }
  }, [familyMemberId]);

  const filteredRecords = useMemo(() => {
    if (selectedPerson.type === 'patient') {
      return records.filter(record => !record.familyMemberId);
    } else {
      // Compare with string conversion to handle type mismatches
      return records.filter(record => {
        if (!record.familyMemberId) return false;
        return String(record.familyMemberId) === String(selectedPerson.id);
      });
    }
  }, [records, selectedPerson]);

  const selectedPersonData = useMemo(() => {
    if (selectedPerson.type === 'patient') {
      return {
        name: patient?.fullName || 'Patient',
        age: patient?.age,
        gender: patient?.gender,
        relationship: 'Self'
      };
    }
    // Compare with string conversion to handle type mismatches
    const member = familyMembers.find(m => String(m.id) === String(selectedPerson.id));
    return member ? {
      name: `${member.firstName} ${member.lastName}`,
      age: resolveMemberAge(member),
      gender: member.gender,
      relationship: member.relationship
    } : { name: 'Family Member', relationship: 'Family' };
  }, [selectedPerson, patient, familyMembers]);

  const handleSelectPerson = (type, id = null) => {
    setSelectedPerson({ type, id });
    // Update URL without navigation
    if (type === 'family' && id) {
      navigate(`/doctor/patient/${patientPhoneNumber}/history?familyMemberId=${id}`, { replace: true });
    } else {
      navigate(`/doctor/patient/${patientPhoneNumber}/history`, { replace: true });
    }
  };

  const handleNewConsultation = () => {
    const params = new URLSearchParams();
    if (selectedPerson.type === 'family' && selectedPerson.id !== null && selectedPerson.id !== undefined) {
      params.set('familyMemberId', String(selectedPerson.id));
    }
    params.set('openConsultation', '1');
    navigate(`/doctor/patient/${patientPhoneNumber}?${params.toString()}`);
  };

  const printRecord = async (record) => {
    try {
      if (!doctorProfile) {
        toast.error("Doctor profile not loaded");
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
      toast.success("PDF generated!");
    } catch (err) {
      toast.error("Failed to generate PDF: " + err.message);
    }
  };

  const handleEditRecord = (record) => {
    // Navigate back to the main page with edit mode
    const params = new URLSearchParams();
    params.set('editRecord', String(record.id));
    if (record.familyMemberId !== null && record.familyMemberId !== undefined) {
      params.set('familyMemberId', String(record.familyMemberId));
    }
    navigate(`/doctor/patient/${patientPhoneNumber}?${params.toString()}`);
  };

  const handleDeleteRecord = async (record) => {
    const confirmed = await confirm(
      `Delete record "${record.title}"? This action cannot be undone.`,
      "Delete Medical Record"
    );
    if (!confirmed) return;
    try {
      await api.delete(`/records/${record.id}`);
      toast.success("Record deleted successfully");
      setRecords(prev => prev.filter(r => r.id !== record.id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner label="Loading medical history..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <BackButton to={`/doctor/patient/${patientPhoneNumber}`} label="Back to console" />
          
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Medical History</h1>
              <p className="mt-1 text-sm text-gray-500">
                Complete records for {patient?.fullName || 'Patient'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-gray-700 font-medium">
                {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar - Person Selector */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Viewing Records For
                </h2>
              </div>
              
              <div className="p-2">
                {/* Main Patient */}
                <button
                  type="button"
                  onClick={() => handleSelectPerson('patient')}
                  className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                    selectedPerson.type === 'patient'
                      ? 'bg-gray-900 text-white'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                      selectedPerson.type === 'patient' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {(patient?.fullName || 'P').charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{patient?.fullName || 'Patient'}</p>
                      <p className={`text-xs ${selectedPerson.type === 'patient' ? 'text-gray-300' : 'text-gray-500'}`}>
                        {patient?.age && `${patient.age} yrs`}
                        {patient?.age && patient?.gender && ' · '}
                        {patient?.gender}
                        {(patient?.age || patient?.gender) && ' · '}Self
                      </p>
                    </div>
                  </div>
                </button>

                {/* Family Members */}
                {familyMembers.length > 0 && (
                  <>
                    <div className="my-2 px-3">
                      <div className="border-t border-gray-100" />
                    </div>
                    <p className="px-3 py-1 text-xs font-medium text-gray-400 uppercase">Family Members</p>
                    {familyMembers.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => handleSelectPerson('family', member.id)}
                        className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                          selectedPerson.type === 'family' && String(selectedPerson.id) === String(member.id)
                            ? 'bg-gray-900 text-white'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                            selectedPerson.type === 'family' && String(selectedPerson.id) === String(member.id)
                              ? 'bg-white/20 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {member.firstName?.charAt(0) || 'F'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{member.firstName} {member.lastName}</p>
                            <p className={`text-xs ${
                              selectedPerson.type === 'family' && String(selectedPerson.id) === String(member.id)
                                ? 'text-gray-300'
                                : 'text-gray-500'
                            }`}>
                              {resolveMemberAge(member) != null && `${resolveMemberAge(member)} yrs`}
                              {resolveMemberAge(member) != null && member.gender && ' · '}
                              {member.gender}
                              {(resolveMemberAge(member) != null || member.gender) && ' · '}
                              {member.relationship}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Records */}
          <div>
            {/* Selected Person Info Banner */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-semibold text-gray-600">
                    {selectedPersonData.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedPersonData.name}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedPersonData.age && `${selectedPersonData.age} years`}
                      {selectedPersonData.age && selectedPersonData.gender && ' · '}
                      {selectedPersonData.gender}
                      {(selectedPersonData.age || selectedPersonData.gender) && ' · '}
                      {selectedPersonData.relationship}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleNewConsultation}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  New Consultation
                </button>
              </div>
            </div>

            {/* Records */}
            {filteredRecords.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Records Found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  No medical records exist for {selectedPersonData.name} yet.
                </p>
                <button
                  type="button"
                  onClick={handleNewConsultation}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Create First Record
                </button>
              </div>
            ) : (
              <RecordTimeline
                records={filteredRecords}
                onPrintRecord={printRecord}
                onEditRecord={handleEditRecord}
                onDeleteRecord={handleDeleteRecord}
                doctorProfile={doctorProfile}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
