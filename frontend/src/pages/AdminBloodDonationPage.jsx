import { useEffect, useState } from "react";
import api from "../services/api.js";
import { useToast } from "../components/Toast.jsx";
import BackButton from "../components/BackButton.jsx";
import Spinner from "../components/Spinner.jsx";
import EmptyState from "../components/EmptyState.jsx";

// SVG Icons
const BloodDropIcon = () => (
  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2c-5.33 8-8 11.5-8 15a8 8 0 1016 0c0-3.5-2.67-7-8-15zm0 19c-3.31 0-6-2.69-6-6 0-2.5 2-5.5 6-11.25C16 9.5 18 12.5 18 15c0 3.31-2.69 6-6 6z"/>
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function AdminBloodDonationPage() {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedRequests, setExpandedRequests] = useState({});
  const [donorsByRequestId, setDonorsByRequestId] = useState({});
  const [loadingDonorsId, setLoadingDonorsId] = useState(null);
  const [isMarkingReceived, setIsMarkingReceived] = useState(null);
  const [formData, setFormData] = useState({
    bloodGroup: "",
    hospitalName: "",
    patientName: "",
    patientGender: "",
    patientAge: "",
    contactNumber: "",
    urgency: "HIGH",
    reason: ""
  });

  const bloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
  const urgencyLevels = ["NORMAL", "HIGH", "CRITICAL"];

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await api.get("/blood-donation/requests");
      setRequests(response.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load blood requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.bloodGroup || !formData.hospitalName || !formData.patientName || !formData.contactNumber) {
      toast.warning("Blood group, hospital, patient name and contact number are required");
      return;
    }

    setIsCreating(true);

    try {
      const payload = {
        ...formData,
        patientAge: formData.patientAge ? parseInt(formData.patientAge) : null
      };
      await api.post("/blood-donation/request", payload);
      toast.success("Blood request created and notifications sent!");
      setFormData({
        bloodGroup: "",
        hospitalName: "",
        patientName: "",
        patientGender: "",
        patientAge: "",
        contactNumber: "",
        urgency: "HIGH",
        reason: ""
      });
      setShowModal(false);
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create blood request");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleDonors = async (requestId) => {
    const isExpanded = expandedRequests[requestId];
    if (isExpanded) {
      setExpandedRequests((prev) => ({ ...prev, [requestId]: false }));
      return;
    }

    setExpandedRequests((prev) => ({ ...prev, [requestId]: true }));
    if (donorsByRequestId[requestId]) {
      return;
    }

    setLoadingDonorsId(requestId);
    try {
      const response = await api.get(`/blood-donation/requests/${requestId}/donors`);
      setDonorsByRequestId((prev) => ({ ...prev, [requestId]: response.data }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load donor list");
    } finally {
      setLoadingDonorsId(null);
    }
  };

  const handleMarkReceived = async (requestId) => {
    setIsMarkingReceived(requestId);
    try {
      await api.put(`/blood-donation/requests/${requestId}/received`);
      toast.success("Marked as received and closed.");
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark as received");
    } finally {
      setIsMarkingReceived(null);
    }
  };

  const getUrgencyColor = (urgency) => {
    if (urgency === "CRITICAL") return "bg-red-100 text-red-700 border-red-300";
    if (urgency === "HIGH") return "bg-orange-100 text-orange-700 border-orange-300";
    return "bg-blue-100 text-blue-700 border-blue-300";
  };

  if (isLoading) {
    return <Spinner label="Loading blood requests..." />;
  }

  return (
    <div className="space-y-6">
      <BackButton to="/admin" label="Back to dashboard" />

      {/* Header */}
      <div className="card fade-up">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="pill">Blood Management</div>
            <h1 className="mt-4 text-2xl font-semibold">Blood Donation Requests</h1>
            <p className="text-gray-700">Create urgent blood requests and track donor responses</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="button whitespace-nowrap"
          >
            + New Request
          </button>
        </div>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <EmptyState
          title="No active blood requests"
          description="Click 'New Request' to create one and notify matching donors."
          action={<button onClick={() => setShowModal(true)} className="button">+ New Request</button>}
        />
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <BloodDropIcon />
                      <h3 className="text-lg font-semibold">{request.bloodGroup}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(request.urgency)}`}>
                      {request.urgency}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Patient:</span> {request.patientName}, {request.patientGender}{request.patientAge && `, Age ${request.patientAge}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Hospital:</span> {request.hospitalName}
                  </p>
                  {request.reason && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Reason:</span> {request.reason}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Contact:</span> {request.contactNumber}
                  </p>
                  <div className="mt-4 flex gap-3 flex-wrap">
                    <button
                      className="button-outline text-sm"
                      type="button"
                      onClick={() => toggleDonors(request.id)}
                      disabled={loadingDonorsId === request.id}
                    >
                      {loadingDonorsId === request.id
                        ? "Loading donors..."
                        : expandedRequests[request.id]
                          ? "Hide donors"
                          : "View donors"}
                    </button>
                    <button
                      className="button text-sm"
                      type="button"
                      onClick={() => handleMarkReceived(request.id)}
                      disabled={isMarkingReceived === request.id}
                    >
                      {isMarkingReceived === request.id ? "Marking..." : "Mark received"}
                    </button>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-3xl font-bold text-emerald-600">{request.interestedCount}</div>
                  <p className="text-xs text-gray-500">Donors Interested</p>
                </div>
              </div>

              {expandedRequests[request.id] && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700">Interested donors</h4>
                  {donorsByRequestId[request.id]?.length ? (
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {donorsByRequestId[request.id].map((donor) => (
                        <div key={donor.patientId} className="rounded-lg border border-gray-200 p-3 text-sm">
                          <div className="font-medium text-gray-900">{donor.fullName}</div>
                          <div className="text-gray-600">{donor.phoneNumber}</div>
                          <div className="text-gray-600">
                            {donor.gender || "Gender n/a"}
                            {donor.age ? ` - Age ${donor.age}` : ""}
                          </div>
                          <div className="text-gray-600">
                            {donor.bloodGroup || "Blood group n/a"}
                          </div>
                          {donor.location && (
                            <div className="text-gray-600">{donor.location}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-gray-500">No donors have responded yet.</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="card w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto relative slide-up">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <h2 className="text-xl font-semibold">Create Blood Request</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Blood Group */}
                <div>
                  <label className="label">Blood Group *</label>
                  <select
                    className="input"
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select blood group</option>
                    {bloodGroups.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                {/* Urgency */}
                <div>
                  <label className="label">Urgency Level *</label>
                  <select
                    className="input"
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleInputChange}
                  >
                    {urgencyLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Hospital/Clinic Name *</label>
                <input
                  className="input"
                  type="text"
                  name="hospitalName"
                  placeholder="e.g., City Hospital"
                  value={formData.hospitalName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Patient Name */}
                <div>
                  <label className="label">Patient Name *</label>
                  <input
                    className="input"
                    type="text"
                    name="patientName"
                    placeholder="Patient name"
                    value={formData.patientName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label className="label">Contact Number *</label>
                  <input
                    className="input"
                    type="tel"
                    name="contactNumber"
                    placeholder="Emergency contact"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Gender */}
                <div>
                  <label className="label">Patient Gender</label>
                  <select
                    className="input"
                    name="patientGender"
                    value={formData.patientGender}
                    onChange={handleInputChange}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Age */}
                <div>
                  <label className="label">Patient Age</label>
                  <input
                    className="input"
                    type="number"
                    name="patientAge"
                    placeholder="Age"
                    value={formData.patientAge}
                    onChange={handleInputChange}
                    min="0"
                    max="120"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="label">Reason for Blood (Optional)</label>
                <textarea
                  className="input"
                  name="reason"
                  placeholder="e.g., Emergency surgery, Post-delivery complication"
                  rows="2"
                  value={formData.reason}
                  onChange={handleInputChange}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="button-outline flex-1"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button flex-1"
                  disabled={isCreating}
                >
                  {isCreating && <span className="spinner" />}
                  {isCreating ? "Creating..." : "Create & Send Requests"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
