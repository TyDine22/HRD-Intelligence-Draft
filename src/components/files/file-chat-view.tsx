"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  DocumentMagnifyingGlassIcon,
  LightBulbIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  PresentationChartBarIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuth } from "@/lib/auth/auth-context";
import { useAppStore } from "@/lib/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { formatBytes } from "@/lib/data/files";
import { userById } from "@/lib/data/users";
import { formatDate } from "@/lib/utils/format";
import { exportText } from "@/lib/utils/export";
import type { FileNode } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { AssistantAvatar, MessageBubble, ThinkingBubble } from "@/components/chat/chat-parts";
import { useDocChat } from "@/lib/store/doc-chat-store";
import { FileIcon } from "./file-icon";

const FILE_PROMPTS = [
  { label: "Summarize this document", icon: DocumentMagnifyingGlassIcon },
  { label: "What are the key points?", icon: LightBulbIcon },
  { label: "Generate slides from this file", icon: PresentationChartBarIcon },
  { label: "Create 5 quiz questions", icon: QuestionMarkCircleIcon },
];

/** Google Drive–style viewer: document preview on the left, an assistant scoped to this one file on the right. */
export function FileChatView({ id }: { id: string }) {
  const { user } = useAuth();
  const { files } = useAppStore();
  const { toast } = useToast();
  const node = files.find((f) => f.id === id && f.kind === "file");
  const { chat, send } = useDocChat(`file:${id}`);
  const thinking = chat.thinking;

  const [input, setInput] = React.useState("");
  const [panelOpen, setPanelOpen] = React.useState(true);
  const [mobileTab, setMobileTab] = React.useState<"preview" | "chat">("preview");
  const bottomRef = React.useRef<HTMLDivElement>(null);


  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.messages.length, thinking]);

  const trail = React.useMemo(() => {
    const out: FileNode[] = [];
    let cur = node?.parentId ? files.find((f) => f.id === node.parentId) : undefined;
    while (cur) {
      out.unshift(cur);
      const pid: string | null = cur.parentId;
      cur = pid ? files.find((f) => f.id === pid) : undefined;
    }
    return out;
  }, [node, files]);

  if (!node) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="bg-card rounded-3xl p-6 shadow-sm">
          <EmptyState title="File not found" description="It may have been moved or deleted, or you no longer have access." />
          <div className="flex justify-center"><Button asChild variant="ghost" className="rounded-xl"><Link href="/files"><ArrowLeftIcon /> Back to Data management</Link></Button></div>
        </div>
      </div>
    );
  }

  const submit = (text?: string) => {
    if (send(text ?? input, [node])) setInput("");
    setMobileTab("chat");
  };

  const download = () => {
    exportText(node.name, `Mock content for ${node.name}\nOwner: ${userById(node.ownerId)?.name}\nSize: ${formatBytes(node.size)}`);
    toast({ title: "Download started", description: node.name });
  };

  const owner = node.ownerId === user?.id ? "You" : userById(node.ownerId)?.name ?? "Unknown";

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-[520px] flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 md:px-6">
        <Button asChild variant="ghost" size="icon-sm" className="bg-card rounded-xl shadow-sm" aria-label="Back to Data management">
          <Link href="/files"><ArrowLeftIcon /></Link>
        </Button>
        <div className="bg-card flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm"><FileIcon kind="file" ext={node.ext} className="size-5" /></div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{node.name}</p>
          <p className="text-muted-foreground flex items-center gap-1 truncate text-xs">
            <Link href="/files" className="hover:text-foreground">Data management</Link>
            {trail.map((t) => (
              <React.Fragment key={t.id}><ChevronRightIcon className="size-3 shrink-0" /><span className="truncate">{t.name}</span></React.Fragment>
            ))}
            <span className="hidden sm:inline">· {formatBytes(node.size)} · {owner} · {formatDate(node.updatedAt)}</span>
          </p>
        </div>
        <Button variant="ghost" size="sm" className="bg-card rounded-xl shadow-sm" onClick={download}><ArrowDownTrayIcon /><span className="hidden sm:inline">Download</span></Button>
        <Button
          size="sm"
          onClick={() => setPanelOpen((o) => !o)}
          className={cn("hidden rounded-xl lg:inline-flex", panelOpen ? "bg-primary/10 text-primary hover:bg-primary/15 shadow-none" : "from-primary to-chart-5 bg-gradient-to-r shadow-md shadow-primary/20")}
        >
          <SparklesIcon /> {panelOpen ? "Hide AI" : "Ask AI"}
        </Button>
      </div>

      {/* Mobile switcher */}
      <div className="px-4 pb-3 lg:hidden">
        <div className="bg-muted grid grid-cols-2 rounded-xl p-1 text-sm font-medium">
          {(["preview", "chat"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setMobileTab(t)} className={cn("cursor-pointer rounded-lg py-1.5 transition-all", mobileTab === t ? "bg-card shadow-sm" : "text-muted-foreground")}>
              {t === "preview" ? "Preview" : "Ask AI"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-4 px-4 pb-4 md:px-6 md:pb-6">
        {/* Preview */}
        <div className={cn("bg-muted/50 scrollbar-thin min-w-0 flex-1 overflow-y-auto rounded-3xl p-4 sm:p-8", mobileTab === "chat" && "hidden lg:block")}>
          <DocumentPreview node={node} />
        </div>

        {/* AI panel */}
        {(panelOpen || mobileTab === "chat") && (
          <aside className={cn("bg-card flex w-full min-w-0 flex-col overflow-hidden rounded-3xl shadow-sm lg:w-[420px] lg:shrink-0", mobileTab === "preview" && "hidden lg:flex", !panelOpen && "lg:hidden")}>
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <AssistantAvatar className="size-9" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Ask about this file</p>
                <p className="text-muted-foreground truncate text-xs">Answers come only from {node.name}</p>
              </div>
              <Button variant="ghost" size="icon-sm" className="hidden rounded-lg lg:inline-flex" aria-label="Close AI panel" onClick={() => setPanelOpen(false)}><XMarkIcon /></Button>
            </div>

            <div className="scrollbar-thin flex-1 overflow-y-auto px-4 pb-4">
              {chat.messages.length === 0 ? (
                <div className="flex h-full flex-col justify-end gap-3">
                  <div className="from-primary/10 to-chart-5/10 rounded-2xl bg-gradient-to-br p-4">
                    <p className="text-sm font-semibold">I&apos;ve read this document.</p>
                    <p className="text-muted-foreground mt-1 text-xs">Ask a question, or start with one of these.</p>
                  </div>
                  {FILE_PROMPTS.map(({ label, icon: Icon }) => (
                    <button key={label} type="button" onClick={() => submit(label)} className="bg-muted/60 hover:bg-primary/10 hover:text-primary flex cursor-pointer items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm transition-colors">
                      <Icon className="text-primary size-5 shrink-0" /> {label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {chat.messages.map((m) => <MessageBubble key={m.id} message={m} sessionId={`file:${id}`} compact />)}
                  {thinking && <ThinkingBubble compact />}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <div className="p-3 pt-0">
              <div className="bg-muted/60 focus-within:bg-card focus-within:ring-primary/25 flex items-end gap-2 rounded-2xl p-1.5 ring-1 ring-transparent transition-all focus-within:shadow-md">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  placeholder="Ask anything about this file…"
                  rows={1}
                  className="max-h-28 min-h-9 resize-none border-0 bg-transparent px-2.5 py-2 shadow-none focus-visible:ring-0 dark:bg-transparent"
                />
                <Button size="icon-sm" onClick={() => submit()} disabled={!input.trim() || thinking} aria-label="Send" className="from-primary to-chart-5 mb-0.5 rounded-xl bg-gradient-to-br">
                  <PaperAirplaneIcon />
                </Button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

/** Lightweight mock preview, shaped by file type (the prototype has no real file contents). */
function DocumentPreview({ node }: { node: FileNode }) {
  const title = node.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
  const ext = node.ext ?? "";

  if (ext === "xlsx" || ext === "csv") {
    const cols = ["A", "B", "C", "D", "E", "F"];
    return (
      <div className="bg-card mx-auto max-w-4xl overflow-hidden rounded-2xl shadow-sm">
        <div className="bg-muted/60 px-4 py-2.5 text-sm font-medium">{title}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30 text-muted-foreground">
                <th className="w-10 px-2 py-1.5" />
                {cols.map((c) => <th key={c} className="px-3 py-1.5 text-left font-medium">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 18 }, (_, r) => (
                <tr key={r} className="even:bg-muted/20">
                  <td className="text-muted-foreground px-2 py-1.5 text-center">{r + 1}</td>
                  {cols.map((c, i) => (
                    <td key={c} className="px-3 py-1.5">
                      {r === 0 ? <span className="font-semibold">{["ID", "Name", "Class", "Attendance", "Score", "Status"][i]}</span> : <span className="bg-muted inline-block h-2 rounded-full" style={{ width: `${30 + ((r * 17 + i * 23) % 60)}%` }} />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (ext === "pptx") {
    return (
      <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-card aspect-video rounded-2xl p-5 shadow-sm">
            <p className="text-muted-foreground text-[10px] font-medium">Slide {i + 1}</p>
            {i === 0 ? (
              <div className="flex h-full flex-col justify-center pb-4">
                <p className="text-base font-semibold">{title}</p>
                <span className="from-primary to-chart-5 mt-2 h-1 w-12 rounded-full bg-gradient-to-r" />
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <span className="bg-foreground/15 block h-2.5 w-1/2 rounded-full" />
                {[80, 65, 72].map((w) => <span key={w} className="bg-muted block h-2 rounded-full" style={{ width: `${w - i * 3}%` }} />)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (ext === "png" || ext === "jpeg" || ext === "jpg") {
    return (
      <div className="bg-card mx-auto flex aspect-[3/4] max-w-xl flex-col items-center justify-center gap-3 rounded-2xl shadow-sm">
        <div className="from-chart-5/15 to-primary/15 flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br"><PhotoIcon className="text-chart-5 size-10" /></div>
        <p className="text-sm font-medium">{node.name}</p>
        <p className="text-muted-foreground text-xs">Scanned image · text is read with OCR for the assistant</p>
      </div>
    );
  }

  // pdf, docx, md, txt
  return (
    <div className="bg-card mx-auto max-w-3xl space-y-6 rounded-2xl px-8 py-10 shadow-sm sm:px-14 sm:py-14">
      <div>
        <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">{ext.toUpperCase()} document</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
        <span className="from-primary to-chart-5 mt-3 block h-1 w-16 rounded-full bg-gradient-to-r" />
      </div>
      {["Overview", "Key policies", "Procedures", "Summary"].map((h, i) => (
        <section key={h} className="space-y-2.5">
          <h2 className="text-sm font-semibold">{i + 1}. {h}</h2>
          {[96, 88, 92, 70].slice(0, 3 + (i % 2)).map((w, j) => (
            <span key={j} className="bg-muted block h-2 rounded-full" style={{ width: `${w - ((i + j) % 3) * 6}%` }} />
          ))}
        </section>
      ))}
    </div>
  );
}
