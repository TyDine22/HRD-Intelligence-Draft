"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDownTrayIcon, BanknotesIcon, PencilSquareIcon, PlusIcon, TrashIcon, TrophyIcon } from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/lib/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { STUDENTS, CLASSROOMS } from "@/lib/data/students";
import { ALLOWANCE_MONTHS, allowanceColumns, challengeAppliesTo, computeMonthlyAllowance } from "@/lib/data/allowances";
import { CodingChallengePanel } from "./coding-challenge-panel";
import { formatCurrency, formatMonth } from "@/lib/utils/format";
import { exportCsv, exportExcel } from "@/lib/utils/export";
import type { AllowanceRange, AllowanceType } from "@/lib/data/types";

const BASIS_LABEL: Record<AllowanceType["basis"], string> = {
  fixed: "Fixed monthly",
  "per-hour": "Per extra-class hour",
  "score-range": "Score tiers",
  "attendance-range": "Attendance tiers",
  role: "Role-based",
};

export function AllowancesView() {
  const { allowanceTypes, updateAllowanceType, challenge, updateChallenge } = useAppStore();
  const [tab, setTab] = React.useState("monthly");
  const { toast } = useToast();
  const [month, setMonth] = React.useState("2026-09");
  const [classroom, setClassroom] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const [editing, setEditing] = React.useState<AllowanceType | null>(null);
  const [draft, setDraft] = React.useState<{ amount: string; ranges: { min: string; amount: string }[] }>({ amount: "0", ranges: [] });

  const activeClassrooms = CLASSROOMS.filter((c) => c.includes("13"));
  const enabledTypes = allowanceTypes.filter((t) => t.enabled);
  const columns = React.useMemo(() => allowanceColumns(allowanceTypes, month, challenge), [allowanceTypes, month, challenge]);
  const challengeActive = challengeAppliesTo(challenge, month);

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return STUDENTS.filter((s) => s.status === "active" && (classroom === "all" || s.classroom === classroom) && (!q || s.name.toLowerCase().includes(q)))
      .map((s) => ({ student: s, allowance: computeMonthlyAllowance(s, month, allowanceTypes, challenge) }))
      .sort((a, b) => b.allowance.total - a.allowance.total);
  }, [month, classroom, query, allowanceTypes, challenge]);

  const grandTotal = rows.reduce((a, r) => a + r.allowance.total, 0);
  const avg = rows.length ? grandTotal / rows.length : 0;
  const byType = columns.map((t) => ({ t, total: rows.reduce((a, r) => a + (r.allowance.lines.find((l) => l.typeId === t.id)?.amount ?? 0), 0) }));
  const largest = [...byType].sort((a, b) => b.total - a.total)[0];

  const exportColumns = ["Student ID", "Name", "Class", "Attendance %", "Extra hours", ...columns.map((t) => t.name), "Total (USD)"];
  const exportRows = () => rows.map((r) => [r.student.id, r.student.name, r.student.classroom, r.allowance.attendanceRate, r.allowance.extraHours, ...r.allowance.lines.map((l) => l.amount), r.allowance.total]);

  const openEdit = (t: AllowanceType) => {
    setEditing(t);
    setDraft({ amount: String(t.amount), ranges: (t.ranges ?? []).map((r) => ({ min: String(r.min), amount: String(r.amount) })) });
  };
  const saveEdit = () => {
    if (!editing) return;
    const ranges: AllowanceRange[] | undefined = editing.ranges
      ? draft.ranges.filter((r) => r.min !== "" && r.amount !== "").map((r) => ({ min: Number(r.min), amount: Number(r.amount) })).sort((a, b) => b.min - a.min)
      : undefined;
    updateAllowanceType(editing.id, { amount: Number(draft.amount) || 0, ranges });
    toast({ title: "Allowance rule updated", description: `${editing.name} will use the new amounts from the next calculation.`, variant: "success" });
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monthly allowance management"
        description="Manage allowance types, score-based ranges and rates. Each student's total is calculated automatically every month."
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline"><ArrowDownTrayIcon /> Export report</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => exportCsv(`allowances_${month}`, exportColumns, exportRows())}>Download CSV</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => exportExcel(`allowances_${month}`, exportColumns, exportRows(), formatMonth(month))}>Download Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={`Total · ${formatMonth(month)}`} value={formatCurrency(Math.round(grandTotal))} hint={`${rows.length} active students`} icon={<BanknotesIcon />} tone="primary" />
        <KpiCard label="Average per student" value={formatCurrency(Math.round(avg))} hint="all enabled allowance types" tone="success" />
        <KpiCard label="Largest component" value={largest?.t.name ?? "—"} hint={largest ? formatCurrency(Math.round(largest.total)) : ""} />
        <KpiCard label="Allowance types enabled" value={`${enabledTypes.length} / ${allowanceTypes.length}`} hint={challenge.enabled ? `+ coding challenge (${formatMonth(challenge.payoutMonth)})` : "coding challenge inactive"} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="monthly">Monthly allowances</TabsTrigger>
          <TabsTrigger value="rules">Allowance types & rules</TabsTrigger>
          <TabsTrigger value="challenge">
            <TrophyIcon /> Coding challenge
            {challenge.enabled && <Badge variant="success" className="ml-1 h-4 px-1.5 text-[10px]">On</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="pt-2">
          <div className="bg-card rounded-xl border shadow-sm">
            <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
              <SearchInput value={query} onChange={setQuery} placeholder="Search student…" className="lg:w-64" />
              <div className="flex flex-wrap gap-2">
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger size="sm" className="bg-card w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[...ALLOWANCE_MONTHS].reverse().map((m) => <SelectItem key={m} value={m}>{formatMonth(m)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={classroom} onValueChange={setClassroom}>
                  <SelectTrigger size="sm" className="bg-card w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All classes</SelectItem>
                    {activeClassrooms.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {challengeActive && (
              <p className="bg-warning/15 flex items-center gap-2 border-b px-4 py-2 text-xs">
                <TrophyIcon className="size-4" /> {challenge.name} prizes are included in this month. Winning teams are highlighted in the “Coding challenge reward” column.
              </p>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-right">Att. %</TableHead>
                  {columns.map((t) => <TableHead key={t.id} className="text-right">{t.name.replace(" allowance", "")}</TableHead>)}
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.student.id}>
                    <TableCell>
                      <Link href={`/students/${r.student.id}`} className="font-medium hover:underline">{r.student.name}</Link>
                      {r.student.isClassLeader && <Badge variant="secondary" className="ml-2">Leader</Badge>}
                    </TableCell>
                    <TableCell>{r.student.classroom}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.allowance.attendanceRate}%</TableCell>
                    {r.allowance.lines.map((l) => (
                      <TableCell key={l.typeId} className="text-right tabular-nums" title={l.note}>{l.amount ? formatCurrency(l.amount) : <span className="text-muted-foreground">—</span>}</TableCell>
                    ))}
                    <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(r.allowance.total)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/40 font-semibold">
                  <TableCell colSpan={3}>Total ({rows.length} students)</TableCell>
                  {byType.map((b) => <TableCell key={b.t.id} className="text-right tabular-nums">{formatCurrency(Math.round(b.total))}</TableCell>)}
                  <TableCell className="text-right tabular-nums">{formatCurrency(Math.round(grandTotal))}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="pt-2">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {allowanceTypes.map((t) => (
              <div key={t.id} className={`bg-card flex flex-col rounded-xl border p-4 shadow-sm ${!t.enabled ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-muted-foreground text-xs">{BASIS_LABEL[t.basis]}</p>
                  </div>
                  <Switch checked={t.enabled} onCheckedChange={(v) => updateAllowanceType(t.id, { enabled: v })} aria-label={`Enable ${t.name}`} />
                </div>
                <p className="text-muted-foreground mt-2 text-sm">{t.description}</p>
                <div className="mt-3 flex-1 text-sm">
                  {t.ranges ? (
                    <ul className="space-y-1">
                      {[...t.ranges].sort((a, b) => b.min - a.min).map((r) => (
                        <li key={r.min} className="flex items-center justify-between rounded-md bg-muted/50 px-2 py-1">
                          <span>{t.basis === "attendance-range" ? `Attendance ≥ ${r.min}%` : `Score ≥ ${r.min}`}</span>
                          <span className="font-medium tabular-nums">{formatCurrency(r.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-2xl font-semibold tabular-nums">
                      {formatCurrency(t.amount)}
                      <span className="text-muted-foreground text-sm font-normal">{t.basis === "per-hour" ? " / hour" : " / month"}</span>
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" className="mt-4 self-start" onClick={() => openEdit(t)}>
                  <PencilSquareIcon /> Edit rule
                </Button>
              </div>
            ))}
            <div className={`bg-card border-warning/50 flex flex-col rounded-xl border border-dashed p-4 shadow-sm ${!challenge.enabled ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="flex items-center gap-1.5 font-medium"><TrophyIcon className="size-4" /> Coding challenge reward</p>
                  <p className="text-muted-foreground text-xs">One-off · team prize · {formatMonth(challenge.payoutMonth)}</p>
                </div>
                <Switch checked={challenge.enabled} onCheckedChange={(v) => updateChallenge({ enabled: v })} aria-label="Enable coding challenge reward" />
              </div>
              <p className="text-muted-foreground mt-2 text-sm">Prize for the top 3 teams of the one-day coding challenge held once in the Basic course before the final project.</p>
              <ul className="mt-3 flex-1 space-y-1 text-sm">
                {challenge.rewards.map((r) => (
                  <li key={r.place} className="flex items-center justify-between rounded-md bg-muted/50 px-2 py-1">
                    <span>Top {r.place} team</span>
                    <span className="font-medium tabular-nums">{formatCurrency(r.amount)}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" size="sm" className="mt-4 self-start" onClick={() => setTab("challenge")}>
                <PencilSquareIcon /> Manage challenge
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="challenge" className="pt-2">
          <CodingChallengePanel />
        </TabsContent>
      </Tabs>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit · {editing?.name}</DialogTitle>
            <DialogDescription>Update amounts when HRD policies change. Totals recalculate immediately.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4">
              {editing.ranges ? (
                <div className="grid gap-2">
                  <Label>{editing.basis === "attendance-range" ? "Attendance tiers (%)" : "Score tiers"}</Label>
                  {draft.ranges.map((r, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                      <Input type="number" placeholder="≥ min" value={r.min} onChange={(e) => setDraft({ ...draft, ranges: draft.ranges.map((x, j) => (j === i ? { ...x, min: e.target.value } : x)) })} />
                      <Input type="number" placeholder="USD" value={r.amount} onChange={(e) => setDraft({ ...draft, ranges: draft.ranges.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)) })} />
                      <Button variant="ghost" size="icon-sm" onClick={() => setDraft({ ...draft, ranges: draft.ranges.filter((_, j) => j !== i) })} aria-label="Remove tier"><TrashIcon /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-fit" onClick={() => setDraft({ ...draft, ranges: [...draft.ranges, { min: "", amount: "" }] })}>
                    <PlusIcon /> Add tier
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount (USD{editing.basis === "per-hour" ? " per hour" : " per month"})</Label>
                  <Input id="amount" type="number" min={0} step={0.5} value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}