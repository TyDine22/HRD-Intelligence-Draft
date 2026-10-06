import type { ReactNode } from "react";

import { BrandWordmark } from "@/components/layout/brand";
import { AuthFeatureList } from "@/components/auth/auth-feature-list";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="bg-sidebar text-sidebar-foreground relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="surface-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-[oklch(0.62_0.17_268)] opacity-30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 size-96 rounded-full bg-[oklch(0.68_0.13_185)] opacity-25 blur-3xl" />
        <div className="relative">
          <BrandWordmark light />
        </div>
        <div className="relative max-w-lg">
          <p className="text-sidebar-primary mb-3 text-xs font-semibold tracking-widest uppercase">HRD Final Project · Draft v5</p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance text-white">
            Turn HRD data into actionable insights.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Centralised student, alumni, attendance and allowance management with a private, local LLM for analytics,
            summaries and automation.
          </p>
          <AuthFeatureList />
        </div>
        <p className="relative text-xs text-white/40">Local LLM · RAG · Keycloak SSO · Spring Cloud microservices</p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
