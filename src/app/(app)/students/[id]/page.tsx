import type { Metadata } from "next";

import { StudentDetailView } from "@/components/students/student-detail-view";
import { STUDENTS } from "@/lib/data/students";

export const metadata: Metadata = { title: "Student profile" };

export const dynamicParams = false;

export function generateStaticParams() {
  return STUDENTS.map((s) => ({ id: s.id }));
}

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentDetailView id={id} />;
}
