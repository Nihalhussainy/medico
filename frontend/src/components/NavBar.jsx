import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const roleLinks = {
  ADMIN: [
    { to: "/admin", label: "Dashboard" },
    { to: "/admin/blood-donation", label: "Blood Requests" }
  ],
  DOCTOR: [
    { to: "/doctor", label: "Workspace" },
    { to: "/doctor/profile", label: "Profile" }
  ],
  PATIENT: [
    { to: "/patient", label: "Portal" },
    { to: "/patient/profile", label: "Profile" }
  ]
};

export default function NavBar() {
  const { token, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  const links = role ? roleLinks[role] || [] : [];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-30 border-b border-emerald-200/60 bg-white/85 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 text-lg font-semibold tracking-wide text-slate-900">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 transition-transform hover:scale-110">
            ⟡
          </span>
          <span className="hide-mobile">Medico Cloud</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {token && links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive(link.to)
                  ? "bg-emerald-100 text-emerald-800"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {!token && (
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="button-outline">Login</Link>
              <Link to="/register" className="button">Register</Link>
            </div>
          )}
          {token && (
            <div className="hidden md:flex items-center gap-3">
              <span className="pill">{role}</span>
              <button type="button" className="button-ghost" onClick={onLogout}>
                Logout
              </button>
            </div>
          )}

          {/* Mobile Hamburger */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-lg fade-in">
          <div className="px-6 py-4 space-y-2">
            {!token && (
              <>
                <Link
                  to="/login"
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  onClick={() => setMobileOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                  onClick={() => setMobileOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
            {token && (
              <>
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {role}
                </div>
                {links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive(link.to)
                        ? "bg-emerald-100 text-emerald-800"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  type="button"
                  className="w-full text-left rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  onClick={() => {
                    setMobileOpen(false);
                    onLogout();
                  }}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
