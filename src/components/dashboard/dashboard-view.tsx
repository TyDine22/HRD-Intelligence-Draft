"use client";

import * as React from "react";
import Link from "next/link";
import {
  AcademicCapIcon,
  ArrowRightIcon,
  ClockIcon,
  ComputerDesktopIcon,
  LanguageIcon,
  BriefcaseIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  UserGroupIcon,
  UserMinusIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { RiskBadge } from "@/components/shared/status-badge";
import { ChartCard, DonutChart, SimpleBarChart, SimpleLineChart } from "@/components/charts/charts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth/auth-context";
import { useAppStore } from "@/lib/store/app-store";
import { STUDENTS, GENERATIONS, initials } from "@/lib/data/students";
import { courseByCode } from "@/lib/data/users";
import { ATTENDANCE, RISK_ASSESSMENTS, attendanceSeries, getStudentStats } from "@/lib/data/academics";
import { formatDate } from "@/lib/utils/format";
import { TODAY } from "@/lib/data/seed";
import { ReportExportDialog } from "./report-export-dialog";

type Granularity = "daily" | "weekly" | "monthly";

export function DashboardView() {
  const { user, isAdmin } = useAuth();
  const { alumni } = useAppStore();
  const [generation, setGeneration] = React.useState<string>("all");
  const [granularity, setGranularity] = React.useState<Granularity>("weekly");

  const students = React.useMemo(
    () => (generation === "all" ? STUDENTS : STUDENTS.filter((s) => s.generation === Number(generation))),
    [generation]
  );
  const studentIds = React.useMemo(() => new Set(students.map((s) => s.id)), [students]);

  const counts = React.useMemo(
    () => ({
      total: students.length,
      active: students.filter((s) => s.status === "active").length,
      dropped: students.filter((s) => s.status === "dropped").length,
      graduated: students.filter((s) => s.status === "graduated").length,
    }),
    [students]
  );

  const gender = React.useMemo(
    () => [
      { name: "Male", value: students.filter((s) => s.gender === "Male").length },
      { name: "Female", value: students.filter((s) => s.gender === "Female").length },
    ],
    [students]
  );

  const ranked = React.useMemo(() => {
    const byScore = students
      .map((s) => ({ student: s, value: getStudentStats(s.id).averageScore }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    const byIt = [...students].sort((a, b) => b.itScore - a.itScore).slice(0, 5).map((s) => ({ student: s, value: s.itScore }));
    const byKorean = [...students].sort((a, b) => b.koreanScore - a.koreanScore).slice(0, 5).map((s) => ({ student: s, value: s.koreanScore }));
    const byExtra = students
      .map((s) => ({ student: s, value: getStudentStats(s.id).extraClassHours }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    return { byScore, byIt, byKorean, byExtra };
  }, [students]);

  const attendanceBreakdown = React.useMemo(() => {
    const c = { Present: 0, Late: 0, Absent: 0, Permission: 0 };
    ATTENDANCE.forEach((a) => {
      if (studentIds.has(a.studentId)) c[a.status] += 1;
    });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [studentIds]);
  const attendanceTotal = attendanceBreakdown.reduce((a, b) => a + b.value, 0);
  const attendanceRate = attendanceTotal
    ? Math.round(((attendanceBreakdown[0].value + attendanceBreakdown[1].value) / attendanceTotal) * 1000) / 10
    : 0;

  const series = React.useMemo(
    () => attendanceSeries(granularity, (r) => studentIds.has(r.studentId)).map((p) => ({ label: granularity === "daily" ? p.label.slice(5) : p.label, rate: p.rate })),
    [granularity, studentIds]
  );

  const risk = React.useMemo(
    () => RISK_ASSESSMENTS.filter((r) => studentIds.has(r.studentId)).sort((a, b) => b.score - a.score),
    [studentIds]
  );

  const byGeneration = React.useMemo(
    () => GENERATIONS.map((g) => ({ name: `Gen ${g}`, value: STUDENTS.filter((s) => s.generation === g).length })),
    []
  );

  const employment = React.useMemo(() => {
    const employed = alumni.filter((a) => a.employmentStatus === "employed").length;
    const unemployed = alumni.filter((a) => a.employmentStatus === "unemployed").length;
    return [
      { name: "Employed", value: employed },
      { name: "Unemployed", value: unemployed },
      { name: "Other", value: alumni.length - employed - unemployed },
    ];
  }, [alumni]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${formatDate(TODAY)} · Term 2026/27`}
        title={`Good morning, ${user?.name.split(" ")[1] ?? user?.name}`}
        description={
          isAdmin
            ? "Student overview, attendance analytics, at-risk tracking and alumni outcomes across the HRD programme."
            : "Student overview, attendance analytics and at-risk tracking for your classes."
        }
        actions={
          <>
            <Select value={generation} onValueChange={setGeneration}>
              <SelectTrigger className="w-40 bg-card">
                <SelectValue placeholder="Generation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All generations</SelectItem>
                {[...GENERATIONS].reverse().map((g) => (
                  <SelectItem key={g} value={String(g)}>
                    Generation {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isAdmin && <ReportExportDialog />}
          </>
        }
      />

      {/* KPI row */}
      <div className={`grid gap-4 sm:grid-cols-2 ${isAdmin ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}>
        <KpiCard label="Total students" value={counts.total} hint={generation === "all" ? "across 3 generations" : `generation ${generation}`} icon={<UsersIcon />} tone="primary" />
        <KpiCard label="Active" value={counts.active} hint={`${counts.total ? Math.round((counts.active / counts.total) * 100) : 0}% of total`} icon={<AcademicCapIcon />} tone="success" />
        <KpiCard label="Dropped" value={counts.dropped} hint="require exit review" icon={<UserMinusIcon />} tone="danger" />
        <KpiCard label="Graduated" value={counts.graduated} hint="completed the programme" icon={<UserGroupIcon />} tone="default" />
        {isAdmin && <KpiCard label="Total alumni" value={alumni.length} hint={`${employment[0].value} employed`} icon={<BriefcaseIcon />} tone="warning" />}
      </div>

      {/* Student & attendance analytics */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Gender distribution" description={generation === "all" ? "All generations" : `Generation ${generation}`}>
          <DonutChart data={gender} centerLabel={{ value: String(students.length), label: "students" }} />
        </ChartCard>
        <ChartCard title="Attendance breakdown" description="Present · Absent · Late · Permission">
          {attendanceTotal ? (
            <DonutChart data={attendanceBreakdown} centerLabel={{ value: `${attendanceRate}%`, label: "attendance rate" }} />
          ) : (
            <p className="text-muted-foreground py-16 text-center text-sm">No attendance records for this selection (only active students check in).</p>
          )}
        </ChartCard>
        <ChartCard
          title="Attendance rate over time"
          description="Share of students present or late per period"
          action={
            <Tabs value={granularity} onValueChange={(v) => setGranularity(v as Granularity)}>
              <TabsList className="h-8">
                <TabsTrigger value="daily" className="text-xs">Daily</TabsTrigger>
                <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          }
        >
          {series.length ? (
            <SimpleLineChart data={series} xKey="label" series={[{ key: "rate", label: "Attendance rate", color: "var(--chart-2)" }]} domain={[60, 100]} valueSuffix="%" />
          ) : (
            <p className="text-muted-foreground py-16 text-center text-sm">No attendance data for this selection.</p>
          )}
        </ChartCard>
      </div>

      {/* At risk + admin-only */}
      <div className={`grid gap-4 ${isAdmin ? "xl:grid-cols-[1.5fr_1fr]" : ""}`}>
        <div className="bg-card rounded-xl border shadow-sm">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <h3 className="flex items-center gap-2 font-semibold">
                <ExclamationTriangleIcon className="text-destructive size-5" /> Students at risk
              </h3>
              <p className="text-muted-foreground text-xs">Automatically identified from attendance and score trends</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/at-risk">
                View all <ArrowRightIcon />
              </Link>
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Academic</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {risk.slice(0, 6).map((r) => {
                const s = STUDENTS.find((x) => x.id === r.studentId)!;
                return (
                  <TableRow key={r.studentId}>
                    <TableCell>
                      <Link href={`/students/${s.id}`} className="hover:underline">
                        <p className="font-medium">{s.name}</p>
                        <p className="text-muted-foreground text-xs">{s.classroom}</p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="w-10 tabular-nums">{r.stats.averageScore}</span>
                        <span className={`text-xs ${r.stats.trend < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {r.stats.trend > 0 ? "+" : ""}
                          {r.stats.trend}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={r.stats.attendanceRate} className="w-20" indicatorClassName={r.stats.attendanceRate < 75 ? "bg-destructive" : r.stats.attendanceRate < 85 ? "bg-warning" : "bg-success"} />
                        <span className="tabular-nums">{r.stats.attendanceRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RiskBadge level={r.level} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {risk.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground py-10 text-center">
                    No students at risk for this selection.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {isAdmin && (
          <div className="grid gap-4">
            <ChartCard title="Students by generation" description="Generation overview">
              <SimpleBarChart data={byGeneration} height={180} />
            </ChartCard>
            <ChartCard title="Alumni employment status" description={`${alumni.length} alumni on record`}>
              <SimpleBarChart data={employment} layout="horizontal" height={170} colorByName />
            </ChartCard>
          </div>
        )}
      </div>

      {/* Top students – ranked lists */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <TrophyIcon className="text-warning size-5" />
          <h2 className="font-semibold">Top students</h2>
          <span className="text-muted-foreground text-xs">
            {generation === "all" ? "All generations" : `Generation ${generation}`} · ranked lists
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <RankedCard
            title="Basic & Advanced courses"
            description="Top 5 by course average score"
            icon={<AcademicCapIcon />}
            accent="var(--chart-1)"
            valueLabel="Score"
            rows={ranked.byScore.map((r) => ({
              id: r.student.id,
              name: r.student.name,
              meta: courseByCode(r.student.courseCode).name,
              value: r.value,
              display: String(r.value),
            }))}
          />
          <RankedCard
            title="IT students"
            description="Top 5 by monthly IT assessment score"
            icon={<ComputerDesktopIcon />}
            accent="var(--chart-2)"
            valueLabel="Score"
            rows={ranked.byIt.map((r) => ({ id: r.student.id, name: r.student.name, meta: r.student.classroom, value: r.value, display: String(r.value) }))}
          />
          <RankedCard
            title="Korean students"
            description="Top 5 by Korean language score"
            icon={<LanguageIcon />}
            accent="var(--chart-5)"
            valueLabel="Score"
            rows={ranked.byKorean.map((r) => ({ id: r.student.id, name: r.student.name, meta: r.student.classroom, value: r.value, display: String(r.value) }))}
          />
          <RankedCard
            title="Extra-class students"
            description="Top 5 by approved extra-class hours"
            icon={<ClockIcon />}
            accent="var(--chart-3)"
            valueLabel="Hours"
            rows={ranked.byExtra.map((r) => ({ id: r.student.id, name: r.student.name, meta: r.student.classroom, value: r.value, display: `${r.value} h` }))}
            emptyText="No extra-class hours recorded for this selection."
          />
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ranked table card                                                   */
/* ------------------------------------------------------------------ */

interface RankedRow {
  id: string;
  name: string;
  meta: string;
  value: number;
  display: string;
}

const MEDALS = [
  { ribbon: "oklch(0.55 0.2 25)", disc: "oklch(0.82 0.17 85)", rim: "oklch(0.68 0.16 75)", label: "Gold medal", glow: "oklch(0.82 0.17 85 / 0.18)" },
  { ribbon: "oklch(0.52 0.16 262)", disc: "oklch(0.86 0.01 260)", rim: "oklch(0.68 0.015 260)", label: "Silver medal", glow: "oklch(0.86 0.01 260 / 0.22)" },
  { ribbon: "oklch(0.48 0.12 160)", disc: "oklch(0.74 0.12 55)", rim: "oklch(0.58 0.11 50)", label: "Bronze medal", glow: "oklch(0.74 0.12 55 / 0.18)" },
];

/** Original medal glyph (Heroicons has no medal), coloured per podium place. */
function MedalIcon({ place, className }: { place: 0 | 1 | 2; className?: string }) {
  const m = MEDALS[place];
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label={m.label}>
      <path d="M7.5 2h4l-2.6 7.2h-4L7.5 2Z" fill={m.ribbon} />
      <path d="M16.5 2h-4l2.6 7.2h4L16.5 2Z" fill={m.ribbon} opacity="0.75" />
      <circle cx="12" cy="15" r="6.5" fill={m.disc} stroke={m.rim} strokeWidth="1.3" />
      <circle cx="12" cy="15" r="3.6" fill="none" stroke={m.rim} strokeWidth="0.9" opacity="0.7" />
      <path d="M12 12.4l.85 1.72 1.9.28-1.37 1.33.32 1.9L12 16.73l-1.7.9.32-1.9-1.37-1.33 1.9-.28L12 12.4Z" fill={m.rim} opacity="0.9" />
    </svg>
  );
}

function RankedCard({
  title,
  description,
  icon,
  accent,
  valueLabel,
  rows,
  emptyText = "No data for this selection.",
}: {
  title: string;
  description?: string;
  icon: React.ReactNode;
  accent: string;
  valueLabel: string;
  rows: RankedRow[];
  emptyText?: string;
}) {
  const max = rows.reduce((m, r) => Math.max(m, r.value), 0) || 1;
  return (
    <div className="bg-card relative overflow-hidden rounded-xl border shadow-sm">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg [&>svg]:size-5" style={{ background: `color-mix(in oklch, ${accent} 14%, transparent)`, color: accent }}>
            {icon}
          </div>
          <div>
            <h3 className="font-semibold leading-tight">{title}</h3>
            {description && <p className="text-muted-foreground text-xs">{description}</p>}
          </div>
        </div>
        <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">{valueLabel}</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground px-5 pb-6 text-sm">{emptyText}</p>
      ) : (
        <ol className="px-3 pb-3">
          {rows.map((r, i) => {
            const podium = i < 3;
            return (
              <li key={r.id}>
                <Link
                  href={`/students/${r.id}`}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors",
                    i === 0 ? "bg-[oklch(0.97_0.03_85)] dark:bg-[oklch(0.3_0.04_85)]" : "hover:bg-accent/60"
                  )}
                >
                  <span className="flex w-8 shrink-0 items-center justify-center">
                    {podium ? (
                      <MedalIcon place={i as 0 | 1 | 2} className="size-8 drop-shadow-sm" />
                    ) : (
                      <span className="text-muted-foreground text-sm font-semibold tabular-nums">{i + 1}</span>
                    )}
                  </span>
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: podium ? MEDALS[i].glow : "var(--muted)", color: podium ? "var(--foreground)" : "var(--muted-foreground)" }}
                  >
                    {initials(r.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-sm group-hover:underline", i === 0 ? "font-semibold" : "font-medium")}>{r.name}</span>
                    <span className="text-muted-foreground block truncate text-xs">{r.meta}</span>
                    <span className="bg-muted mt-1.5 block h-1 w-full overflow-hidden rounded-full">
                      <span className="block h-full rounded-full" style={{ width: `${Math.max(6, (r.value / max) * 100)}%`, background: accent, opacity: podium ? 1 : 0.55 }} />
                    </span>
                  </span>
                  <span className={cn("shrink-0 text-right tabular-nums", i === 0 ? "text-lg font-bold" : "text-sm font-semibold")}>{r.display}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}