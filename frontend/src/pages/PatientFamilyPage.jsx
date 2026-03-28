import { useEffect, useMemo, useState } from "react";
import BackButton from "../components/BackButton.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Spinner from "../components/Spinner.jsx";
import api from "../services/api.js";
import { useToast } from "../components/Toast.jsx";
import { useConfirm } from "../components/ConfirmDialog.jsx";

const initialMember = {
  firstName: "",
  lastName: "",
  relationship: "",
  gender: "",
  bloodGroup: "",
  phoneNumber: "",
  dateOfBirth: ""
};

const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDER_OPTIONS = ["Male", "Female", "Other"];

export default function PatientFamilyPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState(initialMember);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadFamilyView = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await api.get("/family/group");
        setMembers(data?.members || []);
      } catch (err) {
        setError(err.response?.data?.message || err.response?.data?.error || err.message || "Failed to load family page");
      } finally {
        setLoading(false);
      }
    };

    loadFamilyView();
  }, []);

  const editingMember = useMemo(
    () => members.find((member) => member.id === editingMemberId) || null,
    [members, editingMemberId]
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditingMemberId(null);
    setFormData(initialMember);
  };

  const startEdit = (member) => {
    setEditingMemberId(member.id);
    setFormData({
      firstName: member.firstName || "",
      lastName: member.lastName || "",
      relationship: member.relationship || "",
      gender: member.gender || "",
      bloodGroup: member.bloodGroup || "",
      phoneNumber: member.phoneNumber || "",
      dateOfBirth: member.dateOfBirth || ""
    });
  };

  const refreshGroup = async () => {
    const { data } = await api.get("/family/group");
    setMembers(data?.members || []);
  };

  const saveMember = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.relationship.trim()) {
      toast.error("First name, last name, and relationship are required");
      return;
    }

    const isNew = !editingMemberId;
    const confirmed = await confirm(
      `Are you sure you want to ${isNew ? "add" : "update"} this family member?`,
      isNew ? "Add Family Member" : "Update Family Member"
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        relationship: formData.relationship.trim(),
        gender: formData.gender || null,
        bloodGroup: formData.bloodGroup || null,
        phoneNumber: formData.phoneNumber || null,
        dateOfBirth: formData.dateOfBirth || null
      };

      if (editingMemberId) {
        await api.put(`/family/members/${editingMemberId}`, payload);
        toast.success("Family member updated successfully!");
      } else {
        await api.post("/family/members", payload);
        toast.success("Family member added successfully!");
      }

      await refreshGroup();
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save family member");
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (memberId) => {
    const memberName = members.find((m) => m.id === memberId);
    const confirmed = await confirm(
      `Are you sure you want to remove ${memberName?.firstName} ${memberName?.lastName} from your family?`,
      "Remove Family Member"
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      await api.delete(`/family/members/${memberId}`);
      toast.success("Family member removed successfully!");
      await refreshGroup();
      if (editingMemberId === memberId) {
        resetForm();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove family member");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Spinner label="Loading family care view..." />;
  }

  return (
    <div className="space-y-6">
      <BackButton to="/patient" label="Back to dashboard" />

      <div className="card fade-up">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-orange-600">Family Care</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">My Family</h1>
            <p className="mt-2 text-sm text-gray-600">
              Add and manage your family members for consultation and history selection.
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
            Total family members: <span className="font-semibold text-gray-900">{members.length}</span>
          </div>
        </div>

      </div>

      {error && (
        <div className="card border border-red-200 bg-red-50">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!error && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {editingMember ? "Edit Family Member" : "Add Family Member"}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <input className="input" name="firstName" placeholder="First name" value={formData.firstName} onChange={handleInputChange} />
                <input className="input" name="lastName" placeholder="Last name" value={formData.lastName} onChange={handleInputChange} />
                <input className="input" name="relationship" placeholder="Relationship (e.g. Son)" value={formData.relationship} onChange={handleInputChange} />
                <input className="input" name="phoneNumber" placeholder="Phone (optional)" value={formData.phoneNumber} onChange={handleInputChange} />
                <select className="input" name="gender" value={formData.gender} onChange={handleInputChange}>
                  <option value="">Select gender</option>
                  {GENDER_OPTIONS.map((gender) => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>
                <select className="input" name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange}>
                  <option value="">Select blood group</option>
                  {BLOOD_GROUP_OPTIONS.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>

              <input className="input" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleInputChange} />

              <div className="flex flex-wrap gap-2">
                <button className="button" type="button" onClick={saveMember} disabled={saving}>
                  {editingMember ? "Update Member" : "Add Member"}
                </button>
                {editingMember && (
                  <button className="button-outline" type="button" onClick={resetForm} disabled={saving}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            <div className="card space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Family Members</p>

              {members.length === 0 ? (
                <EmptyState
                  title="No family members yet"
                  description="Add your first family member to start managing dependent consultations."
                />
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{member.firstName} {member.lastName}</p>
                          <p className="text-xs text-gray-600">{member.relationship}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {member.gender || "-"} | {member.bloodGroup || "-"} | {member.phoneNumber || "No phone"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button className="button-outline" type="button" onClick={() => startEdit(member)} disabled={saving}>Edit</button>
                          <button className="button-danger" type="button" onClick={() => removeMember(member.id)} disabled={saving}>Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
