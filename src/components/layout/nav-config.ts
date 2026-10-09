import type { ComponentType, SVGProps } from "react";
import {
  AcademicCapIcon,
  BanknotesIcon,
  BellIcon,
  BoltIcon,
  ChartPieIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  FolderOpenIcon,
  PencilSquareIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

import type { Role } from "@/lib/data/types";

export interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  roles: Role[];
  badgeKey?: "notifications" | "atRisk";
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const ALL: Role[] = ["ADMIN", "INSTRUCTOR"];
const ADMIN: Role[] = ["ADMIN"];

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/dashboard", icon: ChartPieIcon, roles: ALL }],
  },
  {
    label: "Workspace",
    items: [
      { label: "Data Management", href: "/files", icon: FolderOpenIcon, roles: ALL },
      { label: "AI Chatbot", href: "/chat", icon: ChatBubbleLeftRightIcon, roles: ALL },
      { label: "AI Agents", href: "/agents", icon: BoltIcon, roles: ADMIN },
    ],
  },
  {
    label: "Students",
    items: [
      { label: "Students", href: "/students", icon: UsersIcon, roles: ALL },
      { label: "Attendance", href: "/attendance", icon: ClipboardDocumentCheckIcon, roles: ALL },
      { label: "Scores", href: "/scores", icon: AcademicCapIcon, roles: ALL },
      { label: "At-Risk", href: "/at-risk", icon: ExclamationTriangleIcon, roles: ALL, badgeKey: "atRisk" },
      { label: "Feedback", href: "/feedback", icon: PencilSquareIcon, roles: ALL },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Extra Classes", href: "/extra-class", icon: ClockIcon, roles: ADMIN },
      { label: "Allowances", href: "/allowances", icon: BanknotesIcon, roles: ADMIN },
      { label: "Alumni", href: "/alumni", icon: UserGroupIcon, roles: ADMIN },
    ],
  },
  {
    label: "Workspace",
    items: [
      // { label: "Notifications", href: "/notifications", icon: BellIcon, roles: ALL, badgeKey: "notifications" },
      { label: "Overtime Reports", href: "/overtime", icon: DocumentDuplicateIcon, roles: ["INSTRUCTOR"] },
    ],
  },
  {
    label: "Account",
    items: [{ label: "Settings", href: "/settings", icon: Cog6ToothIcon, roles: ALL }],
  },
];

export function pageTitle(pathname: string): string {
  for (const g of NAV_GROUPS) for (const i of g.items) if (pathname === i.href || pathname.startsWith(i.href + "/")) return i.label;
  return "HRD Intelligence";
}
