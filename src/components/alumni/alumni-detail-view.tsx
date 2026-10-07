"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftIcon, BriefcaseIcon, DocumentIcon, EnvelopeIcon, PencilSquareIcon, PhoneIcon, SparklesIcon } from "@heroicons/react/24/outline";

import { EmptyState } from "@/components/shared/empty-state";
import { EmploymentBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppStore } from "@/lib/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { courseByCode } from "@/lib/data/users";
import { initials } from "@/lib/data/students";
import { formatBytes } from "@/lib/data/files";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import type { AlumniValues } from "@/lib/validation/schemas";
import { AlumniFormDialog } from "./alumni-form-dialog";

export function AlumniDetailView({ id }: { id: string }) {
  const { alumni, updateAlumni, sendUpdateRequest } = useAppStore();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = React.useState(false);
  const a = alumni.find((x) => x.id === id);

  if (!a) {
    return <EmptyState title="Alumni not found" action={<Button asChild variant="outline"><Link href="/alumni">Back to alumni</Link></Button>} />;
  }

  const save = (v: AlumniValues) => {
    const last = a.jobs[a.jobs.length - 1];
    const jobs = [...a.jobs];
    if (v.company) {
      if (last && last.company === v.company) {
        jobs[jobs.length - 1] = { ...last, title: v.jobTitle ?? last.title, industry: v.industry, location: v.location ?? last.location };
      } else {
        if (last && !last.to) jobs[jobs.length - 1] = { ...last, to: new Date().toISOString().slice(0, 10) };
        jobs.push({ id: `JOB-${Date.now()}`, company: v.company, title: v.jobTitle ?? "", industry: v.industry, location: v.location ?? "", from: new Date().toISOString().slice(0, 10), to: null });
      }
    }
    updateAlumni(a.id, {
      name: v.name, email: v.email, phone: v.phone, gender: v.gender, generation: Number(v.generation), courseCode: v.courseCode,
      education: v.education, university: v.university, employmentStatus: v.employmentStatus, industry: v.industry,
      salaryRange: v.employmentStatus === "Full Scholarship Abroad" ? "—" : v.salaryRange, jobs,
      lastUpdated: new Date().toISOString().slice(0, 10),
    });
    setEditOpen(false);
    toast({ title: "Profile updated", variant: "success" });
  };

  const current = a.jobs.find((j) => !j.to) ?? a.jobs[a.jobs.length - 1];

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2"><Link href="/alumni"><ArrowLeftIcon /> Alumni</Link></Button>

      <div className="bg-card flex flex-col gap-5 rounded-xl border p-5 shadow-sm md:flex-row md:items-start">
        <Avatar className="size-16"><AvatarFallback className="bg-chart-2/25 text-lg">{initials(a.name)}</AvatarFallback></Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{a.name}</h1>
            <EmploymentBadge status={a.employmentStatus} />
            {a.updateRequest?.status === "pending" && <Badge variant="warning">Update request pending</Badge>}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">{a.id} · Generation {a.generation} · {courseByCode(a.courseCode).name}</p>
          <div className="mt-3 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
            <p className="flex items-center gap-2"><EnvelopeIcon className="text-muted-foreground size-4" />{a.email}</p>
            <p className="flex items-center gap-2"><PhoneIcon className="text-muted-foreground size-4" />{a.phone}</p>
            <p><span className="text-muted-foreground">Gender:</span> {a.gender}</p>
            <p><span className="text-muted-foreground">Education:</span> {a.education} · {a.university}</p>
            <p><span className="text-muted-foreground">Industry:</span> {a.industry}</p>
            <p><span className="text-muted-foreground">Salary range:</span> {a.salaryRange}</p>
            <p><span className="text-muted-foreground">Last updated:</span> {formatDate(a.lastUpdated)}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <Button onClick={() => setEditOpen(true)}><PencilSquareIcon /> Edit profile</Button>
          <Button variant="outline" disabled={a.updateRequest?.status === "pending"} onClick={() => { sendUpdateRequest(a.id, "admin"); toast({ title: "Update request sent", description: `A form link was emailed to ${a.email}. The profile updates automatically when submitted.`, variant: "success" }); }}>
            <EnvelopeIcon /> Send update form
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><BriefcaseIcon className="size-5" /> Employment history</CardTitle>
            <CardDescription>Current and past positions, most recent first.</CardDescription>
          </CardHeader>
          <CardContent>
            {a.jobs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No employment recorded.</p>
            ) : (
              <ol className="relative space-y-6 border-l pl-6">
                {[...a.jobs].reverse().map((j) => (
                  <li key={j.id} className="relative">
                    <span className={`absolute -left-[31px] top-1 size-2.5 rounded-full ring-4 ring-card ${!j.to ? "bg-primary" : "bg-muted-foreground/40"}`} />
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{j.title}</p>
                      {!j.to && <Badge variant="success">Current</Badge>}
                    </div>
                    <p className="text-sm">{j.company} · {j.industry}</p>
                    <p className="text-muted-foreground text-xs">{j.location} · {formatDate(j.from)} – {j.to ? formatDate(j.to) : "present"}</p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><SparklesIcon className="text-primary size-5" /> Profile update requests</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {a.updateRequest ? (
                <div className="space-y-1">
                  <p>Sent {formatDateTime(a.updateRequest.sentAt)} by {a.updateRequest.sentBy === "ai" ? "the Alumni Profile agent" : "an administrator"}.</p>
                  <p>Status: <Badge variant={a.updateRequest.status === "pending" ? "warning" : "success"}>{a.updateRequest.status}</Badge></p>
                  {a.updateRequest.status === "completed" && <p className="text-muted-foreground text-xs">The submitted form updated this record automatically and the Alumni Job Alert agent notified administrators.</p>}
                </div>
              ) : (
                <p className="text-muted-foreground">No update request has been sent yet. The agent emails alumni every 6 months when AI auto-requests are enabled.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><DocumentIcon className="size-5" /> Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {a.documents.length === 0 ? (
                <p className="text-muted-foreground text-sm">No uploaded documents.</p>
              ) : (
                <ul className="divide-y text-sm">
                  {a.documents.map((d) => (
                    <li key={d.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2"><Badge variant="outline" className="uppercase">{d.ext}</Badge><span>{d.name}</span></div>
                      <span className="text-muted-foreground text-xs">{formatBytes(d.size)} · {formatDate(d.uploadedAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          {current && (
            <p className="text-muted-foreground text-xs">Currently at <span className="text-foreground font-medium">{current.company}</span> as {current.title}.</p>
          )}
        </div>
      </div>

      <AlumniFormDialog open={editOpen} onOpenChange={setEditOpen} initial={a} onSubmit={save} />
    </div>
  );
}
