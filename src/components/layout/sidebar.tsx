"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";

import { useAuth } from "@/lib/auth/auth-context";
import { useAppStore } from "@/lib/store/app-store";
import { RISK_ASSESSMENTS } from "@/lib/data/academics";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "./nav-config";
import { BrandWordmark } from "./brand";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();
  const { notifications } = useAppStore();

  const unread = notifications.filter((n) => !n.read && role && n.roles.includes(role)).length;
  const atRisk = RISK_ASSESSMENTS.filter((r) => r.level !== "Low").length;

  return (
    <div className="bg-sidebar text-sidebar-foreground flex h-full flex-col">
      <div className="border-sidebar-border flex h-16 items-center border-b px-4">
        <BrandWordmark light />
      </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((i) => role && i.roles.includes(role));
          if (!items.length) return null;
          return (
            <div key={group.label} className="mb-5">
              <p className="text-sidebar-foreground/45 mb-1.5 px-2 text-[11px] font-semibold tracking-wider uppercase">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  const badge = item.badgeKey === "notifications" ? unread : item.badgeKey === "atRisk" ? atRisk : 0;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <item.icon className={cn("size-[18px] shrink-0", active ? "text-sidebar-primary" : "opacity-80")} />
                        <span className="flex-1 truncate">{item.label}</span>
                        {badge > 0 && (
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                              item.badgeKey === "atRisk" ? "bg-[#ed1c2e] text-white" : "bg-sidebar-primary text-sidebar-primary-foreground"
                            )}
                          >
                            {badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-sidebar-border border-t p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
            {user?.name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="text-sidebar-foreground/55 truncate text-[11px]">{user?.title}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground cursor-pointer rounded p-1"
            aria-label="Sign out"
            title="Sign out"
          >
            <ArrowRightStartOnRectangleIcon className="size-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
