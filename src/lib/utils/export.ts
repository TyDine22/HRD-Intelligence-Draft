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

/** Mock ZIP export – produces a manifest file so the flow can be exercised without a backend. */
export function exportZipManifest(name: string, entries: string[]) {
  const manifest = [`Archive: ${name}.zip`, `Entries: ${entries.length}`, "", ...entries].join("\n");
  exportText(`${name}.zip.manifest.txt`, manifest);
}
