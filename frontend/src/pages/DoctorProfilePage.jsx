import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import BackButton from "../components/BackButton.jsx";
import Spinner from "../components/Spinner.jsx";

export default function DoctorProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    specialization: "",
    hospitalName: "",
    phoneNumber: "",
    email: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/doctors/me");
      setProfile(response.data);
      setFormData({
        specialization: response.data.specialization,
        hospitalName: response.data.hospitalName || "",
        phoneNumber: response.data.phoneNumber || "",
        email: response.data.email || user?.email || "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (formData.newPassword && formData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        ...formData,
        newPassword: formData.newPassword?.trim() ? formData.newPassword : null
      };
      delete payload.confirmPassword;
      const emailChanged = formData.email.trim().toLowerCase() !== (user?.email || "").toLowerCase();
      const response = await api.put("/doctors/me", payload);
      setProfile(response.data);
      updateUser({
        email: response.data.email,
        phoneNumber: response.data.phoneNumber,
        firstName: response.data.firstName,
        lastName: response.data.lastName
      });
      if (emailChanged) {
        toast.success("Email updated. Please sign in again with your new email.");
        logout();
        navigate("/login");
        return;
      }
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Spinner label="Loading profile..." />;
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <BackButton to="/doctor" label="Back to workspace" />
        <div className="alert alert-error">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton to="/doctor" label="Back to workspace" />

      {/* Header */}
      <div className="card fade-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-teal-600">Profile</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">Doctor Information</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your professional identity and clinic details.</p>
          </div>
          {!isEditing && (
            <button className="button-outline shrink-0" onClick={() => setIsEditing(true)}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Profile Details */}
      <div className="card fade-up-delay-1 space-y-6">
        {/* Read-only Fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">First Name</label>
            <div className="px-3.5 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 text-sm">
              {profile.firstName}
            </div>
          </div>
          <div>
            <label className="label">Last Name</label>
            <div className="px-3.5 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 text-sm">
              {profile.lastName}
            </div>
          </div>
          <div>
            <label className="label">License Number</label>
            <div className="px-3.5 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 text-sm">
              {profile.licenseNumber}
            </div>
          </div>
          <div>
            <label className="label">Phone Number</label>
            <div className="px-3.5 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 text-sm">
              {profile.phoneNumber}
            </div>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="border-t border-gray-100 pt-6">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Specialization</label>
                  <input
                    className="input"
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    placeholder="e.g., Cardiology"
                  />
                </div>
                <div>
                  <label className="label">Hospital Name</label>
                  <input
                    className="input"
                    type="text"
                    name="hospitalName"
                    value={formData.hospitalName}
                    onChange={handleInputChange}
                    placeholder="Your hospital or clinic"
                  />
                </div>
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                />
                <p className="mt-1 text-xs text-gray-500">Account notifications are sent here.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">New Password</label>
                  <input
                    className="input"
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Leave blank to keep current"
                  />
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input
                    className="input"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button className="button" onClick={handleSave} disabled={isSaving}>
                  {isSaving && <span className="spinner" />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  className="button-outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      specialization: profile.specialization,
                      hospitalName: profile.hospitalName || "",
                      phoneNumber: profile.phoneNumber || "",
                      email: profile.email || user?.email || "",
                      newPassword: "",
                      confirmPassword: ""
                    });
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Specialization</label>
                <div className="px-3.5 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 text-sm">
                  {profile.specialization}
                </div>
              </div>
              <div>
                <label className="label">Hospital Name</label>
                <div className="px-3.5 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 text-sm">
                  {profile.hospitalName || <span className="text-gray-400">Not set</span>}
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <div className="px-3.5 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 text-sm">
                  {profile.email || user?.email || "Not provided"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
