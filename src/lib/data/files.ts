import type { FileNode } from "./types";

export const SUPPORTED_EXTENSIONS = ["txt", "md", "xlsx", "csv", "pdf", "docx", "pptx", "png", "jpeg"] as const;
export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

const ADMIN = "USR-ADMIN-01";
const INS_SP = "USR-INS-01";
const INS_DA = "USR-INS-02";
const INS_MB = "USR-INS-03";

export const FILES: FileNode[] = [
  // ---- Admin folders -------------------------------------------------
  { id: "F-POL", name: "HRD Policies", kind: "folder", ownerId: ADMIN, parentId: null, createdAt: "2026-01-12", updatedAt: "2026-09-02", shares: [{ userId: INS_SP, permission: "viewer" }, { userId: INS_DA, permission: "viewer" }, { userId: INS_MB, permission: "viewer" }, { userId: "USR-INS-04", permission: "viewer" }] },
  { id: "F-POL-1", name: "Student Allowance Policy 2026.pdf", kind: "file", ext: "pdf", size: 812_000, ownerId: ADMIN, parentId: "F-POL", createdAt: "2026-01-12", updatedAt: "2026-01-12", shares: [] },
  { id: "F-POL-2", name: "Attendance & Academic Warning Rules.docx", kind: "file", ext: "docx", size: 96_000, ownerId: ADMIN, parentId: "F-POL", createdAt: "2026-02-20", updatedAt: "2026-09-02", shares: [] },
  { id: "F-POL-3", name: "HRD Program FAQ.md", kind: "file", ext: "md", size: 14_000, ownerId: ADMIN, parentId: "F-POL", createdAt: "2026-03-01", updatedAt: "2026-03-01", shares: [] },
  { id: "F-POL-4", name: "Scholarship & Benefits Overview.pptx", kind: "file", ext: "pptx", size: 2_400_000, ownerId: ADMIN, parentId: "F-POL", createdAt: "2026-03-14", updatedAt: "2026-03-14", shares: [] },

  { id: "F-G13", name: "Generation 13 Records", kind: "folder", ownerId: ADMIN, parentId: null, createdAt: "2026-02-02", updatedAt: "2026-10-01", shares: [{ userId: INS_SP, permission: "editor" }] },
  { id: "F-G13-1", name: "Gen13_Enrollment_List.xlsx", kind: "file", ext: "xlsx", size: 188_000, ownerId: ADMIN, parentId: "F-G13", createdAt: "2026-02-02", updatedAt: "2026-02-02", shares: [] },
  { id: "F-G13-2", name: "Attendance_Export_Sep2026.csv", kind: "file", ext: "csv", size: 54_000, ownerId: ADMIN, parentId: "F-G13", createdAt: "2026-10-01", updatedAt: "2026-10-01", shares: [] },
  { id: "F-G13-3", name: "Midterm_Scores_Gen13.xlsx", kind: "file", ext: "xlsx", size: 210_000, ownerId: ADMIN, parentId: "F-G13", createdAt: "2026-09-18", updatedAt: "2026-09-18", shares: [] },
  { id: "F-G13-SCAN", name: "Scanned Forms", kind: "folder", ownerId: ADMIN, parentId: "F-G13", createdAt: "2026-02-10", updatedAt: "2026-08-22", shares: [] },
  { id: "F-G13-SCAN-1", name: "Permission_Form_Sokha.png", kind: "file", ext: "png", size: 1_300_000, ownerId: ADMIN, parentId: "F-G13-SCAN", createdAt: "2026-08-22", updatedAt: "2026-08-22", shares: [] },
  { id: "F-G13-SCAN-2", name: "Enrollment_Agreement_Scan.jpeg", kind: "file", ext: "jpeg", size: 2_100_000, ownerId: ADMIN, parentId: "F-G13-SCAN", createdAt: "2026-02-10", updatedAt: "2026-02-10", shares: [] },

  { id: "F-ALM", name: "Alumni Documents", kind: "folder", ownerId: ADMIN, parentId: null, createdAt: "2025-12-05", updatedAt: "2026-09-28", shares: [] },
  { id: "F-ALM-1", name: "Alumni_Employment_Survey_2026.xlsx", kind: "file", ext: "xlsx", size: 320_000, ownerId: ADMIN, parentId: "F-ALM", createdAt: "2026-06-30", updatedAt: "2026-09-28", shares: [] },
  { id: "F-ALM-2", name: "Profile_Update_Email_Template.txt", kind: "file", ext: "txt", size: 3_000, ownerId: ADMIN, parentId: "F-ALM", createdAt: "2025-12-05", updatedAt: "2026-04-11", shares: [] },

  { id: "F-REP", name: "Reports 2026", kind: "folder", ownerId: ADMIN, parentId: null, createdAt: "2026-01-05", updatedAt: "2026-10-03", shares: [] },
  { id: "F-REP-1", name: "Weekly_Summary_2026-10-02.pdf", kind: "file", ext: "pdf", size: 410_000, ownerId: ADMIN, parentId: "F-REP", createdAt: "2026-10-03", updatedAt: "2026-10-03", shares: [] },
  { id: "F-REP-2", name: "Feedback_Summary_September.docx", kind: "file", ext: "docx", size: 150_000, ownerId: ADMIN, parentId: "F-REP", createdAt: "2026-10-01", updatedAt: "2026-10-01", shares: [] },
  { id: "F-REP-3", name: "Allowance_Report_Sep2026.csv", kind: "file", ext: "csv", size: 22_000, ownerId: ADMIN, parentId: "F-REP", createdAt: "2026-10-01", updatedAt: "2026-10-01", shares: [] },

  // ---- Instructor folders --------------------------------------------
  { id: "F-SP", name: "Spring Teaching Materials", kind: "folder", ownerId: INS_SP, parentId: null, createdAt: "2026-02-03", updatedAt: "2026-10-02", shares: [{ userId: ADMIN, permission: "viewer" }] },
  { id: "F-SP-1", name: "Week01_Java_Core.pptx", kind: "file", ext: "pptx", size: 3_800_000, ownerId: INS_SP, parentId: "F-SP", createdAt: "2026-02-03", updatedAt: "2026-02-03", shares: [] },
  { id: "F-SP-2", name: "Week05_Spring_Boot_Lab.md", kind: "file", ext: "md", size: 22_000, ownerId: INS_SP, parentId: "F-SP", createdAt: "2026-03-10", updatedAt: "2026-03-12", shares: [] },
  { id: "F-SP-3", name: "Spring_Cloud_Lesson_Notes.docx", kind: "file", ext: "docx", size: 180_000, ownerId: INS_SP, parentId: "F-SP", createdAt: "2026-09-15", updatedAt: "2026-10-02", shares: [] },
  { id: "F-SP-4", name: "Microservices_Reference.pdf", kind: "file", ext: "pdf", size: 5_200_000, ownerId: INS_SP, parentId: "F-SP", createdAt: "2026-09-20", updatedAt: "2026-09-20", shares: [] },

  { id: "F-DA", name: "Data Analytics Materials", kind: "folder", ownerId: INS_DA, parentId: null, createdAt: "2026-02-03", updatedAt: "2026-09-25", shares: [{ userId: ADMIN, permission: "viewer" }] },
  { id: "F-DA-1", name: "Statistics_Cheatsheet.pdf", kind: "file", ext: "pdf", size: 640_000, ownerId: INS_DA, parentId: "F-DA", createdAt: "2026-02-03", updatedAt: "2026-02-03", shares: [] },
  { id: "F-DA-2", name: "Sales_Dataset_Practice.csv", kind: "file", ext: "csv", size: 1_900_000, ownerId: INS_DA, parentId: "F-DA", createdAt: "2026-05-18", updatedAt: "2026-05-18", shares: [] },
  { id: "F-DA-3", name: "ML_Intro_Slides.pptx", kind: "file", ext: "pptx", size: 4_100_000, ownerId: INS_DA, parentId: "F-DA", createdAt: "2026-09-25", updatedAt: "2026-09-25", shares: [] },

  { id: "F-MB", name: "Mobile Dev Materials", kind: "folder", ownerId: INS_MB, parentId: null, createdAt: "2026-02-03", updatedAt: "2026-08-30", shares: [] },
  { id: "F-MB-1", name: "Compose_Basics.pptx", kind: "file", ext: "pptx", size: 2_900_000, ownerId: INS_MB, parentId: "F-MB", createdAt: "2026-02-03", updatedAt: "2026-02-03", shares: [] },
  { id: "F-MB-2", name: "SwiftUI_Lab_Guide.md", kind: "file", ext: "md", size: 31_000, ownerId: INS_MB, parentId: "F-MB", createdAt: "2026-08-30", updatedAt: "2026-08-30", shares: [] },
];

export function formatBytes(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
