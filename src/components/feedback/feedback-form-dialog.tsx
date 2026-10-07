"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { STUDENTS, initials } from "@/lib/data/students";
import { FEEDBACK_CATEGORIES } from "@/lib/data/feedback";
import { courseByCode } from "@/lib/data/users";
import { feedbackSchema, type FeedbackValues } from "@/lib/validation/schemas";
import type { FeedbackEntry } from "@/lib/data/types";
import { TODAY } from "@/lib/data/seed";

export function FeedbackFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  instructorCourse,
  studentId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: FeedbackEntry | null;
  onSubmit: (values: FeedbackValues) => void;
  instructorCourse?: string;
  /** Pins the form to one student (e.g. when opened from their profile) and hides the student picker. */
  studentId?: string;
}) {
  const form = useForm<FeedbackValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { studentId: studentId ?? "", category: "Behavior", content: "", date: TODAY },
  });

  React.useEffect(() => {
    if (open) {
      form.reset(
        initial
          ? { studentId: initial.studentId, category: initial.category, content: initial.content, date: initial.date }
          : { studentId: studentId ?? "", category: "Behavior", content: "", date: TODAY }
      );
    }
  }, [open, initial, studentId, form]);

  const students = STUDENTS.filter((s) => s.status === "active" && (!instructorCourse || s.courseCode === instructorCourse));
  const selected = STUDENTS.find((s) => s.id === form.watch("studentId"));
  const pinned = Boolean(studentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit feedback" : "Submit private feedback"}</DialogTitle>
          <DialogDescription>Feedback is private to HRD staff and is never visible to students.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  {pinned ? (
                    <div className="bg-muted/50 flex items-center gap-3 rounded-lg border px-3 py-2">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">{selected ? initials(selected.name) : "?"}</AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{selected?.name ?? field.value}</span>
                        {selected && <span className="text-muted-foreground block text-xs">{selected.classroom} · {courseByCode(selected.courseCode).name}</span>}
                      </span>
                    </div>
                  ) : (
                    <>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full"><SelectValue placeholder="Select a student" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} · {s.classroom}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {selected && <FormDescription>{selected.classroom} · {courseByCode(selected.courseCode).name}</FormDescription>}
                    </>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FEEDBACK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl><Input type="date" max={TODAY} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback</FormLabel>
                  <FormControl><Textarea rows={5} placeholder="Observations about behaviour, soft skills, hard skills or academic performance…" {...field} /></FormControl>
                  <FormDescription>{field.value.length} / 1000 characters</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{initial ? "Save changes" : "Submit feedback"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
