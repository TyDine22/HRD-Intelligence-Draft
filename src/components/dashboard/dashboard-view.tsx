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
import { RiskBadge } from "@/components/shared/status-badge";
import { ChartCard, DonutChart, SimpleBarChart, SimpleLineChart } from "@/components/charts/charts";
import { AlumniAchievementChart } from "@/components/charts/alumni-achievement-chart";
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
import { EMPLOYED_STATUSES } from "@/lib/data/alumni";
import { ATTENDANCE, RISK_ASSESSMENTS, attendanceSeries, getStudentStats } from "@/lib/data/academics";
import { formatDate } from "@/lib/utils/format";
import { TODAY } from "@/lib/data/seed";
import { ReportExportDialog } from "./report-export-dialog";
import { FeaturedStatTile, StatTile } from "./dashboard-widgets";

type Granularity = "daily" | "weekly" | "monthly";

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

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

  const employedCount = React.useMemo(() => alumni.filter((a) => EMPLOYED_STATUSES.includes(a.employmentStatus)).length, [alumni]);

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
      <div className={cn("grid grid-cols-2 gap-3 sm:gap-4", isAdmin ? "lg:grid-cols-3 xl:grid-cols-5" : "xl:grid-cols-4")}>
        <div className={cn("grid", isAdmin && "col-span-2 lg:col-span-1")}>
          <FeaturedStatTile
            label="Total students"
            value={counts.total}
            hint={generation === "all" ? "Across 3 generations" : `Generation ${generation}`}
            icon={<UsersIcon />}
            segments={[
              { label: "Active", value: counts.active, color: "oklch(0.85 0.15 160)" },
              { label: "Graduated", value: counts.graduated, color: "oklch(0.88 0.1 210)" },
              { label: "Dropped", value: counts.dropped, color: "oklch(0.78 0.16 20)" },
            ]}
          />
        </div>
        <StatTile
          label="Active"
          value={counts.active}
          hint={`${pct(counts.active, counts.total)}% of total`}
          icon={<AcademicCapIcon />}
          tone="success"
          share={pct(counts.active, counts.total)}
        />
        <StatTile
          label="Dropped"
          value={counts.dropped}
          hint="Require exit review"
          icon={<UserMinusIcon />}
          tone="danger"
          share={pct(counts.dropped, counts.total)}
        />
        <StatTile
          label="Graduated"
          value={counts.graduated}
          hint="Completed the programme"
          icon={<UserGroupIcon />}
          tone="info"
          share={pct(counts.graduated, counts.total)}
        />
        {isAdmin && (
          <StatTile
            label="Total alumni"
            value={alumni.length}
            hint={`${employedCount} employed`}
            icon={<BriefcaseIcon />}
            tone="warning"
            share={pct(employedCount, alumni.length)}
          />
        )}
      </div>

      {/* Student & attendance analytics */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_1.8fr]">
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
          className="lg:col-span-2 xl:col-span-1"
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
        <div className="bg-card rounded-xl shadow-sm">
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
            <ChartCard title="Students by generation" description="Generation overview" className="h-full">
              <SimpleBarChart data={byGeneration} height={360} />
            </ChartCard>
          </div>
        )}
      </div>

      {isAdmin && (
        <ChartCard title="Alumni employment status" description="Official employment status of every graduate, as recorded in Alumni management">
          <div className="px-2 pt-1">
            <AlumniAchievementChart alumni={alumni} />
          </div>
        </ChartCard>
      )}

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
  { ribbon: "#c4001e", disc: "#f5a300", rim: "#9a5b00", label: "Gold medal", glow: "rgba(245, 163, 0, 0.18)" },
  { ribbon: "#1c67a7", disc: "#cfd5db", rim: "#677079", label: "Silver medal", glow: "rgba(207, 213, 219, 0.35)" },
  { ribbon: "#15803d", disc: "#d98e4a", rim: "#8a4b1c", label: "Bronze medal", glow: "rgba(217, 142, 74, 0.2)" },
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
    <div className="bg-card relative overflow-hidden rounded-xl shadow-sm">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg [&>svg]:size-5" style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}>
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
                    i === 0 ? "bg-warning-bg" : "hover:bg-accent/60"
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
