export type Role = "ADMIN" | "INSTRUCTOR";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  course?: string;
  standbyDays?: string[];
}

export type Gender = "Male" | "Female";
export type StudentStatus = "active" | "dropped" | "graduated";

export interface Course {
  code: string;
  name: string;
  subjects: string[];
  instructorId: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: Gender;
  dob: string;
  generation: number;
  classroom: string;
  courseCode: string;
  enrollmentDate: string;
  university: string;
  status: StudentStatus;
  itScore: number;
  koreanScore: number;
  isClassLeader: boolean;
}

export type AttendanceStatus = "Present" | "Absent" | "Late" | "Permission";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;
}

export interface ScoreRecord {
  id: string;
  studentId: string;
  subject: string;
  assignment: number;
  quiz: number;
  exam: number;
  homework: number;
}

export interface MonthlyScore {
  studentId: string;
  month: string; // YYYY-MM
  average: number;
}

export interface ExtraClassRecord {
  id: string;
  studentId: string;
  date: string;
  hours: number;
  subject: string;
  instructorId: string;
  status: "approved" | "pending";
}

export type AllowanceBasis = "fixed" | "per-hour" | "score-range" | "attendance-range" | "role";

export interface AllowanceRange {
  min: number;
  amount: number;
}

export interface AllowanceType {
  id: string;
  key: string;
  name: string;
  description: string;
  basis: AllowanceBasis;
  amount: number;
  ranges?: AllowanceRange[];
  enabled: boolean;
}

export interface ChallengeTeam {
  id: string;
  name: string;
  memberIds: string[];
  rank: 1 | 2 | 3 | null;
}

export interface ChallengeReward {
  place: 1 | 2 | 3;
  amount: number;
}

/** One-off team coding challenge held once in the Basic course, before the final project. */
export interface CodingChallenge {
  enabled: boolean;
  name: string;
  courseLabel: string;
  date: string;
  /** Allowance month (YYYY-MM) in which the reward is paid out. */
  payoutMonth: string;
  maxTeamSize: number;
  /** The team prize is always split equally among the team members. */
  rewards: ChallengeReward[];
  teams: ChallengeTeam[];
}

export type FeedbackCategory = "Behavior" | "Soft Skills" | "Hard Skills" | "Other";

export interface FeedbackEntry {
  id: string;
  studentId: string;
  instructorId: string;
  category: FeedbackCategory;
  content: string;
  date: string;
}

/**
 * Official alumni employment status (the categories reported in the HRD
 * achievements chart). Every alumni record carries exactly one.
 */
export type EmploymentStatus =
  | "Local SW Developer"
  | "International SW Developer"
  | "Banks"
  | "Government Officials"
  | "Full Scholarship Abroad"
  | "IT Instructor in HRD Center"
  | "Other";

export interface Job {
  id: string;
  company: string;
  title: string;
  industry: string;
  location: string;
  from: string;
  to: string | null;
}

export interface AlumniDocument {
  id: string;
  name: string;
  ext: string;
  size: number;
  uploadedAt: string;
}

export interface Alumni {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: Gender;
  generation: number;
  courseCode: string;
  education: "Bachelor" | "Master" | "PhD";
  university: string;
  employmentStatus: EmploymentStatus;
  industry: string;
  salaryRange: string;
  jobs: Job[];
  documents: AlumniDocument[];
  lastUpdated: string;
  updateRequest: {
    sentAt: string;
    sentBy: "admin" | "ai";
    status: "pending" | "completed";
  } | null;
}

export type FilePermission = "viewer" | "editor";

export interface FileShare {
  userId: string;
  permission: FilePermission;
}

export interface FileNode {
  id: string;
  name: string;
  kind: "folder" | "file";
  ext?: string;
  size?: number;
  ownerId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  shares: FileShare[];
}

export type NotificationType =
  | "low-attendance"
  | "declining-academic"
  | "alumni-update"
  | "overtime-reminder"
  | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  roles: Role[];
  createdAt: string;
  read: boolean;
  link?: string;
  channel: ("in-app" | "email")[];
}

export interface ChartAttachment {
  kind: "chart";
  chartType: "bar" | "line" | "donut";
  title: string;
  data: { name: string; value: number }[];
}

export interface TableAttachment {
  kind: "table";
  title: string;
  columns: string[];
  rows: (string | number)[][];
}

export interface FileAttachment {
  kind: "file";
  name: string;
  ext: "txt" | "md" | "pptx" | "docx" | "pdf";
  content: string;
}

export interface EmailDraftAttachment {
  kind: "email-draft";
  to: string;
  subject: string;
  body: string;
  status: "pending" | "sent" | "cancelled";
}

export interface EmailDeleteAttachment {
  kind: "email-delete";
  subject: string;
  status: "pending" | "deleted" | "cancelled";
}

export type ChatAttachment =
  | ChartAttachment
  | TableAttachment
  | FileAttachment
  | EmailDraftAttachment
  | EmailDeleteAttachment;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  attachment?: ChatAttachment;
  sources?: string[];
}

export type ChatScope = { type: "general" } | { type: "folder"; folderId: string; fileIds: string[] };

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  scope: ChatScope;
  messages: ChatMessage[];
}

export interface AgentRun {
  id: string;
  startedAt: string;
  status: "success" | "failed" | "running";
  summary: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  kind: "scheduled" | "trigger";
  schedule?: string;
  trigger?: string;
  enabled: boolean;
  lastRun: string | null;
  nextRun: string | null;
  runs: AgentRun[];
  outputs: string[];
}

export type RiskLevel = "Low" | "Medium" | "High";

export interface StudentStats {
  attendanceRate: number;
  averageScore: number;
  trend: number; // delta between last month and previous month average
  extraClassHours: number;
  present: number;
  absent: number;
  late: number;
  permission: number;
}

export interface RiskAssessment {
  studentId: string;
  level: RiskLevel;
  score: number;
  reasons: string[];
  alert: string;
  suggestions: string[];
  stats: StudentStats;
}
