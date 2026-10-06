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
import { STUDENTS } from "@/lib/data/students";
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
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: FeedbackEntry | null;
  onSubmit: (values: FeedbackValues) => void;
  instructorCourse?: string;
}) {
  const form = useForm<FeedbackValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { studentId: "", category: "Behavior", content: "", date: TODAY },
  });

  React.useEffect(() => {
    if (open) {
      form.reset(
        initial
          ? { studentId: initial.studentId, category: initial.category, content: initial.content, date: initial.date }
          : { studentId: "", category: "Behavior", content: "", date: TODAY }
      );
    }
  }, [open, initial, form]);

  const students = STUDENTS.filter((s) => s.status === "active" && (!instructorCourse || s.courseCode === instructorCourse));
  const selected = STUDENTS.find((s) => s.id === form.watch("studentId"));

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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select a student" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} · {s.classroom}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {selected && <FormDescription>{selected.classroom} · {courseByCode(selected.courseCode).name}</FormDescription>}
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
