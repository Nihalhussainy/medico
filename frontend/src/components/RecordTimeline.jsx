import { useState } from "react";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const consolidateMedicineDisplay = (medicineString) => {
  if (!medicineString) return medicineString;

  const medicinesByName = {};
  const mealLabels = { BREAKFAST: 'Morning', LUNCH: 'Afternoon', DINNER: 'Evening' };
  const sections = medicineString.split('\n\n');

  sections.forEach((section) => {
    const lines = section.trim().split('\n');
    if (lines.length < 2) return;

    const headerLine = lines[0];
    // Match format: "BREAKFAST_BEFORE:" or "Morning BREAKFAST (Before):"
    let mealMatch = headerLine.match(/(\w+)_(BEFORE|AFTER):/);
    if (!mealMatch) {
      // Try old format
      mealMatch = headerLine.match(/(\w+)\s+\((\w+)\)/);
      if (mealMatch) {
        const meal = mealMatch[1];
        const timing = mealMatch[2];
        const mealLabel = mealLabels[meal] || meal;
        const label = `${mealLabel} (${timing})`;

        lines.slice(1).forEach((line) => {
          const medicineName = line.replace('• ', '').trim();
          if (medicineName) {
            if (!medicinesByName[medicineName]) {
              medicinesByName[medicineName] = [];
            }
            medicinesByName[medicineName].push(label);
          }
        });
      }
      return;
    }

    const meal = mealMatch[1];
    const timing = mealMatch[2] === 'BEFORE' ? 'Before' : 'After';
    const mealLabel = mealLabels[meal] || meal;
    const label = `${mealLabel} (${timing})`;

    lines.slice(1).forEach((line) => {
      const medicineName = line.replace('• ', '').trim();
      if (medicineName) {
        if (!medicinesByName[medicineName]) {
          medicinesByName[medicineName] = [];
        }
        medicinesByName[medicineName].push(label);
      }
    });
  });

  // Format consolidated view with meal time labels
  return Object.entries(medicinesByName)
    .map(([name, timings]) => `${name} - ${timings.join(', ')}`)
    .join(' | ');
};

// SVG Icons
const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const PrintIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function RecordTimeline({ records, onPrintRecord, onEditRecord, onDeleteRecord, doctorProfile }) {
  const [expandedRecords, setExpandedRecords] = useState({});

  const toggleRecordExpand = (recordId) => {
    setExpandedRecords(prev => ({
      ...prev,
      [recordId]: !prev[recordId]
    }));
  };

  const canModifyRecord = (record) => {
    if (!doctorProfile || record.doctorId !== doctorProfile.id) {
      return { canModify: false, reason: null };
    }

    // Check if record is older than 24 hours
    const createdAt = new Date(record.createdAt);
    const now = new Date();
    const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);

    if (hoursSinceCreation > 24) {
      return { canModify: false, reason: "Cannot edit/delete after 24 hours" };
    }

    return { canModify: true, reason: null };
  };

  if (!records?.length) {
    return <div className="card text-center py-8 text-gray-500">No records yet.</div>;
  }

  return (
    <div className="space-y-4">
      {records.map((record, index) => (
        <div key={record.id} className="card card-hover fade-up border border-gray-200 bg-white" style={{ animationDelay: `${index * 60}ms` }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{record.title}</h3>
              <p className="text-sm text-gray-700">
                {record.doctorName || "Doctor"}
                {record.doctorSpecialization ? ` - ${record.doctorSpecialization}` : ""}
              </p>
              {record.hospitalName && (
                <p className="text-sm text-gray-600">{record.hospitalName}</p>
              )}
            </div>
            <span className="pill text-xs">
              {formatDate(record.recordDate || record.createdAt)}
            </span>
          </div>
          <p className="mt-3 text-gray-700 leading-6">{record.description}</p>

          {expandedRecords[record.id] && (record.diagnosis || record.vitals || record.medications || record.allergies || record.followUpDate) && (
            <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 space-y-1.5 fade-in">
              {record.diagnosis && <div><span className="font-semibold text-gray-800">Diagnosis:</span> {record.diagnosis}</div>}
              {record.vitals && <div><span className="font-semibold text-gray-800">Vitals:</span> {record.vitals}</div>}
              {record.medications && <div><span className="font-semibold text-gray-800">Medications:</span> {consolidateMedicineDisplay(record.medications)}</div>}
              {record.allergies && <div><span className="font-semibold text-gray-800">Allergies:</span> {record.allergies}</div>}
              {record.followUpDate && <div><span className="font-semibold text-gray-800">Follow-up:</span> {formatDate(record.followUpDate)}</div>}
            </div>
          )}

          {expandedRecords[record.id] && record.files?.length > 0 && (
            <div className="mt-4 grid gap-2 fade-in">
              {record.files.map((file) => (
                <a
                  key={file.id}
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 hover:underline"
                >
                  <FileIcon />
                  {file.category ? `[${file.category}] ` : ""}{file.originalFileName}
                </a>
              ))}
            </div>
          )}

          <div className="mt-4 flex gap-2 flex-wrap border-t border-gray-200 pt-3">
            <button
              type="button"
              onClick={() => toggleRecordExpand(record.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-all font-medium ${
                expandedRecords[record.id]
                  ? "bg-gray-800 border-gray-800 text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {expandedRecords[record.id] ? <ChevronUpIcon /> : <ChevronDownIcon />}
              {expandedRecords[record.id] ? "Hide Details" : "View Details"}
            </button>
            <button
              type="button"
              onClick={() => onPrintRecord && onPrintRecord(record)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all"
            >
              <PrintIcon />
              Print
            </button>
            {(() => {
              const { canModify, reason } = canModifyRecord(record);
              if (canModify) {
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => onEditRecord && onEditRecord(record)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 transition-all"
                    >
                      <EditIcon />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRecord && onDeleteRecord(record)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition-all"
                    >
                      <TrashIcon />
                      Delete
                    </button>
                  </>
                );
              } else if (reason) {
                return (
                  <div className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
                    <InfoIcon />
                    {reason}
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      ))}
    </div>
  );
}
