import type { AllowanceType, Student } from "./types";
import { ATTENDANCE, EXTRA_CLASSES } from "./academics";

export const ALLOWANCE_TYPES: AllowanceType[] = [
  {
    id: "ALW-MEAL",
    key: "meal",
    name: "Meal allowance",
    description: "Fixed monthly meal support for every active student.",
    basis: "fixed",
    amount: 50,
    enabled: true,
  },
  {
    id: "ALW-KOREAN",
    key: "korean",
    name: "Korean language allowance",
    description: "Paid to students who reach the required Korean class score.",
    basis: "score-range",
    amount: 0,
    ranges: [
      { min: 90, amount: 40 },
      { min: 75, amount: 25 },
      { min: 60, amount: 15 },
    ],
    enabled: true,
  },
  {
    id: "ALW-IT",
    key: "it",
    name: "IT score-based allowance",
    description: "Tiered allowance based on the monthly IT assessment score.",
    basis: "score-range",
    amount: 0,
    ranges: [
      { min: 90, amount: 100 },
      { min: 80, amount: 70 },
      { min: 70, amount: 40 },
    ],
    enabled: true,
  },
  {
    id: "ALW-EXTRA",
    key: "extra",
    name: "Extra-class allowance",
    description: "Calculated from approved extra-class hours recorded in the month.",
    basis: "per-hour",
    amount: 5,
    enabled: true,
  },
  {
    id: "ALW-LEADER",
    key: "leader",
    name: "Class leader allowance",
    description: "Paid to the designated leader of each classroom.",
    basis: "role",
    amount: 20,
    enabled: true,
  },
  {
    id: "ALW-ATTITUDE",
    key: "attitude",
    name: "Attitude & attendance allowance",
    description: "Rewards consistent attendance; tiers are based on the monthly attendance rate.",
    basis: "attendance-range",
    amount: 0,
    ranges: [
      { min: 95, amount: 30 },
      { min: 90, amount: 15 },
    ],
    enabled: true,
  },
  {
    id: "ALW-OTHER",
    key: "other",
    name: "Transportation support",
    description: "Other HRD-provided allowance.",
    basis: "fixed",
    amount: 20,
    enabled: false,
  },
];

export const ALLOWANCE_MONTHS = ["2026-07", "2026-08", "2026-09", "2026-10"];

export interface AllowanceLine {
  typeId: string;
  key: string;
  name: string;
  amount: number;
  note: string;
}

export interface MonthlyAllowance {
  studentId: string;
  month: string;
  lines: AllowanceLine[];
  total: number;
  extraHours: number;
  attendanceRate: number;
}

function rangeAmount(ranges: { min: number; amount: number }[] | undefined, value: number): number {
  if (!ranges) return 0;
  const sorted = [...ranges].sort((a, b) => b.min - a.min);
  for (const r of sorted) if (value >= r.min) return r.amount;
  return 0;
}

export function monthAttendanceRate(studentId: string, month: string): number {
  const rows = ATTENDANCE.filter((a) => a.studentId === studentId && a.date.startsWith(month));
  if (!rows.length) return 0;
  const present = rows.filter((r) => r.status === "Present" || r.status === "Late").length;
  return Math.round((present / rows.length) * 1000) / 10;
}

export function monthExtraHours(studentId: string, month: string): number {
  return EXTRA_CLASSES.filter(
    (e) => e.studentId === studentId && e.status === "approved" && e.date.startsWith(month)
  ).reduce((acc, e) => acc + e.hours, 0);
}

export function computeMonthlyAllowance(student: Student, month: string, types: AllowanceType[]): MonthlyAllowance {
  const attendanceRate = monthAttendanceRate(student.id, month);
  const extraHours = monthExtraHours(student.id, month);
  const lines: AllowanceLine[] = [];

  for (const t of types) {
    if (!t.enabled) continue;
    let amount = 0;
    let note = "";
    switch (t.basis) {
      case "fixed":
        amount = t.amount;
        note = "Fixed";
        break;
      case "per-hour":
        amount = Math.round(extraHours * t.amount * 100) / 100;
        note = `${extraHours}h × $${t.amount}`;
        break;
      case "score-range": {
        const value = t.key === "korean" ? student.koreanScore : student.itScore;
        amount = rangeAmount(t.ranges, value);
        note = `score ${value}`;
        break;
      }
      case "attendance-range":
        amount = rangeAmount(t.ranges, attendanceRate);
        note = `attendance ${attendanceRate}%`;
        break;
      case "role":
        amount = student.isClassLeader ? t.amount : 0;
        note = student.isClassLeader ? "Class leader" : "—";
        break;
    }
    lines.push({ typeId: t.id, key: t.key, name: t.name, amount, note });
  }

  const total = Math.round(lines.reduce((acc, l) => acc + l.amount, 0) * 100) / 100;
  return { studentId: student.id, month, lines, total, extraHours, attendanceRate };
}
