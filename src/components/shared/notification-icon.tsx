import {
  AcademicCapIcon,
  BellAlertIcon,
  ClockIcon,
  CpuChipIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

import type { NotificationType } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const MAP: Record<NotificationType, { icon: typeof BellAlertIcon; className: string }> = {
  "low-attendance": { icon: BellAlertIcon, className: "bg-destructive/10 text-destructive" },
  "declining-academic": { icon: AcademicCapIcon, className: "bg-warning/25 text-[oklch(0.45_0.12_70)] dark:text-[oklch(0.88_0.14_80)]" },
  "alumni-update": { icon: UserGroupIcon, className: "bg-info/15 text-[oklch(0.42_0.1_215)] dark:text-[oklch(0.82_0.1_215)]" },
  "overtime-reminder": { icon: ClockIcon, className: "bg-primary/10 text-primary" },
  system: { icon: CpuChipIcon, className: "bg-muted text-muted-foreground" },
};

export function NotificationIcon({ type, className }: { type: NotificationType; className?: string }) {
  const m = MAP[type];
  const Icon = m.icon;
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", m.className, className)}>
      <Icon className="size-4" />
    </span>
  );
}
