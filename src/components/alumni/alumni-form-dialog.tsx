"use client";

import * as React from "react";
import { useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COURSES } from "@/lib/data/users";
import { UNIVERSITIES } from "@/lib/data/students";
import { EMPLOYMENT_STATUSES, INDUSTRIES, SALARY_RANGES } from "@/lib/data/alumni";
import { alumniSchema, type AlumniValues } from "@/lib/validation/schemas";
import type { Alumni } from "@/lib/data/types";


function SelectField({
  control,
  name,
  label,
  options,
}: {
  control: Control<AlumniValues>;
  name: keyof AlumniValues;
  label: string;
  options: { value: string; label: string }[];
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select value={String(field.value ?? "")} onValueChange={field.onChange}>
            <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
            <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function AlumniFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Alumni | null;
  onSubmit: (values: AlumniValues) => void;
}) {
  const form = useForm<AlumniValues>({
    resolver: zodResolver(alumniSchema),
    defaultValues: {
      name: "", email: "", phone: "", gender: "Male", generation: "12", courseCode: "SP", education: "Bachelor",
      university: UNIVERSITIES[0], employmentStatus: "Local SW Developer", industry: INDUSTRIES[0], salaryRange: SALARY_RANGES[1],
      company: "", jobTitle: "", location: "Phnom Penh",
    },
  });

  React.useEffect(() => {
    if (!open) return;
    if (initial) {
      const job = initial.jobs[initial.jobs.length - 1];
      form.reset({
        name: initial.name, email: initial.email, phone: initial.phone, gender: initial.gender, generation: String(initial.generation),
        courseCode: initial.courseCode, education: initial.education, university: initial.university, employmentStatus: initial.employmentStatus,
        industry: initial.industry, salaryRange: initial.salaryRange === "—" ? SALARY_RANGES[0] : initial.salaryRange,
        company: job?.company ?? "", jobTitle: job?.title ?? "", location: job?.location ?? "",
      });
    } else {
      form.reset();
    }
  }, [open, initial, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit alumni profile" : "Add alumni"}</DialogTitle>
          <DialogDescription>Personal information, education and current employment.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Full name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <SelectField control={form.control} name="gender" label="Gender" options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }]} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="+855 …" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Education</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField control={form.control} name="generation" label="Generation" options={[8, 9, 10, 11, 12, 13].map((g) => ({ value: String(g), label: `Generation ${g}` }))} />
              <SelectField control={form.control} name="courseCode" label="Course" options={COURSES.map((c) => ({ value: c.code, label: c.name }))} />
              <SelectField control={form.control} name="education" label="Education level" options={["Bachelor", "Master", "PhD"].map((e) => ({ value: e, label: e }))} />
              <SelectField control={form.control} name="university" label="University" options={UNIVERSITIES.map((u) => ({ value: u, label: u }))} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Employment</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField control={form.control} name="employmentStatus" label="Employment status" options={EMPLOYMENT_STATUSES.map((s) => ({ value: s, label: s }))} />
              <SelectField control={form.control} name="industry" label="Industry" options={INDUSTRIES.map((i) => ({ value: i, label: i }))} />
              <SelectField control={form.control} name="salaryRange" label="Salary range" options={SALARY_RANGES.map((s) => ({ value: s, label: s }))} />
              <FormField control={form.control} name="company" render={({ field }) => (
                <FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="jobTitle" render={({ field }) => (
                <FormItem><FormLabel>Job title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem><FormLabel>Work location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{initial ? "Save changes" : "Create profile"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}