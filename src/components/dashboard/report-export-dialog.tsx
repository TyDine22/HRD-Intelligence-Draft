"use client";

import * as React from "react";
import { ArrowDownTrayIcon, ArrowLeftIcon, DocumentTextIcon, EyeIcon, PrinterIcon, TableCellsIcon } from "@heroicons/react/24/outline";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { exportCsv, exportPdf } from "@/lib/utils/export";
import { ATTENDANCE, getStudentStats } from "@/lib/data/academics";
import { STUDENTS } from "@/lib/data/students";
import { TODAY, addDays } from "@/lib/data/seed";
import { cn } from "@/lib/utils";

type Range = "week" | "month" | "custom";
type Format = "csv" | "pdf";
type Step = "options" | "preview";

const COLUMNS = ["Student ID", "Name", "Class", "Attendance %", "Avg score", "Extra hours"];
const NUMERIC_FROM = 3; // columns from this index onward are right-aligned numbers
const PREVIEW_LIMIT = 50;

interface ReportRow {
  id: string;
  name: string;
  classroom: string;
  attendance: number;
  averageScore: number;
  extraHours: number;
}

function buildReport(from: string, to: string): ReportRow[] {
  return STUDENTS.filter((s) => s.status === "active").map((s) => {
    const att = ATTENDANCE.filter((a) => a.studentId === s.id && a.date >= from && a.date <= to);
    const present = att.filter((a) => a.status === "Present" || a.status === "Late").length;
    const st = getStudentStats(s.id);
    return {
      id: s.id,
      name: s.name,
      classroom: s.classroom,
      attendance: att.length ? Math.round((present / att.length) * 1000) / 10 : 0,
      averageScore: st.averageScore,
      extraHours: st.extraClassHours,
    };
  });
}

const toCells = (r: ReportRow): (string | number)[] => [r.id, r.name, r.classroom, r.attendance, r.averageScore, r.extraHours];

export function ReportExportDialog() {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<Step>("options");
  const [range, setRange] = React.useState<Range>("week");
  const [format, setFormat] = React.useState<Format>("csv");
  const [from, setFrom] = React.useState(addDays(TODAY, -7));
  const [to, setTo] = React.useState(TODAY);
  /** Set when the user chose PDF: the print dialog opens only after this dialog has fully closed. */
  const printOnClose = React.useRef(false);

  const resolved = React.useMemo(() => {
    if (range === "week") return { from: addDays(TODAY, -7), to: TODAY };
    if (range === "month") return { from: addDays(TODAY, -30), to: TODAY };
    return { from, to };
  }, [range, from, to]);

  const rows = React.useMemo(() => (step === "preview" ? buildReport(resolved.from, resolved.to) : []), [step, resolved.from, resolved.to]);
  const filename = `dashboard-report_${resolved.from}_${resolved.to}.${format}`;

  const summary = React.useMemo(() => {
    if (!rows.length) return { attendance: 0, score: 0, hours: 0 };
    const avg = (pick: (r: ReportRow) => number) => Math.round((rows.reduce((a, r) => a + pick(r), 0) / rows.length) * 10) / 10;
    return {
      attendance: avg((r) => r.attendance),
      score: avg((r) => r.averageScore),
      hours: rows.reduce((a, r) => a + r.extraHours, 0),
    };
  }, [rows]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setStep("options");
  };

  /** Runs once the dialog has fully closed: reset the wizard and, if requested, open the print dialog. */
  const handleClosed = () => {
    setStep("options");
    if (!printOnClose.current) return;
    printOnClose.current = false;
    setTimeout(exportPdf, 50);
  };

  const download = () => {
    if (format === "pdf") {
      // window.print() blocks the main thread, so calling it while the dialog is still
      // animating out leaves the overlay stuck. Defer it until the content has unmounted.
      printOnClose.current = true;
      handleOpenChange(false);
      return;
    }
    exportCsv(filename, COLUMNS, rows.map(toCells));
    toast({
      title: "Report exported",
      description: `${filename} downloaded (${rows.length} rows).`,
      variant: "success",
    });
    handleOpenChange(false);
  };

  const invalidRange = range === "custom" && from > to;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowDownTrayIcon /> Export report
        </Button>
      </DialogTrigger>

      <DialogContent className={cn(step === "preview" && "sm:max-w-3xl")} onCloseAutoFocus={handleClosed}>
        {step === "options" ? (
          <>
            <DialogHeader>
              <DialogTitle>Export dashboard report</DialogTitle>
              <DialogDescription>Filter by week, month or a custom date range and choose the output format.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Date range</Label>
                <Select value={range} onValueChange={(v) => setRange(v as Range)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">This week</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {range === "custom" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="from">From</Label>
                    <Input id="from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="to">To</Label>
                    <Input id="to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
                  </div>
                </div>
              )}
              <div className="grid gap-2">
                <Label>Format</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      {
                        id: "csv",
                        label: "CSV",
                        hint: "Spreadsheet data",
                        icon: TableCellsIcon,
                      },
                      {
                        id: "pdf",
                        label: "PDF",
                        hint: "Printable dashboard",
                        icon: DocumentTextIcon,
                      },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFormat(f.id)}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                        format === f.id ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent",
                      )}
                    >
                      <f.icon className="size-5 shrink-0" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{f.label}</span>
                        <span className={cn("block text-xs", format === f.id ? "text-primary/80" : "text-muted-foreground")}>{f.hint}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => setStep("preview")} disabled={invalidRange}>
                <EyeIcon /> Preview
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Preview report</DialogTitle>
              <DialogDescription>
                Check the data below before downloading.{" "}
                {format === "pdf" ? "The PDF is produced by the browser print dialog and includes the full dashboard." : "The CSV will contain exactly these rows."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3">
              <div className="bg-muted/50 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg px-4 py-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  {format === "pdf" ? <DocumentTextIcon className="text-muted-foreground size-4 shrink-0" /> : <TableCellsIcon className="text-muted-foreground size-4 shrink-0" />}
                  <span className="truncate font-medium" title={filename}>
                    {filename}
                  </span>
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {resolved.from} → {resolved.to}
                </span>
                <Badge variant="info" className="ml-auto tabular-nums">
                  {rows.length} {rows.length === 1 ? "student" : "students"}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Avg attendance", value: `${summary.attendance}%` },
                  { label: "Avg score", value: summary.score },
                  { label: "Extra hours", value: summary.hours },
                ].map((k) => (
                  <div key={k.label} className="rounded-lg border px-3 py-2">
                    <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">{k.label}</p>
                    <p className="text-lg font-semibold tabular-nums">{k.value}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-lg border">
                <div className="max-h-[45vh] overflow-auto [&_[data-slot=table-container]]:overflow-visible">
                  <Table>
                    <TableHeader className="bg-muted/60 sticky top-0 z-10 backdrop-blur">
                      <TableRow>
                        {COLUMNS.map((c, i) => (
                          <TableHead key={c} className={cn("whitespace-nowrap", i >= NUMERIC_FROM && "text-right")}>
                            {c}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={COLUMNS.length} className="text-muted-foreground py-10 text-center">
                            No active students in this range.
                          </TableCell>
                        </TableRow>
                      ) : (
                        rows.slice(0, PREVIEW_LIMIT).map((r) => (
                          <TableRow key={r.id}>
                            {toCells(r).map((v, i) => (
                              <TableCell key={COLUMNS[i]} className={cn("whitespace-nowrap", i >= NUMERIC_FROM && "text-right tabular-nums", i === 1 && "font-medium")}>
                                {i === 3 ? `${v}%` : v}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {rows.length > PREVIEW_LIMIT && (
                  <p className="text-muted-foreground border-t px-3 py-2 text-xs">
                    Showing the first {PREVIEW_LIMIT} of {rows.length} rows. The download includes all rows.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button variant="ghost" onClick={() => setStep("options")}>
                <ArrowLeftIcon /> Back
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={download} disabled={format === "csv" && rows.length === 0}>
                  {format === "pdf" ? (
                    <>
                      <PrinterIcon /> Print / Save PDF
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon /> Download CSV
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
