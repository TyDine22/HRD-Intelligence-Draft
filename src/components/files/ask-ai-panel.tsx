"use client";

import * as React from "react";
import {
  ArrowPathIcon,
  CheckIcon,
  CloudArrowUpIcon,
  DocumentMagnifyingGlassIcon,
  FolderOpenIcon,
  LightBulbIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  PresentationChartBarIcon,
  QuestionMarkCircleIcon,
  ScaleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SearchInput } from "@/components/shared/search-input";
import { AssistantAvatar, MessageBubble, ThinkingBubble } from "@/components/chat/chat-parts";
import { useAuth } from "@/lib/auth/auth-context";
import { useAppStore } from "@/lib/store/app-store";
import { useDocChat } from "@/lib/store/doc-chat-store";
import { useToast } from "@/hooks/use-toast";
import { SUPPORTED_EXTENSIONS, formatBytes } from "@/lib/data/files";
import type { FileNode } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { FileIcon } from "./file-icon";

export const ASK_AI_PANEL = "panel";
const MAX_FILES = 10;

const QUICK_ACTIONS = [
  { label: "Summarize", prompt: "Summarize these documents", icon: DocumentMagnifyingGlassIcon },
  { label: "Key points", prompt: "What are the key points?", icon: LightBulbIcon },
  { label: "Compare", prompt: "Compare these documents", icon: ScaleIcon },
  { label: "Make slides", prompt: "Generate slides from these files", icon: PresentationChartBarIcon },
  { label: "Quiz", prompt: "Create 5 quiz questions", icon: QuestionMarkCircleIcon },
];

/**
 * Google Drive–style "Ask AI" side panel for Data Management. The user attaches documents
 * (from their files or uploaded from the computer) and chats with an assistant that answers only from them.
 * Separate from the general AI Chatbot.
 */
export function AskAiPanel({
  onClose,
  currentFolder,
  accessibleFiles,
  className,
}: {
  onClose: () => void;
  currentFolder: string | null;
  accessibleFiles: FileNode[];
  className?: string;
}) {
  const { user } = useAuth();
  const { files, uploadFiles } = useAppStore();
  const { toast } = useToast();
  const { chat, setFiles, reset, send } = useDocChat(ASK_AI_PANEL);
  const [input, setInput] = React.useState("");
  const [picking, setPicking] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [dragging, setDragging] = React.useState(false);
  const fileInput = React.useRef<HTMLInputElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  // Names uploaded from the panel, waiting for the store to give them ids so they can be attached
  const pendingUploads = React.useRef<{ names: string[]; knownIds: Set<string> } | null>(null);

  const byId = React.useMemo(() => new Map(files.map((f) => [f.id, f])), [files]);
  const attached = chat.fileIds.map((id) => byId.get(id)).filter((f): f is FileNode => !!f);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.messages.length, chat.thinking]);

  React.useEffect(() => {
    const pending = pendingUploads.current;
    if (!pending) return;
    const added = files.filter((f) => !pending.knownIds.has(f.id) && pending.names.includes(f.name)).map((f) => f.id);
    if (!added.length) return;
    pendingUploads.current = null;
    setFiles((prev) => [...prev, ...added.filter((id) => !prev.includes(id))].slice(0, MAX_FILES));
  }, [files, setFiles]);

  const candidates = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return accessibleFiles
      .filter((f) => f.kind === "file" && (!q || f.name.toLowerCase().includes(q)))
      .sort((a, b) => Number(b.parentId === currentFolder) - Number(a.parentId === currentFolder) || a.name.localeCompare(b.name));
  }, [accessibleFiles, query, currentFolder]);

  const toggle = (id: string) => {
    if (!chat.fileIds.includes(id) && chat.fileIds.length >= MAX_FILES) {
      toast({ title: `Up to ${MAX_FILES} files`, description: "Remove a file to add another.", variant: "error" });
      return;
    }
    setFiles((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const upload = (list: FileList | null) => {
    const names = Array.from(list ?? []).map((f) => f.name);
    const accepted = names.filter((n) => SUPPORTED_EXTENSIONS.includes((n.split(".").pop() ?? "").toLowerCase() as (typeof SUPPORTED_EXTENSIONS)[number]));
    if (accepted.length) {
      pendingUploads.current = { names: accepted, knownIds: new Set(files.map((f) => f.id)) };
      uploadFiles(currentFolder, accepted, user?.id ?? "");
      toast({ title: `${accepted.length} file${accepted.length > 1 ? "s" : ""} attached`, description: "Also saved to this folder.", variant: "success" });
    }
    if (accepted.length !== names.length) toast({ title: "Some files were skipped", description: "Supported: TXT, MD, XLSX, CSV, PDF, DOCX, PPTX, PNG, JPEG.", variant: "error" });
  };

  const submit = (text = input) => {
    if (!attached.length) {
      setPicking(true);
      toast({ title: "Attach a document first", description: "Pick a file or upload one, then ask again." });
      return;
    }
    if (send(text, attached)) {
      setInput("");
      setPicking(false);
    }
  };

  return (
    <aside
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }}
      onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files); }}
      className={cn("bg-card relative flex flex-col overflow-hidden rounded-3xl shadow-lg shadow-black/5", className)}
    >
      <input ref={fileInput} type="file" multiple accept=".txt,.md,.xlsx,.csv,.pdf,.docx,.pptx,.png,.jpeg,.jpg" className="hidden" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />

      {dragging && (
        <div className="bg-primary/10 ring-primary/40 absolute inset-2 z-20 flex flex-col items-center justify-center gap-2 rounded-2xl ring-2 backdrop-blur-sm">
          <CloudArrowUpIcon className="text-primary size-8" />
          <p className="text-primary text-sm font-medium">Drop to attach</p>
        </div>
      )}

      {/* Header */}
      <div className="from-primary/10 to-chart-5/10 flex items-center gap-3 bg-gradient-to-br px-4 py-3.5">
        <AssistantAvatar className="size-9" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Ask AI</p>
          <p className="text-muted-foreground truncate text-xs">Answers only from the documents you attach</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="rounded-lg" aria-label="New conversation" onClick={() => { reset(); setInput(""); }}><ArrowPathIcon /></Button>
          </TooltipTrigger>
          <TooltipContent>New conversation</TooltipContent>
        </Tooltip>
        <Button variant="ghost" size="icon-sm" className="rounded-lg" aria-label="Close Ask AI" onClick={onClose}><XMarkIcon /></Button>
      </div>

      {/* Attached documents */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {attached.map((f) => (
            <span key={f.id} className="bg-primary/10 text-primary inline-flex max-w-[180px] items-center gap-1.5 rounded-full py-1 pr-1 pl-2.5 text-xs font-medium">
              <FileIcon kind="file" ext={f.ext} className="size-3.5" />
              <span className="truncate">{f.name}</span>
              <button type="button" onClick={() => toggle(f.id)} aria-label={`Remove ${f.name}`} className="hover:bg-primary/15 flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full">
                <XMarkIcon className="size-3" />
              </button>
            </span>
          ))}
          <AddMenu onPick={() => setPicking((p) => !p)} onUpload={() => fileInput.current?.click()} label={attached.length ? "Add" : "Add documents"} />
        </div>

        {picking && (
          <div className="bg-muted/50 mt-3 rounded-2xl p-2">
            <div className="mb-1.5 flex items-center gap-2">
              <SearchInput value={query} onChange={setQuery} placeholder="Search your documents…" className="flex-1 [&_input]:h-8 [&_input]:rounded-xl [&_input]:border-0 [&_input]:shadow-none" />
              <Button size="sm" variant="ghost" className="h-8 rounded-xl" onClick={() => setPicking(false)}>Done</Button>
            </div>
            <div className="scrollbar-thin max-h-56 space-y-0.5 overflow-y-auto">
              {candidates.map((f) => {
                const on = chat.fileIds.includes(f.id);
                const folder = f.parentId ? byId.get(f.parentId) : undefined;
                return (
                  <button key={f.id} type="button" onClick={() => toggle(f.id)} className={cn("flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left transition-colors", on ? "bg-card shadow-sm" : "hover:bg-card/70")}>
                    <span className={cn("flex size-4.5 shrink-0 items-center justify-center rounded-md", on ? "bg-primary text-primary-foreground" : "bg-card shadow-xs")}>{on && <CheckIcon className="size-3" />}</span>
                    <FileIcon kind="file" ext={f.ext} className="size-4" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px]">{f.name}</span>
                      <span className="text-muted-foreground block truncate text-[10px]">{folder?.name ?? "My files"} · {formatBytes(f.size)}</span>
                    </span>
                  </button>
                );
              })}
              {candidates.length === 0 && <p className="text-muted-foreground px-3 py-3 text-center text-xs">No files match.</p>}
            </div>
          </div>
        )}
      </div>

      {/* Conversation */}
      <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-4">
        {chat.messages.length === 0 ? (
          <div className="flex h-full flex-col justify-end gap-3">
            {attached.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="bg-muted/50 hover:bg-primary/5 flex cursor-pointer flex-col items-center gap-2 rounded-2xl px-4 py-6 text-center transition-colors"
              >
                <span className="bg-card text-primary flex size-11 items-center justify-center rounded-2xl shadow-sm"><CloudArrowUpIcon className="size-6" /></span>
                <span className="text-sm font-medium">Drop files here or click to upload</span>
                <span className="text-muted-foreground text-xs">Or use <b>Add documents</b> to pick from your files</span>
              </button>
            ) : (
              <div className="from-primary/10 to-chart-5/10 rounded-2xl bg-gradient-to-br p-4">
                <p className="text-sm font-semibold">I&apos;ve read {attached.length === 1 ? "this document" : `these ${attached.length} documents`}.</p>
                <p className="text-muted-foreground mt-0.5 text-xs">What would you like me to do?</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map(({ label, prompt, icon: Icon }) => (
                <button key={label} type="button" onClick={() => submit(prompt)} className="bg-muted hover:bg-primary/10 hover:text-primary inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors">
                  <Icon className="size-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chat.messages.map((m) => <MessageBubble key={m.id} message={m} sessionId={ASK_AI_PANEL} compact />)}
            {chat.thinking && <ThinkingBubble compact />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="p-3 pt-0">
        <div className="bg-muted/60 focus-within:bg-card focus-within:ring-primary/25 flex items-end gap-1 rounded-2xl p-1.5 ring-1 ring-transparent transition-all focus-within:shadow-md">
          <AddMenu icon onPick={() => setPicking(true)} onUpload={() => fileInput.current?.click()} />
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={attached.length ? "Ask about the attached documents…" : "Attach a document, then ask…"}
            rows={1}
            className="max-h-28 min-h-9 resize-none border-0 bg-transparent px-1.5 py-2 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <Button size="icon-sm" onClick={() => submit()} disabled={!input.trim() || chat.thinking} aria-label="Send" className="from-primary to-chart-5 mb-0.5 rounded-xl bg-gradient-to-br">
            <PaperAirplaneIcon />
          </Button>
        </div>
      </div>
    </aside>
  );
}

/** "+ Add" menu: pick from Data Management or upload from the computer. */
function AddMenu({ onPick, onUpload, label, icon = false }: { onPick: () => void; onUpload: () => void; label?: string; icon?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {icon ? (
          <Button variant="ghost" size="icon-sm" className="mb-0.5 rounded-xl" aria-label="Attach documents"><PaperClipIcon /></Button>
        ) : (
          <button type="button" className="bg-muted hover:bg-primary/10 hover:text-primary inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors">
            <span className="text-sm leading-none">+</span> {label}
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="rounded-xl">
        <DropdownMenuItem onSelect={onPick}><FolderOpenIcon /> From your documents</DropdownMenuItem>
        <DropdownMenuItem onSelect={onUpload}><CloudArrowUpIcon /> Upload from computer</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
