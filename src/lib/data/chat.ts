import type { ChatAttachment, ChatMessage, ChatScope, ChatSession, Role } from "./types";
import { STUDENTS, CLASSROOMS } from "./students";
import { ATTENDANCE, EXTRA_CLASSES, RISK_ASSESSMENTS, getStudentStats } from "./academics";
import { ALUMNI } from "./alumni";
import { FILES } from "./files";
import { courseByCode } from "./users";

export const MAX_SESSIONS = 10;

export const INITIAL_SESSIONS: ChatSession[] = [
  {
    id: "CHAT-001",
    title: "Gen 13 attendance overview",
    createdAt: "2026-10-05T09:12:00",
    updatedAt: "2026-10-05T09:15:00",
    scope: { type: "general" },
    messages: [
      { id: "m1", role: "user", content: "How is attendance looking for Generation 13 this month?", createdAt: "2026-10-05T09:12:00" },
      {
        id: "m2",
        role: "assistant",
        content:
          "Generation 13 attendance for October is holding at about 88%. SP13-A is the strongest classroom; DO13 has the most permission days. Two students are below the 85% threshold and have been flagged in the at-risk list.",
        createdAt: "2026-10-05T09:12:30",
        sources: ["RDA API · attendance feed", "Attendance & Academic Warning Rules.docx"],
      },
    ],
  },
  {
    id: "CHAT-002",
    title: "Allowance policy questions",
    createdAt: "2026-10-02T14:40:00",
    updatedAt: "2026-10-02T14:44:00",
    scope: { type: "folder", folderId: "F-POL", fileIds: ["F-POL-1"] },
    messages: [
      { id: "m1", role: "user", content: "What are the IT score allowance tiers?", createdAt: "2026-10-02T14:40:00" },
      {
        id: "m2",
        role: "assistant",
        content:
          "According to Student Allowance Policy 2026: students scoring ≥90 receive $100, ≥80 receive $70 and ≥70 receive $40 per month. Scores below 70 do not qualify.",
        createdAt: "2026-10-02T14:40:20",
        sources: ["Student Allowance Policy 2026.pdf · p.3"],
      },
    ],
  },
  {
    id: "CHAT-003",
    title: "Alumni in fintech",
    createdAt: "2026-09-29T11:00:00",
    updatedAt: "2026-09-29T11:02:00",
    scope: { type: "general" },
    messages: [
      { id: "m1", role: "user", content: "List alumni currently working in fintech", createdAt: "2026-09-29T11:00:00" },
      {
        id: "m2",
        role: "assistant",
        content: "Here are the alumni whose current role is in Fintech & Banking.",
        createdAt: "2026-09-29T11:00:25",
        attachment: {
          kind: "table",
          title: "Alumni in Fintech & Banking",
          columns: ["Name", "Generation", "Company", "Title"],
          rows: ALUMNI.filter((a) => a.industry === "Fintech & Banking")
            .slice(0, 6)
            .map((a) => [a.name, `Gen ${a.generation}`, a.jobs[a.jobs.length - 1]?.company ?? "—", a.jobs[a.jobs.length - 1]?.title ?? "—"]),
        },
      },
    ],
  },
];

export const SUGGESTED_PROMPTS = [
  "Show attendance breakdown for this term",
  "Who are the top 5 students by course score?",
  "Which students are at risk right now?",
  "Summarize alumni employment status",
  "Draft an email to students with low attendance",
  "Generate a weekly summary file",
];

function pct(n: number, d: number) {
  return d ? Math.round((n / d) * 1000) / 10 : 0;
}

/**
 * Mock RAG + local LLM engine.
 * Produces a deterministic reply based on keywords so the UI can be exercised
 * without a backend. A real implementation calls the FastAPI AI service.
 */
export function generateReply(prompt: string, scope: ChatScope, role: Role): Omit<ChatMessage, "id" | "createdAt"> {
  const q = prompt.toLowerCase();
  const now = { role: "assistant" as const };

  if (scope.type === "folder") {
    const folder = FILES.find((f) => f.id === scope.folderId);
    const files = FILES.filter((f) => scope.fileIds.includes(f.id));
    const names = files.map((f) => f.name);
    if (/slide|pptx|presentation/.test(q)) {
      return {
        ...now,
        content: `I generated a slide deck from ${names.length} document${names.length === 1 ? "" : "s"} in "${folder?.name}". It contains an overview, key concepts, and a summary slide per source file.`,
        attachment: { kind: "file", name: `${(folder?.name ?? "Folder").replace(/\s+/g, "_")}_Slides.pptx`, ext: "pptx", content: `# ${folder?.name}\n\nGenerated slides from: ${names.join(", ")}` },
        sources: names,
      };
    }
    if (/summar/.test(q)) {
      return {
        ...now,
        content: `Summary of the selected files in "${folder?.name}":\n\n${names.map((n) => `• ${n} — covers the core concepts, worked examples and a practice checklist.`).join("\n")}\n\nAsk me to generate slides, a study guide, or quiz questions from these files.`,
        sources: names,
      };
    }
    return {
      ...now,
      content: `Answering strictly from ${names.length} selected file${names.length === 1 ? "" : "s"} in "${folder?.name}". Based on ${names[0] ?? "the selected content"}, the relevant section explains the topic you asked about in detail, including the policy thresholds and procedures. Would you like a short summary or a generated slide deck?`,
      sources: names.slice(0, 3),
    };
  }

  // ---------- general assistant ----------
  if (/attendance/.test(q) && !/email|mail/.test(q)) {
    const counts = { Present: 0, Absent: 0, Late: 0, Permission: 0 };
    ATTENDANCE.forEach((a) => (counts[a.status] += 1));
    const total = ATTENDANCE.length;
    const attachment: ChatAttachment = {
      kind: "chart",
      chartType: "donut",
      title: "Attendance breakdown · current term",
      data: Object.entries(counts).map(([name, value]) => ({ name, value })),
    };
    return {
      ...now,
      content: `Across ${total.toLocaleString()} attendance records this term: ${pct(counts.Present, total)}% present, ${pct(counts.Late, total)}% late, ${pct(counts.Absent, total)}% absent and ${pct(counts.Permission, total)}% with permission. Overall attendance rate (present + late) is ${pct(counts.Present + counts.Late, total)}%.`,
      attachment,
      sources: ["RDA API · attendance feed"],
    };
  }

  if (/top\s*5|top five|best students|highest/.test(q)) {
    const active = STUDENTS.filter((s) => s.status === "active");
    const ranked = active
      .map((s) => ({ s, avg: getStudentStats(s.id).averageScore }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5);
    return {
      ...now,
      content: "Top 5 active students ranked by course average score.",
      attachment: {
        kind: "chart",
        chartType: "bar",
        title: "Top 5 students · course score",
        data: ranked.map((r) => ({ name: r.s.name, value: r.avg })),
      },
      sources: ["Assessment API · scores"],
    };
  }

  if (/at.?risk|warning|struggl/.test(q)) {
    const rows = RISK_ASSESSMENTS.sort((a, b) => b.score - a.score).slice(0, 8);
    return {
      ...now,
      content: `${RISK_ASSESSMENTS.length} students are currently flagged (${RISK_ASSESSMENTS.filter((r) => r.level === "High").length} high, ${RISK_ASSESSMENTS.filter((r) => r.level === "Medium").length} medium). The highest-priority cases are listed below; open the At-Risk page for AI-suggested support actions.`,
      attachment: {
        kind: "table",
        title: "Students requiring attention",
        columns: ["Student", "Class", "Attendance", "Avg score", "Trend", "Risk"],
        rows: rows.map((r) => {
          const s = STUDENTS.find((x) => x.id === r.studentId)!;
          return [s.name, s.classroom, `${r.stats.attendanceRate}%`, r.stats.averageScore, r.stats.trend, r.level];
        }),
      },
      sources: ["Risk engine · attendance + score trend"],
    };
  }

  if (/alumni|employment|graduate/.test(q) && role === "ADMIN") {
    const counts: Record<string, number> = {};
    ALUMNI.forEach((a) => (counts[a.employmentStatus] = (counts[a.employmentStatus] ?? 0) + 1));
    const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return {
      ...now,
      content: `Of ${ALUMNI.length} alumni on record, ${ranked.map(([k, v]) => `${v} are ${k.toLowerCase()}${k === "Banks" ? " staff" : ""}`).join(", ")}. The largest group is ${ranked[0][0]} (${Math.round((ranked[0][1] / ALUMNI.length) * 100)}%).`,
      attachment: {
        kind: "chart",
        chartType: "bar",
        title: "Alumni employment status",
        data: Object.entries(counts).map(([name, value]) => ({ name, value })),
      },
      sources: ["Alumni module", "Alumni_Employment_Survey_2026.xlsx"],
    };
  }

  if (/extra.?class|overtime|hours/.test(q)) {
    const byClass = CLASSROOMS.filter((c) => c.includes("13")).map((c) => ({
      name: c,
      value: EXTRA_CLASSES.filter((e) => e.status === "approved" && STUDENTS.find((s) => s.id === e.studentId)?.classroom === c).reduce((a, e) => a + e.hours, 0),
    }));
    return {
      ...now,
      content: `Approved extra-class hours this term total ${byClass.reduce((a, b) => a + b.value, 0)} hours across Generation 13. ${byClass.sort((a, b) => b.value - a.value)[0].name} has the most hours.`,
      attachment: { kind: "chart", chartType: "bar", title: "Extra-class hours by classroom", data: byClass },
      sources: ["Extra-class records"],
    };
  }

  if (/delete.*(email|mail)/.test(q)) {
    return {
      ...now,
      content: "I found a matching email in your sent folder. Deleting requires your confirmation.",
      attachment: { kind: "email-delete", subject: "Reminder: September overtime report", status: "pending" },
    };
  }

  if (/(write|draft|send).*(email|mail)|email.*(student|alumni|instructor)/.test(q)) {
    const target = /alumni/.test(q)
      ? { to: "alumni-gen12@alumni.hrd.local", subject: "Please update your profile information", body: "Dear alumni,\n\nWe are updating our records. Please take two minutes to confirm your current employer, job title, industry and contact details using the form link below.\n\nThank you,\nHRD Intelligence" }
      : {
          to: RISK_ASSESSMENTS.filter((r) => r.stats.attendanceRate < 85)
            .map((r) => STUDENTS.find((s) => s.id === r.studentId)?.email)
            .filter(Boolean)
            .join(", "),
          subject: "Attendance reminder – action required",
          body: "Dear student,\n\nOur records show your attendance has fallen below the 85% requirement this term. Please make every effort to attend all sessions. If there are circumstances affecting your attendance, contact the HRD office so we can support you.\n\nBest regards,\nHRD Administration",
        };
    return {
      ...now,
      content: "Here is a draft. Review it and confirm before I send it on your behalf.",
      attachment: { kind: "email-draft", ...target, status: "pending" },
    };
  }

  if (/file|report|export|txt|md|docx|pdf|pptx|generate/.test(q)) {
    const ext = (["pptx", "docx", "pdf", "md", "txt"] as const).find((e) => q.includes(e)) ?? "md";
    const lines = [
      "# Weekly HRD Summary",
      "",
      `Active students: ${STUDENTS.filter((s) => s.status === "active").length}`,
      `Flagged at-risk: ${RISK_ASSESSMENTS.length}`,
      `Approved extra-class hours: ${EXTRA_CLASSES.filter((e) => e.status === "approved").reduce((a, e) => a + e.hours, 0)}`,
      "",
      "Generated by HRD Intelligence (local LLM).",
    ];
    return {
      ...now,
      content: `I compiled a weekly summary and exported it as ${ext.toUpperCase()}.`,
      attachment: { kind: "file", name: `Weekly_Summary_2026-10-06.${ext}`, ext, content: lines.join("\n") },
      sources: ["Attendance feed", "Assessment API", "Extra-class records"],
    };
  }

  if (/policy|scholarship|benefit|faq|program|course/.test(q)) {
    return {
      ...now,
      content:
        "HRD scholars receive a monthly allowance package (meal, Korean language, IT score-based, extra-class, class leader and attitude allowances), free training in one of four tracks (Spring + Microservices, Data Analytics, Mobile Development, DevOps), and placement support after graduation. Attendance must stay above 85% and the monthly average above 65 to remain in good standing.",
      sources: ["HRD Program FAQ.md", "Student Allowance Policy 2026.pdf"],
    };
  }

  const match = STUDENTS.find((s) => q.includes(s.name.toLowerCase()) || q.includes(s.name.split(" ")[1]?.toLowerCase() ?? "§"));
  if (match) {
    const st = getStudentStats(match.id);
    return {
      ...now,
      content: `${match.name} (${match.classroom}, ${courseByCode(match.courseCode).name}) has an attendance rate of ${st.attendanceRate}%, an average score of ${st.averageScore} (${st.trend >= 0 ? "+" : ""}${st.trend} vs last month) and ${st.extraClassHours} approved extra-class hours.`,
      sources: ["Assessment API", "RDA API"],
    };
  }

  return {
    ...now,
    content:
      "I can help with student information, attendance and academic performance, extra-class activities and allowances, alumni profiles, and HRD policies. Try asking for an attendance breakdown, the top 5 students, who is at risk, or ask me to draft an email or generate a report file.",
  };
}
