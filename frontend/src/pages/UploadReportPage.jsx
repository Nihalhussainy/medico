import { useParams } from "react-router-dom";
import api from "../services/api.js";
import FileUploader from "../components/FileUploader.jsx";
import { useToast } from "../components/Toast.jsx";
import BackButton from "../components/BackButton.jsx";

const UploadIcon = () => (
  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

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

      <div className="card fade-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <UploadIcon />
          </div>
          <div>
            <div className="pill">File vault</div>
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Upload report</h1>
        <div className="flex items-center gap-2 mt-2 text-gray-600">
          <DocumentIcon />
          <span>Record ID: {recordId}</span>
        </div>
      </div>

      <div className="fade-up-delay-1">
        <FileUploader onUpload={onUpload} />
      </div>
    </div>
  );
}
