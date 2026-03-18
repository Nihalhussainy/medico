import { useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api.js";
import FileUploader from "../components/FileUploader.jsx";
import { useToast } from "../components/Toast.jsx";
import BackButton from "../components/BackButton.jsx";

export default function UploadReportPage() {
  const toast = useToast();
  const { recordId } = useParams();

  const onUpload = async (file, category) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`/records/${recordId}/files?category=${category}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    toast.success(`Uploaded: ${response.data.originalFileName}`);
  };

  return (
    <div className="space-y-6">
      <BackButton label="Back" />

      <div className="card-accent fade-up">
        <div className="pill">File vault</div>
        <h1 className="mt-4 text-2xl font-semibold">Upload report</h1>
        <p className="text-slate-700">Record ID {recordId}</p>
      </div>

      <div className="fade-up-delay-1">
        <FileUploader onUpload={onUpload} />
      </div>
    </div>
  );
}
