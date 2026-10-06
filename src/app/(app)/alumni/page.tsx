import type { Metadata } from "next";

import { AlumniView } from "@/components/alumni/alumni-view";
import { RoleGate } from "@/components/shared/role-gate";

export const metadata: Metadata = { title: "Alumni" };

export default function AlumniPage() {
  return (
    <RoleGate allow={["ADMIN"]}>
      <AlumniView />
    </RoleGate>
  );
}
