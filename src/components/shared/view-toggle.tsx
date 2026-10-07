"use client";

import * as React from "react";
import Link from "next/link";
import { ListBulletIcon, Squares2X2Icon } from "@heroicons/react/24/outline";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type ViewMode = "table" | "grid";

const STORAGE_PREFIX = "hrd:view:";

/**
 * Table / card-grid preference for a list, remembered per list in this browser.
 * Starts from `initial` on the server and first paint, then adopts the stored choice.
 */
export function useViewMode(key: string, initial: ViewMode = "table"): [ViewMode, (v: ViewMode) => void] {
  const [view, setView] = React.useState<ViewMode>(initial);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_PREFIX + key);
      if (stored === "table" || stored === "grid") setView(stored);
    } catch {
      /* storage unavailable (private mode, blocked) – keep the default */
    }
  }, [key]);

  const update = React.useCallback(
    (v: ViewMode) => {
      setView(v);
      try {
        window.localStorage.setItem(STORAGE_PREFIX + key, v);
      } catch {
        /* ignore */
      }
    },
    [key]
  );

  return [view, update];
}

export function ViewToggle({ value, onChange, className }: { value: ViewMode; onChange: (v: ViewMode) => void; className?: string }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as ViewMode)} className={cn("shrink-0", className)}>
      <TabsList className="h-8" aria-label="Layout">
        <TabsTrigger value="table" aria-label="Table view" title="Table view" className="px-2">
          <ListBulletIcon />
        </TabsTrigger>
        <TabsTrigger value="grid" aria-label="Card view" title="Card view" className="px-2">
          <Squares2X2Icon />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

/* ------------------------------------------------------------------ */
/* Card-grid primitives shared by every list that offers a grid view   */
/* ------------------------------------------------------------------ */

export function CardGrid({ children, className, columns = 3 }: { children: React.ReactNode; className?: string; columns?: 2 | 3 | 4 }) {
  const cols = columns === 4 ? "sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4" : columns === 2 ? "md:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3";
  return <div className={cn("grid gap-3 p-4", cols, className)}>{children}</div>;
}

export function RecordCard({
  title,
  subtitle,
  href,
  leading,
  trailing,
  children,
  footer,
  className,
  onClick,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Makes the title a link. */
  href?: string;
  /** Avatar or icon shown before the title. */
  leading?: React.ReactNode;
  /** Badge or action shown opposite the title. */
  trailing?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const heading = (
    <div className="min-w-0">
      <p className="truncate font-medium">{title}</p>
      {subtitle && <p className="text-muted-foreground truncate text-xs">{subtitle}</p>}
    </div>
  );
  return (
    <div className={cn("bg-card flex flex-col gap-3 rounded-lg border p-4 shadow-xs transition-shadow hover:shadow-sm", onClick && "cursor-pointer", className)} onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {leading}
          {href ? (
            <Link href={href} className="min-w-0 hover:underline" onClick={(e) => e.stopPropagation()}>
              {heading}
            </Link>
          ) : (
            heading
          )}
        </div>
        {trailing && <div className="flex shrink-0 items-center gap-1">{trailing}</div>}
      </div>
      {children}
      {footer && <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3 text-sm">{footer}</div>}
    </div>
  );
}

/** Label / value pairs laid out in a responsive two-column grid inside a RecordCard. */
export function CardFields({ children, columns = 2, className }: { children: React.ReactNode; columns?: 2 | 3 | 4; className?: string }) {
  const cols = columns === 4 ? "grid-cols-4" : columns === 3 ? "grid-cols-3" : "grid-cols-2";
  return <dl className={cn("grid gap-x-4 gap-y-2 text-sm", cols, className)}>{children}</dl>;
}

export function CardField({ label, children, className, align = "left" }: { label: string; children: React.ReactNode; className?: string; align?: "left" | "right" }) {
  return (
    <div className={cn("min-w-0", align === "right" && "text-right", className)}>
      <dt className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">{label}</dt>
      <dd className="truncate tabular-nums">{children}</dd>
    </div>
  );
}
