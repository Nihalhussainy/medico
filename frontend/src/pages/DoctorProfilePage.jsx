import { useEffect, useState } from "react";
import api from "../services/api.js";
import { useToast } from "../components/Toast.jsx";
import BackButton from "../components/BackButton.jsx";
import Spinner from "../components/Spinner.jsx";

export default function DoctorProfilePage() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    specialization: "",
    hospitalName: ""
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
        hospitalName: response.data.hospitalName || ""
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
    try {
      setIsSaving(true);
      const response = await api.put("/doctors/me", formData);
      setProfile(response.data);
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
        <div className="card border-l-4 border-coral">
          <p className="text-coral">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton to="/doctor" label="Back to workspace" />

      <div className="card fade-up">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="pill">Profile</div>
            <h1 className="mt-4 text-2xl font-semibold">Doctor information</h1>
            <p className="text-slate-700">Manage your professional details</p>
          </div>
          {!isEditing && (
            <button 
              className="button-outline"
              onClick={() => setIsEditing(true)}
            >
              Edit profile
            </button>
          )}
        </div>
      </div>

      <div className="card space-y-6 fade-up-delay-1">
        {/* Basic Info - Read Only */}
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="label">First name</label>
            <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
              {profile.firstName}
            </div>
          </div>
          <div>
            <label className="label">Last name</label>
            <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
              {profile.lastName}
            </div>
          </div>
          <div>
            <label className="label">Phone number</label>
            <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
              {profile.phoneNumber}
            </div>
          </div>
          <div>
            <label className="label">License number</label>
            <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
              {profile.licenseNumber}
            </div>
          </div>
        </div>

        {/* Editable Fields */}
        {isEditing ? (
          <div className="space-y-4 border-t pt-6">
            <div>
              <label className="label">Specialization</label>
              <input
                className="input"
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                placeholder="e.g., General Practitioner, Cardiologist"
              />
            </div>
            <div>
              <label className="label">Hospital name</label>
              <input
                className="input"
                type="text"
                name="hospitalName"
                value={formData.hospitalName}
                onChange={handleInputChange}
                placeholder="Your hospital/clinic name"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                className="button"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving && <span className="spinner" />}
                {isSaving ? "Saving..." : "Save changes"}
              </button>
              <button
                className="button-outline"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    specialization: profile.specialization,
                    hospitalName: profile.hospitalName || ""
                  });
                }}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 border-t pt-6">
            <div>
              <label className="label">Specialization</label>
              <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
                {profile.specialization}
              </div>
            </div>
            <div>
              <label className="label">Hospital name</label>
              <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
                {profile.hospitalName ? (
                  <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm border border-emerald-200">
                    {profile.hospitalName}
                  </span>
                ) : (
                  <span className="text-slate-500">Not set</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
