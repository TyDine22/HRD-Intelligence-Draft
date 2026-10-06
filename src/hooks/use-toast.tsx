"use client";

import * as React from "react";
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "error";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const counter = React.useRef(0);

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (opts: ToastOptions) => {
      const id = ++counter.current;
      setToasts((prev) => [...prev.slice(-4), { id, ...opts }]);
      window.setTimeout(() => dismiss(id), opts.duration ?? 4000);
    },
    [dismiss]
  );

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-full max-w-sm flex-col gap-2 no-print">
        {toasts.map((t) => {
          const Icon =
            t.variant === "success" ? CheckCircleIcon : t.variant === "error" ? ExclamationTriangleIcon : InformationCircleIcon;
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-lg border bg-card p-3 pr-9 text-sm shadow-lg animate-in slide-in-from-bottom-2 fade-in-0 relative",
                t.variant === "success" && "border-success/40",
                t.variant === "error" && "border-destructive/40"
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 size-5 shrink-0",
                  t.variant === "success" && "text-success",
                  t.variant === "error" && "text-destructive",
                  (!t.variant || t.variant === "default") && "text-primary"
                )}
              />
              <div className="min-w-0">
                <p className="font-medium">{t.title}</p>
                {t.description && <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{t.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-muted-foreground hover:text-foreground absolute top-2 right-2 rounded p-1 cursor-pointer"
                aria-label="Dismiss"
              >
                <XMarkIcon className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
