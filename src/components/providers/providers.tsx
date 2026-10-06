"use client";

import * as React from "react";

import { AuthProvider } from "@/lib/auth/auth-context";
import { AppStoreProvider } from "@/lib/store/app-store";
import { ToastProvider } from "@/hooks/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppStoreProvider>
        <ToastProvider>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        </ToastProvider>
      </AppStoreProvider>
    </AuthProvider>
  );
}
