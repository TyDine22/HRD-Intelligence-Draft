"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRightStartOnRectangleIcon,
  ArrowsRightLeftIcon,
  Bars3Icon,
  BellIcon,
  CheckIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/auth-context";
import { useAppStore } from "@/lib/store/app-store";
import { STUDENTS } from "@/lib/data/students";
import { relativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { pageTitle } from "./nav-config";
import { SidebarNav } from "./sidebar";
import { NotificationIcon } from "@/components/shared/notification-icon";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, logout, switchRole } = useAuth();
  const { notifications, markRead, markAllRead } = useAppStore();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    const stored = window.localStorage.getItem("hrd.theme");
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("hrd.theme", next ? "dark" : "light");
  };

  const mine = notifications.filter((n) => role && n.roles.includes(role));
  const unread = mine.filter((n) => !n.read);

  const matches = query.trim().length >= 2
    ? STUDENTS.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()) || s.email.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];

  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur no-print md:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
          <Bars3Icon />
        </Button>
        <SheetContent side="left" className="w-72 p-0 sm:max-w-72 [&>button]:text-white">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold md:text-base">{pageTitle(pathname)}</h2>
      </div>

      <div className="relative hidden w-64 lg:block">
        <MagnifyingGlassIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a student…"
          className="bg-card h-9 pl-8"
          onKeyDown={(e) => {
            if (e.key === "Enter" && matches[0]) {
              router.push(`/students/${matches[0].id}`);
              setQuery("");
            }
            if (e.key === "Escape") setQuery("");
          }}
        />
        {matches.length > 0 && (
          <div className="bg-popover absolute top-full right-0 left-0 z-40 mt-1 overflow-hidden rounded-md border shadow-lg">
            {matches.map((s) => (
              <button
                key={s.id}
                type="button"
                className="hover:bg-accent flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm"
                onClick={() => {
                  router.push(`/students/${s.id}`);
                  setQuery("");
                }}
              >
                <span className="truncate">{s.name}</span>
                <span className="text-muted-foreground ml-2 shrink-0 text-xs">{s.classroom}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
        {dark ? <SunIcon /> : <MoonIcon />}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <BellIcon />
            {unread.length > 0 && (
              <span className="bg-destructive absolute top-1 right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-bold text-white">
                {unread.length > 9 ? "9+" : unread.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-96 p-0">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-semibold">
              Notifications{" "}
              {unread.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {unread.length} new
                </Badge>
              )}
            </p>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAllRead((n) => !!role && n.roles.includes(role))}>
              <CheckIcon /> Mark all read
            </Button>
          </div>
          <DropdownMenuSeparator className="my-0" />
          <div className="max-h-96 overflow-y-auto">
            {mine.slice(0, 6).map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={cn("flex items-start gap-3 rounded-none px-3 py-2.5", !n.read && "bg-primary/5")}
                onSelect={() => {
                  markRead(n.id);
                  if (n.link) router.push(n.link);
                }}
              >
                <NotificationIcon type={n.type} />
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm", !n.read && "font-semibold")}>{n.title}</p>
                  <p className="text-muted-foreground line-clamp-2 text-xs leading-snug whitespace-normal">{n.message}</p>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">{relativeTime(n.createdAt)}</p>
                </div>
                {!n.read && <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />}
              </DropdownMenuItem>
            ))}
            {mine.length === 0 && <p className="text-muted-foreground px-3 py-6 text-center text-sm">No notifications</p>}
          </div>
          <DropdownMenuSeparator className="my-0" />
          <Link href="/notifications" className="text-primary block px-3 py-2 text-center text-xs font-medium hover:underline">
            View all notifications
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm">
            <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-full text-xs font-bold">
              {user?.name
                .split(" ")
                .map((p) => p[0])
                .join("")
                .slice(0, 2)}
            </span>
            <span className="hidden sm:inline">{user?.name.split(" ")[0]}</span>
            <Badge variant={role === "ADMIN" ? "default" : "info"} className="hidden sm:inline-flex">
              {role === "ADMIN" ? "Admin" : "Instructor"}
            </Badge>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>
            <p className="font-medium">{user?.name}</p>
            <p className="text-muted-foreground text-xs font-normal">{user?.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => router.push("/settings")}>
            <KeyIcon /> Change password
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => switchRole(role === "ADMIN" ? "INSTRUCTOR" : "ADMIN")}>
            <ArrowsRightLeftIcon /> Switch to {role === "ADMIN" ? "Instructor" : "Admin"} (demo)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={logout}>
            <ArrowRightStartOnRectangleIcon /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
