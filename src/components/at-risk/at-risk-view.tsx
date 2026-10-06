"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDownIcon, EnvelopeIcon, SparklesIcon } from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { EmptyState } from "@/components/shared/empty-state";
import { RiskBadge } from "@/components/shared/status-badge";
import { ChartCard, DonutChart } from "@/components/charts/charts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/hooks/use-toast";
import { RISK_ASSESSMENTS } from "@/lib/data/academics";
import { STUDENTS, initials } from "@/lib/data/students";
import { courseByCode } from "@/lib/data/users";
import type { RiskAssessment, RiskLevel } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export function AtRiskView() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [level, setLevel] = React.useState<"all" | RiskLevel>("all");
  const [open, setOpen] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<{ r: RiskAssessment; subject: string; body: string } | null>(null);

  const list = React.useMemo(
    () => [...RISK_ASSESSMENTS].sort((a, b) => b.score - a.score).filter((r) => level === "all" || r.level === level),
    [level]
  );
  const counts = {
    High: RISK_ASSESSMENTS.filter((r) => r.level === "High").length,
    Medium: RISK_ASSESSMENTS.filter((r) => r.level === "Medium").length,
    Low: RISK_ASSESSMENTS.filter((r) => r.level === "Low").length,
  };

  const openDraft = (r: RiskAssessment) => {
    const s = STUDENTS.find((x) => x.id === r.studentId)!;
    setDraft({
      r,
      subject: `Academic warning – ${s.name} (${s.classroom})`,
      body: `Dear ${s.name},\n\nThis is a formal notice from the HRD office regarding your current standing in the ${courseByCode(s.courseCode).name} programme.\n\n${r.reasons.map((x) => `• ${x}`).join("\n")}\n\nRecommended next steps:\n${r.suggestions.map((x) => `• ${x}`).join("\n")}\n\nPlease arrange a meeting with your instructor within the next 5 working days.\n\nKind regards,\nHRD Administration`,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="At-risk student tracking"
        description="Students automatically identified from low attendance and declining academic performance, with AI alerts and suggested support actions."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1.2fr]">
        <KpiCard label="High risk" value={counts.High} hint="immediate attention" tone="danger" />
        <KpiCard label="Medium risk" value={counts.Medium} hint="warning signs" tone="warning" />
        <KpiCard label="Low risk" value={counts.Low} hint="monitor" tone="primary" />
        <ChartCard title="Risk distribution" className="row-span-1">
          <DonutChart
            data={[
              { name: "High", value: counts.High },
              { name: "Medium", value: counts.Medium },
              { name: "Low", value: counts.Low },
            ]}
            height={150}
          />
        </ChartCard>
      </div>

      <div className="flex items-center justify-between">
        <Tabs value={level} onValueChange={(v) => setLevel(v as typeof level)}>
          <TabsList>
            <TabsTrigger value="all">All ({RISK_ASSESSMENTS.length})</TabsTrigger>
            <TabsTrigger value="High">High</TabsTrigger>
            <TabsTrigger value="Medium">Medium</TabsTrigger>
            <TabsTrigger value="Low">Low</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-muted-foreground hidden text-xs sm:block">Risk indicators: attendance &lt; 85%, average &lt; 65, trend ≤ −6 points, ≥ 10 late arrivals</p>
      </div>

      {list.length === 0 ? (
        <EmptyState title="No students in this category" />
      ) : (
        <div className="grid gap-4">
          {list.map((r) => {
            const s = STUDENTS.find((x) => x.id === r.studentId)!;
            const expanded = open === r.studentId;
            return (
              <div key={r.studentId} className={cn("bg-card rounded-xl border shadow-sm", r.level === "High" && "border-destructive/40")}>
                <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar className="size-10">
                      <AvatarFallback className="bg-primary/10 text-primary">{initials(s.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/students/${s.id}`} className="truncate font-medium hover:underline">{s.name}</Link>
                        <RiskBadge level={r.level} />
                      </div>
                      <p className="text-muted-foreground text-xs">{s.classroom} · {courseByCode(s.courseCode).name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm lg:w-[420px]">
                    <div>
                      <p className="text-muted-foreground text-xs">Attendance</p>
                      <div className="flex items-center gap-2">
                        <Progress value={r.stats.attendanceRate} className="w-16" indicatorClassName={r.stats.attendanceRate < 75 ? "bg-destructive" : r.stats.attendanceRate < 85 ? "bg-warning" : "bg-success"} />
                        <span className="tabular-nums">{r.stats.attendanceRate}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Average score</p>
                      <p className="tabular-nums">{r.stats.averageScore}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Trend</p>
                      <p className={cn("tabular-nums", r.stats.trend < 0 ? "text-destructive" : "")}>{r.stats.trend > 0 ? "+" : ""}{r.stats.trend} pts</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <Button variant="outline" size="sm" onClick={() => openDraft(r)}>
                        <EnvelopeIcon /> Draft warning
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setOpen(expanded ? null : r.studentId)}>
                      AI insight <ChevronDownIcon className={cn("transition-transform", expanded && "rotate-180")} />
                    </Button>
                  </div>
                </div>
                {expanded && (
                  <div className="grid gap-4 border-t p-4 md:grid-cols-2">
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"><SparklesIcon className="text-primary size-4" /> AI alert</p>
                      <p className="mt-1 text-sm">{r.alert}</p>
                      <ul className="text-muted-foreground mt-2 list-inside list-disc text-xs">
                        {r.reasons.map((x) => <li key={x}>{x}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide">Suggested support actions</p>
                      <ul className="mt-1 space-y-1.5 text-sm">
                        {r.suggestions.map((x) => <li key={x} className="flex gap-2"><span className="text-primary">→</span>{x}</li>)}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>AI-drafted warning email</DialogTitle>
            <DialogDescription>Generated by the At-Risk Agent. Review and edit before sending.</DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>To</Label>
                <Input value={STUDENTS.find((x) => x.id === draft.r.studentId)?.email ?? ""} readOnly />
              </div>
              <div className="grid gap-1.5">
                <Label>Subject</Label>
                <Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Message</Label>
                <Textarea rows={12} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className="font-mono text-xs" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
            <Button
              onClick={() => {
                toast({ title: "Warning email sent", description: "A copy was stored in the student record.", variant: "success" });
                setDraft(null);
              }}
            >
              <EnvelopeIcon /> Send email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
