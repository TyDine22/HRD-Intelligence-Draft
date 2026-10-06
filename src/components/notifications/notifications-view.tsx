"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon, EnvelopeIcon, DevicePhoneMobileIcon } from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { NotificationIcon } from "@/components/shared/notification-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { useAppStore } from "@/lib/store/app-store";
import { relativeTime } from "@/lib/utils/format";
import type { NotificationType } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<NotificationType, string> = {
  "low-attendance": "Low attendance",
  "declining-academic": "Declining academic",
  "alumni-update": "Alumni update",
  "overtime-reminder": "Overtime reminder",
  system: "System",
};

export function NotificationsView() {
  const { role, isAdmin } = useAuth();
  const { notifications, markRead, markAllRead } = useAppStore();
  const [filter, setFilter] = React.useState<"all" | "unread">("all");
  const [type, setType] = React.useState<"all" | NotificationType>("all");

  const mine = notifications.filter((n) => role && n.roles.includes(role));
  const unread = mine.filter((n) => !n.read).length;
  const list = mine.filter((n) => (filter === "all" || !n.read) && (type === "all" || n.type === type));
  const types = Array.from(new Set(mine.map((n) => n.type)));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="In-app and email alerts triggered by attendance, academic performance, alumni updates and agent activity."
        actions={<Button variant="outline" disabled={!unread} onClick={() => markAllRead((n) => !!role && n.roles.includes(role))}><CheckIcon /> Mark all as read</Button>}
      />

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="bg-card rounded-xl border shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList>
                <TabsTrigger value="all">All ({mine.length})</TabsTrigger>
                <TabsTrigger value="unread">Unread {unread > 0 && <Badge variant="destructive" className="ml-1 h-4 px-1.5">{unread}</Badge>}</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => setType("all")} className={cn("cursor-pointer rounded-full border px-2.5 py-1 text-xs", type === "all" && "bg-primary text-primary-foreground border-primary")}>All types</button>
              {types.map((t) => (
                <button key={t} type="button" onClick={() => setType(t)} className={cn("cursor-pointer rounded-full border px-2.5 py-1 text-xs", type === t && "bg-primary text-primary-foreground border-primary")}>{TYPE_LABEL[t]}</button>
              ))}
            </div>
          </div>
          {list.length === 0 ? (
            <EmptyState title="You're all caught up" description="No notifications match this filter." />
          ) : (
            <ul className="divide-y">
              {list.map((n) => (
                <li key={n.id} className={cn("flex gap-4 p-4", !n.read && "bg-primary/5")}>
                  <NotificationIcon type={n.type} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</p>
                      <Badge variant="outline">{TYPE_LABEL[n.type]}</Badge>
                      {!n.read && <span className="bg-primary size-2 rounded-full" />}
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-sm">{n.message}</p>
                    <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-3 text-xs">
                      <span>{relativeTime(n.createdAt)}</span>
                      <span className="flex items-center gap-1">
                        {n.channel.includes("in-app") && <DevicePhoneMobileIcon className="size-3.5" />}
                        {n.channel.includes("email") && <EnvelopeIcon className="size-3.5" />}
                        {n.channel.map((c) => (c === "in-app" ? "In-app" : "Email")).join(" + ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {!n.read && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markRead(n.id)}>Mark read</Button>}
                    {n.link && (
                      <Button asChild variant="outline" size="sm" className="h-7 text-xs" onClick={() => markRead(n.id)}>
                        <Link href={n.link}>Open <ArrowRightIcon /></Link>
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Trigger events for your role</CardTitle>
            <CardDescription>Delivered in-app and by email to your registered address.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3"><NotificationIcon type="low-attendance" /><div><p className="font-medium">Low attendance</p><p className="text-muted-foreground text-xs">When a student's attendance falls below the 85% threshold.</p></div></li>
              <li className="flex gap-3"><NotificationIcon type="declining-academic" /><div><p className="font-medium">Declining academic performance</p><p className="text-muted-foreground text-xs">When a student's monthly average shows a declining trend.</p></div></li>
              {isAdmin ? (
                <li className="flex gap-3"><NotificationIcon type="alumni-update" /><div><p className="font-medium">Alumni updates</p><p className="text-muted-foreground text-xs">When an alumnus submits the emailed profile update form.</p></div></li>
              ) : (
                <li className="flex gap-3"><NotificationIcon type="overtime-reminder" /><div><p className="font-medium">Overtime reminders</p><p className="text-muted-foreground text-xs">Extra-class requests on your standby days.</p></div></li>
              )}
              <li className="flex gap-3"><NotificationIcon type="system" /><div><p className="font-medium">Agent activity</p><p className="text-muted-foreground text-xs">Weekly summaries, feedback reports and automated alerts.</p></div></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
