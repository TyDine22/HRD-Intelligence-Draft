"use client";

import * as React from "react";
import { AcademicCapIcon, UsersIcon } from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store/app-store";
import { StudentExtraClassSection } from "./student-extra-class-section";
import { InstructorExtraClassSection } from "./instructor-extra-class-section";

type Audience = "students" | "instructors";

/**
 * Extra-class management for both audiences:
 *  - Students: sessions attended, approved hours feed the monthly student allowance.
 *  - Instructors: sessions taught (overtime reports), approved hours are paid at the instructor rate.
 */
export function ExtraClassView() {
  const { extraClasses, overtimeReports } = useAppStore();
  const [audience, setAudience] = React.useState<Audience>("students");

  const pendingStudents = extraClasses.filter((e) => e.status === "pending").length;
  const pendingInstructors = overtimeReports.filter((r) => r.status === "submitted").length;

  return (
    <Tabs value={audience} onValueChange={(v) => setAudience(v as Audience)} className="gap-6">
      <PageHeader
        title="Extra-class & allowance management"
        description={
          audience === "students"
            ? "Track extra-class hours per student, approve sessions and calculate the hourly allowance automatically."
            : "Review the extra classes instructors teach outside regular hours, approve their reports and calculate the hourly pay."
        }
        actions={
          <TabsList>
            <TabsTrigger value="students">
              <UsersIcon /> Students
              {pendingStudents > 0 && <PendingBadge count={pendingStudents} />}
            </TabsTrigger>
            <TabsTrigger value="instructors">
              <AcademicCapIcon /> Instructors
              {pendingInstructors > 0 && <PendingBadge count={pendingInstructors} />}
            </TabsTrigger>
          </TabsList>
        }
      />

      <TabsContent value="students">
        <StudentExtraClassSection />
      </TabsContent>
      <TabsContent value="instructors">
        <InstructorExtraClassSection />
      </TabsContent>
    </Tabs>
  );
}

function PendingBadge({ count }: { count: number }) {
  return (
    <Badge variant="warning" className="ml-1 h-4 min-w-4 px-1 text-[10px] tabular-nums" title={`${count} awaiting approval`}>
      {count}
    </Badge>
  );
}
