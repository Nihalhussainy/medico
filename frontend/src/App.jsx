import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";
import NavBar from "./components/NavBar.jsx";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="min-h-screen bg-gray-50 text-gray-900">
          <NavBar />
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <AppRoutes />
          </main>
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
