"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDownTrayIcon, CheckIcon, ClockIcon, CurrencyDollarIcon, PencilSquareIcon } from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { ChartCard, SimpleBarChart } from "@/components/charts/charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePagination } from "@/hooks/use-pagination";
import { useAppStore } from "@/lib/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { STUDENTS, CLASSROOMS } from "@/lib/data/students";
import { MONTHS } from "@/lib/data/academics";
import { userById } from "@/lib/data/users";
import { formatCurrency, formatDate, formatMonth } from "@/lib/utils/format";
import { exportCsv } from "@/lib/utils/export";

export function ExtraClassView() {
  const { extraClasses, setExtraClassStatus, allowanceTypes, updateAllowanceType } = useAppStore();
  const { toast } = useToast();
  const [query, setQuery] = React.useState("");
  const [classroom, setClassroom] = React.useState("all");
  const [month, setMonth] = React.useState("all");
  const [rateOpen, setRateOpen] = React.useState(false);
  const rateType = allowanceTypes.find((t) => t.key === "extra")!;
  const [rateInput, setRateInput] = React.useState(String(rateType.amount));

  const studentMap = React.useMemo(() => new Map(STUDENTS.map((s) => [s.id, s])), []);
  const activeClassrooms = CLASSROOMS.filter((c) => c.includes("13"));

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return extraClasses.filter((e) => {
      const s = studentMap.get(e.studentId);
      if (!s) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      if (classroom !== "all" && s.classroom !== classroom) return false;
      if (month !== "all" && !e.date.startsWith(month)) return false;
      return true;
    });
  }, [extraClasses, query, classroom, month, studentMap]);

  const approvedHours = filtered.filter((e) => e.status === "approved").reduce((a, e) => a + e.hours, 0);
  const pending = filtered.filter((e) => e.status === "pending").length;

  const byStudent = React.useMemo(() => {
    const map = new Map<string, { hours: number; sessions: number; pending: number }>();
    filtered.forEach((e) => {
      const cur = map.get(e.studentId) ?? { hours: 0, sessions: 0, pending: 0 };
      if (e.status === "approved") cur.hours += e.hours;
      else cur.pending += 1;
      cur.sessions += 1;
      map.set(e.studentId, cur);
    });
    return Array.from(map.entries())
      .map(([id, v]) => ({ student: studentMap.get(id)!, ...v, allowance: Math.round(v.hours * rateType.amount * 100) / 100 }))
      .sort((a, b) => b.hours - a.hours);
  }, [filtered, studentMap, rateType.amount]);

  const byClass = React.useMemo(
    () => activeClassrooms.map((c) => ({ name: c, value: extraClasses.filter((e) => e.status === "approved" && studentMap.get(e.studentId)?.classroom === c).reduce((a, e) => a + e.hours, 0) })),
    [extraClasses, activeClassrooms, studentMap]
  );

  const history = React.useMemo(
    () =>
      MONTHS.map((m) => {
        const rows = extraClasses.filter((e) => e.status === "approved" && e.date.startsWith(m));
        const hours = rows.reduce((a, e) => a + e.hours, 0);
        return { month: m, sessions: rows.length, hours, students: new Set(rows.map((r) => r.studentId)).size, amount: Math.round(hours * rateType.amount * 100) / 100 };
      }).reverse(),
    [extraClasses, rateType.amount]
  );

  const { page, setPage, pageSize, slice, total } = usePagination(filtered, 15);
  React.useEffect(() => setPage(1), [query, classroom, month, setPage]);

  const saveRate = () => {
    const n = Number(rateInput);
    if (Number.isNaN(n) || n < 0) return;
    updateAllowanceType(rateType.id, { amount: n });
    setRateOpen(false);
    toast({ title: "Rate updated", description: `Extra-class allowance is now ${formatCurrency(n)} per hour.`, variant: "success" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Extra-class & allowance management"
        description="Track extra-class hours per student, approve sessions and calculate the hourly allowance automatically."
        actions={
          <>
            <Button variant="outline" onClick={() => { setRateInput(String(rateType.amount)); setRateOpen(true); }}>
              <PencilSquareIcon /> Rate: {formatCurrency(rateType.amount)}/h
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                exportCsv("extra-class-records", ["Date", "Student", "Class", "Subject", "Hours", "Instructor", "Status", "Allowance"], filtered.map((e) => {
                  const s = studentMap.get(e.studentId)!;
                  return [e.date, s.name, s.classroom, e.subject, e.hours, userById(e.instructorId)?.name ?? "", e.status, e.status === "approved" ? e.hours * rateType.amount : 0];
                }))
              }
            >
              <ArrowDownTrayIcon /> Export CSV
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Approved hours" value={`${approvedHours} h`} hint={`${filtered.length} sessions`} icon={<ClockIcon />} tone="primary" />
        <KpiCard label="Allowance payable" value={formatCurrency(approvedHours * rateType.amount)} hint={`at ${formatCurrency(rateType.amount)}/h`} icon={<CurrencyDollarIcon />} tone="success" />
        <KpiCard label="Pending approval" value={pending} hint="sessions awaiting review" tone={pending ? "warning" : "default"} />
        <KpiCard label="Students with extra class" value={byStudent.length} hint="in current selection" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.8fr]">
        <ChartCard title="Hours by classroom" description="Approved extra-class hours this term">
          <SimpleBarChart data={byClass} height={200} />
        </ChartCard>
        <div className="bg-card rounded-xl border shadow-sm">
          <Tabs defaultValue="records">
            <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
              <TabsList>
                <TabsTrigger value="records">Records</TabsTrigger>
                <TabsTrigger value="students">By student</TabsTrigger>
                <TabsTrigger value="history">Monthly history</TabsTrigger>
              </TabsList>
              <div className="flex flex-wrap items-center gap-2">
                <SearchInput value={query} onChange={setQuery} placeholder="Student…" className="w-44" />
                <Select value={classroom} onValueChange={setClassroom}>
                  <SelectTrigger size="sm" className="bg-card w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All classes</SelectItem>
                    {activeClassrooms.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger size="sm" className="bg-card w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All months</SelectItem>
                    {[...MONTHS].reverse().map((m) => <SelectItem key={m} value={m}>{formatMonth(m)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="records">
              {slice.length === 0 ? (
                <EmptyState title="No extra-class records" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Allowance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slice.map((e) => {
                      const s = studentMap.get(e.studentId)!;
                      return (
                        <TableRow key={e.id}>
                          <TableCell>{formatDate(e.date)}</TableCell>
                          <TableCell>
                            <Link href={`/students/${s.id}`} className="font-medium hover:underline">{s.name}</Link>
                            <p className="text-muted-foreground text-xs">{s.classroom}</p>
                          </TableCell>
                          <TableCell>{e.subject}</TableCell>
                          <TableCell className="text-right tabular-nums">{e.hours}</TableCell>
                          <TableCell className="text-xs">{userById(e.instructorId)?.name}</TableCell>
                          <TableCell>
                            {e.status === "approved" ? (
                              <Badge variant="success">Approved</Badge>
                            ) : (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setExtraClassStatus(e.id, "approved"); toast({ title: "Session approved", variant: "success" }); }}>
                                <CheckIcon /> Approve
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{e.status === "approved" ? formatCurrency(e.hours * rateType.amount) : "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
              <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
            </TabsContent>

            <TabsContent value="students">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Sessions</TableHead>
                    <TableHead className="text-right">Approved hours</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Allowance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byStudent.map((r) => (
                    <TableRow key={r.student.id}>
                      <TableCell><Link href={`/students/${r.student.id}`} className="font-medium hover:underline">{r.student.name}</Link></TableCell>
                      <TableCell>{r.student.classroom}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.sessions}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.hours}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.pending || "—"}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatCurrency(r.allowance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="history">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Students</TableHead>
                    <TableHead className="text-right">Sessions</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Total allowance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h.month}>
                      <TableCell className="font-medium">{formatMonth(h.month)}</TableCell>
                      <TableCell className="text-right tabular-nums">{h.students}</TableCell>
                      <TableCell className="text-right tabular-nums">{h.sessions}</TableCell>
                      <TableCell className="text-right tabular-nums">{h.hours}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(rateType.amount)}/h</TableCell>
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
            <DialogTitle>Extra-class allowance rate</DialogTitle>
            <DialogDescription>Applied to every approved extra-class hour. Changes recalculate all monthly allowances.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="rate">USD per hour</Label>
            <Input id="rate" type="number" min={0} step={0.5} value={rateInput} onChange={(e) => setRateInput(e.target.value)} />
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
