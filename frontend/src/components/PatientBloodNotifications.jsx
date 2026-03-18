import { useEffect, useState } from "react";
import api from "../services/api.js";
import { useToast } from "../components/Toast.jsx";
import Spinner from "../components/Spinner.jsx";
import EmptyState from "../components/EmptyState.jsx";

// SVG Icons
const AlertIcon = () => (
  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const BloodDropIcon = () => (
  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

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
    if (response === "NOT_INTERESTED") return "text-gray-600 bg-gray-50 border-gray-200";
    return "text-gray-500 bg-gray-50 border-gray-200";
  };

  if (isLoading) {
    return <Spinner label="Loading notifications..." />;
  }

  const activeNotifications = notifications.filter(n => n.response === "NO_RESPONSE");
  const respondedNotifications = notifications
    .filter(n => n.response !== "NO_RESPONSE")
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  const latestRespondedNotification = respondedNotifications[0] || null;

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {activeNotifications.length > 0 && (
        <>
          <div className="card bg-red-50 border border-red-200 p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertIcon />
              </div>
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
                    <div className="flex items-center gap-2">
                      <BloodDropIcon />
                      <h3 className="text-lg font-semibold">{notif.bloodGroup}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(notif.urgency)}`}>
                      {notif.urgency}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Patient:</span> {notif.patientName}{notif.patientGender && `, ${notif.patientGender}`}{notif.patientAge && `, Age ${notif.patientAge}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Hospital:</span> {notif.hospitalName}
                  </p>
                  {notif.reason && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Reason:</span> {notif.reason}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Contact:</span> {notif.contactNumber}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 border-t border-gray-200 pt-4">
                <button
                  onClick={() => handleRespond(notif.id, "INTERESTED")}
                  disabled={respondingId === notif.id}
                  className="button flex-1 bg-emerald-600 hover:bg-emerald-700 inline-flex items-center justify-center gap-2"
                >
                  {respondingId === notif.id && <span className="spinner" />}
                  {respondingId === notif.id ? "Responding..." : (
                    <>
                      <CheckIcon />
                      <span>I Can Donate</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleRespond(notif.id, "NOT_INTERESTED")}
                  disabled={respondingId === notif.id}
                  className="button-outline flex-1 inline-flex items-center justify-center gap-2"
                >
                  {respondingId === notif.id ? "Responding..." : (
                    <>
                      <CloseIcon />
                      <span>Cannot Donate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Previously Responded */}
      {latestRespondedNotification && (
        <>
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Most Recent Previous Request</h3>
            <div className="space-y-3">
              <div className="card p-4 opacity-80">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{latestRespondedNotification.bloodGroup}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getResponseColor(latestRespondedNotification.response)}`}>
                        {latestRespondedNotification.response === "INTERESTED" ? "You responded: Interested" : "You responded: Not Interested"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{latestRespondedNotification.hospitalName}</p>
                  </div>
                </div>
              </div>
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
