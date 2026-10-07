"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BellAlertIcon, ClockIcon, CurrencyDollarIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CardField, CardFields, CardGrid, RecordCard, ViewToggle, useViewMode } from "@/components/shared/view-toggle";
import { useAuth } from "@/lib/auth/auth-context";
import { useAppStore } from "@/lib/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { CLASSROOMS } from "@/lib/data/students";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { overtimeReportSchema, type OvertimeReportValues } from "@/lib/validation/schemas";
import { TODAY } from "@/lib/data/seed";

export function OvertimeView() {
  const { user } = useAuth();
  const { overtimeReports, addOvertimeReport, notifications, instructorExtraRate } = useAppStore();
  const { toast } = useToast();
  const mine = overtimeReports.filter((r) => r.instructorId === user?.id);
  const reminders = notifications.filter((n) => n.type === "overtime-reminder");
  const [view, setView] = useViewMode("overtime-reports");

  const form = useForm<OvertimeReportValues>({
    resolver: zodResolver(overtimeReportSchema),
    defaultValues: { date: TODAY, classroom: "", hours: "2", subject: "", notes: "" },
  });

  const onSubmit = (v: OvertimeReportValues) => {
    addOvertimeReport({ instructorId: user?.id ?? "", date: v.date, classroom: v.classroom, hours: Number(v.hours), subject: v.subject, notes: v.notes });
    form.reset({ date: TODAY, classroom: "", hours: "2", subject: "", notes: "" });
    toast({ title: "Overtime report submitted", description: "HRD Admin will review and approve the hours.", variant: "success" });
  };

  const totalHours = mine.reduce((a, r) => a + r.hours, 0);
  const approvedHours = mine.filter((r) => r.status === "approved").reduce((a, r) => a + r.hours, 0);
  const pendingHours = mine.filter((r) => r.status === "submitted").reduce((a, r) => a + r.hours, 0);
  const pay = (h: number) => Math.round(h * instructorExtraRate * 100) / 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overtime & extra-class reports"
        description={`Submit the extra-class sessions you taught and review reminders for your standby days. Approved hours are paid at ${formatCurrency(instructorExtraRate)}/h.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Reported hours" value={`${totalHours} h`} hint={`${approvedHours} h approved this term`} icon={<ClockIcon />} tone="primary" />
        <KpiCard label="Approved pay" value={formatCurrency(pay(approvedHours))} hint={`at ${formatCurrency(instructorExtraRate)}/h`} icon={<CurrencyDollarIcon />} tone="success" />
        <KpiCard
          label="Awaiting approval"
          value={mine.filter((r) => r.status === "submitted").length}
          hint={pendingHours ? `${pendingHours} h · ${formatCurrency(pay(pendingHours))} if approved` : "all sessions reviewed"}
          tone={pendingHours ? "warning" : "default"}
        />
        <KpiCard label="Standby days" value={user?.standbyDays?.join(" · ") ?? "—"} hint="extra-class reminders are sent on these days" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submit overtime report</CardTitle>
            <CardDescription>One entry per session.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" max={TODAY} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="hours" render={({ field }) => (
                    <FormItem><FormLabel>Hours</FormLabel><FormControl><Input type="number" step={0.5} min={0.5} max={8} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="classroom" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Classroom</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Select classroom" /></SelectTrigger></FormControl>
                      <SelectContent>{CLASSROOMS.filter((c) => c.includes("13")).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem><FormLabel>Subject</FormLabel><FormControl><Input placeholder="e.g. Spring Cloud config server lab" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notes (optional)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-fit"><PaperAirplaneIcon /> Submit report</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="gap-0 py-0">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <p className="text-sm font-medium">
                My reports <span className="text-muted-foreground font-normal">· {mine.length}</span>
              </p>
              <ViewToggle value={view} onChange={setView} />
            </div>
            {view === "grid" ? (
              mine.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">No reports yet.</p>
              ) : (
                <CardGrid columns={2}>
                  {mine.map((r) => (
                    <RecordCard
                      key={r.id}
                      title={r.subject}
                      subtitle={`${formatDate(r.date)} · ${r.classroom}`}
                      trailing={
                        <Badge variant={r.status === "approved" ? "success" : r.status === "rejected" ? "danger" : "warning"}>
                          {r.status === "approved" ? "Approved" : r.status === "rejected" ? "Rejected" : "Submitted"}
                        </Badge>
                      }
                    >
                      <CardFields>
                        <CardField label="Hours">{r.hours} h</CardField>
                        <CardField label="Pay" align="right">{r.status === "approved" ? formatCurrency(pay(r.hours)) : "—"}</CardField>
                      </CardFields>
                      {r.notes && <p className="text-muted-foreground text-xs">{r.notes}</p>}
                    </RecordCard>
                  ))}
                </CardGrid>
              )
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Classroom</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mine.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{formatDate(r.date)}</TableCell>
                    <TableCell>{r.classroom}</TableCell>
                    <TableCell>
                      <p>{r.subject}</p>
                      {r.notes && <p className="text-muted-foreground text-xs">{r.notes}</p>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.hours}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "approved" ? "success" : r.status === "rejected" ? "danger" : "warning"}>
                        {r.status === "approved" ? "Approved" : r.status === "rejected" ? "Rejected" : "Submitted"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.status === "approved" ? formatCurrency(pay(r.hours)) : "—"}</TableCell>
                  </TableRow>
                ))}
                {mine.length === 0 && <TableRow><TableCell colSpan={6} className="text-muted-foreground py-8 text-center">No reports yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><BellAlertIcon className="text-primary size-5" /> Extra-class reminders</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {reminders.map((n) => (
                  <li key={n.id} className="text-sm">
                    <p className="font-medium">{n.title}</p>
                    <p className="text-muted-foreground text-xs">{n.message}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
