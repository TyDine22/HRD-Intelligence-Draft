"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/auth-context";
import { SidebarNav } from "./sidebar";
import { Topbar } from "./topbar";
import { BrandMark } from "./brand";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (hydrated && !user) router.replace("/login");
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <BrandMark className="animate-pulse" />
          <p className="text-muted-foreground text-sm">Loading workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 md:block no-print">
        <SidebarNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        <Topbar />
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
