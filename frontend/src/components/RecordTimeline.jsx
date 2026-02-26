import { useState } from "react";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const consolidateMedicineDisplay = (medicineString) => {
  if (!medicineString) return medicineString;
  
  const medicinesByName = {};
  const mealEmojis = { BREAKFAST: '🌅', LUNCH: '☀️', DINNER: '🌙' };
  const sections = medicineString.split('\n\n');
  
  sections.forEach((section) => {
    const lines = section.trim().split('\n');
    if (lines.length < 2) return;
    
    const headerLine = lines[0];
    // Match format: "BREAKFAST_BEFORE:" or "🌅 BREAKFAST (Before):"
    let mealMatch = headerLine.match(/(\w+)_(BEFORE|AFTER):/);
    if (!mealMatch) {
      // Try old emoji format
      mealMatch = headerLine.match(/(\w+)\s+\((\w+)\)/);
      if (mealMatch) {
        const meal = mealMatch[1];
        const timing = mealMatch[2];
        const emoji = mealEmojis[meal] || '';
        const label = `${emoji} (${timing}) ${meal}`;
        
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
    const emoji = mealEmojis[meal] || '';
    const label = `${emoji} (${timing}) ${meal}`;
    
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
  
  // Format consolidated view with meal time emojis only
  return Object.entries(medicinesByName)
    .map(([name, timings]) => `${name} - ${timings.join(', ')}`)
    .join(' | ');
};

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
    return <div className="card text-center py-8 text-slate-500">No records yet.</div>;
  }

  return (
    <div className="space-y-4">
      {records.map((record, index) => (
        <div key={record.id} className="card card-hover fade-up" style={{ animationDelay: `${index * 60}ms` }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{record.title}</h3>
              <p className="text-sm text-slate-700">
                {record.doctorName || "Doctor"}
                {record.doctorSpecialization ? ` • ${record.doctorSpecialization}` : ""}
              </p>
              {record.hospitalName && (
                <p className="text-sm text-slate-600">{record.hospitalName}</p>
              )}
            </div>
            <span className="pill text-xs">
              {formatDate(record.recordDate || record.createdAt)}
            </span>
          </div>
          <p className="mt-3 text-slate-800">{record.description}</p>
          
          {expandedRecords[record.id] && (record.diagnosis || record.vitals || record.medications || record.allergies || record.followUpDate) && (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700 space-y-1.5 fade-in">
              {record.diagnosis && <div>Diagnosis: {record.diagnosis}</div>}
              {record.vitals && <div>Vitals: {record.vitals}</div>}
              {record.medications && <div>Medications: {consolidateMedicineDisplay(record.medications)}</div>}
              {record.allergies && <div>Allergies: {record.allergies}</div>}
              {record.followUpDate && <div>Follow-up: {formatDate(record.followUpDate)}</div>}
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
                  className="text-sm text-emerald-700 hover:underline"
                >
                  {file.category ? `[${file.category}] ` : ""}{file.originalFileName}
                </a>
              ))}
            </div>
          )}
          
          <div className="mt-4 flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => toggleRecordExpand(record.id)}
              className={`px-3 py-2 text-sm rounded-lg border transition-all font-medium ${
                expandedRecords[record.id]
                  ? "bg-slate-800 border-slate-800 text-white"
                  : "border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {expandedRecords[record.id] ? "👁 Hide Details" : "👁 View Details"}
            </button>
            <button
              type="button"
              onClick={() => onPrintRecord && onPrintRecord(record)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-all"
            >
              🖨 Print
            </button>
            {(() => {
              const { canModify, reason } = canModifyRecord(record);
              if (canModify) {
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => onEditRecord && onEditRecord(record)}
                      className="px-3 py-2 text-sm rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 transition-all"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRecord && onDeleteRecord(record)}
                      className="px-3 py-2 text-sm rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition-all"
                    >
                      🗑️ Delete
                    </button>
                  </>
                );
              } else if (reason) {
                return (
                  <div className="px-3 py-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded">
                    🔒 {reason}
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
