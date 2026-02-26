import { useEffect, useState } from "react";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import BackButton from "../components/BackButton.jsx";
import Spinner from "../components/Spinner.jsx";

export default function PatientProfilePage() {
  const { user } = useAuth();
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
    location: ""
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
        location: response.data.location || ""
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleOpenModal = () => {
    setError(null);
    setMessage(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError(null);
    setMessage(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsUpdating(true);

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("First name and last name are required");
      setIsUpdating(false);
      return;
    }

    try {
      const response = await api.put("/patients/me", formData);
      setProfile(response.data);
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

  return (
    <div className="space-y-6">
      <BackButton to="/patient" label="Back to portal" />

      {/* Profile Card */}
      <div className="card fade-up">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="pill">Health Profile</div>
            <h1 className="mt-4 text-2xl font-semibold">{profile?.fullName || "Patient"}</h1>
            <div className="mt-4 grid gap-3 text-sm text-slate-700">
              <div>
                <span className="font-medium">Age:</span> {profile?.age || "Not provided"}
              </div>
              <div>
                <span className="font-medium">Gender:</span> {profile?.gender || "Not provided"}
              </div>
              <div>
                <span className="font-medium">Phone:</span> {profile?.phoneNumber}
              </div>
              <div>
                <span className="font-medium">Blood Group:</span> {profile?.bloodGroup || "Not provided"}
              </div>
              <div>
                <span className="font-medium">Location:</span> {profile?.location || "Not provided"}
              </div>
            </div>
          </div>
          <button
            onClick={handleOpenModal}
            className="button text-sm whitespace-nowrap"
          >
            Complete Profile
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={handleCloseModal} />
          <div className="card w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto relative slide-up">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-xl font-semibold">Complete Your Profile</h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First Name */}
              <div>
                <label className="label">First Name *</label>
                <input
                  className="input"
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="label">Last Name *</label>
                <input
                  className="input"
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="label">Date of Birth</label>
                <input
                  className="input"
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                />
              </div>

              {/* Gender */}
              <div>
                <label className="label">Gender</label>
                <select
                  className="input"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Blood Group */}
              <div>
                <label className="label">Blood Group</label>
                <select
                  className="input"
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleInputChange}
                >
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

              {/* Location */}
              <div>
                <label className="label">Location / Address</label>
                <textarea
                  className="input"
                  name="location"
                  placeholder="Enter your city, area, or full address"
                  rows="2"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="button-outline flex-1"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button flex-1"
                  disabled={isUpdating}
                >
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
