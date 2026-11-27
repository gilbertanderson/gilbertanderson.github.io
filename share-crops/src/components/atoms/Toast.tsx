import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Module-level bridge so non-React code (e.g. the React Query cache's global
// error handler) can surface a toast without access to the context.
let externalToast: ((message: string) => void) | null = null;
export function showGlobalToast(message: string) {
  externalToast?.(message);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast(message);
    timer.current = setTimeout(() => setToast(null), 1800);
  }, []);

  useEffect(() => {
    externalToast = showToast;
    return () => {
      if (externalToast === showToast) externalToast = null;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
