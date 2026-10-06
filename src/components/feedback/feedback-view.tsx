"use client";

import * as React from "react";
import Link from "next/link";
import { LockClosedIcon, PencilSquareIcon, PlusIcon, SparklesIcon, TrashIcon } from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth/auth-context";
import { useAppStore } from "@/lib/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { STUDENTS, CLASSROOMS } from "@/lib/data/students";
import { COURSES, courseByCode, userById } from "@/lib/data/users";
import { FEEDBACK_CATEGORIES, summarizeFeedback } from "@/lib/data/feedback";
import { formatDate } from "@/lib/utils/format";
import type { FeedbackEntry } from "@/lib/data/types";
import type { FeedbackValues } from "@/lib/validation/schemas";
import { FeedbackFormDialog } from "./feedback-form-dialog";

export function FeedbackView() {
  const { user, isAdmin } = useAuth();
  const { feedback, addFeedback, updateFeedback, removeFeedback } = useAppStore();
  const { toast } = useToast();
  const [query, setQuery] = React.useState("");
  const [classroom, setClassroom] = React.useState("all");
  const [course, setCourse] = React.useState("all");
  const [category, setCategory] = React.useState("all");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<FeedbackEntry | null>(null);
  const [deleting, setDeleting] = React.useState<FeedbackEntry | null>(null);
  const [summaryFor, setSummaryFor] = React.useState<string>("");

  const studentMap = React.useMemo(() => new Map(STUDENTS.map((s) => [s.id, s])), []);

  const visible = React.useMemo(
    () => (isAdmin ? feedback : feedback.filter((f) => f.instructorId === user?.id)),
    [feedback, isAdmin, user?.id]
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return visible.filter((f) => {
      const s = studentMap.get(f.studentId);
      if (!s) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      if (classroom !== "all" && s.classroom !== classroom) return false;
      if (course !== "all" && s.courseCode !== course) return false;
      if (category !== "all" && f.category !== category) return false;
      return true;
    });
  }, [visible, query, classroom, course, category, studentMap]);

  const studentsWithFeedback = Array.from(new Set(visible.map((f) => f.studentId)));
  const summaryStudent = studentMap.get(summaryFor || studentsWithFeedback[0] || "");
  const summaryEntries = visible.filter((f) => f.studentId === summaryStudent?.id);

  const submit = (values: FeedbackValues) => {
    if (editing) {
      updateFeedback(editing.id, values);
      toast({ title: "Feedback updated", variant: "success" });
    } else {
      addFeedback({ ...values, instructorId: user?.id ?? "USR-INS-01" });
      toast({ title: "Feedback submitted", description: "Saved privately; the AI summary will include it.", variant: "success" });
    }
    setFormOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instructor feedback"
        description={isAdmin ? "All private instructor feedback about students, with AI-generated summaries." : "Submit and manage your private feedback about students. Only HRD staff can see it."}
        actions={
          !isAdmin ? (
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              <PlusIcon /> New feedback
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Feedback entries" value={visible.length} hint={isAdmin ? "all instructors" : "submitted by you"} tone="primary" />
        <KpiCard label="Students covered" value={studentsWithFeedback.length} hint="with at least one note" />
        {FEEDBACK_CATEGORIES.slice(0, 2).map((c) => (
          <KpiCard key={c} label={c} value={visible.filter((f) => f.category === c).length} hint="entries" />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="bg-card rounded-xl border shadow-sm">
          <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
            <SearchInput value={query} onChange={setQuery} placeholder="Search by student…" className="lg:w-56" />
            <div className="flex flex-wrap gap-2">
              <Select value={classroom} onValueChange={setClassroom}>
                <SelectTrigger size="sm" className="bg-card w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {CLASSROOMS.filter((c) => c.includes("13")).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={course} onValueChange={setCourse}>
                <SelectTrigger size="sm" className="bg-card w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All courses</SelectItem>
                  {COURSES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger size="sm" className="bg-card w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {FEEDBACK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="No feedback found" description={isAdmin ? "No instructor has submitted feedback for this selection." : "Submit your first private feedback note."} />
          ) : (
            <ul className="divide-y">
              {filtered.map((f) => {
                const s = studentMap.get(f.studentId)!;
                const mine = f.instructorId === user?.id;
                return (
                  <li key={f.id} className="flex gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/students/${s.id}`} className="font-medium hover:underline">{s.name}</Link>
                        <span className="text-muted-foreground text-xs">{s.classroom} · {courseByCode(s.courseCode).name}</span>
                        <Badge variant="secondary">{f.category}</Badge>
                      </div>
                      <p className="mt-1.5 text-sm">{f.content}</p>
                      <p className="text-muted-foreground mt-1.5 flex items-center gap-1 text-xs">
                        <LockClosedIcon className="size-3" /> Private · {userById(f.instructorId)?.name} · {formatDate(f.date)}
                      </p>
                    </div>
                    {mine && (
                      <div className="flex shrink-0 items-start gap-1">
                        <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => { setEditing(f); setFormOpen(true); }}><PencilSquareIcon /></Button>
                        <Button variant="ghost" size="icon-sm" aria-label="Delete" className="text-destructive" onClick={() => setDeleting(f)}><TrashIcon /></Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><SparklesIcon className="text-primary size-5" /> AI feedback summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={summaryStudent?.id ?? ""} onValueChange={setSummaryFor}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Choose a student" /></SelectTrigger>
              <SelectContent>
                {studentsWithFeedback.map((id) => {
                  const s = studentMap.get(id)!;
                  return <SelectItem key={id} value={id}>{s.name} · {s.classroom}</SelectItem>;
                })}
              </SelectContent>
            </Select>
            {summaryStudent ? (
              <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed">{summarizeFeedback(summaryEntries, summaryStudent.name)}</div>
            ) : (
              <p className="text-muted-foreground text-sm">Submit feedback to generate a summary.</p>
            )}
            <p className="text-muted-foreground text-xs">Summaries are generated by the local LLM from private instructor notes and are refreshed monthly by the Feedback Summary agent.</p>
          </CardContent>
        </Card>
      </div>

      <FeedbackFormDialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }} initial={editing} onSubmit={submit} instructorCourse={user?.course} />

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete feedback?</DialogTitle>
            <DialogDescription>This removes your note about {deleting && studentMap.get(deleting.studentId)?.name}. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (deleting) removeFeedback(deleting.id); setDeleting(null); toast({ title: "Feedback deleted" }); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
