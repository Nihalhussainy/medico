import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import AdminDashboard from "../pages/AdminDashboard.jsx";
import AdminBloodDonationPage from "../pages/AdminBloodDonationPage.jsx";
import AnalyticsDashboardPage from "../pages/AnalyticsDashboardPage.jsx";
import DoctorDashboard from "../pages/DoctorDashboard.jsx";
import DoctorProfilePage from "../pages/DoctorProfilePage.jsx";
import DoctorPatientPage from "../pages/DoctorPatientPage.jsx";
import PatientDashboard from "../pages/PatientDashboard.jsx";
import PatientProfilePage from "../pages/PatientProfilePage.jsx";
import OtpConsentPage from "../pages/OtpConsentPage.jsx";
import MedicalHistoryPage from "../pages/MedicalHistoryPage.jsx";
import UploadReportPage from "../pages/UploadReportPage.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";

const rolePath = (role) => {
  if (role === "ADMIN") return "/admin";
  if (role === "DOCTOR") return "/doctor";
  if (role === "PATIENT") return "/patient";
  return "/login";
};

export default function AppRoutes() {
  const { token, role } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={token ? rolePath(role) : "/login"} replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/blood-donation"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminBloodDonationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AnalyticsDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor"
        element={
          <ProtectedRoute roles={["DOCTOR"]}>
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/profile"
        element={
          <ProtectedRoute roles={["DOCTOR"]}>
            <DoctorProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/patient/:patientPhoneNumber"
        element={
          <ProtectedRoute roles={["DOCTOR"]}>
            <DoctorPatientPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient"
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/profile"
        element={
          <ProtectedRoute roles={["PATIENT"]}>
            <PatientProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/consent"
        element={
          <ProtectedRoute roles={["DOCTOR"]}>
            <OtpConsentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history/:patientPhoneNumber"
        element={
          <ProtectedRoute roles={["PATIENT", "DOCTOR", "ADMIN"]}>
            <MedicalHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload/:recordId"
        element={
          <ProtectedRoute roles={["DOCTOR"]}>
            <UploadReportPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
