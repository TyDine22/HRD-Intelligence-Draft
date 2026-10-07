"use client";

import * as React from "react";
import { ArrowDownTrayIcon, DocumentTextIcon, PrinterIcon, TableCellsIcon } from "@heroicons/react/24/outline";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { exportCsv, exportExcel, exportPdfReport } from "@/lib/utils/export";
import { cn } from "@/lib/utils";

export type ExportFormat = "csv" | "excel" | "pdf";
export type ExportCell = string | number | null | undefined;

export interface ExportSpec {
  /** File name without extension. */
  filename: string;
  columns: string[];
  rows: ExportCell[][];
  /** Columns from this index onward are right-aligned numbers. */
  numericFrom?: number;
  /** Formats offered; defaults to CSV only. */
  formats?: ExportFormat[];
  defaultFormat?: ExportFormat;
  /** Excel sheet name. */
  sheetName?: string;
  /** Headline figures shown above the preview (and in the PDF). */
  summary?: { label: string; value: string | number }[];
  /** PDF-specific presentation. Rows/columns override the defaults when the PDF needs formatted values. */
  pdf?: {
    title: string;
    subtitle?: string[];
    columns?: string[];
    rows?: ExportCell[][];
    footer?: ExportCell[];
    note?: string;
  };
}

const FORMAT_META: Record<ExportFormat, { label: string; hint: string; ext: string; icon: typeof TableCellsIcon }> = {
  csv: { label: "CSV", hint: "Spreadsheet data", ext: "csv", icon: TableCellsIcon },
  excel: { label: "Excel", hint: "Opens in Microsoft Excel", ext: "xls", icon: TableCellsIcon },
  pdf: { label: "PDF", hint: "Printable report", ext: "pdf", icon: DocumentTextIcon },
};

const PREVIEW_LIMIT = 50;

/**
 * Shared "look before you download" step for every tabular export in the app.
 * `build` is evaluated only while the dialog is open so views can pass an inline closure.
 */
export function ExportPreviewDialog({
  open,
  onOpenChange,
  build,
  title = "Preview export",
  description,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  build: () => ExportSpec;
  title?: string;
  description?: string;
}) {
  const { toast } = useToast();
  const spec = React.useMemo(() => (open ? build() : null), [open, build]);
  const formats = spec?.formats?.length ? spec.formats : (["csv"] as ExportFormat[]);
  const [format, setFormat] = React.useState<ExportFormat>(formats[0]);

  React.useEffect(() => {
    if (open) setFormat(spec?.defaultFormat && formats.includes(spec.defaultFormat) ? spec.defaultFormat : formats[0]);
    // Reset the format each time the dialog opens; `formats` is derived from the same spec.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!spec) return <Dialog open={open} onOpenChange={onOpenChange} />;

  const usePdfShape = format === "pdf" && !!spec.pdf?.rows;
  const columns = usePdfShape ? (spec.pdf?.columns ?? spec.columns) : spec.columns;
  const rows = usePdfShape ? spec.pdf!.rows! : spec.rows;
  const numericFrom = spec.numericFrom ?? columns.length;
  const filename = `${spec.filename}.${FORMAT_META[format].ext}`;
  const wide = columns.length > 8;

  const download = () => {
    if (format === "pdf") {
      const opened = exportPdfReport({
        title: spec.pdf?.title ?? title,
        subtitle: spec.pdf?.subtitle,
        stats: spec.summary,
        columns,
        rows,
        footer: spec.pdf?.footer,
        numericFrom,
        note: spec.pdf?.note,
      });
      if (!opened) {
        toast({ title: "Pop-up blocked", description: "Allow pop-ups for this site to export the PDF report.", variant: "error" });
        return;
      }
      onOpenChange(false);
      return;
    }
    if (format === "excel") exportExcel(spec.filename, spec.columns, spec.rows, spec.sheetName);
    else exportCsv(spec.filename, spec.columns, spec.rows);
    toast({ title: "Export downloaded", description: `${filename} · ${rows.length} ${rows.length === 1 ? "row" : "rows"}`, variant: "success" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(wide ? "sm:max-w-5xl" : "sm:max-w-3xl")}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description ?? "Check the data below before downloading."}{" "}
            {format === "pdf" ? "The PDF opens in the browser print dialog; choose “Save as PDF”." : `The ${FORMAT_META[format].label} file will contain exactly these rows.`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          {formats.length > 1 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {formats.map((f) => {
                const meta = FORMAT_META[f];
                const selected = format === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                      selected ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent"
                    )}
                  >
                    <meta.icon className="size-5 shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{meta.label}</span>
                      <span className={cn("block text-xs", selected ? "text-primary/80" : "text-muted-foreground")}>{meta.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="bg-muted/50 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg px-4 py-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              {format === "pdf" ? <DocumentTextIcon className="text-muted-foreground size-4 shrink-0" /> : <TableCellsIcon className="text-muted-foreground size-4 shrink-0" />}
              <span className="truncate font-medium" title={filename}>
                {filename}
              </span>
            </span>
            <span className="text-muted-foreground tabular-nums">{columns.length} columns</span>
            <Badge variant="info" className="ml-auto tabular-nums">
              {rows.length} {rows.length === 1 ? "row" : "rows"}
            </Badge>
          </div>

          {spec.summary && spec.summary.length > 0 && (
            <div className={cn("grid gap-2", spec.summary.length >= 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3")}>
              {spec.summary.map((k) => (
                <div key={k.label} className="rounded-lg border px-3 py-2">
                  <p className="text-muted-foreground truncate text-[11px] font-medium tracking-wide uppercase" title={k.label}>
                    {k.label}
                  </p>
                  <p className="truncate text-lg font-semibold tabular-nums" title={String(k.value)}>
                    {k.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="overflow-hidden rounded-lg border">
            <div className="max-h-[45vh] overflow-auto [&_[data-slot=table-container]]:overflow-visible">
              <Table>
                <TableHeader className="bg-muted/60 sticky top-0 z-10 backdrop-blur">
                  <TableRow>
                    {columns.map((c, i) => (
                      <TableHead key={`${c}-${i}`} className={cn("whitespace-nowrap", i >= numericFrom && "text-right")}>
                        {c}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="text-muted-foreground py-10 text-center">
                        Nothing to export for the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.slice(0, PREVIEW_LIMIT).map((r, ri) => (
                      <TableRow key={ri}>
                        {r.map((v, i) => (
                          <TableCell key={i} className={cn("whitespace-nowrap", i >= numericFrom && "text-right tabular-nums", i === 1 && "font-medium")}>
                            {v === null || v === undefined || v === "" ? <span className="text-muted-foreground">—</span> : v}
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={download} disabled={rows.length === 0}>
            {format === "pdf" ? (
              <>
                <PrinterIcon /> Print / Save PDF
              </>
            ) : (
              <>
                <ArrowDownTrayIcon /> Download {FORMAT_META[format].label}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
