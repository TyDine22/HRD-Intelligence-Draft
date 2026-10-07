/**
 * Client-side export helpers. These run only in the browser.
 */

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeCsv(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportCsv(filename: string, columns: string[], rows: (string | number | null | undefined)[][]) {
  const lines = [columns.map(escapeCsv).join(","), ...rows.map((r) => r.map(escapeCsv).join(","))];
  download(new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" }), filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

/** Excel-compatible export (HTML table workbook, opens directly in Excel). */
export function exportExcel(filename: string, columns: string[], rows: (string | number | null | undefined)[][], sheetName = "Sheet1") {
  const esc = (v: string | number | null | undefined) =>
    String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${esc(sheetName)}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table><thead><tr>${columns
    .map((c) => `<th>${esc(c)}</th>`)
    .join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  download(new Blob([html], { type: "application/vnd.ms-excel" }), filename.endsWith(".xls") ? filename : `${filename}.xls`);
}

export function exportText(filename: string, content: string, mime = "text/plain") {
  download(new Blob([content], { type: `${mime};charset=utf-8` }), filename);
}

/** PDF export uses the browser print dialog (Save as PDF). */
export function exportPdf() {
  window.print();
}

export interface PdfReportOptions {
  /** Document title; also used as the default file name in the "Save as PDF" dialog. */
  title: string;
  /** Short lines shown under the title (period, filters, generated date…). */
  subtitle?: string[];
  /** Headline figures shown as tiles above the table. */
  stats?: { label: string; value: string | number }[];
  columns: string[];
  rows: (string | number | null | undefined)[][];
  /** Optional closing row (e.g. totals), rendered in bold. */
  footer?: (string | number | null | undefined)[];
  /** Columns from this index onward are right-aligned numbers. */
  numericFrom?: number;
  /** Small print under the table. */
  note?: string;
  landscape?: boolean;
}

const escapeHtml = (v: string | number | null | undefined) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Tabular PDF export: renders a standalone, print-styled report in a new window and
 * opens the browser print dialog (choose "Save as PDF"). Returns false when the popup
 * was blocked so the caller can tell the user.
 */
export function exportPdfReport(opts: PdfReportOptions): boolean {
  const { title, subtitle = [], stats = [], columns, rows, footer, numericFrom = columns.length, note, landscape = columns.length > 6 } = opts;
  const win = window.open("", "_blank", "noopener,noreferrer,width=1100,height=800");
  if (!win) return false;

  const cell = (v: string | number | null | undefined, i: number, tag: "td" | "th" = "td") =>
    `<${tag}${i >= numericFrom ? ' class="num"' : ""}>${escapeHtml(v)}</${tag}>`;
  const row = (r: (string | number | null | undefined)[], tag: "td" | "th" = "td") => `<tr>${r.map((v, i) => cell(v, i, tag)).join("")}</tr>`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #121920; font: 11px/1.45 "Albert Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding-bottom: 12px; border-bottom: 2px solid #121920; }
  h1 { margin: 0; font-size: 18px; letter-spacing: -0.01em; }
  .sub { margin: 4px 0 0; color: #5b6572; font-size: 11px; }
  .brand { text-align: right; color: #5b6572; font-size: 10px; line-height: 1.3; }
  .brand strong { display: block; color: #121920; font-size: 12px; }
  .stats { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0; }
  .stat { flex: 1 1 140px; border: 1px solid #e3e7ec; border-radius: 6px; padding: 8px 10px; }
  .stat span { display: block; color: #5b6572; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.04em; }
  .stat b { display: block; margin-top: 2px; font-size: 15px; font-variant-numeric: tabular-nums; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  thead th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.03em; color: #5b6572; background: #f3f5f7; border-bottom: 1px solid #cfd5dc; padding: 6px 8px; }
  tbody td { padding: 5px 8px; border-bottom: 1px solid #e9edf1; vertical-align: top; }
  tbody tr:nth-child(even) td { background: #fafbfc; }
  tfoot td { padding: 7px 8px; font-weight: 700; background: #f3f5f7; border-top: 2px solid #cfd5dc; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  thead th, tfoot td { page-break-inside: avoid; }
  tr { page-break-inside: avoid; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  .note { margin-top: 10px; color: #5b6572; font-size: 9.5px; }
  @media screen { body { padding: 24px; background: #e9edf1; } .page { background: #fff; max-width: ${landscape ? "1123px" : "794px"}; margin: 0 auto; padding: 14mm 12mm; box-shadow: 0 2px 12px rgba(18,25,32,.12); } }
</style>
</head>
<body>
<div class="page">
  <header>
    <div>
      <h1>${escapeHtml(title)}</h1>
      ${subtitle.map((l) => `<p class="sub">${escapeHtml(l)}</p>`).join("")}
    </div>
    <div class="brand"><strong>HRD Intelligence</strong>Korea Software HRD Center</div>
  </header>
  ${stats.length ? `<div class="stats">${stats.map((st) => `<div class="stat"><span>${escapeHtml(st.label)}</span><b>${escapeHtml(st.value)}</b></div>`).join("")}</div>` : ""}
  <table>
    <thead>${row(columns, "th")}</thead>
    <tbody>${rows.map((r) => row(r)).join("")}</tbody>
    ${footer ? `<tfoot>${row(footer)}</tfoot>` : ""}
  </table>
  ${note ? `<p class="note">${escapeHtml(note)}</p>` : ""}
</div>
<script>
  window.addEventListener("load", function () { setTimeout(function () { window.focus(); window.print(); }, 50); });
  window.addEventListener("afterprint", function () { window.close(); });
</script>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}

/** Mock ZIP export – produces a manifest file so the flow can be exercised without a backend. */
export function exportZipManifest(name: string, entries: string[]) {
  const manifest = [`Archive: ${name}.zip`, `Entries: ${entries.length}`, "", ...entries].join("\n");
  exportText(`${name}.zip.manifest.txt`, manifest);
}
