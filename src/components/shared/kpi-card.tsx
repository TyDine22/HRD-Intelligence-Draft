import * as React from "react";
import { ArrowTrendingDownIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/outline";

import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  delta?: number;
  deltaLabel?: string;
  icon?: React.ReactNode;
  tone?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

const toneClasses: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "bg-muted text-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-success-bg text-success-text",
  warning: "bg-warning-bg text-warning-text",
  danger: "bg-error-bg text-error-text",
};

export function KpiCard({ label, value, hint, delta, deltaLabel, icon, tone = "default", className }: KpiCardProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className={cn("bg-card flex items-start justify-between gap-3 rounded-xl border p-4 shadow-sm", className)}>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
        {(hint || delta !== undefined) && (
          <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
            {delta !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium",
                  positive ? "text-success-text" : "text-error-text"
                )}
              >
                {positive ? <ArrowTrendingUpIcon className="size-3.5" /> : <ArrowTrendingDownIcon className="size-3.5" />}
                {positive ? "+" : ""}
                {delta}
                {deltaLabel ? ` ${deltaLabel}` : ""}
              </span>
            )}
            {hint && <span>{hint}</span>}
          </p>
        )}
      </div>
      {icon && (
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg [&>svg]:size-5", toneClasses[tone])}>
          {icon}
        </div>
      )}
    </div>
  );
}
