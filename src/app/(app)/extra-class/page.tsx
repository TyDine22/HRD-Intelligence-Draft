import type { Metadata } from "next";

import { ExtraClassView } from "@/components/allowances/extra-class-view";
import { RoleGate } from "@/components/shared/role-gate";

export const metadata: Metadata = { title: "Extra classes" };

export default function ExtraClassPage() {
  return (
    <RoleGate allow={["ADMIN"]}>
      <ExtraClassView />
    </RoleGate>
  );
}
