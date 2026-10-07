"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, CheckCircleIcon, LinkSlashIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BrandWordmark } from "@/components/layout/brand";
import { USERS } from "@/lib/data/users";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validation/schemas";

/**
 * Landing page for the password-reset link sent by "Forgot password".
 * In production Keycloak hosts this page; the prototype validates a mock token
 * of the form `demo-<userId>` carried in the URL (?token=…&email=…).
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const [done, setDone] = React.useState(false);

  const account = React.useMemo(() => {
    const id = token.startsWith("demo-") ? token.slice(5) : null;
    return USERS.find((u) => u.id === id && (!email || u.email.toLowerCase() === email.toLowerCase())) ?? null;
  }, [token, email]);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 600));
    setDone(true);
  };

  if (!account) {
    return (
      <div className="space-y-6 text-center">
        <div className="bg-destructive/10 text-destructive mx-auto flex size-14 items-center justify-center rounded-full">
          <LinkSlashIcon className="size-7" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">This reset link is invalid or has expired</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Reset links are valid for 30 minutes and can only be used once. Request a new one to continue.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
        <Link href="/login" className="text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 text-sm">
          <ArrowLeftIcon className="size-4" /> Back to sign in
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-6 text-center">
        <div className="bg-success-bg text-success-text mx-auto flex size-14 items-center justify-center rounded-full">
          <CheckCircleIcon className="size-7" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Password updated</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            You can now sign in to <span className="text-foreground font-medium">{account.email}</span> with your new password.
            (In this prototype the demo password stays <code className="bg-muted rounded px-1 py-0.5">Hrd@2026</code>.)
          </p>
        </div>
        <Button className="w-full" onClick={() => router.replace("/login")}>
          Continue to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="lg:hidden">
        <BrandWordmark />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Resetting the password for <span className="text-foreground font-medium">{account.email}</span>.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormDescription>At least 8 characters, including an uppercase letter and a number.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      </Form>
      <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs">
        <ShieldCheckIcon className="size-4" /> Secured by Keycloak · link expires in 30 minutes
      </p>
    </div>
  );
}
