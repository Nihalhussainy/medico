import { useEffect, useState } from "react";
import api from "../services/api.js";
import { useToast } from "../components/Toast.jsx";
import Spinner from "../components/Spinner.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function PatientBloodNotifications() {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await api.get("/blood-donation/notifications");
      setNotifications(response.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (notificationId, response) => {
    setRespondingId(notificationId);
    try {
      await api.put(`/blood-donation/notifications/${notificationId}/respond`, {
        response
      });
      toast.success("Thank you! Your response has been recorded.");
      loadNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to respond");
    } finally {
      setRespondingId(null);
    }
  };

  const getUrgencyColor = (urgency) => {
    if (urgency === "CRITICAL") return "bg-red-100 text-red-700 border-red-300";
    if (urgency === "HIGH") return "bg-orange-100 text-orange-700 border-orange-300";
    return "bg-blue-100 text-blue-700 border-blue-300";
  };

  const getResponseColor = (response) => {
    if (response === "INTERESTED") return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (response === "NOT_INTERESTED") return "text-slate-600 bg-slate-50 border-slate-200";
    return "text-slate-500 bg-slate-50 border-slate-200";
  };

  if (isLoading) {
    return <Spinner label="Loading notifications..." />;
  }

  const activeNotifications = notifications.filter(n => n.response === "NO_RESPONSE");
  const respondedNotifications = notifications.filter(n => n.response !== "NO_RESPONSE");

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {activeNotifications.length > 0 && (
        <>
          <div className="card bg-red-50 border border-red-200 p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🚨</div>
              <div>
                <h2 className="text-lg font-semibold text-red-900">Blood Donation Urgently Needed</h2>
                <p className="text-sm text-red-800 mt-1">Your blood group is required. Please respond if you can donate.</p>
              </div>
            </div>
          </div>

          {activeNotifications.map((notif) => (
            <div key={notif.id} className="card space-y-4 border-l-4 border-l-red-500">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">🩸 {notif.bloodGroup}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(notif.urgency)}`}>
                      {notif.urgency}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    <span className="font-medium">Patient:</span> {notif.patientName}{notif.patientGender && `, ${notif.patientGender}`}{notif.patientAge && `, Age ${notif.patientAge}`}
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Hospital:</span> {notif.hospitalName}
                  </p>
                  {notif.reason && (
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Reason:</span> {notif.reason}
                    </p>
                  )}
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Contact:</span> {notif.contactNumber}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 border-t border-slate-200 pt-4">
                <button
                  onClick={() => handleRespond(notif.id, "INTERESTED")}
                  disabled={respondingId === notif.id}
                  className="button flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {respondingId === notif.id && <span className="spinner" />}
                  {respondingId === notif.id ? "Responding..." : "✓ I Can Donate"}
                </button>
                <button
                  onClick={() => handleRespond(notif.id, "NOT_INTERESTED")}
                  disabled={respondingId === notif.id}
                  className="button-outline flex-1"
                >
                  {respondingId === notif.id ? "Responding..." : "✕ Cannot Donate"}
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Previously Responded */}
      {respondedNotifications.length > 0 && (
        <>
          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-lg font-semibold mb-4">Previous Requests</h3>
            <div className="space-y-3">
              {respondedNotifications.map((notif) => (
                <div key={notif.id} className="card p-4 opacity-75">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">{notif.bloodGroup}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getResponseColor(notif.response)}`}>
                          {notif.response === "INTERESTED" ? "You responded: Interested" : "You responded: Not Interested"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{notif.hospitalName}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {notifications.length === 0 && (
        <EmptyState
          icon="notification"
          title="No blood donation requests"
          description="No active blood donation requests for your blood group."
        />
      )}
    </div>
  );
}
