"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BrandWordmark } from "@/components/layout/brand";
import { useAuth } from "@/lib/auth/auth-context";
import { loginSchema, type LoginValues } from "@/lib/validation/schemas";
import { DEMO_PASSWORD, USERS } from "@/lib/data/users";

export function LoginForm() {
  const router = useRouter();
  const { login, user, hydrated } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  React.useEffect(() => {
    if (hydrated && user) router.replace("/dashboard");
  }, [hydrated, user, router]);

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    const res = await login(values.email, values.password);
    if (!res.ok) {
      setServerError(res.error);
      return;
    }
    router.replace("/dashboard");
  };

  const fill = (email: string) => {
    form.setValue("email", email, { shouldValidate: true });
    form.setValue("password", DEMO_PASSWORD, { shouldValidate: true });
    setServerError(null);
  };

  return (
    <div className="space-y-8">
      <div className="lg:hidden">
        <BrandWordmark />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-muted-foreground mt-1 text-sm">Use your HRD account. Authentication is handled by Keycloak (OIDC).</p>
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
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link href="/forgot-password" className="text-primary text-xs font-medium hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeSlashIcon className="size-4" /> : <EyeIcon className="size-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="remember"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={!!field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                </FormControl>
                <FormLabel className="font-normal">Keep me signed in on this device</FormLabel>
              </FormItem>
            )}
          />

          {serverError && (
            <p role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Form>

      <div className="rounded-lg border border-dashed p-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
          <ShieldCheckIcon className="text-primary size-4" /> Demo accounts (static prototype)
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {USERS.slice(0, 2).map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => fill(u.email)}
              className="hover:bg-accent cursor-pointer rounded-md border px-3 py-2 text-left transition-colors"
            >
              <p className="text-sm font-medium">{u.role === "ADMIN" ? "HRD Admin" : "Instructor"}</p>
              <p className="text-muted-foreground truncate text-xs">{u.email}</p>
            </button>
          ))}
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          Password for all demo accounts: <code className="bg-muted rounded px-1 py-0.5">{DEMO_PASSWORD}</code>
        </p>
      </div>
    </div>
  );
}
