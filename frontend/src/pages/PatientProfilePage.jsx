import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import BackButton from "../components/BackButton.jsx";
import Spinner from "../components/Spinner.jsx";

export default function PatientProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    location: "",
    phoneNumber: "",
    email: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get(`/patients/phone/${user?.phoneNumber}`);
      setProfile(response.data);
      setFormData({
        firstName: response.data.fullName?.split(" ")[0] || "",
        lastName: response.data.fullName?.split(" ").slice(1).join(" ") || "",
        dateOfBirth: response.data.dateOfBirth || "",
        gender: response.data.gender || "",
        bloodGroup: response.data.bloodGroup || "",
        location: response.data.location || "",
        phoneNumber: response.data.phoneNumber || "",
        email: response.data.email || user?.email || "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleOpenModal = () => {
    setError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsUpdating(true);

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("First name and last name are required");
      setIsUpdating(false);
      return;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      setIsUpdating(false);
      return;
    }
    if (formData.newPassword && formData.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      setIsUpdating(false);
      return;
    }
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError("New password and confirm password do not match");
      setIsUpdating(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        newPassword: formData.newPassword?.trim() ? formData.newPassword : null
      };
      delete payload.confirmPassword;
      const emailChanged = formData.email.trim().toLowerCase() !== (user?.email || "").toLowerCase();
      const response = await api.put("/patients/me", payload);
      setProfile(response.data);
      updateUser({
        email: response.data.email,
        phoneNumber: response.data.phoneNumber,
        firstName: response.data.fullName?.split(" ")[0] || user?.firstName,
        lastName: response.data.fullName?.split(" ").slice(1).join(" ") || user?.lastName
      });
      if (emailChanged) {
        toast.success("Email updated. Please sign in again with your new email.");
        logout();
        navigate("/login");
        return;
      }
      toast.success("Profile updated successfully!");
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoadingProfile) {
    return <Spinner label="Loading profile..." />;
  }

  const profileFields = [
    { label: "Age", value: profile?.age || "Not provided" },
    { label: "Gender", value: profile?.gender || "Not provided" },
    { label: "Blood Group", value: profile?.bloodGroup || "Not provided", highlight: true },
    { label: "Email", value: profile?.email || user?.email || "Not provided" },
    { label: "Phone", value: profile?.phoneNumber },
    { label: "Location", value: profile?.location || "Not provided" }
  ];

  return (
    <div className="space-y-6">
      <BackButton to="/patient" label="Back to dashboard" />

      {/* Profile Card */}
      <div className="card fade-up">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-teal-600">Health Profile</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">
              {profile?.fullName || "Patient"}
            </h1>
          </div>
          <button onClick={handleOpenModal} className="button shrink-0">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profileFields.map((field, index) => (
            <div key={index} className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{field.label}</p>
              <p className={`mt-1 font-medium ${field.highlight ? "text-red-600" : "text-gray-900"}`}>
                {field.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={handleCloseModal} />
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto relative slide-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Edit Profile</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">First Name *</label>
                  <input className="input" type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input className="input" type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Date of Birth</label>
                  <input className="input" type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select className="input" name="gender" value={formData.gender} onChange={handleInputChange}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Blood Group</label>
                <select className="input" name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange}>
                  <option value="">Select blood group</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label className="label">Location</label>
                <input className="input" type="text" name="location" placeholder="City or address" value={formData.location} onChange={handleInputChange} />
              </div>

              <div>
                <label className="label">Email *</label>
                <input className="input" type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                <p className="mt-1 text-xs text-gray-500">OTP and notifications are sent here.</p>
              </div>

              <div>
                <label className="label">Phone Number</label>
                <input className="input" type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">New Password</label>
                  <input className="input" type="password" name="newPassword" placeholder="Leave blank to keep current" value={formData.newPassword} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input className="input" type="password" name="confirmPassword" placeholder="Re-enter password" value={formData.confirmPassword} onChange={handleInputChange} />
                </div>
              </div>

              {error && (
                <div className="alert alert-error">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={handleCloseModal} className="button-outline flex-1" disabled={isUpdating}>
                  Cancel
                </button>
                <button type="submit" className="button flex-1" disabled={isUpdating}>
                  {isUpdating && <span className="spinner" />}
                  {isUpdating ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
