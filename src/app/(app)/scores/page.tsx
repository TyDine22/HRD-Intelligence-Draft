import type { Metadata } from "next";

import { ScoresView } from "@/components/scores/scores-view";

export const metadata: Metadata = { title: "Scores" };

export default function ScoresPage() {
  return <ScoresView />;
}
