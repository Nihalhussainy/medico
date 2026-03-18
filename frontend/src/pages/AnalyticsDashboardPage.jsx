import { useState, useEffect } from "react";
import api from "../services/api.js";
import BackButton from "../components/BackButton.jsx";
import Spinner from "../components/Spinner.jsx";

export default function AnalyticsDashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get("/analytics/dashboard");
      setAnalytics(res.data);
    } catch (err) {
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const formatGrowth = (value) => {
    if (value === null || value === undefined) return "0%";
    const prefix = value > 0 ? "+" : "";
    return `${prefix}${value.toFixed(1)}%`;
  };

  const getGrowthColor = (value) => {
    if (value > 0) return "text-emerald-600";
    if (value < 0) return "text-red-600";
    return "text-slate-600";
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <BackButton />
        <div className="card border-red-200 bg-red-50">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton />

      <div className="card fade-up">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="pill pill-purple">
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-slate-900">Dashboard Analytics</h1>
            <p className="text-slate-600">Overview of patient activity and system metrics</p>
          </div>
          <button
            onClick={loadAnalytics}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <div className="card hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className={`text-sm font-semibold px-2 py-1 rounded-lg ${analytics?.patientGrowthPercent > 0 ? 'bg-emerald-100 text-emerald-700' : analytics?.patientGrowthPercent < 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
              {formatGrowth(analytics?.patientGrowthPercent)}
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{analytics?.totalPatients || 0}</p>
          <p className="text-sm text-slate-600 font-medium">Total Patients</p>
          <p className="text-xs text-slate-400 mt-1">
            +{analytics?.newPatientsThisMonth || 0} this month
          </p>
        </div>

        <div className="card hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <span className={`text-sm font-semibold px-2 py-1 rounded-lg ${analytics?.visitGrowthPercent > 0 ? 'bg-emerald-100 text-emerald-700' : analytics?.visitGrowthPercent < 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
              {formatGrowth(analytics?.visitGrowthPercent)}
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{analytics?.totalVisitsThisMonth || 0}</p>
          <p className="text-sm text-slate-600 font-medium">Visits This Month</p>
          <p className="text-xs text-slate-400 mt-1">
            {analytics?.totalVisitsLastMonth || 0} last month
          </p>
        </div>

      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-1">
        <div className="card">
          <h3 className="font-semibold text-lg mb-4">Visit Trends</h3>
          {analytics?.visitTrends && analytics.visitTrends.length > 0 ? (
            <div className="h-32 flex items-end gap-2">
              {analytics.visitTrends.slice(-6).map((item, idx) => {
                const maxCount = Math.max(...analytics.visitTrends.map((t) => t.count)) || 1;
                const height = (item.count / maxCount) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all"
                      style={{ height: `${Math.max(height, 4)}%` }}
                      title={`${item.count} visits`}
                    />
                    <span className="text-xs text-slate-500 truncate w-full text-center">
                      {item.month?.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No trend data available</p>
          )}
        </div>
      </div>

      {/* Demographics */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <h3 className="font-semibold text-lg mb-4">Patients by Gender</h3>
          {analytics?.patientsByGender && Object.keys(analytics.patientsByGender).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(analytics.patientsByGender).map(([gender, count]) => {
                const total = Object.values(analytics.patientsByGender).reduce((a, b) => a + b, 0);
                const percent = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={gender}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{gender}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          gender === "Male" ? "bg-blue-500" : gender === "Female" ? "bg-pink-500" : "bg-purple-500"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No data available</p>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-lg mb-4">Patients by Age</h3>
          {analytics?.patientsByAgeGroup && Object.keys(analytics.patientsByAgeGroup).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(analytics.patientsByAgeGroup).map(([ageGroup, count]) => {
                const total = Object.values(analytics.patientsByAgeGroup).reduce((a, b) => a + b, 0);
                const percent = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={ageGroup}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{ageGroup}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No data available</p>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-lg mb-4">Patients by Blood Group</h3>
          {analytics?.patientsByBloodGroup && Object.keys(analytics.patientsByBloodGroup).length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(analytics.patientsByBloodGroup).map(([bloodGroup, count]) => (
                <div
                  key={bloodGroup}
                  className="flex items-center justify-between px-3 py-2 bg-red-50 rounded-lg"
                >
                  <span className="font-bold text-red-600">{bloodGroup}</span>
                  <span className="text-sm text-slate-600">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No data available</p>
          )}
        </div>
      </div>

      {/* Top Categories */}
      <div className="grid gap-4 md:grid-cols-1">
        <div className="card">
          <h3 className="font-semibold text-lg mb-4">Top Diagnoses</h3>
          {analytics?.topDiagnoses && analytics.topDiagnoses.length > 0 ? (
            <div className="space-y-2">
              {analytics.topDiagnoses.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm">{item.category}</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
