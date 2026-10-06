"use client";

import * as React from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { exportCsv, exportPdf } from "@/lib/utils/export";
import { ATTENDANCE, getStudentStats } from "@/lib/data/academics";
import { STUDENTS } from "@/lib/data/students";
import { TODAY, addDays } from "@/lib/data/seed";

type Range = "week" | "month" | "custom";

export function ReportExportDialog() {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [range, setRange] = React.useState<Range>("week");
  const [format, setFormat] = React.useState<"csv" | "pdf">("csv");
  const [from, setFrom] = React.useState(addDays(TODAY, -7));
  const [to, setTo] = React.useState(TODAY);

  const resolved = React.useMemo(() => {
    if (range === "week") return { from: addDays(TODAY, -7), to: TODAY };
    if (range === "month") return { from: addDays(TODAY, -30), to: TODAY };
    return { from, to };
  }, [range, from, to]);

  const run = () => {
    if (format === "pdf") {
      setOpen(false);
      setTimeout(() => exportPdf(), 150);
      return;
    }
    const rows = STUDENTS.filter((s) => s.status === "active").map((s) => {
      const att = ATTENDANCE.filter((a) => a.studentId === s.id && a.date >= resolved.from && a.date <= resolved.to);
      const present = att.filter((a) => a.status === "Present" || a.status === "Late").length;
      const st = getStudentStats(s.id);
      return [s.id, s.name, s.classroom, att.length ? Math.round((present / att.length) * 1000) / 10 : 0, st.averageScore, st.extraClassHours];
    });
    exportCsv(`dashboard-report_${resolved.from}_${resolved.to}`, ["Student ID", "Name", "Class", "Attendance %", "Avg score", "Extra hours"], rows);
    toast({ title: "Report exported", description: `CSV for ${resolved.from} → ${resolved.to} downloaded.`, variant: "success" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowDownTrayIcon /> Export report
        </Button>
      </DialogTrigger>
      <DialogContent>
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
                <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="to">To</Label>
                <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
          )}
          <div className="grid gap-2">
            <Label>Format</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["csv", "pdf"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`cursor-pointer rounded-md border px-3 py-2 text-sm font-medium uppercase transition-colors ${
                    format === f ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            {format === "pdf" && <p className="text-muted-foreground text-xs">PDF uses the browser print dialog (choose “Save as PDF”).</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={run}>
            <ArrowDownTrayIcon /> Export {format.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
