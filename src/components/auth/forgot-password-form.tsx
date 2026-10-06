"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, EnvelopeOpenIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BrandWordmark } from "@/components/layout/brand";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validation/schemas";
import { USERS } from "@/lib/data/users";

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = React.useState<string | null>(null);
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    await new Promise((r) => setTimeout(r, 600));
    setSentTo(values.email);
  };

  if (sentTo) {
    const demoUser = USERS.find((u) => u.email.toLowerCase() === sentTo.toLowerCase());
    const demoLink = demoUser ? `/reset-password?token=demo-${demoUser.id}&email=${encodeURIComponent(demoUser.email)}` : null;
    return (
      <div className="space-y-6 text-center">
        <div className="bg-primary/10 text-primary mx-auto flex size-14 items-center justify-center rounded-full">
          <EnvelopeOpenIcon className="size-7" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            If an account exists for <span className="text-foreground font-medium">{sentTo}</span>, a password reset link has
            been sent. The link expires in 30 minutes.
          </p>
        </div>
        {demoLink && (
          <div className="rounded-lg border border-dashed p-3 text-left text-xs">
            <p className="font-semibold">Prototype shortcut</p>
            <p className="text-muted-foreground mt-0.5">No email is sent in the static demo. Open the link the email would contain:</p>
            <Button asChild variant="secondary" size="sm" className="mt-2 w-full">
              <Link href={demoLink}>Open password reset link</Link>
            </Button>
          </div>
        )}
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">
            <ArrowLeftIcon /> Back to sign in
          </Link>
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
        <h1 className="text-2xl font-semibold tracking-tight">Forgot password</h1>
        <p className="text-muted-foreground mt-1 text-sm">Enter your email and we will send you a reset link.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@hrd-intelligence.local" autoComplete="email" {...field} />
                </FormControl>
                <FormDescription>Use the email registered with your HRD account.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      </Form>
      <Link href="/login" className="text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 text-sm">
        <ArrowLeftIcon className="size-4" /> Back to sign in
      </Link>
    </div>
  );
}