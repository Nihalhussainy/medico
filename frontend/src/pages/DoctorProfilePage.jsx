import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { useConfirm } from "../components/ConfirmDialog.jsx";
import BackButton from "../components/BackButton.jsx";
import Spinner from "../components/Spinner.jsx";
import ImageCropperModal from "../components/ImageCropperModal.jsx";

export default function DoctorProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isPhotoUpdating, setIsPhotoUpdating] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  const quickPhotoInputRef = useRef(null);
  const editSectionRef = useRef(null);
  const passwordSectionRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    specialization: "",
    hospitalName: "",
    phoneNumber: "",
    email: ""
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    fetchProfile();
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
    firstName: data.firstName || "",
    lastName: data.lastName || "",
    specialization: data.specialization || "",
    hospitalName: data.hospitalName || "",
    phoneNumber: data.phoneNumber || "",
    email: data.email || user?.email || ""
  });

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/doctors/me");
      setProfile(response.data);
      setFormData(buildFormFromProfile(response.data));
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to load profile");
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

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const uploadProfilePicture = async (fileToUpload) => {
    const formDataWithImage = new FormData();
    formDataWithImage.append("profilePicture", fileToUpload);
    await api.put("/doctors/me/profile-picture", formDataWithImage, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setProfileError('Please select a valid image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setProfileError('Image size must be less than 5MB');
        return;
      }
      // Create preview and open cropper
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageToCrop(e.target.result);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (imageElement, crop) => {
    const canvas = document.createElement('canvas');
    const scaleX = imageElement.naturalWidth / imageElement.width;
    const scaleY = imageElement.naturalHeight / imageElement.height;
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext('2d');

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
        setProfileError('Failed to process image. Please try again.');
        setIsCropperOpen(false);
        setImageToCrop(null);
        return;
      }

      setIsPhotoUpdating(true);
      try {
        const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
        await uploadProfilePicture(file);
        await fetchProfile();
        toast.success("Profile photo updated");
      } catch (err) {
        setProfileError(err.response?.data?.message || "Failed to update profile photo");
      } finally {
        setIsPhotoUpdating(false);
        setIsCropperOpen(false);
        setImageToCrop(null);
      }
    }, 'image/jpeg');
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

    try {
      setIsSavingProfile(true);
      const payload = { ...formData };
      const emailChanged = formData.email.trim().toLowerCase() !== (user?.email || "").toLowerCase();
      const response = await api.put("/doctors/me", payload);

      setProfile(response.data);
      setFormData(buildFormFromProfile(response.data));
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
      toast.success("Profile updated successfully! All changes have been applied.");
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
      "Are you sure you want to change your password? You may need to log in again.",
      "Change Password"
    );
    if (!confirmed) return;

    try {
      setIsSavingPassword(true);
      const payload = {
        firstName: profile?.firstName || formData.firstName,
        lastName: profile?.lastName || formData.lastName,
        specialization: profile?.specialization || formData.specialization,
        hospitalName: profile?.hospitalName || formData.hospitalName,
        phoneNumber: profile?.phoneNumber || formData.phoneNumber,
        email: profile?.email || formData.email,
        newPassword: newPassword.trim()
      };
      await api.put("/doctors/me", payload);

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
    toast.info("Profile edit cancelled");
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

      <div className="card fade-up">
        <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-28 w-28 overflow-hidden rounded-2xl border-2 border-white bg-teal-100 shadow-sm">
                {profile?.profilePictureUrl ? (
                  <img src={profile.profilePictureUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-teal-700">
                    {(profile?.firstName || "D").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-teal-600">Doctor Profile</p>
                <h1 className="mt-1 text-3xl font-semibold text-gray-900">
                  Dr. {profile?.firstName} {profile?.lastName}
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your professional identity and clinic details.
                </p>
                <p className="mt-2 inline-flex rounded-full border border-teal-100 bg-white px-3 py-1 text-xs font-medium text-teal-700">
                  License No: {profile?.licenseNumber || "Not available"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <label className="cursor-pointer">
                <input
                  ref={quickPhotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
                <span className="button-outline inline-flex">
                  {isPhotoUpdating ? "Updating..." : "Change Photo"}
                </span>
              </label>
              <button
                type="button"
                className="button"
                onClick={() => {
                  setIsEditing((prev) => !prev);
                  setShowPasswordForm(false);
                  setPasswordError(null);
                }}
              >
                {isEditing ? "Close Edit" : "Edit Details"}
              </button>
              <button
                type="button"
                className="button-outline"
                onClick={() => {
                  setShowPasswordForm((prev) => !prev);
                  setIsEditing(false);
                  setProfileError(null);
                }}
              >
                {showPasswordForm ? "Close Password" : "Change Password"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">First Name</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{profile?.firstName || "Not provided"}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Last Name</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{profile?.lastName || "Not provided"}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Specialization</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{profile?.specialization || "Not set"}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Hospital Name</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{profile?.hospitalName || "Not set"}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Email</p>
            <p className="mt-2 break-words text-lg font-semibold text-gray-900">{profile?.email || user?.email || "Not provided"}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Phone Number</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{profile?.phoneNumber || "Not provided"}</p>
          </div>
        </div>
      </div>

      {isEditing && (
        <div ref={editSectionRef} className="card fade-up-delay-1">
          <h2 className="text-lg font-semibold text-gray-900">Edit Details</h2>
          <p className="mt-1 text-sm text-gray-600">Update all information except your license number.</p>

          {profileError && (
            <div className="alert alert-error mt-4">{profileError}</div>
          )}

          <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">First Name</label>
                <input
                  className="input"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  className="input"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label className="label">License Number</label>
              <input className="input bg-gray-100" type="text" value={profile?.licenseNumber || ""} readOnly />
            </div>

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

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Phone Number</label>
                <input
                  className="input"
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Phone number"
                />
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
              </div>
            </div>

            <div className="flex gap-3 border-t border-gray-100 pt-4">
              <button className="button" type="submit" disabled={isSavingProfile}>
                {isSavingProfile ? "Saving..." : "Save Changes"}
              </button>
              <button className="button-outline" type="button" onClick={handleCancelEdit} disabled={isSavingProfile}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showPasswordForm && (
        <div ref={passwordSectionRef} className="card fade-up-delay-2">
          <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
          <p className="mt-1 text-sm text-gray-600">Only password fields are shown here for security and clarity.</p>

          <form className="mt-5 space-y-4" onSubmit={handleChangePassword}>
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

            {passwordError && <div className="alert alert-error">{passwordError}</div>}

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

      {/* Image Cropper Modal */}
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
