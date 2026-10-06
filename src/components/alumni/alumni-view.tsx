"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDownTrayIcon, BriefcaseIcon, EnvelopeIcon, PlusIcon, SparklesIcon, UserGroupIcon } from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { EmploymentBadge } from "@/components/shared/status-badge";
import { ChartCard, DonutChart, SimpleBarChart } from "@/components/charts/charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePagination } from "@/hooks/use-pagination";
import { useAppStore } from "@/lib/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { COURSES, courseByCode } from "@/lib/data/users";
import { ALUMNI_GENERATIONS, EMPLOYMENT_STATUSES, INDUSTRIES, SALARY_RANGES } from "@/lib/data/alumni";
import { initials } from "@/lib/data/students";
import { formatDate } from "@/lib/utils/format";
import { exportCsv } from "@/lib/utils/export";
import type { AlumniValues } from "@/lib/validation/schemas";
import { AlumniFormDialog } from "./alumni-form-dialog";

export function AlumniView() {
  const { alumni, addAlumni, sendUpdateRequest, autoAlumniRequests, setAutoAlumniRequests } = useAppStore();
  const { toast } = useToast();
  const [query, setQuery] = React.useState("");
  const [generation, setGeneration] = React.useState("all");
  const [course, setCourse] = React.useState("all");
  const [employment, setEmployment] = React.useState("all");
  const [industry, setIndustry] = React.useState("all");
  const [salary, setSalary] = React.useState("all");
  const [education, setEducation] = React.useState("all");
  const [formOpen, setFormOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return alumni.filter(
      (a) =>
        (!q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)) &&
        (generation === "all" || a.generation === Number(generation)) &&
        (course === "all" || a.courseCode === course) &&
        (employment === "all" || a.employmentStatus === employment) &&
        (industry === "all" || a.industry === industry) &&
        (salary === "all" || a.salaryRange === salary) &&
        (education === "all" || a.education === education)
    );
  }, [alumni, query, generation, course, employment, industry, salary, education]);

  const { page, setPage, pageSize, slice, total } = usePagination(filtered, 12);
  React.useEffect(() => setPage(1), [query, generation, course, employment, industry, salary, education, setPage]);

  const stats = React.useMemo(() => {
    const employed = alumni.filter((a) => a.employmentStatus === "employed" || a.employmentStatus === "self-employed").length;
    const pending = alumni.filter((a) => a.updateRequest?.status === "pending").length;
    const byStatus = EMPLOYMENT_STATUSES.map((s) => ({ name: s, value: alumni.filter((a) => a.employmentStatus === s).length }));
    const byIndustry = INDUSTRIES.map((i) => ({ name: i, value: alumni.filter((a) => a.industry === i).length })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);
    const bySalary = SALARY_RANGES.map((s) => ({ name: s, value: alumni.filter((a) => a.salaryRange === s).length }));
    const byGen = ALUMNI_GENERATIONS.map((g) => ({ name: `Gen ${g}`, value: alumni.filter((a) => a.generation === g).length }));
    return { employed, pending, byStatus, byIndustry, bySalary, byGen, rate: alumni.length ? Math.round((employed / alumni.length) * 100) : 0 };
  }, [alumni]);

  const create = (v: AlumniValues) => {
    const created = addAlumni({
      name: v.name, email: v.email, phone: v.phone, gender: v.gender, generation: Number(v.generation), courseCode: v.courseCode,
      education: v.education, university: v.university, employmentStatus: v.employmentStatus, industry: v.industry,
      salaryRange: v.employmentStatus === "unemployed" || v.employmentStatus === "studying" ? "—" : v.salaryRange,
      jobs: v.company ? [{ id: `JOB-${Date.now()}`, company: v.company, title: v.jobTitle ?? "", industry: v.industry, location: v.location ?? "", from: new Date().toISOString().slice(0, 10), to: null }] : [],
      documents: [], lastUpdated: new Date().toISOString().slice(0, 10), updateRequest: null,
    });
    setFormOpen(false);
    toast({ title: "Alumni profile created", description: `${created.name} was added to the alumni directory.`, variant: "success" });
  };

  const exportRows = () =>
    exportCsv("alumni", ["ID", "Name", "Email", "Phone", "Generation", "Course", "Education", "University", "Employment", "Industry", "Salary range", "Company", "Job title", "Last updated"],
      filtered.map((a) => { const j = a.jobs[a.jobs.length - 1]; return [a.id, a.name, a.email, a.phone, a.generation, courseByCode(a.courseCode).name, a.education, a.university, a.employmentStatus, a.industry, a.salaryRange, j?.company ?? "", j?.title ?? "", a.lastUpdated]; }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alumni management"
        description="Profiles, employment tracking and profile update requests for HRD graduates."
        actions={
          <>
            <Button variant="outline" onClick={exportRows}><ArrowDownTrayIcon /> Export CSV</Button>
            <Button onClick={() => setFormOpen(true)}><PlusIcon /> Add alumni</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total alumni" value={alumni.length} hint={`${ALUMNI_GENERATIONS.length} generations`} icon={<UserGroupIcon />} tone="primary" />
        <KpiCard label="Employment rate" value={`${stats.rate}%`} hint={`${stats.employed} employed or self-employed`} icon={<BriefcaseIcon />} tone="success" />
        <KpiCard label="Pending update requests" value={stats.pending} hint="awaiting alumni response" icon={<EnvelopeIcon />} tone={stats.pending ? "warning" : "default"} />
        <div className="bg-card flex items-center justify-between gap-3 rounded-xl border p-4 shadow-sm">
          <div>
            <Label htmlFor="auto" className="flex items-center gap-1.5"><SparklesIcon className="text-primary size-4" /> AI auto-requests</Label>
            <p className="text-muted-foreground mt-1 text-xs">Alumni Profile agent emails update forms every 6 months.</p>
          </div>
          <Switch id="auto" checked={autoAlumniRequests} onCheckedChange={setAutoAlumniRequests} />
        </div>
      </div>

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="pt-2">
          <div className="bg-card rounded-xl border shadow-sm">
            <div className="flex flex-col gap-3 border-b p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <SearchInput value={query} onChange={setQuery} placeholder="Search by name or email…" className="lg:w-72" />
                <div className="flex flex-wrap gap-2">
                  <Select value={generation} onValueChange={setGeneration}>
                    <SelectTrigger size="sm" className="bg-card w-36"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All generations</SelectItem>{ALUMNI_GENERATIONS.map((g) => <SelectItem key={g} value={String(g)}>Generation {g}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={course} onValueChange={setCourse}>
                    <SelectTrigger size="sm" className="bg-card w-44"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All courses</SelectItem>{COURSES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={employment} onValueChange={setEmployment}>
                    <SelectTrigger size="sm" className="bg-card w-40"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All employment</SelectItem>{EMPLOYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger size="sm" className="bg-card w-48"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All industries</SelectItem>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={salary} onValueChange={setSalary}>
                    <SelectTrigger size="sm" className="bg-card w-36"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All salaries</SelectItem>{SALARY_RANGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={education} onValueChange={setEducation}>
                    <SelectTrigger size="sm" className="bg-card w-32"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All degrees</SelectItem>{["Bachelor", "Master", "PhD"].map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {slice.length === 0 ? (
              <EmptyState title="No alumni match" description="Adjust your search or filters." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alumni</TableHead>
                    <TableHead>Gen / Course</TableHead>
                    <TableHead>Employment</TableHead>
                    <TableHead>Current role</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Education</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Request</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slice.map((a) => {
                    const job = a.jobs[a.jobs.length - 1];
                    return (
                      <TableRow key={a.id}>
                        <TableCell>
                          <Link href={`/alumni/${a.id}`} className="flex items-center gap-3 hover:underline">
                            <Avatar><AvatarFallback className="bg-chart-2/20">{initials(a.name)}</AvatarFallback></Avatar>
                            <div><p className="font-medium">{a.name}</p><p className="text-muted-foreground text-xs">{a.email}</p></div>
                          </Link>
                        </TableCell>
                        <TableCell><p>Gen {a.generation}</p><p className="text-muted-foreground text-xs">{courseByCode(a.courseCode).name}</p></TableCell>
                        <TableCell><EmploymentBadge status={a.employmentStatus} /></TableCell>
                        <TableCell>{job ? <><p className="text-sm">{job.title}</p><p className="text-muted-foreground text-xs">{job.company}</p></> : <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="text-xs">{a.industry}</TableCell>
                        <TableCell className="text-xs tabular-nums">{a.salaryRange}</TableCell>
                        <TableCell className="text-xs">{a.education}</TableCell>
                        <TableCell className="text-xs">{formatDate(a.lastUpdated)}</TableCell>
                        <TableCell className="text-right">
                          {a.updateRequest?.status === "pending" ? (
                            <Badge variant="warning">Pending · {a.updateRequest.sentBy === "ai" ? "AI" : "Admin"}</Badge>
                          ) : (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { sendUpdateRequest(a.id, "admin"); toast({ title: "Update request sent", description: `Form link emailed to ${a.email}.`, variant: "success" }); }}>
                              <EnvelopeIcon /> Send form
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="grid gap-4 pt-2 md:grid-cols-2">
          <ChartCard title="Employment status" description="All alumni"><DonutChart data={stats.byStatus} centerLabel={{ value: `${stats.rate}%`, label: "employed" }} /></ChartCard>
          <ChartCard title="Alumni by generation"><SimpleBarChart data={stats.byGen} /></ChartCard>
          <ChartCard title="Industry distribution" description="Current or most recent role"><SimpleBarChart data={stats.byIndustry} layout="horizontal" height={280} /></ChartCard>
          <ChartCard title="Salary range" description="Employed and self-employed alumni"><SimpleBarChart data={stats.bySalary} color="var(--chart-2)" /></ChartCard>
        </TabsContent>
      </Tabs>

      <AlumniFormDialog open={formOpen} onOpenChange={setFormOpen} onSubmit={create} />
    </div>
  );
}

