import { useCallback, useContext, createContext, useState } from "react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [config, setConfig] = useState(null);

  const confirm = useCallback((message, title = "Confirm Action") => {
    return new Promise((resolve) => {
      setConfig({
        title,
        message,
        onConfirm: () => {
          setConfig(null);
          resolve(true);
        },
        onCancel: () => {
          setConfig(null);
          resolve(false);
        }
      });
    });
  }, []);

  const handleConfirm = () => {
    config?.onConfirm();
  };

  const handleCancel = () => {
    config?.onCancel();
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {config && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="card w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{config.title}</h2>
                <p className="mt-2 text-sm text-gray-600">{config.message}</p>
              </div>
              <div className="flex gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  className="button"
                  onClick={handleConfirm}
                  autoFocus
                >
                  Confirm
                </button>
                <button
                  type="button"
                  className="button-outline"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
