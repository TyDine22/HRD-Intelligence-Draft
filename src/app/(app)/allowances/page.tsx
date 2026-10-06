import type { Metadata } from "next";

import { AllowancesView } from "@/components/allowances/allowances-view";
import { RoleGate } from "@/components/shared/role-gate";

export const metadata: Metadata = { title: "Allowances" };

export default function AllowancesPage() {
  return (
    <RoleGate allow={["ADMIN"]}>
      <AllowancesView />
    </RoleGate>
  );
}
