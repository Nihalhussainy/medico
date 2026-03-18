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

  const growthBadgeClass = (value) => {
    if (value > 0) return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    if (value < 0) return "bg-red-50 text-red-700 border border-red-200";
    return "bg-gray-100 text-gray-600 border border-gray-200";
  };

  const percentOf = (count, total) => {
    if (!total || total <= 0) return 0;
    return (count / total) * 100;
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
        <BackButton to="/doctor" label="Back to workspace" />
        <div className="card border-red-200 bg-red-50">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton to="/doctor" label="Back to workspace" />

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="pill-blue">Doctor Analytics</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">Practice Intelligence</h1>
            <p className="mt-1 text-sm text-gray-600">Patient growth, visit trends, demographics and top diagnosis insights.</p>
          </div>
          <button
            onClick={loadAnalytics}
            className="button-outline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="card">
          <div className="flex items-center justify-between">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className={`rounded-lg px-2.5 py-1 text-sm font-semibold ${growthBadgeClass(analytics?.patientGrowthPercent)}`}>
              {formatGrowth(analytics?.patientGrowthPercent)}
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold tracking-tight text-gray-900">{analytics?.totalPatients || 0}</p>
          <p className="text-sm font-medium text-gray-600">Total Patients</p>
          <p className="mt-1 text-xs text-gray-400">+{analytics?.newPatientsThisMonth || 0} new this month</p>
        </article>

        <article className="card">
          <div className="flex items-center justify-between">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <span className={`rounded-lg px-2.5 py-1 text-sm font-semibold ${growthBadgeClass(analytics?.visitGrowthPercent)}`}>
              {formatGrowth(analytics?.visitGrowthPercent)}
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold tracking-tight text-gray-900">{analytics?.totalVisitsThisMonth || 0}</p>
          <p className="text-sm font-medium text-gray-600">Visits This Month</p>
          <p className="mt-1 text-xs text-gray-400">{analytics?.totalVisitsLastMonth || 0} last month</p>
        </article>
      </section>

      <section className="card">
        <h3 className="text-lg font-semibold tracking-tight text-gray-900">Visit Trends</h3>
        {analytics?.visitTrends && analytics.visitTrends.length > 0 ? (
          <div className="mt-4 h-44">
            <div className="grid h-full grid-cols-6 items-end gap-2">
              {analytics.visitTrends.slice(-6).map((item, idx, arr) => {
                const maxCount = Math.max(...arr.map((t) => t.count)) || 1;
                const height = (item.count / maxCount) * 100;
                return (
                  <div key={idx} className="flex h-full flex-col items-center justify-end gap-2">
                    <div
                      className="w-full rounded-t-md bg-cyan-500"
                      style={{ height: `${Math.max(height, 6)}%` }}
                      title={`${item.count} visits`}
                    />
                    <span className="text-xs text-gray-500">{item.month?.split(" ")[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500">No trend data available</p>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="card">
          <h3 className="text-lg font-semibold tracking-tight text-gray-900">Patients by Gender</h3>
          {analytics?.patientsByGender && Object.keys(analytics.patientsByGender).length > 0 ? (
            <div className="mt-4 space-y-3">
              {Object.entries(analytics.patientsByGender).map(([gender, count]) => {
                const total = Object.values(analytics.patientsByGender).reduce((a, b) => a + b, 0);
                const percent = percentOf(count, total);
                return (
                  <div key={gender}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-gray-600">{gender}</span>
                      <span className="font-semibold text-gray-800">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${gender === "Male" ? "bg-blue-500" : gender === "Female" ? "bg-pink-500" : "bg-violet-500"}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">No data available</p>
          )}
        </article>

        <article className="card">
          <h3 className="text-lg font-semibold tracking-tight text-gray-900">Patients by Age</h3>
          {analytics?.patientsByAgeGroup && Object.keys(analytics.patientsByAgeGroup).length > 0 ? (
            <div className="mt-4 space-y-3">
              {Object.entries(analytics.patientsByAgeGroup).map(([ageGroup, count]) => {
                const total = Object.values(analytics.patientsByAgeGroup).reduce((a, b) => a + b, 0);
                const percent = percentOf(count, total);
                return (
                  <div key={ageGroup}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-gray-600">{ageGroup}</span>
                      <span className="font-semibold text-gray-800">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">No data available</p>
          )}
        </article>

        <article className="card">
          <h3 className="text-lg font-semibold tracking-tight text-gray-900">Patients by Blood Group</h3>
          {analytics?.patientsByBloodGroup && Object.keys(analytics.patientsByBloodGroup).length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {Object.entries(analytics.patientsByBloodGroup).map(([bloodGroup, count]) => (
                <div key={bloodGroup} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-3 py-2">
                  <span className="font-semibold text-red-600">{bloodGroup}</span>
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">No data available</p>
          )}
        </article>
      </section>

      <section className="card">
        <h3 className="text-lg font-semibold tracking-tight text-gray-900">Top Diagnoses</h3>
        {analytics?.topDiagnoses && analytics.topDiagnoses.length > 0 ? (
          <div className="mt-4 space-y-2">
            {analytics.topDiagnoses.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                <span className="text-sm text-gray-700">{item.category}</span>
                <span className="rounded-md bg-white px-2 py-0.5 text-sm font-semibold text-gray-700 border border-gray-200">{item.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500">No data available</p>
        )}
      </section>
    </div>
  );
}
