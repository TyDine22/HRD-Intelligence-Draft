"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { LockClosedIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import type { Role } from "@/lib/data/types";

export function RoleGate({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { role } = useAuth();
  if (!role || !allow.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <div className="bg-muted flex size-14 items-center justify-center rounded-full">
          <LockClosedIcon className="text-muted-foreground size-6" />
        </div>
        <h2 className="text-lg font-semibold">Admin access required</h2>
        <p className="text-muted-foreground max-w-sm text-sm">
          This module is available to HRD Administrators only. Instructors can view students, attendance, scores, feedback and teaching materials.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }
  return <>{children}</>;
}
