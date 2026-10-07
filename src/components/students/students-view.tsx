"use client";

import * as React from "react";
import Link from "next/link";
import { AcademicCapIcon, ArrowDownTrayIcon, FunnelIcon, UserGroupIcon, UserMinusIcon, UsersIcon } from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { StudentStatusBadge, ScoreBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePagination } from "@/hooks/use-pagination";
import { STUDENTS, CLASSROOMS, GENERATIONS, initials } from "@/lib/data/students";
import { COURSES, courseByCode } from "@/lib/data/users";
import { getStudentStats } from "@/lib/data/academics";
import { formatDate } from "@/lib/utils/format";
import { ExportPreviewDialog, type ExportSpec } from "@/components/shared/export-preview-dialog";
import { CardField, CardFields, CardGrid, RecordCard, ViewToggle, useViewMode } from "@/components/shared/view-toggle";
import { useAuth } from "@/lib/auth/auth-context";

export function StudentsView() {
  const { isAdmin } = useAuth();
  const [query, setQuery] = React.useState("");
  const [generation, setGeneration] = React.useState("all");
  const [classroom, setClassroom] = React.useState("all");
  const [course, setCourse] = React.useState("all");
  const [status, setStatus] = React.useState("all");

  // Students matching every filter except status – drives the summary cards so they never zero out when a status is picked.
  const base = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return STUDENTS.filter(
      (s) =>
        (!q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)) &&
        (generation === "all" || s.generation === Number(generation)) &&
        (classroom === "all" || s.classroom === classroom) &&
        (course === "all" || s.courseCode === course)
    );
  }, [query, generation, classroom, course]);

  const filtered = React.useMemo(() => base.filter((s) => status === "all" || s.status === status), [base, status]);

  const counts = React.useMemo(
    () => ({
      total: base.length,
      active: base.filter((s) => s.status === "active").length,
      dropped: base.filter((s) => s.status === "dropped").length,
      graduated: base.filter((s) => s.status === "graduated").length,
    }),
    [base]
  );
  const pct = (n: number) => (counts.total ? `${Math.round((n / counts.total) * 100)}% of total` : "—");

  const { page, setPage, pageSize, slice, total } = usePagination(filtered, 12);
  React.useEffect(() => setPage(1), [query, generation, classroom, course, status, setPage]);

  const classrooms = generation === "all" ? CLASSROOMS : CLASSROOMS.filter((c) => c.includes(generation));

  const reset = () => {
    setQuery("");
    setGeneration("all");
    setClassroom("all");
    setCourse("all");
    setStatus("all");
  };

  const [exportOpen, setExportOpen] = React.useState(false);
  const [view, setView] = useViewMode("students");
  const buildExport = (): ExportSpec => ({
    filename: "students",
    columns: ["ID", "Name", "Email", "Phone", "Gender", "DOB", "Generation", "Classroom", "Course", "Enrollment", "University", "Status", "Attendance %", "Avg score"],
    numericFrom: 12,
    rows: filtered.map((s) => {
      const st = getStudentStats(s.id);
      return [s.id, s.name, s.email, s.phone, s.gender, s.dob, s.generation, s.classroom, courseByCode(s.courseCode).name, s.enrollmentDate, s.university, s.status, st.attendanceRate, st.averageScore];
    }),
    summary: [
      { label: "Students", value: filtered.length },
      { label: "Active", value: filtered.filter((s) => s.status === "active").length },
      { label: "Classrooms", value: new Set(filtered.map((s) => s.classroom)).size },
    ],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Monitor student profiles, academic performance and personal information."
        actions={
          isAdmin ? (
            <>
              <Button variant="outline" onClick={() => setExportOpen(true)}>
                <ArrowDownTrayIcon /> Export CSV
              </Button>
              <ExportPreviewDialog open={exportOpen} onOpenChange={setExportOpen} build={buildExport} title="Export students" />
            </>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            { key: "all", label: "Total students", value: counts.total, hint: generation === "all" ? "across all generations" : `generation ${generation}`, icon: <UsersIcon />, tone: "primary" },
            { key: "active", label: "Active", value: counts.active, hint: pct(counts.active), icon: <AcademicCapIcon />, tone: "success" },
            { key: "dropped", label: "Dropped", value: counts.dropped, hint: pct(counts.dropped), icon: <UserMinusIcon />, tone: "danger" },
            { key: "graduated", label: "Graduated", value: counts.graduated, hint: pct(counts.graduated), icon: <UserGroupIcon />, tone: "default" },
          ] as const
        ).map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setStatus(c.key)}
            className={`cursor-pointer rounded-xl text-left transition-shadow focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${status === c.key ? "ring-2 ring-primary/60" : "hover:shadow-md"}`}
            aria-pressed={status === c.key}
            title={c.key === "all" ? "Show all students" : `Filter: ${c.label.toLowerCase()} students`}
          >
            <KpiCard label={c.label} value={c.value} hint={c.hint} icon={c.icon} tone={c.tone} className="h-full" />
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl border shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="Search by name or email…" className="lg:w-72" />
          <div className="flex flex-wrap items-center gap-2">
            <FunnelIcon className="text-muted-foreground size-4" />
            <Select value={generation} onValueChange={(v) => { setGeneration(v); setClassroom("all"); }}>
              <SelectTrigger size="sm" className="bg-card w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All generations</SelectItem>
                {[...GENERATIONS].reverse().map((g) => <SelectItem key={g} value={String(g)}>Generation {g}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={classroom} onValueChange={setClassroom}>
              <SelectTrigger size="sm" className="bg-card w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {classrooms.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={course} onValueChange={setCourse}>
              <SelectTrigger size="sm" className="bg-card w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                {COURSES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger size="sm" className="bg-card w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="dropped">Dropped</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
              </SelectContent>
            </Select>
            {(query || generation !== "all" || classroom !== "all" || course !== "all" || status !== "all") && (
              <Button variant="ghost" size="sm" onClick={reset}>Clear</Button>
            )}
            <ViewToggle value={view} onChange={setView} className="ml-auto" />
          </div>
        </div>

        {slice.length === 0 ? (
          <EmptyState title="No students match" description="Try adjusting your search or filters." action={<Button variant="outline" size="sm" onClick={reset}>Clear filters</Button>} />
        ) : view === "grid" ? (
          <CardGrid columns={4}>
            {slice.map((s) => {
              const st = getStudentStats(s.id);
              return (
                <RecordCard
                  key={s.id}
                  href={`/students/${s.id}`}
                  title={s.name}
                  subtitle={`${s.id} · Gen ${s.generation} · ${s.classroom}`}
                  leading={
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">{initials(s.name)}</AvatarFallback>
                    </Avatar>
                  }
                  trailing={<StudentStatusBadge status={s.status} />}
                  footer={
                    <>
                      <span className="text-muted-foreground text-xs">
                        Attendance <span className="text-foreground font-medium tabular-nums">{s.status === "active" ? `${st.attendanceRate}%` : "—"}</span>
                      </span>
                      <ScoreBadge score={st.averageScore} />
                    </>
                  }
                >
                  <CardFields>
                    <CardField label="Course" className="col-span-2">{courseByCode(s.courseCode).name}</CardField>
                    <CardField label="Email" className="col-span-2">{s.email}</CardField>
                    <CardField label="Phone">{s.phone}</CardField>
                    <CardField label="Gender">{s.gender}</CardField>
                    <CardField label="University" className="col-span-2">{s.university}</CardField>
                    <CardField label="Enrolled">{formatDate(s.enrollmentDate)}</CardField>
                  </CardFields>
                </RecordCard>
              );
            })}
          </CardGrid>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Gen / Class</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>University</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead>Avg score</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((s) => {
                const st = getStudentStats(s.id);
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link href={`/students/${s.id}`} className="flex items-center gap-3 hover:underline">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">{initials(s.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{s.name}</p>
                          <p className="text-muted-foreground text-xs">{s.id}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs">{s.email}</p>
                      <p className="text-muted-foreground text-xs">{s.phone}</p>
                    </TableCell>
                    <TableCell>{s.gender}</TableCell>
                    <TableCell>
                      <p>Gen {s.generation}</p>
                      <p className="text-muted-foreground text-xs">{s.classroom}</p>
                    </TableCell>
                    <TableCell>{courseByCode(s.courseCode).name}</TableCell>
                    <TableCell className="max-w-44 truncate text-xs">{s.university}</TableCell>
                    <TableCell className="text-xs">{formatDate(s.enrollmentDate)}</TableCell>
                    <TableCell className="tabular-nums">{s.status === "active" ? `${st.attendanceRate}%` : "—"}</TableCell>
                    <TableCell><ScoreBadge score={st.averageScore} /></TableCell>
                    <TableCell><StudentStatusBadge status={s.status} /></TableCell>
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
