import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api.js";
import RecordTimeline from "../components/RecordTimeline.jsx";
import { useToast } from "../components/Toast.jsx";
import BackButton from "../components/BackButton.jsx";
import Spinner from "../components/Spinner.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function MedicalHistoryPage() {
  const toast = useToast();
  const { patientPhoneNumber } = useParams();
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get(`/records/patient/${patientPhoneNumber}`);
        setRecords(response.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load records");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [patientPhoneNumber]);

  if (isLoading) {
    return <Spinner label="Loading medical history..." />;
  }

  return (
    <div className="space-y-6">
      <BackButton label="Back" />

      <div className="card-accent fade-up">
        <div className="pill">Record timeline</div>
        <h1 className="mt-4 text-2xl font-semibold">Medical history</h1>
        <p className="text-slate-700">Patient phone {patientPhoneNumber}</p>
      </div>

      {records.length === 0 ? (
        <EmptyState
          title="No medical records"
          description="There are no medical records for this patient yet."
        />
      ) : (
        <div className="fade-up-delay-1">
          <RecordTimeline records={records} />
        </div>
      )}
    </div>
  );
}
