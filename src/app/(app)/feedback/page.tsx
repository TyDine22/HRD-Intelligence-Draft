import type { Metadata } from "next";

import { FeedbackView } from "@/components/feedback/feedback-view";

export const metadata: Metadata = { title: "Instructor feedback" };

export default function FeedbackPage() {
  return <FeedbackView />;
}
