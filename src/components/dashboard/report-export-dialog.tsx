"use client";

import * as React from "react";
import { ArrowDownTrayIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, PrinterIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/lib/store/app-store";
import { exportExcelSections, exportPdfHtml } from "@/lib/utils/export";
import {
  GENERATION_OPTIONS,
  REPORT_CSS,
  REPORT_PERIODS,
  REPORT_SECTIONS,
  buildDashboardReport,
  excelSections,
  paginate,
  renderBlocks,
  renderDocument,
  renderFooter,
  renderHeader,
  type ReportPeriod,
  type SectionId,
} from "@/lib/reports/dashboard-report";
import { cn } from "@/lib/utils";

type Format = "pdf" | "excel";

const DEFAULT_SECTIONS = REPORT_SECTIONS.filter((s) => s.defaultOn).map((s) => s.id);

const FORMATS: { id: Format; label: string }[] = [
  { id: "pdf", label: "PDF report" },
  { id: "excel", label: "Excel data" },
];

export function ReportExportDialog({ generation: initialGeneration = "all" }: { generation?: string }) {
  const { toast } = useToast();
  const { alumni } = useAppStore();

  const [open, setOpen] = React.useState(false);
  const [generation, setGeneration] = React.useState<string>(initialGeneration);
  const [period, setPeriod] = React.useState<ReportPeriod>("term");
  const [sections, setSections] = React.useState<SectionId[]>(DEFAULT_SECTIONS);
  const [format, setFormat] = React.useState<Format>("pdf");
  const [page, setPage] = React.useState(0);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      // Mirror the dashboard's current generation filter each time the dialog opens.
      setGeneration(initialGeneration);
      setPage(0);
    }
  };

  const doc = React.useMemo(
    () =>
      open
        ? buildDashboardReport({
            generation: generation === "all" ? "all" : Number(generation),
            period,
            // Keep the report in dashboard order regardless of click order.
            sections: REPORT_SECTIONS.filter((s) => sections.includes(s.id)).map((s) => s.id),
            alumni,
          })
        : null,
    [open, generation, period, sections, alumni]
  );
  const pages = React.useMemo(() => (doc ? paginate(doc) : []), [doc]);
  const pageCount = Math.max(1, pages.length);
  const current = Math.min(page, pageCount - 1);

  const previewHtml = React.useMemo(() => {
    if (!doc) return "";
    const blocks = pages[current] ?? [];
    return (current === 0 ? renderHeader(doc) : "") + renderBlocks(blocks) + (current === pageCount - 1 ? renderFooter(doc) : "");
  }, [doc, pages, current, pageCount]);

  const toggle = (id: SectionId, on: boolean) => {
    setSections((prev) => (on ? [...prev, id] : prev.filter((s) => s !== id)));
    setPage(0);
  };

  const download = () => {
    if (!doc) return;
    if (format === "pdf") {
      const opened = exportPdfHtml({ title: doc.title, css: REPORT_CSS, body: renderDocument(doc), bodyClass: "hrd-report" });
      if (!opened) {
        toast({ title: "Pop-up blocked", description: "Allow pop-ups for this site to export the PDF report.", variant: "error" });
        return;
      }
      handleOpenChange(false);
      return;
    }
    const tables = excelSections(doc);
    exportExcelSections(doc.filename, tables, "Dashboard");
    toast({
      title: "Excel exported",
      description: `${doc.filename}.xls · ${tables.length} ${tables.length === 1 ? "table" : "tables"}`,
      variant: "success",
    });
    handleOpenChange(false);
  };

  const none = sections.length === 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowDownTrayIcon /> Export report
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="border-b px-6 py-5 text-left">
          <DialogTitle className="text-xl">Export report</DialogTitle>
          <DialogDescription>Choose what to include, check the preview, then download.</DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:overflow-hidden">
          {/* Options */}
          <div className="grid min-w-0 content-start gap-6 px-6 py-5 md:overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid min-w-0 gap-2">
                <Label>Generation</Label>
                <Select value={generation} onValueChange={(v) => { setGeneration(v); setPage(0); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENERATION_OPTIONS.map((g) => (
                      <SelectItem key={String(g.value)} value={String(g.value)}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid min-w-0 gap-2">
                <Label>Period</Label>
                <Select value={period} onValueChange={(v) => { setPeriod(v); setPage(0); }}>
                  <SelectTrigger className="w-full [&>svg:last-child]:hidden">
                    <SelectValue />
                    <CalendarIcon className="text-muted-foreground ml-auto size-4 shrink-0" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_PERIODS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <fieldset className="grid gap-1">
              <legend className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-wider uppercase">Include sections</legend>
              {REPORT_SECTIONS.map((s) => {
                const checked = sections.includes(s.id);
                return (
                  <label
                    key={s.id}
                    htmlFor={`section-${s.id}`}
                    className={cn(
                      "hover:bg-accent/60 -mx-2 flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors",
                      checked ? "text-foreground" : "text-foreground/80"
                    )}
                  >
                    <Checkbox id={`section-${s.id}`} checked={checked} onCheckedChange={(v) => toggle(s.id, v === true)} className="size-[18px]" />
                    <span className="text-sm">{s.label}</span>
                    <span className="text-muted-foreground ml-auto hidden text-xs sm:inline">{s.hint}</span>
                  </label>
                );
              })}
            </fieldset>

            <div className="grid gap-2">
              <p className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">Format</p>
              <div role="tablist" className="bg-muted grid grid-cols-2 gap-1 rounded-xl p-1">
                {FORMATS.map((f) => {
                  const active = format === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setFormat(f.id)}
                      className={cn(
                        "focus-visible:ring-ring/50 cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-all outline-none focus-visible:ring-[3px]",
                        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-muted-foreground text-xs">PDF is a formatted report for sharing. Excel exports the raw numbers behind each section.</p>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-muted/40 flex min-w-0 flex-col border-t md:min-h-0 md:border-t-0 md:border-l">
            <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-3">
              <h3 className="font-semibold">Preview</h3>
              <div className="text-muted-foreground flex items-center gap-1 text-sm tabular-nums">
                <Button variant="ghost" size="icon" className="size-7" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={current === 0} aria-label="Previous page">
                  <ChevronLeftIcon />
                </Button>
                <span>
                  Page {current + 1} of {pageCount}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  disabled={current >= pageCount - 1}
                  aria-label="Next page"
                >
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto px-6 pb-6 md:min-h-0 md:flex-1 md:overflow-auto">
              <style>{REPORT_CSS}</style>
              {none ? (
                <div className="text-muted-foreground flex h-full min-h-56 items-center justify-center rounded-xl border border-dashed text-center text-sm">
                  Select at least one section to preview the report.
                </div>
              ) : (
                <div
                  className="hrd-report mx-auto w-full min-w-[480px] max-w-[560px] rounded-md bg-white p-6 shadow-[0_1px_2px_rgba(18,25,32,0.06),0_8px_24px_-12px_rgba(18,25,32,0.18)] md:min-h-full"
                  // Preview HTML is generated locally from seed data with every value escaped.
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm tabular-nums">
            {sections.length} {sections.length === 1 ? "section" : "sections"} · about {pageCount} {pageCount === 1 ? "page" : "pages"} · {format === "pdf" ? "PDF" : "Excel"}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={download} disabled={none}>
              {format === "pdf" ? (
                <>
                  <PrinterIcon /> Download PDF
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon /> Download Excel
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
