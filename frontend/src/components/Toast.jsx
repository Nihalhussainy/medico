import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }, []);

  const addToast = useCallback(
    (message, { type = "success", duration = 4000 } = {}) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type, exiting: false }]);
      if (duration > 0) {
        timersRef.current[id] = setTimeout(() => removeToast(id), duration);
      }
      return id;
    },
    [removeToast]
  );

  const toast = {
    success: (msg, opts) => addToast(msg, { type: "success", ...opts }),
    error: (msg, opts) => addToast(msg, { type: "error", duration: 6000, ...opts }),
    info: (msg, opts) => addToast(msg, { type: "info", ...opts }),
    warning: (msg, opts) => addToast(msg, { type: "warning", ...opts })
  };

  const typeStyles = {
    success: "border-emerald-200 bg-emerald-50/95 text-emerald-800",
    error: "border-red-200 bg-red-50/95 text-red-800",
    info: "border-blue-200 bg-blue-50/95 text-blue-800",
    warning: "border-amber-200 bg-amber-50/95 text-amber-800"
  };

  const typeIcons = {
    success: "✓",
    error: "✕",
    info: "ℹ",
    warning: "⚠"
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${typeStyles[t.type]} ${t.exiting ? "toast-exit" : ""}`}
            onClick={() => removeToast(t.id)}
            role="alert"
          >
            <span className="mr-2 font-bold">{typeIcons[t.type]}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
