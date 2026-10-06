import type { AllowanceType, ChallengeTeam, CodingChallenge, Student } from "./types";
import { ATTENDANCE, EXTRA_CLASSES } from "./academics";
import { STUDENTS } from "./students";

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

/* ------------------------------------------------------------------ */
/* Coding challenge (one-off reward)                                   */
/* ------------------------------------------------------------------ */

export const CHALLENGE_TYPE_ID = "ALW-CHALLENGE";

function buildDefaultTeams(): ChallengeTeam[] {
  // Basic-course cohort = active Generation 13 students, grouped into teams of ≤ 8.
  const basic = STUDENTS.filter((s) => s.status === "active" && s.generation === 13);
  const names = ["Team Angkor", "Team Bayon", "Team Mekong", "Team Tonle", "Team Kirirom"];
  const size = 8;
  const teams: ChallengeTeam[] = [];
  for (let i = 0; i < basic.length; i += size) {
    const idx = teams.length;
    teams.push({
      id: `TEAM-${idx + 1}`,
      name: names[idx] ?? `Team ${idx + 1}`,
      memberIds: basic.slice(i, i + size).map((s) => s.id),
      rank: idx === 0 ? 2 : idx === 1 ? 1 : idx === 2 ? 3 : null,
    });
  }
  return teams;
}

export const CODING_CHALLENGE: CodingChallenge = {
  enabled: true,
  name: "Basic Course Coding Challenge",
  courseLabel: "Basic course · Generation 13",
  date: "2026-09-25",
  payoutMonth: "2026-09",
  maxTeamSize: 10,
  rewards: [
    { place: 1, amount: 150 },
    { place: 2, amount: 100 },
    { place: 3, amount: 50 },
  ],
  teams: buildDefaultTeams(),
};

export const ordinal = (n: number) => (n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);

export function teamPrize(team: ChallengeTeam, challenge: CodingChallenge): number {
  if (!team.rank) return 0;
  return challenge.rewards.find((r) => r.place === team.rank)?.amount ?? 0;
}

/** Amount a single member receives: the team prize split equally among its members. */
export function memberPrize(team: ChallengeTeam, challenge: CodingChallenge): number {
  const prize = teamPrize(team, challenge);
  if (!prize || team.memberIds.length === 0) return 0;
  return Math.round((prize / team.memberIds.length) * 100) / 100;
}

export function challengeAppliesTo(challenge: CodingChallenge | undefined, month: string): challenge is CodingChallenge {
  return !!challenge && challenge.enabled && challenge.payoutMonth === month;
}

/** Column headers for a monthly allowance table (enabled types + challenge when it pays out that month). */
export function allowanceColumns(types: AllowanceType[], month: string, challenge?: CodingChallenge): { id: string; name: string }[] {
  const cols = types.filter((t) => t.enabled).map((t) => ({ id: t.id, name: t.name }));
  if (challengeAppliesTo(challenge, month)) cols.push({ id: CHALLENGE_TYPE_ID, name: "Coding challenge reward" });
  return cols;
}

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

export function computeMonthlyAllowance(
  student: Student,
  month: string,
  types: AllowanceType[],
  challenge?: CodingChallenge
): MonthlyAllowance {
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

  if (challengeAppliesTo(challenge, month)) {
    const team = challenge.teams.find((t) => t.memberIds.includes(student.id));
    const amount = team ? memberPrize(team, challenge) : 0;
    lines.push({
      typeId: CHALLENGE_TYPE_ID,
      key: "challenge",
      name: "Coding challenge reward",
      amount,
      note: team?.rank ? `${team.name} · ${ordinal(team.rank)} place` : team ? `${team.name} · not placed` : "not a participant",
    });
  }

  const total = Math.round(lines.reduce((acc, l) => acc + l.amount, 0) * 100) / 100;
  return { studentId: student.id, month, lines, total, extraHours, attendanceRate };
}