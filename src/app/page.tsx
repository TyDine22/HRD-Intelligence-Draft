"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { BrandMark } from "@/components/layout/brand";
import { useAuth } from "@/lib/auth/auth-context";

/** Static-export friendly entry point: routes to the dashboard (or login) on the client. */
export default function RootPage() {
  const router = useRouter();
  const { hydrated, user } = useAuth();

  React.useEffect(() => {
    if (!hydrated) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [hydrated, user, router]);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <BrandMark className="animate-pulse" />
        <p className="text-muted-foreground text-sm">Opening HRD Intelligence…</p>
      </div>
    </div>
  );
}
