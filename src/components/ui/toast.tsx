"use client";

import { AlertTriangle, Check, Info, X, XCircle } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * One notification system for the whole app: storefront feedback ("✓ Added to
 * cart") and admin feedback ("✓ Product updated"). Toasts are non-blocking,
 * short, and announced to screen readers — the wrapper is not a live region,
 * each toast carries `role="status"` (polite) or `role="alert"` (assertive),
 * which is what assistive tech announces on insert.
 */

export type ToastVariant = "success" | "error" | "warning" | "info";

export type ToastAction = { label: string; href?: string; onClick?: () => void };

export type ToastOptions = {
  variant?: ToastVariant;
  /** Second line — e.g. the product name, or what went wrong. */
  description?: string;
  /** Optional follow-up, such as "View Cart" or "Undo". */
  action?: ToastAction;
  /** Overrides the per-variant default. */
  duration?: number;
};

type ToastRecord = ToastOptions & { id: number; message: string; variant: ToastVariant };

type ToastContextValue = {
  toast: (message: string, options?: ToastOptions) => void;
  dismiss: (id: number) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

const MAX_VISIBLE = 3;

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 2600,
  info: 3200,
  warning: 4200,
  error: 5200,
};

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "bg-ink text-canvas",
  info: "border border-line bg-canvas text-ink",
  warning: "border border-amber-300 bg-amber-50 text-amber-950",
  error: "bg-red-600 text-white",
};

const VARIANT_ICONS: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  success: Check,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

function ToastCard({
  entry,
  onDismiss,
}: {
  entry: ToastRecord;
  onDismiss: (id: number) => void;
}) {
  const Icon = VARIANT_ICONS[entry.variant];
  const assertive = entry.variant === "error";

  return (
    <div
      role={assertive ? "alert" : "status"}
      className={cn(
        "animate-rise pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl px-4 py-3 text-sm shadow-lg sm:max-w-sm",
        VARIANT_STYLES[entry.variant],
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />

      <div className="min-w-0 flex-1">
        <p className="font-medium">{entry.message}</p>
        {entry.description ? (
          <p className="mt-0.5 truncate text-[13px] opacity-80">{entry.description}</p>
        ) : null}

        {entry.action ? (
          entry.action.href ? (
            <Link
              href={entry.action.href}
              onClick={() => onDismiss(entry.id)}
              className="mt-1.5 inline-block text-[13px] font-semibold underline underline-offset-4"
            >
              {entry.action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                entry.action?.onClick?.();
                onDismiss(entry.id);
              }}
              className="mt-1.5 text-[13px] font-semibold underline underline-offset-4"
            >
              {entry.action.label}
            </button>
          )
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(entry.id)}
        aria-label="Dismiss notification"
        className="-mr-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full opacity-70 transition-opacity hover:opacity-100"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastRecord[]>([]);
  const timers = React.useRef(new Map<number, number>());

  const dismiss = React.useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const toast = React.useCallback(
    (message: string, options: ToastOptions = {}) => {
      const variant = options.variant ?? "success";
      const id = Date.now() + Math.random();
      const duration =
        options.duration ?? (options.action ? 6000 : DEFAULT_DURATION[variant]);

      setToasts((current) => {
        // Never stack the identical message twice — it just resets the timer.
        const withoutDuplicate = current.filter(
          (entry) => !(entry.message === message && entry.variant === variant),
        );
        return [...withoutDuplicate, { ...options, variant, id, message }].slice(-MAX_VISIBLE);
      });

      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), duration),
      );
    },
    [dismiss],
  );

  React.useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const value = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4 pb-[env(safe-area-inset-bottom)] sm:inset-x-auto sm:right-6 sm:items-end">
        {toasts.map((entry) => (
          <ToastCard key={entry.id} entry={entry} onDismiss={dismiss} />
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
