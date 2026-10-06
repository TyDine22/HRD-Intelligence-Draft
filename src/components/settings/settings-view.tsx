"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyIcon, ShieldCheckIcon, UserCircleIcon } from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/hooks/use-toast";
import { changePasswordSchema, type ChangePasswordValues } from "@/lib/validation/schemas";

export function SettingsView() {
  const { user, role, changePassword } = useAuth();
  const { toast } = useToast();
  const [emailNotif, setEmailNotif] = React.useState(true);
  const [inAppNotif, setInAppNotif] = React.useState(true);

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ChangePasswordValues) => {
    const res = await changePassword(values.currentPassword, values.newPassword);
    if (!res.ok) {
      form.setError("currentPassword", { message: res.error });
      return;
    }
    form.reset();
    toast({ title: "Password updated", description: "Your Keycloak credentials were changed successfully.", variant: "success" });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account, credentials and notification channels." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircleIcon className="size-5" /> Profile
              </CardTitle>
              <CardDescription>Managed in Keycloak; shown here for reference.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-full text-base font-bold">
                  {user?.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-muted-foreground text-xs">{user?.title}</p>
                </div>
              </div>
              <dl className="grid grid-cols-[100px_1fr] gap-y-2 pt-2">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="truncate">{user?.email}</dd>
                <dt className="text-muted-foreground">Role</dt>
                <dd>
                  <Badge variant={role === "ADMIN" ? "default" : "info"}>{role === "ADMIN" ? "HRD Admin" : "Instructor"}</Badge>
                </dd>
                <dt className="text-muted-foreground">Realm</dt>
                <dd>hrd-intelligence</dd>
                {user?.standbyDays && (
                  <>
                    <dt className="text-muted-foreground">Standby days</dt>
                    <dd>{user.standbyDays.join(", ")}</dd>
                  </>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheckIcon className="size-5" /> Notification channels
              </CardTitle>
              <CardDescription>Choose where reminders, requests and status updates are delivered.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="inapp">In-app notifications</Label>
                  <p className="text-muted-foreground text-xs">Shown in the web and mobile apps with an unread count.</p>
                </div>
                <Switch id="inapp" checked={inAppNotif} onCheckedChange={setInAppNotif} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email">Email notifications</Label>
                  <p className="text-muted-foreground text-xs">Sent to {user?.email}.</p>
                </div>
                <Switch id="email" checked={emailNotif} onCheckedChange={setEmailNotif} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyIcon className="size-5" /> Change password
            </CardTitle>
            <CardDescription>Enter your current password, then choose a new one.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="current-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => form.reset()}>
                    Reset
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Updating…" : "Update password"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
