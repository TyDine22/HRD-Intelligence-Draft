import type { Metadata } from "next";

import { AlumniDetailView } from "@/components/alumni/alumni-detail-view";
import { RoleGate } from "@/components/shared/role-gate";
import { ALUMNI } from "@/lib/data/alumni";

export const metadata: Metadata = { title: "Alumni profile" };

export function generateStaticParams() {
  return ALUMNI.map((a) => ({ id: a.id }));
}

export default async function AlumniDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RoleGate allow={["ADMIN"]}>
      <AlumniDetailView id={id} />
    </RoleGate>
  );
}
