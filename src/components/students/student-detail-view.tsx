"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  SparklesIcon,
  AcademicCapIcon,
  ClockIcon,
  ClipboardDocumentCheckIcon,
  LanguageIcon,
  ComputerDesktopIcon,
  ChatBubbleBottomCenterTextIcon,
  LockClosedIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

import { KpiCard } from "@/components/shared/kpi-card";
import { EmptyState } from "@/components/shared/empty-state";
import { AttendanceBadge, RiskBadge, StudentStatusBadge } from "@/components/shared/status-badge";
import { ChartCard, DonutChart, SimpleLineChart } from "@/components/charts/charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FeedbackFormDialog } from "@/components/feedback/feedback-form-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth/auth-context";
import { useAppStore } from "@/lib/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { studentById, initials } from "@/lib/data/students";
import { courseByCode, userById } from "@/lib/data/users";
import { ATTENDANCE, MONTHLY_SCORES, SCORES, assessRisk, getStudentStats, scoreAverage, scoreTotal } from "@/lib/data/academics";
import { ALLOWANCE_MONTHS, allowanceColumns, computeMonthlyAllowance } from "@/lib/data/allowances";
import { summarizeFeedback } from "@/lib/data/feedback";
import { formatDate, formatMonth, formatCurrency, ageFromDob, weekdayOf } from "@/lib/utils/format";
import type { FeedbackEntry } from "@/lib/data/types";
import type { FeedbackValues } from "@/lib/validation/schemas";

export function StudentDetailView({ id }: { id: string }) {
  const { user, isAdmin } = useAuth();
  const { feedback, addFeedback, updateFeedback, removeFeedback, allowanceTypes, extraClasses, challenge } = useAppStore();
  const { toast } = useToast();
  const student = studentById(id);
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<FeedbackEntry | null>(null);
  const [deleting, setDeleting] = React.useState<FeedbackEntry | null>(null);

  if (!student) {
    return (
      <EmptyState
        title="Student not found"
        description={`No student with ID ${id}.`}
        action={
          <Button asChild variant="outline">
            <Link href="/students">Back to students</Link>
          </Button>
        }
      />
    );
  }

  const course = courseByCode(student.courseCode);
  const instructor = userById(course.instructorId);
  const stats = getStudentStats(student.id);
  const risk = assessRisk(student.id);
  const scores = SCORES.filter((s) => s.studentId === student.id);
  const monthly = MONTHLY_SCORES.filter((m) => m.studentId === student.id).map((m) => ({ month: formatMonth(m.month).slice(0, 3), average: m.average }));
  const attendance = ATTENDANCE.filter((a) => a.studentId === student.id).sort((a, b) => (a.date < b.date ? 1 : -1));
  const studentFeedback = feedback.filter((f) => f.studentId === student.id);
  // Instructors give feedback only about active students on their own course (same rule as the Feedback module).
  const canGiveFeedback = !isAdmin && !!user && student.status === "active" && (!user.course || user.course === student.courseCode);

  const openNewFeedback = () => {
    setEditing(null);
    setFeedbackOpen(true);
  };
  const submitFeedback = (values: FeedbackValues) => {
    if (editing) {
      updateFeedback(editing.id, values);
      toast({ title: "Feedback updated", variant: "success" });
    } else {
      addFeedback({ ...values, studentId: student.id, instructorId: user?.id ?? "USR-INS-01" });
      toast({ title: "Feedback submitted", description: `Private note about ${student.name} saved.`, variant: "success" });
    }
    setFeedbackOpen(false);
    setEditing(null);
  };
  const studentExtra = extraClasses.filter((e) => e.studentId === student.id);
  // Columns are the enabled allowance types plus the one-off coding challenge reward (in its payout month).
  const allowanceCols = allowanceColumns(allowanceTypes, challenge.payoutMonth, challenge);

  const attendanceData = [
    { name: "Present", value: stats.present },
    { name: "Late", value: stats.late },
    { name: "Absent", value: stats.absent },
    { name: "Permission", value: stats.permission },
  ];

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/students">
          <ArrowLeftIcon /> Students
        </Link>
      </Button>

      <div className="bg-card flex flex-col gap-5 rounded-xl border p-5 shadow-sm md:flex-row md:items-start">
        <Avatar className="size-16">
          <AvatarFallback className="bg-primary text-primary-foreground text-lg">{initials(student.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{student.name}</h1>
            <StudentStatusBadge status={student.status} />
            {student.isClassLeader && <Badge variant="secondary">Class leader</Badge>}
            {risk && <RiskBadge level={risk.level} />}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {student.id} · Generation {student.generation} · {student.classroom} · {course.name}
          </p>
          <div className="mt-3 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <p className="flex items-center gap-2"><EnvelopeIcon className="text-muted-foreground size-4" />{student.email}</p>
            <p className="flex items-center gap-2"><PhoneIcon className="text-muted-foreground size-4" />{student.phone}</p>
            <p><span className="text-muted-foreground">Gender:</span> {student.gender}</p>
            <p><span className="text-muted-foreground">Date of birth:</span> {formatDate(student.dob)} ({ageFromDob(student.dob)} yrs)</p>
            <p><span className="text-muted-foreground">Enrolled:</span> {formatDate(student.enrollmentDate)}</p>
            <p><span className="text-muted-foreground">University:</span> {student.university}</p>
            <p><span className="text-muted-foreground">Instructor:</span> {instructor?.name}</p>
          </div>
        </div>
        {canGiveFeedback && (
          <Button onClick={openNewFeedback} className="md:self-start">
            <ChatBubbleBottomCenterTextIcon /> Give feedback
          </Button>
        )}
      </div>

      {risk && (
        <div className="border-destructive/30 bg-destructive/5 rounded-xl border p-4">
          <div className="flex items-start gap-3">
            <SparklesIcon className="text-destructive mt-0.5 size-5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">AI alert · {risk.level} risk</p>
              <p className="text-sm">{risk.alert}</p>
              <ul className="text-muted-foreground mt-2 list-inside list-disc text-xs">
                {risk.reasons.map((r) => <li key={r}>{r}</li>)}
              </ul>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide">AI-suggested support</p>
              <ul className="mt-1 space-y-1 text-sm">
                {risk.suggestions.map((s) => <li key={s} className="flex gap-2"><span className="text-primary">→</span>{s}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Attendance rate" value={`${stats.attendanceRate}%`} hint={`${stats.absent} absent · ${stats.late} late`} icon={<ClipboardDocumentCheckIcon />} tone={stats.attendanceRate < 85 ? "danger" : "success"} />
        <KpiCard label="Average score" value={stats.averageScore} delta={stats.trend} deltaLabel="vs last month" icon={<AcademicCapIcon />} tone="primary" />
        <KpiCard label="Extra-class hours" value={`${stats.extraClassHours} h`} hint="approved this term" icon={<ClockIcon />} />
        <KpiCard label="IT score" value={student.itScore} hint="monthly assessment" icon={<ComputerDesktopIcon />} />
        <KpiCard label="Korean score" value={student.koreanScore} hint="language class" icon={<LanguageIcon />} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scores">Scores</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="feedback">Instructor feedback</TabsTrigger>
          {isAdmin && <TabsTrigger value="allowance">Allowance</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="grid gap-4 pt-2 lg:grid-cols-2">
          <ChartCard title="Score trend" description="Monthly average across all subjects">
            <SimpleLineChart data={monthly} xKey="month" series={[{ key: "average", label: "Average score", color: "var(--chart-1)" }]} domain={[0, 100]} height={220} />
          </ChartCard>
          <ChartCard title="Attendance" description="Current term">
            {attendance.length ? (
              <DonutChart data={attendanceData} centerLabel={{ value: `${stats.attendanceRate}%`, label: "rate" }} height={220} />
            ) : (
              <p className="text-muted-foreground py-16 text-center text-sm">No attendance records (student is not active).</p>
            )}
          </ChartCard>
        </TabsContent>

        <TabsContent value="scores" className="pt-2">
          <Card className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Assignment</TableHead>
                  <TableHead className="text-right">Quiz</TableHead>
                  <TableHead className="text-right">Exam</TableHead>
                  <TableHead className="text-right">Homework</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Average</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.subject}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.assignment}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.quiz}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.exam}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.homework}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{scoreTotal(r)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{scoreAverage(r)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/40 font-semibold">
                  <TableCell>Overall</TableCell>
                  <TableCell className="text-right tabular-nums">{Math.round(scores.reduce((a, r) => a + r.assignment, 0) / scores.length)}</TableCell>
                  <TableCell className="text-right tabular-nums">{Math.round(scores.reduce((a, r) => a + r.quiz, 0) / scores.length)}</TableCell>
                  <TableCell className="text-right tabular-nums">{Math.round(scores.reduce((a, r) => a + r.exam, 0) / scores.length)}</TableCell>
                  <TableCell className="text-right tabular-nums">{Math.round(scores.reduce((a, r) => a + r.homework, 0) / scores.length)}</TableCell>
                  <TableCell className="text-right tabular-nums">{scores.reduce((a, r) => a + scoreTotal(r), 0)}</TableCell>
                  <TableCell className="text-right tabular-nums">{stats.averageScore}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="pt-2">
          <Card className="py-0">
            {attendance.length === 0 ? (
              <EmptyState title="No attendance records" description="Attendance is only tracked for active students." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.slice(0, 20).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{formatDate(a.date)}</TableCell>
                      <TableCell className="text-muted-foreground">{weekdayOf(a.date)}</TableCell>
                      <TableCell className="tabular-nums">{a.checkIn ?? "—"}</TableCell>
                      <TableCell className="tabular-nums">{a.checkOut ?? "—"}</TableCell>
                      <TableCell><AttendanceBadge status={a.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {attendance.length > 20 && (
              <p className="text-muted-foreground border-t px-4 py-3 text-xs">Showing the latest 20 of {attendance.length} records. Use the Attendance module for the full history.</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="grid gap-4 pt-2 lg:grid-cols-[1fr_1.4fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><SparklesIcon className="text-primary size-5" /> AI summary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed">{summarizeFeedback(studentFeedback, student.name)}</CardContent>
          </Card>
          <Card className="py-0">
            {canGiveFeedback && studentFeedback.length > 0 && (
              <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <LockClosedIcon className="size-3.5" /> {studentFeedback.length} private {studentFeedback.length === 1 ? "note" : "notes"} · visible to HRD staff only
                </p>
                <Button size="sm" variant="outline" onClick={openNewFeedback}>
                  <ChatBubbleBottomCenterTextIcon /> New feedback
                </Button>
              </div>
            )}
            {studentFeedback.length === 0 ? (
              <EmptyState
                title="No feedback yet"
                description={canGiveFeedback ? `Be the first to leave a private note about ${student.name}.` : "Instructors have not submitted private feedback for this student."}
                action={
                  canGiveFeedback ? (
                    <Button onClick={openNewFeedback}>
                      <ChatBubbleBottomCenterTextIcon /> Give feedback
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <ul className="divide-y">
                {studentFeedback.map((f) => {
                  const mine = f.instructorId === user?.id;
                  return (
                    <li key={f.id} className="flex gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{f.category}</Badge>
                          <span className="text-muted-foreground text-xs">
                            {formatDate(f.date)} · {mine ? "You" : userById(f.instructorId)?.name}
                          </span>
                        </div>
                        <p className="text-sm">{f.content}</p>
                      </div>
                      {mine && !isAdmin && (
                        <div className="flex shrink-0 items-start gap-1">
                          <Button variant="ghost" size="icon-sm" aria-label="Edit feedback" onClick={() => { setEditing(f); setFeedbackOpen(true); }}>
                            <PencilSquareIcon />
                          </Button>
                          <Button variant="ghost" size="icon-sm" aria-label="Delete feedback" className="text-destructive" onClick={() => setDeleting(f)}>
                            <TrashIcon />
                          </Button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="allowance" className="pt-2">
            <Card className="py-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    {allowanceCols.map((c) => <TableHead key={c.id} className="text-right">{c.name}</TableHead>)}
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...ALLOWANCE_MONTHS].reverse().map((m) => {
                    const row = computeMonthlyAllowance(student, m, allowanceTypes, challenge);
                    return (
                      <TableRow key={m}>
                        <TableCell className="font-medium">{formatMonth(m)}</TableCell>
                        {allowanceCols.map((c) => {
                          const line = row.lines.find((l) => l.typeId === c.id);
                          return (
                            <TableCell key={c.id} className="text-right tabular-nums" title={line?.note}>
                              {line && line.amount ? formatCurrency(line.amount) : "—"}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(row.total)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <p className="text-muted-foreground border-t px-4 py-3 text-xs">
                Extra-class allowance is based on {studentExtra.filter((e) => e.status === "approved").length} approved sessions. Rates are managed in the Allowances module.
              </p>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <FeedbackFormDialog
        open={feedbackOpen}
        onOpenChange={(o) => { setFeedbackOpen(o); if (!o) setEditing(null); }}
        initial={editing}
        studentId={student.id}
        onSubmit={submitFeedback}
        instructorCourse={user?.course}
      />

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete feedback?</DialogTitle>
            <DialogDescription>This removes your note about {student.name}. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleting) removeFeedback(deleting.id);
                setDeleting(null);
                toast({ title: "Feedback deleted" });
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
