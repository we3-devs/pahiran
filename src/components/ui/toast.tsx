"use client";

import { Check } from "lucide-react";
import * as React from "react";

type Toast = { id: number; message: string };

const ToastContext = React.createContext<{ toast: (message: string) => void } | null>(null);

/** Subtle, non-blocking confirmations ("✓ Added to cart"). */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current.slice(-2), { id, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((entry) => entry.id !== id));
    }, 2600);
  }, []);

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:items-end"
      >
        {toasts.map((entry) => (
          <div
            key={entry.id}
            role="status"
            className="animate-rise flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm text-canvas shadow-lg"
          >
            <Check className="size-4" aria-hidden />
            {entry.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
