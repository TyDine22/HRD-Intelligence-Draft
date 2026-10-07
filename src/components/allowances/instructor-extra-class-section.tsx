"use client";

import * as React from "react";
import { ArrowDownTrayIcon, CheckIcon, ClockIcon, CurrencyDollarIcon, PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";

import { KpiCard } from "@/components/shared/kpi-card";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { ChartCard, SimpleBarChart } from "@/components/charts/charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePagination } from "@/hooks/use-pagination";
import { useAppStore } from "@/lib/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { initials } from "@/lib/data/students";
import { MONTHS } from "@/lib/data/academics";
import { TODAY } from "@/lib/data/seed";
import { USERS, courseByCode, userById } from "@/lib/data/users";
import { formatCurrency, formatDate, formatMonth } from "@/lib/utils/format";
import { ExportPreviewDialog, type ExportSpec } from "@/components/shared/export-preview-dialog";
import { CardField, CardFields, CardGrid, RecordCard, ViewToggle, useViewMode } from "@/components/shared/view-toggle";
import type { OvertimeReport } from "@/lib/data/types";

const INSTRUCTORS = USERS.filter((u) => u.role === "INSTRUCTOR");

const STATUS_LABEL: Record<OvertimeReport["status"], string> = { submitted: "Submitted", approved: "Approved", rejected: "Rejected" };

function StatusBadge({ status }: { status: OvertimeReport["status"] }) {
  const variant = status === "approved" ? "success" : status === "rejected" ? "danger" : "warning";
  return <Badge variant={variant}>{STATUS_LABEL[status]}</Badge>;
}

/** Admin view of instructor-taught extra classes (overtime): approval, hourly pay rate and per-instructor totals. */
export function InstructorExtraClassSection() {
  const { overtimeReports, setOvertimeStatus, instructorExtraRate, setInstructorExtraRate, pushNotification } = useAppStore();
  const { toast } = useToast();
  const [query, setQuery] = React.useState("");
  const [instructor, setInstructor] = React.useState("all");
  const [month, setMonth] = React.useState("all");
  const [status, setStatus] = React.useState<"all" | OvertimeReport["status"]>("all");
  const [rateOpen, setRateOpen] = React.useState(false);
  const [rateInput, setRateInput] = React.useState(String(instructorExtraRate));
  const [exportOpen, setExportOpen] = React.useState(false);
  const [view, setView] = useViewMode("extra-class-instructors");

  const pay = React.useCallback((hours: number) => Math.round(hours * instructorExtraRate * 100) / 100, [instructorExtraRate]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return overtimeReports.filter((r) => {
      const u = userById(r.instructorId);
      if (!u) return false;
      if (q && !u.name.toLowerCase().includes(q) && !r.subject.toLowerCase().includes(q)) return false;
      if (instructor !== "all" && r.instructorId !== instructor) return false;
      if (month !== "all" && !r.date.startsWith(month)) return false;
      if (status !== "all" && r.status !== status) return false;
      return true;
    });
  }, [overtimeReports, query, instructor, month, status]);

  const approvedHours = filtered.filter((r) => r.status === "approved").reduce((a, r) => a + r.hours, 0);
  const pendingCount = filtered.filter((r) => r.status === "submitted").length;
  const pendingHours = filtered.filter((r) => r.status === "submitted").reduce((a, r) => a + r.hours, 0);

  const byInstructor = React.useMemo(() => {
    const map = new Map<string, { hours: number; sessions: number; pending: number; classrooms: Set<string> }>();
    filtered.forEach((r) => {
      const cur = map.get(r.instructorId) ?? { hours: 0, sessions: 0, pending: 0, classrooms: new Set<string>() };
      if (r.status === "approved") cur.hours += r.hours;
      if (r.status === "submitted") cur.pending += 1;
      cur.sessions += 1;
      cur.classrooms.add(r.classroom);
      map.set(r.instructorId, cur);
    });
    return Array.from(map.entries())
      .map(([id, v]) => ({ user: userById(id)!, ...v, pay: pay(v.hours) }))
      .sort((a, b) => b.hours - a.hours);
  }, [filtered, pay]);

  const chart = React.useMemo(
    () =>
      INSTRUCTORS.map((u) => ({
        name: u.name.split(" ").slice(-1)[0],
        value: overtimeReports.filter((r) => r.status === "approved" && r.instructorId === u.id).reduce((a, r) => a + r.hours, 0),
      })),
    [overtimeReports]
  );

  const history = React.useMemo(
    () =>
      MONTHS.map((m) => {
        const rows = overtimeReports.filter((r) => r.status === "approved" && r.date.startsWith(m));
        const hours = rows.reduce((a, r) => a + r.hours, 0);
        return { month: m, sessions: rows.length, hours, instructors: new Set(rows.map((r) => r.instructorId)).size, amount: pay(hours) };
      }).reverse(),
    [overtimeReports, pay]
  );

  const { page, setPage, pageSize, slice, total } = usePagination(filtered, 15);
  React.useEffect(() => setPage(1), [query, instructor, month, status, setPage]);

  const decide = (r: OvertimeReport, next: "approved" | "rejected") => {
    setOvertimeStatus(r.id, next);
    const name = userById(r.instructorId)?.name ?? "Instructor";
    pushNotification({
      type: "overtime-reminder",
      title: next === "approved" ? "Overtime report approved" : "Overtime report rejected",
      message:
        next === "approved"
          ? `Your ${r.hours} h ${r.subject} session on ${formatDate(r.date)} (${r.classroom}) was approved · ${formatCurrency(pay(r.hours))}.`
          : `Your ${r.hours} h ${r.subject} session on ${formatDate(r.date)} (${r.classroom}) was not approved. Contact HRD Admin for details.`,
      roles: ["INSTRUCTOR"],
      link: "/overtime",
      channel: ["in-app", "email"],
    });
    toast({
      title: next === "approved" ? "Session approved" : "Session rejected",
      description: `${name} · ${r.hours} h · ${formatDate(r.date)}`,
      variant: next === "approved" ? "success" : "default",
    });
  };

  const saveRate = () => {
    const n = Number(rateInput);
    if (Number.isNaN(n) || n < 0) return;
    setInstructorExtraRate(n);
    setRateOpen(false);
    toast({ title: "Rate updated", description: `Instructor extra-class pay is now ${formatCurrency(n)} per hour.`, variant: "success" });
  };

  const exportColumns = ["Date", "Instructor", "Course", "Classroom", "Subject", "Hours", "Status", "Pay (USD)"];
  const exportRows = () =>
    filtered.map((r) => {
      const u = userById(r.instructorId);
      return [r.date, u?.name ?? "", u?.course ? courseByCode(u.course).name : "", r.classroom, r.subject, r.hours, STATUS_LABEL[r.status], r.status === "approved" ? pay(r.hours) : 0];
    });

  const scopeLabel = [
    instructor === "all" ? "All instructors" : userById(instructor)?.name,
    month === "all" ? "All months" : formatMonth(month),
    status === "all" ? null : STATUS_LABEL[status],
  ]
    .filter(Boolean)
    .join(" · ");

  const buildExport = (): ExportSpec => {
    const raw = exportRows();
    return {
      filename: `extra-class-instructors${month === "all" ? "" : `_${month}`}`,
      columns: exportColumns,
      rows: raw,
      numericFrom: 5,
      formats: ["csv", "pdf"],
      summary: [
        { label: "Approved hours", value: `${approvedHours} h` },
        { label: "Pay payable", value: formatCurrency(pay(approvedHours)) },
        { label: "Awaiting approval", value: `${pendingCount} · ${pendingHours} h` },
        { label: "Instructors", value: byInstructor.length },
      ],
      pdf: {
        title: `Instructor extra-class report${month === "all" ? "" : ` · ${formatMonth(month)}`}`,
        subtitle: [`${scopeLabel} · ${filtered.length} sessions`, `Generated ${formatDate(TODAY)} · rate ${formatCurrency(instructorExtraRate)}/h`],
        rows: raw.map((r) => r.map((v, i) => (i === 7 ? (typeof v === "number" && v ? formatCurrency(v) : "—") : v))),
        footer: ["", `Total (${filtered.length} sessions)`, "", "", "", approvedHours, "approved", formatCurrency(pay(approvedHours))],
        note: "Pay is calculated only for approved sessions. Submitted sessions are listed for reference and excluded from totals.",
      },
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          Sessions taught by instructors outside regular hours. Approved hours are paid at <span className="text-foreground font-medium">{formatCurrency(instructorExtraRate)}/h</span>.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => { setRateInput(String(instructorExtraRate)); setRateOpen(true); }}>
            <PencilSquareIcon /> Rate: {formatCurrency(instructorExtraRate)}/h
          </Button>
          <Button variant="outline" onClick={() => setExportOpen(true)}><ArrowDownTrayIcon /> Export</Button>
          <ExportPreviewDialog open={exportOpen} onOpenChange={setExportOpen} build={buildExport} title="Export instructor extra classes" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Approved hours" value={`${approvedHours} h`} hint={`${filtered.length} sessions in selection`} icon={<ClockIcon />} tone="primary" />
        <KpiCard label="Pay payable" value={formatCurrency(pay(approvedHours))} hint={`at ${formatCurrency(instructorExtraRate)}/h`} icon={<CurrencyDollarIcon />} tone="success" />
        <KpiCard label="Awaiting approval" value={pendingCount} hint={pendingCount ? `${pendingHours} h · ${formatCurrency(pay(pendingHours))} if approved` : "all sessions reviewed"} tone={pendingCount ? "warning" : "default"} />
        <KpiCard label="Instructors" value={byInstructor.length} hint={`of ${INSTRUCTORS.length} with extra classes`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.8fr]">
        <ChartCard title="Hours by instructor" description="Approved extra-class hours this term">
          <SimpleBarChart data={chart} height={200} />
        </ChartCard>
        <div className="bg-card rounded-xl border shadow-sm">
          <Tabs defaultValue="records">
            <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
              <TabsList>
                <TabsTrigger value="records">Records</TabsTrigger>
                <TabsTrigger value="instructors">By instructor</TabsTrigger>
                <TabsTrigger value="history">Monthly history</TabsTrigger>
              </TabsList>
              <div className="flex flex-wrap items-center gap-2">
                <SearchInput value={query} onChange={setQuery} placeholder="Instructor or subject…" className="w-48" />
                <Select value={instructor} onValueChange={setInstructor}>
                  <SelectTrigger size="sm" className="bg-card w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All instructors</SelectItem>
                    {INSTRUCTORS.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger size="sm" className="bg-card w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All months</SelectItem>
                    {[...MONTHS].reverse().map((m) => <SelectItem key={m} value={m}>{formatMonth(m)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                  <SelectTrigger size="sm" className="bg-card w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <ViewToggle value={view} onChange={setView} />
              </div>
            </div>

            <TabsContent value="records">
              {slice.length === 0 ? (
                <EmptyState title="No instructor extra-class reports" description="Instructors submit their sessions from the Overtime Reports page." />
              ) : view === "grid" ? (
                <CardGrid>
                  {slice.map((r) => {
                    const u = userById(r.instructorId)!;
                    return (
                      <RecordCard
                        key={r.id}
                        title={u.name}
                        subtitle={`${u.course ? courseByCode(u.course).name : u.title} · ${formatDate(r.date)}`}
                        leading={
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials(u.name)}</AvatarFallback>
                          </Avatar>
                        }
                        trailing={
                          r.status === "submitted" ? (
                            <>
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => decide(r, "approved")}>
                                <CheckIcon /> Approve
                              </Button>
                              <Button size="icon-sm" variant="ghost" className="text-destructive h-7" aria-label="Reject session" onClick={() => decide(r, "rejected")}>
                                <XMarkIcon />
                              </Button>
                            </>
                          ) : (
                            <StatusBadge status={r.status} />
                          )
                        }
                        footer={
                          <>
                            <span className="text-muted-foreground text-xs">{r.classroom}</span>
                            <span className="font-medium tabular-nums">{r.status === "approved" ? formatCurrency(pay(r.hours)) : "—"}</span>
                          </>
                        }
                      >
                        <CardFields columns={3}>
                          <CardField label="Subject" className="col-span-2">
                            {r.subject}
                            {r.notes && <span className="text-muted-foreground block truncate text-xs">{r.notes}</span>}
                          </CardField>
                          <CardField label="Hours" align="right">{r.hours} h</CardField>
                        </CardFields>
                      </RecordCard>
                    );
                  })}
                </CardGrid>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Classroom</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Pay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slice.map((r) => {
                      const u = userById(r.instructorId)!;
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="whitespace-nowrap">{formatDate(r.date)}</TableCell>
                          <TableCell>
                            <p className="font-medium">{u.name}</p>
                            <p className="text-muted-foreground text-xs">{u.course ? courseByCode(u.course).name : u.title}</p>
                          </TableCell>
                          <TableCell>{r.classroom}</TableCell>
                          <TableCell>
                            <p>{r.subject}</p>
                            {r.notes && <p className="text-muted-foreground text-xs">{r.notes}</p>}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{r.hours}</TableCell>
                          <TableCell>
                            {r.status === "submitted" ? (
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => decide(r, "approved")}>
                                  <CheckIcon /> Approve
                                </Button>
                                <Button size="icon-sm" variant="ghost" className="text-destructive h-7" aria-label="Reject session" onClick={() => decide(r, "rejected")}>
                                  <XMarkIcon />
                                </Button>
                              </div>
                            ) : (
                              <StatusBadge status={r.status} />
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{r.status === "approved" ? formatCurrency(pay(r.hours)) : "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
              <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
            </TabsContent>

            <TabsContent value="instructors">
              {byInstructor.length === 0 ? (
                <EmptyState title="No instructors in this selection" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Classrooms</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right">Approved hours</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead className="text-right">Pay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {byInstructor.map((r) => (
                      <TableRow key={r.user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="size-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials(r.user.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{r.user.name}</p>
                              <p className="text-muted-foreground text-xs">{r.user.title}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{Array.from(r.classrooms).sort().join(", ")}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.sessions}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.hours}</TableCell>
                        <TableCell className="text-right tabular-nums">{r.pending || "—"}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{formatCurrency(r.pay)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="history">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Instructors</TableHead>
                    <TableHead className="text-right">Sessions</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Total pay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h.month}>
                      <TableCell className="font-medium">{formatMonth(h.month)}</TableCell>
                      <TableCell className="text-right tabular-nums">{h.instructors}</TableCell>
                      <TableCell className="text-right tabular-nums">{h.sessions}</TableCell>
                      <TableCell className="text-right tabular-nums">{h.hours}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(instructorExtraRate)}/h</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatCurrency(h.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={rateOpen} onOpenChange={setRateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Instructor extra-class rate</DialogTitle>
            <DialogDescription>Paid for every approved hour an instructor teaches outside regular class time. Independent of the student allowance rate.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="instructor-rate">USD per hour</Label>
            <Input id="instructor-rate" type="number" min={0} step={0.5} value={rateInput} onChange={(e) => setRateInput(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRateOpen(false)}>Cancel</Button>
            <Button onClick={saveRate}>Save rate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
