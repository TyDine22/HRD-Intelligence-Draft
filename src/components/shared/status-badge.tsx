import { Badge } from "@/components/ui/badge";
import type { AttendanceStatus, EmploymentStatus, RiskLevel, StudentStatus } from "@/lib/data/types";

export function StudentStatusBadge({ status }: { status: StudentStatus }) {
  const map: Record<StudentStatus, { label: string; variant: "success" | "danger" | "info" }> = {
    active: { label: "Active", variant: "success" },
    dropped: { label: "Dropped", variant: "danger" },
    graduated: { label: "Graduated", variant: "info" },
  };
  const m = map[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  const map: Record<AttendanceStatus, "success" | "danger" | "warning" | "info"> = {
    Present: "success",
    Absent: "danger",
    Late: "warning",
    Permission: "info",
  };
  return <Badge variant={map[status]}>{status}</Badge>;
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const map: Record<RiskLevel, "danger" | "warning" | "info"> = { High: "danger", Medium: "warning", Low: "info" };
  return <Badge variant={map[level]}>{level}</Badge>;
}

const EMPLOYMENT_COLORS: Record<EmploymentStatus, string> = {
  "Local SW Developer": "var(--chart-1)",
  "International SW Developer": "var(--chart-2)",
  Banks: "var(--chart-4)",
  "Government Officials": "var(--chart-7)",
  "Full Scholarship Abroad": "var(--chart-3)",
  "IT Instructor in HRD Center": "var(--chart-5)",
  Other: "var(--chart-6)",
};

/** Employment status badge – uses the same colour as the alumni achievements chart. */
export function EmploymentBadge({ status }: { status: EmploymentStatus }) {
  const color = EMPLOYMENT_COLORS[status] ?? "var(--chart-7)";
  return (
    <Badge
      variant="outline"
      className="gap-1.5 border-transparent"
      style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color: `color-mix(in srgb, ${color} 80%, var(--foreground))` }}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {status}
    </Badge>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const variant = score >= 85 ? "success" : score >= 65 ? "info" : score >= 50 ? "warning" : "danger";
  return (
    <Badge variant={variant} className="tabular-nums">
      {score}
    </Badge>
  );
}
