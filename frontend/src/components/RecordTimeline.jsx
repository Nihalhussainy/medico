import { useState } from "react";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatRelativeTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
};

const consolidateMedicineDisplay = (medicineString) => {
  if (!medicineString) return [];

  const medicinesByName = {};
  const mealLabels = { BREAKFAST: 'Morning', LUNCH: 'Afternoon', DINNER: 'Evening' };
  const sections = medicineString.split('\n\n');

  sections.forEach((section) => {
    const lines = section.trim().split('\n');
    if (lines.length < 2) return;

    const headerLine = lines[0];
    let mealMatch = headerLine.match(/(\w+)_(BEFORE|AFTER):/);
    if (!mealMatch) {
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

  return Object.entries(medicinesByName);
};

// Clean, minimal SVG Icons
const ChevronIcon = ({ expanded }) => (
  <svg className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const PrintIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const ViewIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function RecordTimeline({ records, onPrintRecord, onEditRecord, onDeleteRecord, doctorProfile }) {
  const [expandedRecords, setExpandedRecords] = useState({});
  const [showAll, setShowAll] = useState(false);
  const INITIAL_DISPLAY_COUNT = 5;

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

    const createdAt = new Date(record.createdAt);
    const now = new Date();
    const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);

    if (hoursSinceCreation > 24) {
      return { canModify: false, reason: "Locked after 24h" };
    }

    return { canModify: true, reason: null };
  };

  if (!records?.length) {
    return (
      <div className="py-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-100 to-sky-100 mb-4">
          <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-1">No Records Found</h3>
        <p className="text-sm text-gray-500">Medical records will appear here once created.</p>
      </div>
    );
  }

  const displayedRecords = showAll ? records : records.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMoreRecords = records.length > INITIAL_DISPLAY_COUNT;

  return (
    <div className="space-y-4">
      {displayedRecords.map((record, index) => {
        const isExpanded = expandedRecords[record.id];
        const medications = consolidateMedicineDisplay(record.medications);
        const { canModify, reason } = canModifyRecord(record);
        const hasFiles = record.files && record.files.length > 0;

        return (
          <div
            key={record.id}
            className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all fade-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Header Row */}
            <div className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Date & Time */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span className="font-semibold text-gray-700">{formatDate(record.recordDate || record.createdAt)}</span>
                    <span className="text-gray-300">·</span>
                    <span className="flex items-center gap-1 text-gray-400">
                      <ClockIcon />
                      {formatRelativeTime(record.recordDate || record.createdAt)}
                    </span>
                    {record.followUpDate && new Date(record.followUpDate) > new Date() && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="text-amber-600 font-medium">Follow-up {formatDate(record.followUpDate)}</span>
                      </>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-semibold text-gray-900 leading-snug">
                    {record.title || record.diagnosis || "Consultation"}
                  </h3>

                  {/* Doctor & Hospital */}
                  <p className="mt-1 text-sm text-gray-600">
                    {record.doctorName || "Doctor"}
                    {record.doctorSpecialization && <span className="text-gray-400"> · {record.doctorSpecialization}</span>}
                    {record.hospitalName && <span className="text-gray-400"> · {record.hospitalName}</span>}
                  </p>
                </div>

                {/* Expand Button */}
                <button
                  type="button"
                  onClick={() => toggleRecordExpand(record.id)}
                  className={`shrink-0 p-2 rounded-lg border transition-all ${
                    isExpanded 
                      ? 'bg-gray-900 border-gray-900 text-white' 
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  <ChevronIcon expanded={isExpanded} />
                </button>
              </div>

              {/* Quick Info Tags - Always visible */}
              <div className="mt-3 flex flex-wrap gap-2">
                {record.diagnosis && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-rose-50 border border-rose-100 text-xs font-medium text-rose-700">
                    {record.diagnosis.length > 40 ? record.diagnosis.substring(0, 40) + '...' : record.diagnosis}
                  </span>
                )}
                {record.vitals && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-violet-50 border border-violet-100 text-xs font-medium text-violet-700">
                    {record.vitals}
                  </span>
                )}
                {medications.length > 0 && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-teal-50 border border-teal-100 text-xs font-medium text-teal-700">
                    {medications.length} medication{medications.length > 1 ? 's' : ''}
                  </span>
                )}
                {hasFiles && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-50 border border-sky-100 text-xs font-medium text-sky-700">
                    <FileIcon />
                    {record.files.length} file{record.files.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4 space-y-4 fade-in">
                {/* Clinical Notes */}
                {record.description && record.description !== "No clinical notes added." && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Clinical Notes</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{record.description}</p>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {record.diagnosis && (
                    <div className="bg-white rounded-lg border border-gray-200 p-3">
                      <h4 className="text-xs font-semibold text-rose-600 uppercase tracking-wide mb-1">Diagnosis</h4>
                      <p className="text-sm text-gray-800 font-medium">{record.diagnosis}</p>
                    </div>
                  )}
                  {record.vitals && (
                    <div className="bg-white rounded-lg border border-gray-200 p-3">
                      <h4 className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-1">Vitals</h4>
                      <p className="text-sm text-gray-800">{record.vitals}</p>
                    </div>
                  )}
                  {record.allergies && (
                    <div className="bg-white rounded-lg border border-red-200 p-3">
                      <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Allergies</h4>
                      <p className="text-sm text-gray-800">{record.allergies}</p>
                    </div>
                  )}
                  {record.followUpDate && (
                    <div className="bg-white rounded-lg border border-amber-200 p-3">
                      <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Follow-up</h4>
                      <p className="text-sm text-gray-800 font-medium">{formatDate(record.followUpDate)}</p>
                    </div>
                  )}
                </div>

                {/* Medications */}
                {medications.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-2">Medications</h4>
                    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                      {medications.map(([name, timings], idx) => (
                        <div key={idx} className="px-4 py-3 flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800">{name}</span>
                          <span className="text-xs text-teal-700 bg-teal-50 px-2 py-1 rounded-md">{timings.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                    {record.medicineDuration && (
                      <p className="mt-2 text-xs text-gray-500">
                        Duration: <span className="font-medium text-gray-700">{record.medicineDuration} days</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Advice */}
                {record.advice && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="text-xs font-semibold text-sky-600 uppercase tracking-wide mb-2">Medical Advice</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{record.advice}</p>
                  </div>
                )}

                {/* Attached Files / Reports */}
                {hasFiles && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Attached Reports & Files</h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {record.files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"
                        >
                          <div className="shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                            <FileIcon />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-800 truncate">{file.originalFileName}</p>
                            <p className="text-xs text-gray-500">{file.category || 'Document'}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="View"
                            >
                              <ViewIcon />
                            </a>
                            <a
                              href={file.url}
                              download
                              className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                              title="Download"
                            >
                              <DownloadIcon />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
                  {onPrintRecord && (
                    <button
                      type="button"
                      onClick={() => onPrintRecord(record)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                    >
                      <PrintIcon />
                      Print Prescription
                    </button>
                  )}

                  {canModify ? (
                    <>
                      {onEditRecord && (
                        <button
                          type="button"
                          onClick={() => onEditRecord(record)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <EditIcon />
                          Edit
                        </button>
                      )}
                      {onDeleteRecord && (
                        <button
                          type="button"
                          onClick={() => onDeleteRecord(record)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <TrashIcon />
                          Delete
                        </button>
                      )}
                    </>
                  ) : reason && (
                    <span className="text-xs text-gray-400 ml-auto">{reason}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* View More Button */}
      {hasMoreRecords && (
        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            {showAll ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
                Show Less
              </>
            ) : (
              <>
                View {records.length - INITIAL_DISPLAY_COUNT} More Record{records.length - INITIAL_DISPLAY_COUNT > 1 ? 's' : ''}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
