import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";
import NavBar from "./components/NavBar.jsx";

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="min-h-screen text-slate-900">
          <div className="pointer-events-none fixed inset-0 grid-overlay opacity-40" />
          <div className="pointer-events-none fixed -top-32 right-[-10%] h-96 w-96 rounded-full bg-emerald-200/40 blur-[140px]" />
          <div className="pointer-events-none fixed bottom-[-20%] left-[-10%] h-96 w-96 rounded-full bg-cyan-200/30 blur-[160px]" />
          <NavBar />
          <main className="relative mx-auto max-w-6xl px-6 py-8">
            <AppRoutes />
          </main>
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
