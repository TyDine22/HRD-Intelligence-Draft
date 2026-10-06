import type { Metadata } from "next";
import { Suspense } from "react";

import { ChatView } from "@/components/chat/chat-view";

export const metadata: Metadata = { title: "AI Chatbot" };

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground p-8 text-sm">Loading assistant…</div>}>
      <ChatView />
    </Suspense>
  );
}
