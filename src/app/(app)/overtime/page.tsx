import type { Metadata } from "next";

import { OvertimeView } from "@/components/feedback/overtime-view";
import { RoleGate } from "@/components/shared/role-gate";

export const metadata: Metadata = { title: "Overtime reports" };

export default function OvertimePage() {
  return (
    <RoleGate allow={["INSTRUCTOR"]}>
      <OvertimeView />
    </RoleGate>
  );
}
