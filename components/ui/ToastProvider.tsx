"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ToastTone = "success" | "error" | "info";

type Toast = {
  id: string;
  title: string;
  description?: string;
  tone?: ToastTone;
};

type ToastContextValue = {
  pushToast: (toast: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function createToastId() {
  return `toast_${Math.random().toString(36).slice(2, 10)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = createToastId();
      const nextToast: Toast = { id, tone: "info", ...toast };
      setToasts((prev) => [...prev, nextToast]);
      window.setTimeout(() => removeToast(id), 4200);
    },
    [removeToast]
  );

  const api = useMemo<ToastContextValue>(
    () => ({
      pushToast,
      success: (title, description) => pushToast({ title, description, tone: "success" }),
      error: (title, description) => pushToast({ title, description, tone: "error" }),
      info: (title, description) => pushToast({ title, description, tone: "info" })
    }),
    [pushToast]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[320px] max-w-[90vw] flex-col gap-3"
        aria-live="polite"
        role="status"
      >
        {toasts.map((toast) => {
          const toneClasses =
            toast.tone === "success"
              ? "border-success/30 text-success"
              : toast.tone === "error"
                ? "border-danger/30 text-danger"
                : "border-border text-text";

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-2xl border bg-surface/90 p-4 shadow-lg backdrop-blur-xl ${toneClasses}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-text">{toast.title}</div>
                  {toast.description && (
                    <div className="mt-1 text-xs text-muted">{toast.description}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="rounded-lg border border-border bg-surface px-2 py-1 text-[11px] font-semibold text-muted transition-colors hover:text-text"
                  aria-label="Dismiss notification"
                >
                  Close
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
