import type {
  AttendanceRecord,
  AttendanceStatus,
  ExtraClassRecord,
  MonthlyScore,
  RiskAssessment,
  RiskLevel,
  ScoreRecord,
  StudentStats,
} from "./types";
import { STUDENTS, STUDENT_PROFILES } from "./students";
import { courseByCode } from "./users";
import { TODAY, mulberry32, pad, randInt, weekdaysBetween, clamp } from "./seed";

export const TERM_START = "2026-07-06";
export const SCHOOL_DAYS = weekdaysBetween(TERM_START, TODAY);
export const MONTHS = ["2026-07", "2026-08", "2026-09", "2026-10"];

/* ------------------------------------------------------------------ */
/* Attendance                                                          */
/* ------------------------------------------------------------------ */

function buildAttendance(): AttendanceRecord[] {
  const rng = mulberry32(777);
  const out: AttendanceRecord[] = [];
  const active = STUDENTS.filter((s) => s.status === "active");

  for (const date of SCHOOL_DAYS) {
    for (const s of active) {
      const p = STUDENT_PROFILES[s.id];
      const r = rng();
      let status: AttendanceStatus;
      if (r < p.presence) {
        status = rng() < p.lateness ? "Late" : "Present";
      } else {
        status = rng() < 0.4 ? "Permission" : "Absent";
      }
      const inMin = status === "Late" ? randInt(rng, 16, 55) : randInt(rng, -12, 9);
      const checkIn = status === "Absent" || status === "Permission" ? null : `08:${pad(clamp(30 + inMin, 0, 59))}`;
      const checkOut = checkIn ? `17:${pad(randInt(rng, 0, 35))}` : null;
      out.push({
        id: `ATT-${s.id}-${date}`,
        studentId: s.id,
        date,
        status,
        checkIn,
        checkOut,
      });
    }
  }
  return out;
}

export const ATTENDANCE: AttendanceRecord[] = buildAttendance();

/* ------------------------------------------------------------------ */
/* Scores                                                              */
/* ------------------------------------------------------------------ */

function buildScores(): { scores: ScoreRecord[]; monthly: MonthlyScore[] } {
  const rng = mulberry32(4242);
  const scores: ScoreRecord[] = [];
  const monthly: MonthlyScore[] = [];

  for (const s of STUDENTS) {
    const p = STUDENT_PROFILES[s.id];
    const course = courseByCode(s.courseCode);
    for (const subject of course.subjects) {
      const jitter = () => clamp(Math.round(p.base + (rng() * 24 - 12)), 20, 100);
      scores.push({
        id: `SCR-${s.id}-${subject.replace(/\s+/g, "")}`,
        studentId: s.id,
        subject,
        assignment: jitter(),
        quiz: jitter(),
        exam: jitter(),
        homework: jitter(),
      });
    }
    MONTHS.forEach((month, idx) => {
      const avg = clamp(Math.round(p.base + p.drift * (idx - 1) + (rng() * 6 - 3)), 20, 100);
      monthly.push({ studentId: s.id, month, average: avg });
    });
  }
  return { scores, monthly };
}

const built = buildScores();
export const SCORES: ScoreRecord[] = built.scores;
export const MONTHLY_SCORES: MonthlyScore[] = built.monthly;

export const scoreTotal = (r: ScoreRecord) => r.assignment + r.quiz + r.exam + r.homework;
export const scoreAverage = (r: ScoreRecord) => Math.round((scoreTotal(r) / 4) * 10) / 10;

/* ------------------------------------------------------------------ */
/* Extra classes                                                       */
/* ------------------------------------------------------------------ */

function buildExtraClasses(): ExtraClassRecord[] {
  const rng = mulberry32(9090);
  const out: ExtraClassRecord[] = [];
  const active = STUDENTS.filter((s) => s.status === "active");
  const days = SCHOOL_DAYS.filter((d) => d >= "2026-08-03");

  for (const s of active) {
    const course = courseByCode(s.courseCode);
    const sessions = randInt(rng, 0, 9);
    for (let i = 0; i < sessions; i++) {
      const date = days[randInt(rng, 0, days.length - 1)];
      out.push({
        id: `EXC-${s.id}-${i}`,
        studentId: s.id,
        date,
        hours: [1.5, 2, 2, 2.5, 3][randInt(rng, 0, 4)],
        subject: course.subjects[randInt(rng, 0, course.subjects.length - 1)],
        instructorId: course.instructorId,
        status: date > "2026-09-28" && rng() < 0.5 ? "pending" : "approved",
      });
    }
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const EXTRA_CLASSES: ExtraClassRecord[] = buildExtraClasses();

/* ------------------------------------------------------------------ */
/* Derived statistics                                                  */
/* ------------------------------------------------------------------ */

const statsCache = new Map<string, StudentStats>();

export function getStudentStats(studentId: string): StudentStats {
  const cached = statsCache.get(studentId);
  if (cached) return cached;

  const att = ATTENDANCE.filter((a) => a.studentId === studentId);
  const present = att.filter((a) => a.status === "Present").length;
  const late = att.filter((a) => a.status === "Late").length;
  const absent = att.filter((a) => a.status === "Absent").length;
  const permission = att.filter((a) => a.status === "Permission").length;
  const attendanceRate = att.length ? Math.round(((present + late) / att.length) * 1000) / 10 : 100;

  const sc = SCORES.filter((s) => s.studentId === studentId);
  const averageScore = sc.length ? Math.round((sc.reduce((acc, r) => acc + scoreAverage(r), 0) / sc.length) * 10) / 10 : 0;

  const monthly = MONTHLY_SCORES.filter((m) => m.studentId === studentId);
  const last = monthly[monthly.length - 1]?.average ?? averageScore;
  const prev = monthly[monthly.length - 2]?.average ?? last;
  const trend = Math.round((last - prev) * 10) / 10;

  const extraClassHours = EXTRA_CLASSES.filter((e) => e.studentId === studentId && e.status === "approved").reduce(
    (acc, e) => acc + e.hours,
    0
  );

  const stats: StudentStats = { attendanceRate, averageScore, trend, extraClassHours, present, absent, late, permission };
  statsCache.set(studentId, stats);
  return stats;
}

export function assessRisk(studentId: string): RiskAssessment | null {
  const student = STUDENTS.find((s) => s.id === studentId);
  if (!student || student.status !== "active") return null;
  const stats = getStudentStats(studentId);
  const reasons: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  if (stats.attendanceRate < 75) {
    score += 2;
    reasons.push(`Attendance rate is critically low at ${stats.attendanceRate}%`);
    suggestions.push("Schedule a one-to-one check-in with the student to understand attendance barriers");
    suggestions.push("Notify the class instructor and apply the HRD attendance warning policy");
  } else if (stats.attendanceRate < 85) {
    score += 1;
    reasons.push(`Attendance rate is below threshold (${stats.attendanceRate}% < 85%)`);
    suggestions.push("Send an automated attendance reminder and monitor the next two weeks");
  }

  if (stats.late >= 10) {
    score += 1;
    reasons.push(`${stats.late} late arrivals recorded this term`);
    suggestions.push("Review commute or schedule conflicts; consider adjusting extra-class timing");
  }

  if (stats.averageScore < 55) {
    score += 2;
    reasons.push(`Average score is critically low (${stats.averageScore})`);
    suggestions.push("Assign a peer tutor and enrol the student in remedial extra-class sessions");
  } else if (stats.averageScore < 65) {
    score += 1;
    reasons.push(`Average score is below the 65 threshold (${stats.averageScore})`);
    suggestions.push("Recommend targeted extra-class hours in the weakest subject");
  }

  if (stats.trend <= -6) {
    score += 1;
    reasons.push(`Academic performance declining (${stats.trend} points month-over-month)`);
    suggestions.push("Ask the instructor for private feedback on recent engagement and motivation");
  }

  if (score === 0) return null;
  const level: RiskLevel = score >= 4 ? "High" : score >= 2 ? "Medium" : "Low";
  const alert =
    level === "High"
      ? `${student.name} requires immediate attention: ${reasons[0].toLowerCase()}.`
      : level === "Medium"
        ? `${student.name} is showing warning signs: ${reasons[0].toLowerCase()}.`
        : `${student.name} should be monitored: ${reasons[0].toLowerCase()}.`;

  return { studentId, level, score, reasons, alert, suggestions, stats };
}

export const RISK_ASSESSMENTS: RiskAssessment[] = STUDENTS.map((s) => assessRisk(s.id)).filter(
  (r): r is RiskAssessment => r !== null
);

/** Attendance rate series for charts. */
export function attendanceSeries(
  granularity: "daily" | "weekly" | "monthly",
  filter?: (r: AttendanceRecord) => boolean
): { label: string; rate: number }[] {
  const records = filter ? ATTENDANCE.filter(filter) : ATTENDANCE;
  const buckets = new Map<string, { total: number; present: number }>();

  for (const r of records) {
    let key: string;
    if (granularity === "daily") key = r.date;
    else if (granularity === "monthly") key = r.date.slice(0, 7);
    else {
      const idx = SCHOOL_DAYS.indexOf(r.date);
      key = `W${pad(Math.floor(idx / 5) + 1)}`;
    }
    const b = buckets.get(key) ?? { total: 0, present: 0 };
    b.total += 1;
    if (r.status === "Present" || r.status === "Late") b.present += 1;
    buckets.set(key, b);
  }

  const out = Array.from(buckets.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([label, b]) => ({ label, rate: Math.round((b.present / b.total) * 1000) / 10 }));
  return granularity === "daily" ? out.slice(-20) : out;
}
