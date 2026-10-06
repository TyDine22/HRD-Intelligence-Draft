"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDownTrayIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { AttendanceBadge } from "@/components/shared/status-badge";
import { KpiCard } from "@/components/shared/kpi-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePagination } from "@/hooks/use-pagination";
import { STUDENTS, CLASSROOMS } from "@/lib/data/students";
import { ATTENDANCE, MONTHS } from "@/lib/data/academics";
import { TODAY } from "@/lib/data/seed";
import { formatDate, formatMonth, weekdayOf } from "@/lib/utils/format";
import { exportCsv } from "@/lib/utils/export";
import type { AttendanceStatus } from "@/lib/data/types";

type DateMode = "month" | "day";

export function AttendanceView() {
  const [query, setQuery] = React.useState("");
  const [classroom, setClassroom] = React.useState("all");
  const [status, setStatus] = React.useState<"all" | AttendanceStatus>("all");
  const [mode, setMode] = React.useState<DateMode>("month");
  const [month, setMonth] = React.useState("2026-10");
  const [day, setDay] = React.useState(TODAY);

  const studentMap = React.useMemo(() => new Map(STUDENTS.map((s) => [s.id, s])), []);
  const activeClassrooms = CLASSROOMS.filter((c) => c.includes("13"));

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return ATTENDANCE.filter((r) => {
      const s = studentMap.get(r.studentId);
      if (!s) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      if (classroom !== "all" && s.classroom !== classroom) return false;
      if (status !== "all" && r.status !== status) return false;
      if (mode === "month" && !r.date.startsWith(month)) return false;
      if (mode === "day" && r.date !== day) return false;
      return true;
    }).sort((a, b) => (a.date === b.date ? a.studentId.localeCompare(b.studentId) : a.date < b.date ? 1 : -1));
  }, [query, classroom, status, mode, month, day, studentMap]);

  const summary = React.useMemo(() => {
    const c = { Present: 0, Late: 0, Absent: 0, Permission: 0 };
    filtered.forEach((r) => (c[r.status] += 1));
    const rate = filtered.length ? Math.round(((c.Present + c.Late) / filtered.length) * 1000) / 10 : 0;
    return { ...c, rate };
  }, [filtered]);

  const { page, setPage, pageSize, slice, total } = usePagination(filtered, 20);
  React.useEffect(() => setPage(1), [query, classroom, status, mode, month, day, setPage]);

  const exportRows = () =>
    exportCsv(
      `attendance_${mode === "month" ? month : day}`,
      ["Date", "Student ID", "Student", "Class", "Check-in", "Check-out", "Status"],
      filtered.map((r) => {
        const s = studentMap.get(r.studentId)!;
        return [r.date, s.id, s.name, s.classroom, r.checkIn ?? "", r.checkOut ?? "", r.status];
      })
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Daily check-in and check-out records synchronised from the RDA attendance API."
        actions={
          <Button variant="outline" onClick={exportRows}>
            <ArrowDownTrayIcon /> Export CSV
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Attendance rate" value={`${summary.rate}%`} hint={`${filtered.length} records`} tone={summary.rate < 85 ? "danger" : "success"} icon={<CalendarDaysIcon />} />
        <KpiCard label="Present" value={summary.Present} tone="success" />
        <KpiCard label="Late" value={summary.Late} tone="warning" />
        <KpiCard label="Absent" value={summary.Absent} tone="danger" />
        <KpiCard label="Permission" value={summary.Permission} tone="primary" />
      </div>

      <div className="bg-card rounded-xl border shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 xl:flex-row xl:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="Search by student name…" className="xl:w-64" />
          <div className="flex flex-wrap items-center gap-2">
            <Select value={classroom} onValueChange={setClassroom}>
              <SelectTrigger size="sm" className="bg-card w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {activeClassrooms.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger size="sm" className="bg-card w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Present">Present</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="Late">Late</SelectItem>
                <SelectItem value="Permission">Permission</SelectItem>
              </SelectContent>
            </Select>
            <Tabs value={mode} onValueChange={(v) => setMode(v as DateMode)}>
              <TabsList className="h-8">
                <TabsTrigger value="month" className="text-xs">By month</TabsTrigger>
                <TabsTrigger value="day" className="text-xs">Specific day</TabsTrigger>
              </TabsList>
            </Tabs>
            {mode === "month" ? (
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger size="sm" className="bg-card w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[...MONTHS].reverse().map((m) => <SelectItem key={m} value={m}>{formatMonth(m)}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="bg-card h-8 w-40 text-xs" min="2026-07-06" max={TODAY} />
            )}
          </div>
        </div>

        {slice.length === 0 ? (
          <EmptyState title="No attendance records" description={mode === "day" ? "No check-ins on this date (weekend or outside the term)." : "Try a different month, class or status."} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((r) => {
                const s = studentMap.get(r.studentId)!;
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p>{formatDate(r.date)}</p>
                      <p className="text-muted-foreground text-xs">{weekdayOf(r.date)}</p>
                    </TableCell>
                    <TableCell>
                      <Link href={`/students/${s.id}`} className="font-medium hover:underline">{s.name}</Link>
                      <p className="text-muted-foreground text-xs">{s.id}</p>
                    </TableCell>
                    <TableCell>{s.classroom}</TableCell>
                    <TableCell className="tabular-nums">{r.checkIn ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">{r.checkOut ?? "—"}</TableCell>
                    <TableCell><AttendanceBadge status={r.status} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
