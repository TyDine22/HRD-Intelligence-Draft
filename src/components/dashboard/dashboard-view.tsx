"use client";

import * as React from "react";
import Link from "next/link";
import {
  AcademicCapIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  ExclamationTriangleIcon,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth/auth-context";
import { useAppStore } from "@/lib/store/app-store";
import { STUDENTS, GENERATIONS } from "@/lib/data/students";
import { ATTENDANCE, RISK_ASSESSMENTS, attendanceSeries, getStudentStats } from "@/lib/data/academics";
import { formatDate } from "@/lib/utils/format";
import { TODAY } from "@/lib/data/seed";
import { ReportExportDialog } from "./report-export-dialog";

type TopMetric = "course" | "extra" | "it" | "korean";
type Granularity = "daily" | "weekly" | "monthly";

export function DashboardView() {
  const { user, isAdmin } = useAuth();
  const { alumni } = useAppStore();
  const [generation, setGeneration] = React.useState<string>("all");
  const [topMetric, setTopMetric] = React.useState<TopMetric>("course");
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

  const top5 = React.useMemo(() => {
    const scored = students.map((s) => {
      const st = getStudentStats(s.id);
      const value =
        topMetric === "course" ? st.averageScore : topMetric === "extra" ? st.extraClassHours : topMetric === "it" ? s.itScore : s.koreanScore;
      return { name: s.name, value };
    });
    return scored.sort((a, b) => b.value - a.value).slice(0, 5);
  }, [students, topMetric]);

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

      {/* Student analytics */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <ChartCard title="Gender distribution" description={generation === "all" ? "All generations" : `Generation ${generation}`}>
          <DonutChart data={gender} centerLabel={{ value: String(students.length), label: "students" }} />
        </ChartCard>
        <ChartCard
          title="Top 5 students"
          description="Ranked by the selected metric"
          action={
            <Tabs value={topMetric} onValueChange={(v) => setTopMetric(v as TopMetric)}>
              <TabsList className="h-8">
                <TabsTrigger value="course" className="text-xs">Course</TabsTrigger>
                <TabsTrigger value="extra" className="text-xs">Extra hrs</TabsTrigger>
                <TabsTrigger value="it" className="text-xs">IT</TabsTrigger>
                <TabsTrigger value="korean" className="text-xs">Korean</TabsTrigger>
              </TabsList>
            </Tabs>
          }
        >
          <SimpleBarChart data={top5} layout="horizontal" valueSuffix={topMetric === "extra" ? " h" : ""} />
        </ChartCard>
      </div>

      {/* Attendance analytics */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
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
    </div>
  );
}
