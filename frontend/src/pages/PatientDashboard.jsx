import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import PatientBloodNotifications from "../components/PatientBloodNotifications.jsx";

const quickAccessItems = [
  {
    to: "/patient/profile",
    title: "My Profile",
    description: "View and update your health profile",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: "text-blue-600 bg-blue-50"
  },
  {
    to: null, // Dynamic - will be set using user phoneNumber
    title: "Medical History",
    description: "View your records and clinical updates",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: "text-teal-600 bg-teal-50"
  }
];

const serviceItems = [
  {
    to: "/patient/lab-reports",
    title: "Lab Reports",
    description: "View lab results with trend analysis and track health metrics over time",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    color: "text-purple-600 bg-purple-50"
  },
  {
    to: "/patient/family",
    title: "My Family",
    description: "Manage health profiles for your family members under one account",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: "text-orange-600 bg-orange-50"
  },
  {
    to: "/patient/risk-forecast",
    title: "Risk Forecast",
    description: "View health risk analysis, prevention tips, and screening recommendations",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: "text-red-600 bg-red-50"
  },
  {
    to: "/patient/lifestyle-chat",
    title: "Health Assistant",
    description: "Get personalized advice on sleep, diet, exercise, and daily routines",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: "text-indigo-600 bg-indigo-50"
  }
];

export default function PatientDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="card fade-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-teal-600">Patient Portal</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">
              Welcome back, {user?.firstName || "there"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your records, monitor health risks, and coordinate family care.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="font-medium">Secure Session</span>
          </div>
        </div>
      </div>

      {/* Blood Donation Notifications */}
      <PatientBloodNotifications />

      {/* Quick Access */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {quickAccessItems.map((item, index) => {
            const href = item.to || `/history/${user?.phoneNumber || "0"}`;
            return (
              <Link
                key={index}
                to={href}
                className="card card-hover group fade-up-delay-1"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${item.color}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <svg className="h-5 w-5 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Health Services */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Health Services</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {serviceItems.map((item, index) => (
            <Link
              key={index}
              to={item.to}
              className="card card-hover group fade-up-delay-2"
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${item.color}`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <svg className="h-5 w-5 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
