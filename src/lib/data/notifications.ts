import type { Notification } from "./types";
import { RISK_ASSESSMENTS } from "./academics";
import { STUDENTS } from "./students";
import { ALUMNI } from "./alumni";

function studentName(id: string) {
  return STUDENTS.find((s) => s.id === id)?.name ?? id;
}

const lowAttendance = RISK_ASSESSMENTS.filter((r) => r.stats.attendanceRate < 85).slice(0, 3);
const declining = RISK_ASSESSMENTS.filter((r) => r.stats.trend <= -6).slice(0, 2);
const alumniUpdates = ALUMNI.filter((a) => a.updateRequest?.status === "completed").slice(0, 2);

export const NOTIFICATIONS: Notification[] = [
  ...lowAttendance.map<Notification>((r, i) => ({
    id: `NTF-LA-${i}`,
    type: "low-attendance",
    title: "Low attendance detected",
    message: `${studentName(r.studentId)} has an attendance rate of ${r.stats.attendanceRate}%, below the 85% threshold.`,
    roles: ["ADMIN", "INSTRUCTOR"],
    createdAt: `2026-10-0${6 - i}T08:${15 + i * 7}:00`,
    read: i > 0,
    link: `/students/${r.studentId}`,
    channel: ["in-app", "email"],
  })),
  ...declining.map<Notification>((r, i) => ({
    id: `NTF-DA-${i}`,
    type: "declining-academic",
    title: "Declining academic performance",
    message: `${studentName(r.studentId)}'s monthly average dropped ${Math.abs(r.stats.trend)} points. AI has drafted a warning for review.`,
    roles: ["ADMIN", "INSTRUCTOR"],
    createdAt: `2026-10-0${5 - i}T09:40:00`,
    read: false,
    link: `/at-risk`,
    channel: ["in-app", "email"],
  })),
  ...alumniUpdates.map<Notification>((a, i) => ({
    id: `NTF-AL-${i}`,
    type: "alumni-update",
    title: "Alumni profile updated",
    message: `${a.name} submitted the profile update form (${a.industry}, ${a.employmentStatus}).`,
    roles: ["ADMIN"],
    createdAt: `2026-10-0${4 - i}T14:05:00`,
    read: i === 1,
    link: `/alumni/${a.id}`,
    channel: ["in-app", "email"],
  })),
  {
    id: "NTF-OT-0",
    type: "overtime-reminder",
    title: "Extra-class request on your standby day",
    message: "3 students from SP13-A requested a Spring Cloud extra class this Thursday 17:30–19:30.",
    roles: ["INSTRUCTOR"],
    createdAt: "2026-10-06T07:30:00",
    read: false,
    link: "/notifications",
    channel: ["in-app", "email"],
  },
  {
    id: "NTF-OT-1",
    type: "overtime-reminder",
    title: "Overtime report due",
    message: "Please submit your September overtime report before Friday.",
    roles: ["INSTRUCTOR"],
    createdAt: "2026-10-02T16:00:00",
    read: true,
    channel: ["in-app"],
  },
  {
    id: "NTF-SYS-0",
    type: "system",
    title: "Weekly summary sent",
    message: "The Weekly Summary agent emailed the Gen 13 attendance, grades and extra-hours digest.",
    roles: ["ADMIN"],
    createdAt: "2026-10-02T18:00:00",
    read: true,
    link: "/agents",
    channel: ["in-app", "email"],
  },
  {
    id: "NTF-SYS-1",
    type: "system",
    title: "Feedback summary generated",
    message: "September instructor feedback report is ready in Reports 2026.",
    roles: ["ADMIN"],
    createdAt: "2026-10-01T06:00:00",
    read: true,
    link: "/files",
    channel: ["in-app"],
  },
];
