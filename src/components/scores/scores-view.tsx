"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDownTrayIcon, ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { ScoreBadge } from "@/components/shared/status-badge";
import { KpiCard } from "@/components/shared/kpi-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePagination } from "@/hooks/use-pagination";
import { STUDENTS, CLASSROOMS } from "@/lib/data/students";
import { SCORES, getStudentStats, scoreAverage, scoreTotal } from "@/lib/data/academics";
import { courseByCode } from "@/lib/data/users";
import { ExportPreviewDialog, type ExportSpec } from "@/components/shared/export-preview-dialog";
import { CardField, CardFields, CardGrid, RecordCard, ViewToggle, useViewMode } from "@/components/shared/view-toggle";
import { cn } from "@/lib/utils";

const RANGES = [
  { value: "all", label: "All scores" },
  { value: "90", label: "90 and above" },
  { value: "80", label: "80 – 89" },
  { value: "70", label: "70 – 79" },
  { value: "60", label: "60 – 69" },
  { value: "0", label: "Below 60" },
];

function inRange(avg: number, range: string) {
  if (range === "all") return true;
  const min = Number(range);
  if (min === 90) return avg >= 90;
  if (min === 0) return avg < 60;
  return avg >= min && avg < min + 10;
}

export function ScoresView() {
  const [query, setQuery] = React.useState("");
  const [classroom, setClassroom] = React.useState("all");
  const [range, setRange] = React.useState("all");
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return STUDENTS.filter((s) => s.status !== "dropped")
      .map((s) => {
        const subj = SCORES.filter((r) => r.studentId === s.id);
        const avg = (k: "assignment" | "quiz" | "exam" | "homework") => Math.round(subj.reduce((a, r) => a + r[k], 0) / subj.length);
        return {
          student: s,
          subjects: subj,
          assignment: avg("assignment"),
          quiz: avg("quiz"),
          exam: avg("exam"),
          homework: avg("homework"),
          total: subj.reduce((a, r) => a + scoreTotal(r), 0),
          average: getStudentStats(s.id).averageScore,
        };
      })
      .filter((r) => (!q || r.student.name.toLowerCase().includes(q)) && (classroom === "all" || r.student.classroom === classroom) && inRange(r.average, range))
      .sort((a, b) => b.average - a.average);
  }, [query, classroom, range]);

  const { page, setPage, pageSize, slice, total } = usePagination(rows, 15);
  React.useEffect(() => setPage(1), [query, classroom, range, setPage]);

  const classAvg = rows.length ? Math.round((rows.reduce((a, r) => a + r.average, 0) / rows.length) * 10) / 10 : 0;
  const top = rows[0];
  const below = rows.filter((r) => r.average < 65).length;

  const [exportOpen, setExportOpen] = React.useState(false);
  const [view, setView] = useViewMode("scores");
  const buildExport = (): ExportSpec => ({
    filename: "scores",
    columns: ["Student ID", "Student", "Class", "Subject", "Assignment", "Quiz", "Exam", "Homework", "Total", "Average"],
    numericFrom: 4,
    rows: rows.flatMap((r) => r.subjects.map((s) => [r.student.id, r.student.name, r.student.classroom, s.subject, s.assignment, s.quiz, s.exam, s.homework, scoreTotal(s), scoreAverage(s)])),
    summary: [
      { label: "Students", value: rows.length },
      { label: "Average score", value: classAvg },
      { label: "Below 65", value: below },
    ],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic scores"
        description="Assignments, quizzes, exams and homework. Totals and averages are calculated automatically."
        actions={
          <>
            <Button variant="outline" onClick={() => setExportOpen(true)}><ArrowDownTrayIcon /> Export CSV</Button>
            <ExportPreviewDialog open={exportOpen} onOpenChange={setExportOpen} build={buildExport} title="Export scores" />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Average score" value={classAvg} hint={classroom === "all" ? "all classes" : classroom} tone="primary" />
        <KpiCard label="Top performer" value={top ? top.student.name : "—"} hint={top ? `${top.average} average` : ""} tone="success" />
        <KpiCard label="Below 65" value={below} hint="students needing support" tone={below ? "danger" : "default"} />
      </div>

      <div className="bg-card rounded-xl border shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="Search by student name…" className="lg:w-72" />
          <div className="flex flex-wrap items-center gap-2">
            <Select value={classroom} onValueChange={setClassroom}>
              <SelectTrigger size="sm" className="bg-card w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classrooms</SelectItem>
                {CLASSROOMS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger size="sm" className="bg-card w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RANGES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <ViewToggle value={view} onChange={setView} className="ml-auto" />
          </div>
        </div>

        {slice.length === 0 ? (
          <EmptyState title="No scores match" description="Adjust the search, classroom or score range." />
        ) : view === "grid" ? (
          <CardGrid>
            {slice.map((r) => {
              const open = expanded === r.student.id;
              return (
                <RecordCard
                  key={r.student.id}
                  href={`/students/${r.student.id}`}
                  title={r.student.name}
                  subtitle={`${r.student.classroom} · ${courseByCode(r.student.courseCode).name}`}
                  trailing={<ScoreBadge score={r.average} />}
                  footer={
                    <>
                      <span className="text-muted-foreground text-xs">
                        Total <span className="text-foreground font-medium tabular-nums">{r.total}</span>
                      </span>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setExpanded(open ? null : r.student.id)}>
                        {open ? <ChevronDownIcon /> : <ChevronRightIcon />} {r.subjects.length} subjects
                      </Button>
                    </>
                  }
                >
                  <CardFields columns={4}>
                    <CardField label="Assign.">{r.assignment}</CardField>
                    <CardField label="Quiz">{r.quiz}</CardField>
                    <CardField label="Exam">{r.exam}</CardField>
                    <CardField label="Homework">{r.homework}</CardField>
                  </CardFields>
                  {open && (
                    <ul className="bg-muted/30 divide-y rounded-md text-xs">
                      {r.subjects.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                          <span className="text-muted-foreground truncate">{s.subject}</span>
                          <span className="tabular-nums">
                            {scoreTotal(s)} · <span className="font-medium">{scoreAverage(s)}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </RecordCard>
              );
            })}
          </CardGrid>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Assignment</TableHead>
                <TableHead className="text-right">Quiz</TableHead>
                <TableHead className="text-right">Exam</TableHead>
                <TableHead className="text-right">Homework</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Average</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((r) => {
                const open = expanded === r.student.id;
                return (
                  <React.Fragment key={r.student.id}>
                    <TableRow className="cursor-pointer" onClick={() => setExpanded(open ? null : r.student.id)}>
                      <TableCell className="text-muted-foreground">{open ? <ChevronDownIcon className="size-4" /> : <ChevronRightIcon className="size-4" />}</TableCell>
                      <TableCell>
                        <Link href={`/students/${r.student.id}`} onClick={(e) => e.stopPropagation()} className="font-medium hover:underline">{r.student.name}</Link>
                        <p className="text-muted-foreground text-xs">{courseByCode(r.student.courseCode).name}</p>
                      </TableCell>
                      <TableCell>{r.student.classroom}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.assignment}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.quiz}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.exam}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.homework}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{r.total}</TableCell>
                      <TableCell className="text-right"><ScoreBadge score={r.average} /></TableCell>
                    </TableRow>
                    {open &&
                      r.subjects.map((s) => (
                        <TableRow key={s.id} className={cn("bg-muted/30 text-xs")}>
                          <TableCell />
                          <TableCell colSpan={2} className="text-muted-foreground pl-6">{s.subject}</TableCell>
                          <TableCell className="text-right tabular-nums">{s.assignment}</TableCell>
                          <TableCell className="text-right tabular-nums">{s.quiz}</TableCell>
                          <TableCell className="text-right tabular-nums">{s.exam}</TableCell>
                          <TableCell className="text-right tabular-nums">{s.homework}</TableCell>
                          <TableCell className="text-right tabular-nums">{scoreTotal(s)}</TableCell>
                          <TableCell className="text-right tabular-nums">{scoreAverage(s)}</TableCell>
                        </TableRow>
                      ))}
                  </React.Fragment>
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
