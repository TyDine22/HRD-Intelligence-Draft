import type { Metadata } from "next";

import { AtRiskView } from "@/components/at-risk/at-risk-view";

export const metadata: Metadata = { title: "At-risk students" };

export default function AtRiskPage() {
  return <AtRiskView />;
}
