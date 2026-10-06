"use client";

import * as React from "react";
import type { ComponentType, SVGProps } from "react";
import {
  AcademicCapIcon,
  BuildingLibraryIcon,
  BuildingOffice2Icon,
  ComputerDesktopIcon,
  EllipsisHorizontalIcon,
  GlobeAltIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/24/outline";

import { LabelledPieChart, type PieSlice } from "@/components/charts/charts";
import { EMPLOYMENT_STATUSES, salaryMidpoint } from "@/lib/data/alumni";
import type { Alumni, EmploymentStatus } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const META: Record<EmploymentStatus, { color: string; icon: ComponentType<SVGProps<SVGSVGElement>>; short?: string }> = {
  "Local SW Developer": { color: "var(--chart-1)", icon: ComputerDesktopIcon },
  "International SW Developer": { color: "var(--chart-2)", icon: GlobeAltIcon, short: "International SW Dev" },
  Banks: { color: "var(--chart-4)", icon: BuildingLibraryIcon },
  "Government Officials": { color: "var(--chart-7)", icon: BuildingOffice2Icon },
  "Full Scholarship Abroad": { color: "var(--chart-3)", icon: AcademicCapIcon, short: "Scholarship abroad" },
  "IT Instructor in HRD Center": { color: "var(--chart-5)", icon: PresentationChartLineIcon, short: "IT Instructor (HRD)" },
  Other: { color: "var(--chart-6)", icon: EllipsisHorizontalIcon },
};

export function alumniAchievementStats(alumni: Alumni[]) {
  const total = alumni.length;
  const slices: PieSlice[] = EMPLOYMENT_STATUSES.map((a) => ({ name: a, value: alumni.filter((x) => x.employmentStatus === a).length, color: META[a].color })).filter(
    (s) => s.value > 0
  );
  const salaries = alumni.map((a) => salaryMidpoint(a.salaryRange)).filter((n): n is number => n !== null);
  const avgSalary = salaries.length ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 0;
  const generations = alumni.map((a) => a.generation);
  const genRange = generations.length ? `${Math.min(...generations)}th – ${Math.max(...generations)}th` : "";
  return { total, slices, avgSalary, genRange };
}

/**
 * Alumni employment status: a labelled pie (count + share inside each slice) with an
 * icon legend, in the style of the HRD "achievements" infographic. Counts come
 * straight from each alumni record's official employment status.
 */
export function AlumniAchievementChart({ alumni, className }: { alumni: Alumni[]; className?: string }) {
  const { total, slices, avgSalary, genRange } = React.useMemo(() => alumniAchievementStats(alumni), [alumni]);
  const [active, setActive] = React.useState<EmploymentStatus | null>(null);

  if (total === 0) return <p className="text-muted-foreground py-16 text-center text-sm">No alumni on record.</p>;

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]", className)}>
      <div className="flex flex-col items-center">
        <div className="w-full max-w-[340px]">
          <LabelledPieChart data={slices.map((s) => ({ ...s, color: active && active !== s.name ? `color-mix(in oklch, ${s.color} 45%, var(--card))` : s.color }))} height={300} />
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          Generation {genRange} · <span className="text-foreground font-semibold">{total}</span> alumni
        </p>
      </div>

      <div className="flex flex-col justify-center gap-3">
        <div className="bg-muted/50 flex items-baseline justify-between rounded-lg px-4 py-3">
          <span className="text-muted-foreground text-sm">Average salary</span>
          <span className="text-xl font-semibold tabular-nums">
            <span className="text-primary">${avgSalary.toLocaleString()}</span>
            <span className="text-muted-foreground text-sm font-normal"> /month</span>
          </span>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {slices.map((s) => {
            const meta = META[s.name as EmploymentStatus];
            const Icon = meta.icon;
            const pct = Math.round((s.value / total) * 100);
            return (
              <li
                key={s.name}
                onMouseEnter={() => setActive(s.name as EmploymentStatus)}
                onMouseLeave={() => setActive(null)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                  active === s.name ? "bg-accent/70" : "bg-card"
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white [&>svg]:size-4" style={{ background: meta.color }}>
                  <Icon />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium" title={s.name}>
                    {meta.short ?? s.name}
                  </span>
                  <span className="text-muted-foreground block text-xs">{pct}% of alumni</span>
                </span>
                <span className="text-base font-semibold tabular-nums">{s.value}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}