import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Validating reset link…</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}