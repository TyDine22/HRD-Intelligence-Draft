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
  "low-attendance": { icon: BellAlertIcon, className: "bg-error-bg text-error-text" },
  "declining-academic": { icon: AcademicCapIcon, className: "bg-warning-bg text-warning-text" },
  "alumni-update": { icon: UserGroupIcon, className: "bg-info-bg text-info-text" },
  "overtime-reminder": { icon: ClockIcon, className: "bg-accent text-accent-foreground" },
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
