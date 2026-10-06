import type { Metadata } from "next";

import { AgentsView } from "@/components/agents/agents-view";
import { RoleGate } from "@/components/shared/role-gate";

export const metadata: Metadata = { title: "AI Agents" };

export default function AgentsPage() {
  return (
    <RoleGate allow={["ADMIN"]}>
      <AgentsView />
    </RoleGate>
  );
}
