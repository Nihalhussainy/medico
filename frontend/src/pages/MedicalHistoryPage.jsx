import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api.js";
import RecordTimeline from "../components/RecordTimeline.jsx";
import { useToast } from "../components/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import BackButton from "../components/BackButton.jsx";
import Spinner from "../components/Spinner.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function MedicalHistoryPage() {
  const toast = useToast();
  const { user } = useAuth();
  const { patientPhoneNumber } = useParams();
  const [records, setRecords] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState({ type: 'patient', id: null });
  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState(null);

  const isOwnRecords = user?.phoneNumber === patientPhoneNumber;

  useEffect(() => {
    const load = async () => {
      try {
        const [recordsResponse, patientResponse] = await Promise.all([
          api.get(`/records/patient/${patientPhoneNumber}`),
          api.get(`/patients/phone/${patientPhoneNumber}`)
        ]);
        setRecords(recordsResponse.data);
        setPatient(patientResponse.data);

        if (isOwnRecords) {
          try {
            const familyRes = await api.get(`/family/group`);
            if (familyRes.data?.members) {
              setFamilyMembers(familyRes.data.members);
            }
          } catch (err) {
            // No family group
          }
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load records");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [patientPhoneNumber, isOwnRecords]);

  const filteredRecords = useMemo(() => {
    if (selectedPerson.type === 'patient') {
      return records.filter(record => !record.familyMemberId);
    } else {
      return records.filter(record => record.familyMemberId === selectedPerson.id);
    }
  }, [records, selectedPerson]);

  const selectedPersonName = useMemo(() => {
    if (selectedPerson.type === 'patient') {
      return patient?.fullName || 'Self';
    }
    const member = familyMembers.find(m => m.id === selectedPerson.id);
    return member ? `${member.firstName} ${member.lastName}` : 'Family Member';
  }, [selectedPerson, patient, familyMembers]);

  if (isLoading) {
    return <Spinner label="Loading medical history..." />;
  }

  return (
    <div className="space-y-6">
      <BackButton label="Back to dashboard" to="/patient" />

      {/* Header */}
      <div className="card fade-up">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-teal-600">Medical Records</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">
              {selectedPerson.type === 'patient' ? 'My Medical History' : `${selectedPersonName}'s Records`}
            </h1>
            <p className="mt-1 text-sm text-gray-500">Timeline of all consultations and records</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700">
            <svg className="h-4 w-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium">{filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Person Selector */}
        {isOwnRecords && familyMembers.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">View records for</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedPerson({ type: 'patient', id: null })}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPerson.type === 'patient'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {patient?.fullName || 'My Records'}
                <span className="text-xs opacity-75">(Self)</span>
              </button>

              {familyMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedPerson({ type: 'family', id: member.id })}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPerson.type === 'family' && selectedPerson.id === member.id
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {member.firstName} {member.lastName}
                  <span className="text-xs opacity-75">({member.relationship})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Records */}
      {filteredRecords.length === 0 ? (
        <EmptyState
          title={selectedPerson.type === 'patient' ? "No medical records" : `No records for ${selectedPersonName}`}
          description={selectedPerson.type === 'patient'
            ? "No medical records have been added yet."
            : `No records have been added for ${selectedPersonName} yet.`}
        />
      ) : (
        <div className="fade-up-delay-1">
          <RecordTimeline records={filteredRecords} />
        </div>
      )}
    </div>
  );
}
