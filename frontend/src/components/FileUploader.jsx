import { useState } from "react";

export default function FileUploader({ onUpload }) {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState("OTHER");
  const [isUploading, setIsUploading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!file) return;
    setIsUploading(true);
    try {
      await onUpload(file, category);
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div>
        <label className="label">Category</label>
        <select
          className="input"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="PRESCRIPTION">Prescription</option>
          <option value="LAB_REPORT">Lab report</option>
          <option value="IMAGING">Imaging</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <div>
        <label className="label">Select PDF or image</label>
        <input
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 file:cursor-pointer file:transition-colors"
          onChange={(event) => setFile(event.target.files[0])}
        />
      </div>
      <button className="button" type="submit" disabled={!file || isUploading}>
        {isUploading && <span className="spinner" />}
        {isUploading ? "Uploading..." : "Upload File"}
      </button>
    </form>
  );
}
