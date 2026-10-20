/**
 * Dashboard report model.
 *
 * Builds the data behind every exportable dashboard section, renders it to
 * self-contained HTML (used both by the in-app preview and the PDF print window
 * so the two always match) and derives the raw tables for the Excel export.
 * Pure TypeScript – no React, no DOM.
 */

import { ATTENDANCE, RISK_ASSESSMENTS, SCHOOL_DAYS, MONTHS, getStudentStats } from "@/lib/data/academics";
import { EMPLOYED_STATUSES, EMPLOYMENT_STATUSES } from "@/lib/data/alumni";
import { GENERATIONS, STUDENTS } from "@/lib/data/students";
import { courseByCode } from "@/lib/data/users";
import { TODAY, pad } from "@/lib/data/seed";
import type { Alumni, AttendanceRecord, EmploymentStatus } from "@/lib/data/types";
import { formatDate, formatMonth } from "@/lib/utils/format";

/* ------------------------------------------------------------------ */
/* Sections & inputs                                                    */
/* ------------------------------------------------------------------ */

export type SectionId = "kpis" | "trend" | "status" | "risk" | "top" | "alumni" | "gender";

export interface SectionMeta {
  id: SectionId;
  label: string;
  hint: string;
  /** Checked by default when the dialog opens. */
  defaultOn: boolean;
}

export const REPORT_SECTIONS: SectionMeta[] = [
  { id: "kpis", label: "Key metrics (KPIs)", hint: "Headline figures", defaultOn: true },
  { id: "trend", label: "Attendance trend", hint: "Attendance rate over time", defaultOn: true },
  { id: "status", label: "Attendance status", hint: "Present · Late · Absent · Permission", defaultOn: true },
  { id: "risk", label: "At-risk students", hint: "Ranked by risk score", defaultOn: true },
  { id: "top", label: "Top 5 students", hint: "Four ranked lists", defaultOn: true },
  { id: "alumni", label: "Alumni employment status", hint: "Official status of every graduate", defaultOn: false },
  { id: "gender", label: "Gender distribution", hint: "Male · Female", defaultOn: false },
];

/** "term" covers the whole term; otherwise a month in YYYY-MM form. */
export type ReportPeriod = "term" | string;

export const REPORT_PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: "term", label: "Whole term" },
  ...[...MONTHS].reverse().map((m) => ({ value: m, label: formatMonth(m) })),
];

export interface ReportInput {
  generation: "all" | number;
  period: ReportPeriod;
  sections: SectionId[];
  alumni: Alumni[];
}

/* ------------------------------------------------------------------ */
/* Blocks                                                               */
/* ------------------------------------------------------------------ */

export interface Slice {
  name: string;
  value: number;
  color: string;
}

export type Cell = string | number | null | undefined;

export type Block =
  | { id: SectionId; kind: "stats"; title: string; subtitle?: string; items: { label: string; value: string; hint?: string }[] }
  | { id: SectionId; kind: "line"; title: string; subtitle?: string; points: { label: string; value: number }[]; suffix: string; domain: [number, number] }
  | { id: SectionId; kind: "donut"; title: string; subtitle?: string; slices: Slice[]; center?: { value: string; label: string }; note?: string }
  | { id: SectionId; kind: "table"; title: string; subtitle?: string; columns: string[]; rows: Cell[][]; /** Indices of right-aligned numeric columns. */ numeric: number[]; empty: string; continued?: boolean }
  | { id: SectionId; kind: "ranked"; title: string; subtitle?: string; groups: { title: string; valueLabel: string; rows: { name: string; meta: string; display: string }[] }[] };

export interface ReportDocument {
  title: string;
  subtitle: string[];
  /** File name without extension. */
  filename: string;
  blocks: Block[];
}

/* Print-safe palette (the print window has no access to the app's CSS variables). */
const COLORS = {
  blue: "#03528d",
  green: "#15803d",
  amber: "#f5a300",
  red: "#ed1c2e",
  lightBlue: "#5b9ad7",
  gray: "#394149",
  gray300: "#99a3ad",
  red300: "#fe978f",
};

const STATUS_COLOR: Record<string, string> = {
  Present: COLORS.green,
  Late: COLORS.amber,
  Absent: COLORS.red,
  Permission: COLORS.blue,
  Male: COLORS.blue,
  Female: COLORS.red300,
};

const EMPLOYMENT_COLOR: Record<EmploymentStatus, string> = {
  "Local SW Developer": COLORS.blue,
  "International SW Developer": COLORS.green,
  Banks: COLORS.red,
  "Government Officials": COLORS.gray300,
  "Full Scholarship Abroad": COLORS.amber,
  "IT Instructor in HRD Center": COLORS.lightBlue,
  Other: COLORS.gray,
};

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);
const pct1 = (part: number, whole: number) => (whole ? Math.round((part / whole) * 1000) / 10 : 0);

/* ------------------------------------------------------------------ */
/* Build                                                                */
/* ------------------------------------------------------------------ */

export function buildDashboardReport(input: ReportInput): ReportDocument {
  const { generation, period, alumni } = input;
  const wanted = new Set(input.sections);

  const students = generation === "all" ? STUDENTS : STUDENTS.filter((s) => s.generation === generation);
  const ids = new Set(students.map((s) => s.id));
  const inPeriod = (a: AttendanceRecord) => ids.has(a.studentId) && (period === "term" || a.date.startsWith(period));
  const attendance = ATTENDANCE.filter(inPeriod);

  const genLabel = generation === "all" ? "All generations" : `Generation ${generation}`;
  const periodLabel = period === "term" ? "Whole term" : formatMonth(period);
  const scope = `${genLabel} · ${periodLabel}`;

  const counts = {
    total: students.length,
    active: students.filter((s) => s.status === "active").length,
    dropped: students.filter((s) => s.status === "dropped").length,
    graduated: students.filter((s) => s.status === "graduated").length,
  };
  const presentish = attendance.filter((a) => a.status === "Present" || a.status === "Late").length;
  const attendanceRate = pct1(presentish, attendance.length);
  const risk = RISK_ASSESSMENTS.filter((r) => ids.has(r.studentId)).sort((a, b) => b.score - a.score);

  const blocks: Block[] = [];

  if (wanted.has("kpis")) {
    const actives = students.filter((s) => s.status === "active");
    const avgScore = actives.length ? Math.round((actives.reduce((a, s) => a + getStudentStats(s.id).averageScore, 0) / actives.length) * 10) / 10 : 0;
    const employed = alumni.filter((a) => EMPLOYED_STATUSES.includes(a.employmentStatus)).length;
    blocks.push({
      id: "kpis",
      kind: "stats",
      title: "Key metrics",
      subtitle: scope,
      items: [
        { label: "Total students", value: String(counts.total), hint: genLabel },
        { label: "Active", value: String(counts.active), hint: `${pct(counts.active, counts.total)}% of total` },
        { label: "Attendance rate", value: attendance.length ? `${attendanceRate}%` : "—", hint: periodLabel },
        { label: "Avg score", value: actives.length ? String(avgScore) : "—", hint: "Active students, term average" },
        { label: "At-risk", value: String(risk.length), hint: `${risk.filter((r) => r.level === "High").length} high` },
        { label: "Alumni", value: String(alumni.length), hint: `${employed} employed` },
      ],
    });
  }

  if (wanted.has("trend")) {
    blocks.push({
      id: "trend",
      kind: "line",
      title: "Attendance trend",
      subtitle: `${scope} · ${period === "term" ? "weekly" : "daily"} share of students present or late`,
      points: trendSeries(attendance, period),
      suffix: "%",
      domain: [60, 100],
    });
  }

  if (wanted.has("status")) {
    const order = ["Present", "Late", "Absent", "Permission"] as const;
    const slices = order.map((name) => ({ name, value: attendance.filter((a) => a.status === name).length, color: STATUS_COLOR[name] }));
    blocks.push({
      id: "status",
      kind: "donut",
      title: "Attendance status",
      subtitle: scope,
      slices,
      center: { value: attendance.length ? `${attendanceRate}%` : "—", label: "attendance rate" },
      note: attendance.length ? undefined : "No attendance records for this selection (only active students check in).",
    });
  }

  if (wanted.has("risk")) {
    blocks.push({
      id: "risk",
      kind: "table",
      title: "At-risk students",
      subtitle: `${genLabel} · identified from attendance and score trends`,
      columns: ["#", "Student", "Class", "Risk", "Avg score", "Trend", "Attendance", "Main reason"],
      rows: risk.map((r, i) => {
        const s = STUDENTS.find((x) => x.id === r.studentId)!;
        return [i + 1, s.name, s.classroom, r.level, r.stats.averageScore, `${r.stats.trend > 0 ? "+" : ""}${r.stats.trend}`, `${r.stats.attendanceRate}%`, r.reasons[0] ?? ""];
      }),
      numeric: [0, 4, 5, 6],
      empty: "No students at risk for this selection.",
    });
  }

  if (wanted.has("top")) {
    const top = <T>(list: T[], value: (x: T) => number) =>
      [...list]
        .map((x) => ({ x, v: value(x) }))
        .sort((a, b) => b.v - a.v)
        .slice(0, 5);
    const byScore = top(students, (s) => getStudentStats(s.id).averageScore);
    const byIt = top(students, (s) => s.itScore);
    const byKorean = top(students, (s) => s.koreanScore);
    const byExtra = top(students, (s) => getStudentStats(s.id).extraClassHours).filter((r) => r.v > 0);
    blocks.push({
      id: "top",
      kind: "ranked",
      title: "Top 5 students",
      subtitle: `${genLabel} · ranked lists`,
      groups: [
        { title: "Basic & Advanced courses", valueLabel: "Score", rows: byScore.map((r) => ({ name: r.x.name, meta: courseByCode(r.x.courseCode).name, display: String(r.v) })) },
        { title: "IT students", valueLabel: "Score", rows: byIt.map((r) => ({ name: r.x.name, meta: r.x.classroom, display: String(r.v) })) },
        { title: "Korean students", valueLabel: "Score", rows: byKorean.map((r) => ({ name: r.x.name, meta: r.x.classroom, display: String(r.v) })) },
        { title: "Extra-class students", valueLabel: "Hours", rows: byExtra.map((r) => ({ name: r.x.name, meta: r.x.classroom, display: `${r.v} h` })) },
      ],
    });
  }

  if (wanted.has("alumni")) {
    const slices = EMPLOYMENT_STATUSES.map((name) => ({ name, value: alumni.filter((a) => a.employmentStatus === name).length, color: EMPLOYMENT_COLOR[name] }));
    blocks.push({
      id: "alumni",
      kind: "donut",
      title: "Alumni employment status",
      subtitle: "Official employment status of every graduate, as recorded in Alumni management",
      slices,
      center: { value: String(alumni.length), label: "alumni" },
      note: alumni.length ? undefined : "No alumni on record.",
    });
  }

  if (wanted.has("gender")) {
    const slices = (["Male", "Female"] as const).map((name) => ({ name, value: students.filter((s) => s.gender === name).length, color: STATUS_COLOR[name] }));
    blocks.push({
      id: "gender",
      kind: "donut",
      title: "Gender distribution",
      subtitle: genLabel,
      slices,
      center: { value: String(students.length), label: "students" },
    });
  }

  const genSlug = generation === "all" ? "all-generations" : `gen${generation}`;
  return {
    title: "HRD Dashboard report",
    subtitle: [`${genLabel} · ${periodLabel} · generated ${formatDate(TODAY)}`],
    filename: `hrd-dashboard-report_${genSlug}_${period}`,
    blocks,
  };
}

/** Weekly buckets over the term, or daily buckets inside a single month. */
function trendSeries(records: AttendanceRecord[], period: ReportPeriod): { label: string; value: number }[] {
  const buckets = new Map<string, { total: number; present: number }>();
  for (const r of records) {
    const key = period === "term" ? `W${pad(Math.floor(SCHOOL_DAYS.indexOf(r.date) / 5) + 1)}` : r.date.slice(8);
    const b = buckets.get(key) ?? { total: 0, present: 0 };
    b.total += 1;
    if (r.status === "Present" || r.status === "Late") b.present += 1;
    buckets.set(key, b);
  }
  return Array.from(buckets.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([label, b]) => ({ label, value: pct1(b.present, b.total) }));
}

export const GENERATION_OPTIONS: { value: "all" | number; label: string }[] = [
  { value: "all", label: "All generations" },
  ...[...GENERATIONS].reverse().map((g) => ({ value: g, label: `Generation ${g}` })),
];

/* ------------------------------------------------------------------ */
/* Pagination estimate (A4 portrait)                                     */
/* ------------------------------------------------------------------ */

const PAGE_MM = 269; // 297mm − 14mm top/bottom margins
const HEADER_MM = 22;
const TABLE_HEAD_MM = 16;
const TABLE_ROW_MM = 6.5;

function blockHeight(b: Block): number {
  switch (b.kind) {
    case "stats":
      return 10 + Math.ceil(b.items.length / 3) * 20;
    case "line":
      return 72;
    case "donut":
      return 64;
    case "table":
      return TABLE_HEAD_MM + Math.max(1, b.rows.length) * TABLE_ROW_MM;
    case "ranked":
      return 12 + Math.ceil(b.groups.length / 2) * 58;
  }
}

/**
 * Splits the document into pages the way the print engine is expected to.
 * Only tables may break across pages; every other block is kept whole.
 */
export function paginate(doc: ReportDocument): Block[][] {
  const pages: Block[][] = [[]];
  let used = HEADER_MM;
  const push = (b: Block, h: number) => {
    if (used + h > PAGE_MM && pages[pages.length - 1].length) {
      pages.push([]);
      used = 0;
    }
    pages[pages.length - 1].push(b);
    used += h + 4;
  };

  for (const b of doc.blocks) {
    if (b.kind !== "table" || blockHeight(b) <= PAGE_MM - used) {
      push(b, blockHeight(b));
      continue;
    }
    // Split a long table so that each chunk fits the remaining space.
    let rows = b.rows;
    let continued = false;
    while (rows.length) {
      const room = PAGE_MM - used - TABLE_HEAD_MM;
      const fit = Math.max(0, Math.floor(room / TABLE_ROW_MM));
      if (fit < 3 && pages[pages.length - 1].length) {
        pages.push([]);
        used = 0;
        continue;
      }
      const take = Math.max(1, Math.min(fit, rows.length));
      push({ ...b, rows: rows.slice(0, take), continued }, TABLE_HEAD_MM + take * TABLE_ROW_MM);
      rows = rows.slice(take);
      continued = true;
    }
  }
  return pages;
}

/* ------------------------------------------------------------------ */
/* HTML rendering                                                        */
/* ------------------------------------------------------------------ */

const esc = (v: Cell) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Stylesheet scoped under `.hrd-report`; shared by the preview and the print window. */
export const REPORT_CSS = `
.hrd-report { color: #121920; font: 11px/1.45 "Albert Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; font-variant-numeric: tabular-nums; }
.hrd-report * { box-sizing: border-box; }
.hrd-report .rpt-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding-bottom: 10px; margin-bottom: 12px; border-bottom: 2px solid #121920; }
.hrd-report h1 { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.2; }
.hrd-report .rpt-sub { margin: 4px 0 0; color: #5b6572; font-size: 10.5px; }
.hrd-report .rpt-brand { text-align: right; color: #5b6572; font-size: 9.5px; line-height: 1.3; white-space: nowrap; }
.hrd-report .rpt-brand strong { display: block; color: #121920; font-size: 11.5px; }
.hrd-report .rpt-block { margin: 0 0 12px; break-inside: avoid; page-break-inside: avoid; }
.hrd-report .rpt-block--table { break-inside: auto; page-break-inside: auto; }
.hrd-report .rpt-card { border: 1px solid #e3e7ec; border-radius: 8px; padding: 10px 12px; }
.hrd-report h2 { margin: 0; font-size: 12.5px; font-weight: 700; line-height: 1.25; }
.hrd-report .rpt-block-sub { margin: 2px 0 0; color: #5b6572; font-size: 9.5px; }
.hrd-report .rpt-block-head { margin-bottom: 8px; }
.hrd-report .rpt-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.hrd-report .rpt-stat { border: 1px solid #e3e7ec; border-radius: 8px; padding: 8px 10px; }
.hrd-report .rpt-stat span { display: block; color: #5b6572; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; }
.hrd-report .rpt-stat b { display: block; margin-top: 2px; font-size: 17px; font-weight: 700; line-height: 1.2; }
.hrd-report .rpt-stat small { display: block; color: #5b6572; font-size: 9px; margin-top: 1px; }
.hrd-report .rpt-chart { display: block; width: 100%; height: auto; }
.hrd-report .rpt-donut { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 16px; align-items: center; }
.hrd-report .rpt-legend { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px 14px; }
.hrd-report .rpt-legend li { display: flex; align-items: center; gap: 6px; font-size: 10px; min-width: 0; }
.hrd-report .rpt-legend i { flex: none; width: 8px; height: 8px; border-radius: 999px; }
.hrd-report .rpt-legend .n { color: #5b6572; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hrd-report .rpt-legend .v { margin-left: auto; font-weight: 600; white-space: nowrap; }
.hrd-report .rpt-empty { margin: 0; padding: 18px 0; color: #5b6572; text-align: center; font-size: 10px; }
.hrd-report table { width: 100%; border-collapse: collapse; }
.hrd-report thead th { text-align: left; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #5b6572; background: #f3f5f7; border-bottom: 1px solid #cfd5dc; padding: 5px 7px; }
.hrd-report tbody td { padding: 4.5px 7px; border-bottom: 1px solid #e9edf1; vertical-align: top; font-size: 10px; }
.hrd-report tbody tr:nth-child(even) td { background: #fafbfc; }
.hrd-report .num { text-align: right; white-space: nowrap; }
.hrd-report thead { display: table-header-group; }
.hrd-report tr { break-inside: avoid; page-break-inside: avoid; }
.hrd-report .rpt-risk { display: inline-block; padding: 1px 6px; border-radius: 999px; font-size: 9px; font-weight: 600; }
.hrd-report .rpt-risk--High { background: #fde8ea; color: #b4111f; }
.hrd-report .rpt-risk--Medium { background: #fff2d6; color: #8a5a00; }
.hrd-report .rpt-risk--Low { background: #e3eefa; color: #03528d; }
.hrd-report .rpt-ranked { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.hrd-report .rpt-group { border: 1px solid #e3e7ec; border-radius: 8px; padding: 8px 10px; break-inside: avoid; }
.hrd-report .rpt-group h3 { margin: 0 0 6px; display: flex; justify-content: space-between; font-size: 10.5px; font-weight: 700; }
.hrd-report .rpt-group h3 span { color: #5b6572; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.hrd-report .rpt-group ol { list-style: none; margin: 0; padding: 0; }
.hrd-report .rpt-group li { display: flex; align-items: center; gap: 8px; padding: 3.5px 0; border-top: 1px solid #eef1f4; font-size: 10px; }
.hrd-report .rpt-group li:first-child { border-top: 0; }
.hrd-report .rpt-group .rk { flex: none; width: 16px; height: 16px; border-radius: 999px; background: #f3f5f7; color: #5b6572; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.hrd-report .rpt-group .rk--0 { background: #f5a300; color: #fff; }
.hrd-report .rpt-group .rk--1 { background: #99a3ad; color: #fff; }
.hrd-report .rpt-group .rk--2 { background: #d98e4a; color: #fff; }
.hrd-report .rpt-group .nm { min-width: 0; flex: 1; }
.hrd-report .rpt-group .nm b { display: block; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hrd-report .rpt-group .nm small { display: block; color: #5b6572; font-size: 9px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hrd-report .rpt-group .vl { font-weight: 700; white-space: nowrap; }
.hrd-report .rpt-footer { margin-top: 14px; padding-top: 6px; border-top: 1px solid #e3e7ec; color: #5b6572; font-size: 9px; display: flex; justify-content: space-between; }
`;

export function renderHeader(doc: ReportDocument): string {
  return `<div class="rpt-header"><div><h1>${esc(doc.title)}</h1>${doc.subtitle.map((l) => `<p class="rpt-sub">${esc(l)}</p>`).join("")}</div><div class="rpt-brand"><strong>HRD Intelligence</strong>Korea Software HRD Center</div></div>`;
}

export function renderFooter(doc: ReportDocument): string {
  return `<div class="rpt-footer"><span>${esc(doc.title)} · ${esc(doc.subtitle[0] ?? "")}</span><span>HRD Intelligence</span></div>`;
}

export function renderBlocks(blocks: Block[]): string {
  return blocks.map(renderBlock).join("");
}

/** Full document body: header + every block + footer. */
export function renderDocument(doc: ReportDocument): string {
  return renderHeader(doc) + renderBlocks(doc.blocks) + renderFooter(doc);
}

function head(b: Block): string {
  const title = b.kind === "table" && b.continued ? `${b.title} (continued)` : b.title;
  return `<div class="rpt-block-head"><h2>${esc(title)}</h2>${b.subtitle ? `<p class="rpt-block-sub">${esc(b.subtitle)}</p>` : ""}</div>`;
}

function renderBlock(b: Block): string {
  switch (b.kind) {
    case "stats":
      return `<section class="rpt-block">${head(b)}<div class="rpt-stats">${b.items
        .map((s) => `<div class="rpt-stat"><span>${esc(s.label)}</span><b>${esc(s.value)}</b>${s.hint ? `<small>${esc(s.hint)}</small>` : ""}</div>`)
        .join("")}</div></section>`;

    case "line":
      return `<section class="rpt-block"><div class="rpt-card">${head(b)}${
        b.points.length ? lineSvg(b.points, b.domain, b.suffix) : `<p class="rpt-empty">No attendance data for this selection.</p>`
      }</div></section>`;

    case "donut": {
      const total = b.slices.reduce((a, s) => a + s.value, 0);
      const body = b.note
        ? `<p class="rpt-empty">${esc(b.note)}</p>`
        : `<div class="rpt-donut">${donutSvg(b.slices, b.center)}<ul class="rpt-legend">${b.slices
            .map((s) => `<li><i style="background:${s.color}"></i><span class="n">${esc(s.name)}</span><span class="v">${s.value} · ${pct(s.value, total)}%</span></li>`)
            .join("")}</ul></div>`;
      return `<section class="rpt-block"><div class="rpt-card">${head(b)}${body}</div></section>`;
    }

    case "table": {
      const cell = (v: Cell, i: number) => {
        const cls = b.numeric.includes(i) ? ' class="num"' : "";
        const inner = b.columns[i] === "Risk" && typeof v === "string" ? `<span class="rpt-risk rpt-risk--${esc(v)}">${esc(v)}</span>` : esc(v);
        return `<td${cls}>${inner}</td>`;
      };
      const body = b.rows.length
        ? b.rows.map((r) => `<tr>${r.map(cell).join("")}</tr>`).join("")
        : `<tr><td colspan="${b.columns.length}"><p class="rpt-empty">${esc(b.empty)}</p></td></tr>`;
      return `<section class="rpt-block rpt-block--table">${head(b)}<table><thead><tr>${b.columns
        .map((c, i) => `<th${b.numeric.includes(i) ? ' class="num"' : ""}>${esc(c)}</th>`)
        .join("")}</tr></thead><tbody>${body}</tbody></table></section>`;
    }

    case "ranked":
      return `<section class="rpt-block">${head(b)}<div class="rpt-ranked">${b.groups
        .map(
          (g) =>
            `<div class="rpt-group"><h3>${esc(g.title)}<span>${esc(g.valueLabel)}</span></h3>${
              g.rows.length
                ? `<ol>${g.rows
                    .map(
                      (r, i) =>
                        `<li><span class="rk rk--${i}">${i + 1}</span><span class="nm"><b>${esc(r.name)}</b><small>${esc(r.meta)}</small></span><span class="vl">${esc(r.display)}</span></li>`
                    )
                    .join("")}</ol>`
                : `<p class="rpt-empty">No data for this selection.</p>`
            }</div>`
        )
        .join("")}</div></section>`;
  }
}

/* --- SVG charts ----------------------------------------------------- */

function lineSvg(points: { label: string; value: number }[], domain: [number, number], suffix: string): string {
  const W = 640;
  const H = 180;
  const padL = 36;
  const padR = 12;
  const padT = 10;
  const padB = 24;
  const lo = Math.min(domain[0], ...points.map((p) => p.value));
  const hi = Math.max(domain[1], ...points.map((p) => p.value));
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const x = (i: number) => padL + (points.length > 1 ? (i / (points.length - 1)) * innerW : innerW / 2);
  const y = (v: number) => padT + (1 - (v - lo) / (hi - lo || 1)) * innerH;

  const ticks = 4;
  const grid = Array.from({ length: ticks + 1 }, (_, i) => {
    const v = lo + ((hi - lo) * i) / ticks;
    const yy = y(v);
    return `<line x1="${padL}" x2="${W - padR}" y1="${yy.toFixed(1)}" y2="${yy.toFixed(1)}" stroke="#e9edf1" /><text x="${padL - 6}" y="${(yy + 3.5).toFixed(1)}" text-anchor="end" font-size="9" fill="#5b6572">${Math.round(v)}${suffix}</text>`;
  }).join("");

  const every = Math.max(1, Math.ceil(points.length / 10));
  const labels = points
    .map((p, i) => (i % every === 0 || i === points.length - 1 ? `<text x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="9" fill="#5b6572">${esc(p.label)}</text>` : ""))
    .join("");

  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${path} L${x(points.length - 1).toFixed(1)},${(padT + innerH).toFixed(1)} L${x(0).toFixed(1)},${(padT + innerH).toFixed(1)} Z`;
  const dots = points.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="2.4" fill="#fff" stroke="${COLORS.green}" stroke-width="1.6" />`).join("");

  return `<svg class="rpt-chart" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Attendance trend"><defs><linearGradient id="rptFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${COLORS.green}" stop-opacity="0.22" /><stop offset="100%" stop-color="${COLORS.green}" stop-opacity="0" /></linearGradient></defs>${grid}<path d="${area}" fill="url(#rptFill)" /><path d="${path}" fill="none" stroke="${COLORS.green}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" />${dots}${labels}</svg>`;
}

function donutSvg(slices: Slice[], center?: { value: string; label: string }): string {
  const size = 150;
  const r = 56;
  const stroke = 18;
  const c = 2 * Math.PI * r;
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const gap = slices.filter((s) => s.value > 0).length > 1 ? 2.5 : 0;
  let offset = 0;
  const arcs = slices
    .filter((s) => s.value > 0)
    .map((s) => {
      const len = (s.value / total) * c;
      const el = `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${stroke}" stroke-dasharray="${Math.max(0, len - gap).toFixed(2)} ${(c - Math.max(0, len - gap)).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" />`;
      offset += len;
      return el;
    })
    .join("");
  const centre = center
    ? `<text x="${size / 2}" y="${size / 2 - 2}" text-anchor="middle" font-size="20" font-weight="700" fill="#121920">${esc(center.value)}</text><text x="${size / 2}" y="${size / 2 + 13}" text-anchor="middle" font-size="9" fill="#5b6572">${esc(center.label)}</text>`
    : "";
  return `<svg class="rpt-chart" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" role="img"><g transform="rotate(-90 ${size / 2} ${size / 2})"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#eef1f4" stroke-width="${stroke}" />${arcs}</g>${centre}</svg>`;
}

/* ------------------------------------------------------------------ */
/* Excel                                                                */
/* ------------------------------------------------------------------ */

export function excelSections(doc: ReportDocument): { title: string; columns: string[]; rows: Cell[][] }[] {
  const out: { title: string; columns: string[]; rows: Cell[][] }[] = [];
  for (const b of doc.blocks) {
    switch (b.kind) {
      case "stats":
        out.push({ title: b.title, columns: ["Metric", "Value", "Note"], rows: b.items.map((s) => [s.label, s.value, s.hint ?? ""]) });
        break;
      case "line":
        out.push({ title: b.title, columns: ["Period", `Attendance rate (${b.suffix})`], rows: b.points.map((p) => [p.label, p.value]) });
        break;
      case "donut": {
        const total = b.slices.reduce((a, s) => a + s.value, 0);
        out.push({ title: b.title, columns: ["Category", "Count", "Share (%)"], rows: b.slices.map((s) => [s.name, s.value, pct(s.value, total)]) });
        break;
      }
      case "table":
        out.push({ title: b.title, columns: b.columns, rows: b.rows });
        break;
      case "ranked":
        for (const g of b.groups) out.push({ title: `${b.title} · ${g.title}`, columns: ["Rank", "Student", "Class / course", g.valueLabel], rows: g.rows.map((r, i) => [i + 1, r.name, r.meta, r.display]) });
        break;
    }
  }
  return out;
}
