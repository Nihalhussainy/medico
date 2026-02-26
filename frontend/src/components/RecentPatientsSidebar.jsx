import { useNavigate, useLocation } from "react-router-dom";
import { getRecentPatients, isConsentValid, clearRecentPatients } from "../services/recentPatientsManager.js";
import { useState, useEffect } from "react";

export default function RecentPatientsSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [patients, setPatients] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadRecents();
  }, [location]);

  const loadRecents = () => {
    const recents = getRecentPatients();
    setPatients(recents);
  };

  const handleNavigate = (phoneNumber) => {
    navigate(`/doctor/patient/${phoneNumber}`);
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString();
    } catch {
      return "";
    }
  };

  if (patients.length === 0) {
    return null;
  }

  return (
    <div className="fixed left-0 top-0 h-screen z-40 pointer-events-none">
      {/* Sidebar */}
      <div className="h-full pointer-events-auto">
        <div
          className={`h-full bg-slate-900 text-white transition-all duration-300 overflow-y-auto flex flex-col ${
            isExpanded ? "w-72" : "w-16"
          }`}
          style={{
            boxShadow: isExpanded ? "2px 0 8px rgba(0,0,0,0.3)" : "none"
          }}
        >
          {/* Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-16 flex items-center justify-center hover:bg-slate-800 transition-colors border-b border-slate-700 flex-shrink-0"
            title="Toggle sidebar"
          >
            {isExpanded ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>

          {isExpanded && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Today's Patients</h3>
                <button
                  onClick={loadRecents}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Refresh"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-2">
                {patients.map((patient) => {
                  const isValid = isConsentValid(patient.consentValidUntil);
                  return (
                    <button
                      key={patient.phoneNumber}
                      onClick={() => handleNavigate(patient.phoneNumber)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        isValid
                          ? "bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-700/50"
                          : "bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{patient.fullName}</p>
                          <p className="text-xs text-slate-400 mt-1">{patient.phoneNumber}</p>
                          <p className="text-xs text-slate-500 mt-1">{formatTime(patient.lastAccessed)}</p>
                        </div>
                        {isValid && (
                          <div className="mt-1 flex-shrink-0">
                            <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full"></span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Collapsed state - show patient count */}
          {!isExpanded && patients.length > 0 && (
            <div className="flex-shrink-0 flex justify-center py-3">
              <div className="text-xs font-semibold text-emerald-400 whitespace-nowrap px-2 py-1 bg-emerald-900/30 rounded">
                {patients.length}
              </div>
            </div>
          )}

          {/* Clear button at bottom */}
          {isExpanded && (
            <button
              onClick={() => {
                clearRecentPatients();
                setPatients([]);
              }}
              className="text-xs text-slate-400 hover:text-slate-200 py-3 border-t border-slate-700 transition-colors flex-shrink-0"
            >
              Clear history
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
