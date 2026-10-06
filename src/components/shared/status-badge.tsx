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

export function EmploymentBadge({ status }: { status: EmploymentStatus }) {
  const map: Record<EmploymentStatus, { label: string; variant: "success" | "info" | "warning" | "danger" }> = {
    employed: { label: "Employed", variant: "success" },
    "self-employed": { label: "Self-employed", variant: "info" },
    studying: { label: "Studying", variant: "warning" },
    unemployed: { label: "Unemployed", variant: "danger" },
  };
  const m = map[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

export function ScoreBadge({ score }: { score: number }) {
  const variant = score >= 85 ? "success" : score >= 65 ? "info" : score >= 50 ? "warning" : "danger";
  return (
    <Badge variant={variant} className="tabular-nums">
      {score}
    </Badge>
  );
}
