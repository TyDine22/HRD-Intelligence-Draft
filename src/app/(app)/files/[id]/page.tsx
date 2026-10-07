import type { Metadata } from "next";

import { FileChatView } from "@/components/files/file-chat-view";
import { FILES } from "@/lib/data/files";

export const metadata: Metadata = { title: "Document chat" };

export function generateStaticParams() {
  return FILES.map((file) => ({ id: file.id }));
}

export default async function FileChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FileChatView id={id} />;
}
