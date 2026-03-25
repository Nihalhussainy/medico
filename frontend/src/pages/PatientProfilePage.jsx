import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { useConfirm } from "../components/ConfirmDialog.jsx";
import BackButton from "../components/BackButton.jsx";
import Spinner from "../components/Spinner.jsx";
import ImageCropperModal from "../components/ImageCropperModal.jsx";

export default function PatientProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isPhotoUpdating, setIsPhotoUpdating] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  const quickPhotoInputRef = useRef(null);
  const editSectionRef = useRef(null);
  const passwordSectionRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    location: "",
    phoneNumber: "",
    email: ""
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (isEditing && editSectionRef.current) {
      editSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isEditing]);

  useEffect(() => {
    if (showPasswordForm && passwordSectionRef.current) {
      passwordSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showPasswordForm]);

  const buildFormFromProfile = (data) => ({
    firstName: data.fullName?.split(" ")[0] || "",
    lastName: data.fullName?.split(" ").slice(1).join(" ") || "",
    dateOfBirth: data.dateOfBirth || "",
    gender: data.gender || "",
    bloodGroup: data.bloodGroup || "",
    location: data.location || "",
    phoneNumber: data.phoneNumber || "",
    email: data.email || user?.email || ""
  });

  const loadProfile = async () => {
    try {
      const response = await api.get(`/patients/phone/${user?.phoneNumber}`);
      setProfile(response.data);
      setFormData(buildFormFromProfile(response.data));
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileError("Please select a valid image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileError("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setProfileError(null);
      setImageToCrop(event.target.result);
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const uploadProfilePicture = async (fileToUpload) => {
    const formDataWithImage = new FormData();
    formDataWithImage.append("profilePicture", fileToUpload);
    await api.put("/patients/me/profile-picture", formDataWithImage, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
  };

  const handleCropComplete = (imageElement, crop) => {
    const canvas = document.createElement("canvas");
    const scaleX = imageElement.naturalWidth / imageElement.width;
    const scaleY = imageElement.naturalHeight / imageElement.height;
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      imageElement,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setProfileError("Failed to process image. Please try again.");
        setIsCropperOpen(false);
        setImageToCrop(null);
        return;
      }

      setIsPhotoUpdating(true);
      try {
        const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
        await uploadProfilePicture(file);
        await loadProfile();
        toast.success("Profile photo updated");
      } catch (err) {
        setProfileError(err.response?.data?.message || "Failed to update profile photo");
      } finally {
        setIsPhotoUpdating(false);
        setIsCropperOpen(false);
        setImageToCrop(null);
      }
    }, "image/jpeg");
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError(null);

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setProfileError("First name and last name are required");
      return;
    }
    if (!formData.email.trim()) {
      setProfileError("Email is required");
      return;
    }

    const confirmed = await confirm(
      "Do you want to save these profile changes?",
      "Save Profile Changes"
    );
    if (!confirmed) return;

    setIsSavingProfile(true);
    try {
      const payload = { ...formData };
      const emailChanged = formData.email.trim().toLowerCase() !== (user?.email || "").toLowerCase();
      const response = await api.put("/patients/me", payload);

      setProfile(response.data);
      setFormData(buildFormFromProfile(response.data));
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

      toast.success("Profile saved successfully! All changes have been applied.");
      setIsEditing(false);
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);

    const { newPassword, confirmPassword } = passwordForm;
    if (!newPassword.trim()) {
      setPasswordError("New password is required");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match");
      return;
    }

    const confirmed = await confirm(
      "Are you sure you want to change your password? You may need to log in again with your new password.",
      "Change Password"
    );
    if (!confirmed) return;

    setIsSavingPassword(true);
    try {
      const payload = {
        firstName: profile?.fullName?.split(" ")[0] || formData.firstName,
        lastName: profile?.fullName?.split(" ").slice(1).join(" ") || formData.lastName,
        dateOfBirth: profile?.dateOfBirth || formData.dateOfBirth,
        gender: profile?.gender || formData.gender,
        bloodGroup: profile?.bloodGroup || formData.bloodGroup,
        location: profile?.location || formData.location,
        phoneNumber: profile?.phoneNumber || formData.phoneNumber,
        email: profile?.email || formData.email,
        newPassword: newPassword.trim()
      };

      await api.put("/patients/me", payload);
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      setShowPasswordForm(false);
      toast.success("Password changed successfully! Your account is now more secure.");
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Failed to change password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setFormData(buildFormFromProfile(profile));
    }
    setProfileError(null);
    setIsEditing(false);
  };

  if (isLoadingProfile) {
    return <Spinner label="Loading profile..." />;
  }

  const profileFields = [
    {
      key: "age",
      label: "Age",
      value: profile?.age || "Not provided",
      tone: "text-indigo-700 bg-indigo-100",
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      key: "gender",
      label: "Gender",
      value: profile?.gender || "Not provided",
      tone: "text-sky-700 bg-sky-100",
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      key: "blood",
      label: "Blood Group",
      value: profile?.bloodGroup || "Not provided",
      tone: "text-rose-700 bg-rose-100",
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3s6 5.686 6 10a6 6 0 11-12 0c0-4.314 6-10 6-10z" />
        </svg>
      )
    },
    {
      key: "email",
      label: "Email",
      value: profile?.email || user?.email || "Not provided",
      tone: "text-violet-700 bg-violet-100",
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      key: "phone",
      label: "Phone",
      value: profile?.phoneNumber || "Not provided",
      tone: "text-emerald-700 bg-emerald-100",
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.497 4.493a1 1 0 01-.502 1.21l-2.257 1.128a11.042 11.042 0 005.516 5.516l1.128-2.257a1 1 0 011.21-.502l4.493 1.497A1 1 0 0121 15.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      )
    },
    {
      key: "location",
      label: "Location",
      value: profile?.location || "Not provided",
      tone: "text-amber-700 bg-amber-100",
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <BackButton to="/patient" label="Back to dashboard" />

      <div className="card fade-up">
        <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-2xl border-2 border-white bg-teal-100 shadow-sm">
                {profile?.profilePictureUrl ? (
                  <img src={profile.profilePictureUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-teal-700">
                    {(profile?.fullName || "P").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-teal-600">Health Profile</p>
                <h1 className="mt-1 text-3xl font-semibold text-gray-900">{profile?.fullName || "Patient"}</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Keep your details up to date for better recommendations and risk insights.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="button-outline text-xs"
                    onClick={() => quickPhotoInputRef.current?.click()}
                    disabled={isPhotoUpdating || isSavingProfile || isSavingPassword}
                  >
                    {isPhotoUpdating ? "Updating photo..." : "Change Photo"}
                  </button>
                  <input
                    ref={quickPhotoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePictureChange}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-full border border-gray-200 bg-white/80 px-3 py-1 text-xs font-medium text-gray-600">
                {profile?.email || user?.email}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => {
              setIsEditing((prev) => !prev);
              setShowPasswordForm(false);
              setPasswordError(null);
            }}
            className="button shrink-0"
            type="button"
          >
            {isEditing ? "Close Edit" : "Edit Details"}
          </button>
          <button
            onClick={() => {
              setShowPasswordForm((prev) => !prev);
              setIsEditing(false);
              setProfileError(null);
            }}
            className="button-outline shrink-0"
            type="button"
          >
            {showPasswordForm ? "Close Password" : "Change Password"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profileFields.map((field) => (
            <div key={field.key} className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">{field.label}</p>
                  <p className="mt-2 break-words text-lg font-semibold text-gray-900">{field.value}</p>
                </div>
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${field.tone}`}>
                  {field.icon}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isEditing && (
        <div ref={editSectionRef} className="card fade-up-delay-1">
          <h2 className="text-lg font-semibold text-gray-900">Edit Profile</h2>
          <p className="mt-1 text-sm text-gray-600">Update your details directly on this page.</p>

          <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
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

            {profileError && (
              <div className="alert alert-error">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{profileError}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 border-t border-gray-100 pt-4">
              <button type="button" onClick={handleCancelEdit} className="button-outline flex-1" disabled={isSavingProfile}>
                Cancel
              </button>
              <button type="submit" className="button flex-1" disabled={isSavingProfile}>
                {isSavingProfile ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showPasswordForm && (
        <div ref={passwordSectionRef} className="card fade-up-delay-1">
          <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
          <p className="mt-1 text-sm text-gray-600">Only password fields are shown here for security and clarity.</p>

          <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">New Password</label>
                <input
                  className="input"
                  type="password"
                  name="newPassword"
                  placeholder="Minimum 6 characters"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordInputChange}
                />
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input
                  className="input"
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter new password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordInputChange}
                />
              </div>
            </div>

            {passwordError && (
              <div className="alert alert-error">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{passwordError}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordError(null);
                  setPasswordForm({ newPassword: "", confirmPassword: "" });
                }}
                className="button-outline flex-1"
                disabled={isSavingPassword}
              >
                Cancel
              </button>
              <button type="submit" className="button flex-1" disabled={isSavingPassword}>
                {isSavingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      )}

      {isCropperOpen && (
        <ImageCropperModal
          imageSrc={imageToCrop}
          onClose={() => {
            setIsCropperOpen(false);
            setImageToCrop(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
