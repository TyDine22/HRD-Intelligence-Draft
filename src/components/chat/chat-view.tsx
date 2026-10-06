"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckIcon,
  FolderIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SearchInput } from "@/components/shared/search-input";
import { useAuth } from "@/lib/auth/auth-context";
import { useAppStore } from "@/lib/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { MAX_SESSIONS, SUGGESTED_PROMPTS, generateReply } from "@/lib/data/chat";
import { formatDateTime, relativeTime } from "@/lib/utils/format";
import type { ChatMessage, ChatScope, ChatSession, FileNode } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { MessageAttachment } from "./message-attachment";
import { FileIcon } from "@/components/files/file-icon";

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function ChatView() {
  const { user, role } = useAuth();
  const { sessions, createSession, renameSession, deleteSession, appendMessage, updateAttachment, setSessionScope, files } = useAppStore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const folderParam = searchParams.get("folder");

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [sessionQuery, setSessionQuery] = React.useState("");
  const [input, setInput] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const [listening, setListening] = React.useState(false);
  const [renaming, setRenaming] = React.useState<ChatSession | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [scopeOpen, setScopeOpen] = React.useState(false);
  const [scopeFolder, setScopeFolder] = React.useState<string>("");
  const [scopeFiles, setScopeFiles] = React.useState<string[]>([]);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);
  const handledFolderParam = React.useRef<string | null>(null);

  const me = user?.id ?? "";
  const accessibleFolders = React.useMemo(() => {
    const byId = new Map(files.map((f) => [f.id, f]));
    const canSee = (n: FileNode): boolean => {
      let cur: FileNode | undefined = n;
      while (cur) {
        if (cur.ownerId === me || cur.shares.some((s) => s.userId === me)) return true;
        cur = cur.parentId ? byId.get(cur.parentId) : undefined;
      }
      return false;
    };
    return files.filter((f) => f.kind === "folder" && canSee(f));
  }, [files, me]);

  const active = sessions.find((s) => s.id === activeId) ?? null;

  // Create a folder-scoped session when arriving from Data Management (?folder=ID)
  React.useEffect(() => {
    if (!folderParam || handledFolderParam.current === folderParam) return;
    handledFolderParam.current = folderParam;
    const folder = files.find((f) => f.id === folderParam && f.kind === "folder");
    if (!folder) return;
    const fileIds = files.filter((f) => f.parentId === folder.id && f.kind === "file").map((f) => f.id);
    const s = createSession({ type: "folder", folderId: folder.id, fileIds }, `Chat · ${folder.name}`);
    setActiveId(s.id);
  }, [folderParam, files, createSession]);

  React.useEffect(() => {
    if (!activeId && sessions.length && !folderParam) setActiveId(sessions[0].id);
  }, [activeId, sessions, folderParam]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [active?.messages.length, thinking]);

  const newSession = (scope: ChatScope = { type: "general" }) => {
    const s = createSession(scope);
    setActiveId(s.id);
    setInput("");
  };

  const send = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || thinking) return;
    let session = active;
    if (!session) {
      session = createSession({ type: "general" });
      setActiveId(session.id);
    }
    const sid = session.id;
    const scope = session.scope;
    const userMsg: ChatMessage = { id: `m-${Date.now()}`, role: "user", content, createdAt: new Date().toISOString().slice(0, 19) };
    appendMessage(sid, userMsg);
    setInput("");
    setThinking(true);
    window.setTimeout(() => {
      const reply = generateReply(content, scope, role ?? "INSTRUCTOR");
      appendMessage(sid, { id: `m-${Date.now()}-a`, createdAt: new Date().toISOString().slice(0, 19), ...reply });
      setThinking(false);
    }, 900 + Math.min(1200, content.length * 12));
  };

  const toggleVoice = () => {
    const w = window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike; SpeechRecognition?: new () => SpeechRecognitionLike };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      toast({ title: "Voice input unavailable", description: "This browser does not support speech-to-text. Try Chrome or Edge.", variant: "error" });
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = Array.from({ length: e.results.length }, (_, i) => e.results[i][0].transcript).join(" ");
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const filteredSessions = sessions.filter((s) => s.title.toLowerCase().includes(sessionQuery.toLowerCase()));
  const folderScope = active && active.scope.type === "folder" ? active.scope : null;
  const scopeFolderNode = folderScope ? files.find((f) => f.id === folderScope.folderId) : undefined;
  const scopeFileNodes = folderScope ? files.filter((f) => f.parentId === folderScope.folderId && f.kind === "file") : [];

  const openScope = () => {
    if (active?.scope.type === "folder") {
      setScopeFolder(active.scope.folderId);
      setScopeFiles(active.scope.fileIds);
    } else {
      setScopeFolder(accessibleFolders[0]?.id ?? "");
      setScopeFiles(files.filter((f) => f.parentId === accessibleFolders[0]?.id && f.kind === "file").map((f) => f.id));
    }
    setScopeOpen(true);
  };

  const applyScope = (general: boolean) => {
    if (!active) return;
    if (general) setSessionScope(active.id, { type: "general" });
    else setSessionScope(active.id, { type: "folder", folderId: scopeFolder, fileIds: scopeFiles });
    setScopeOpen(false);
  };

  return (
    <div className="bg-card flex h-[calc(100vh-8.5rem)] min-h-[560px] overflow-hidden rounded-xl border shadow-sm">
      {/* Sessions */}
      <aside className="hidden w-72 shrink-0 flex-col border-r md:flex">
        <div className="space-y-2 border-b p-3">
          <Button className="w-full" onClick={() => newSession()}><PlusIcon /> New chat</Button>
          <SearchInput value={sessionQuery} onChange={setSessionQuery} placeholder="Search conversations…" />
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto p-2">
          <p className="text-muted-foreground px-2 py-1 text-[11px] font-semibold uppercase tracking-wider">Recent · {sessions.length}/{MAX_SESSIONS}</p>
          {filteredSessions.map((s) => (
            <div key={s.id} className={cn("group flex items-center gap-1 rounded-md pr-1", s.id === activeId ? "bg-accent" : "hover:bg-accent/60")}>
              <button type="button" onClick={() => setActiveId(s.id)} className="min-w-0 flex-1 cursor-pointer px-2 py-2 text-left">
                <p className="truncate text-sm font-medium">{s.title}</p>
                <p className="text-muted-foreground flex items-center gap-1 truncate text-[11px]">
                  {s.scope.type === "folder" && <FolderIcon className="size-3" />}
                  {relativeTime(s.updatedAt)} · {s.messages.length} msg
                </p>
              </button>
              <div className="hidden shrink-0 items-center group-hover:flex">
                <Button variant="ghost" size="icon-sm" aria-label="Rename" onClick={() => { setRenaming(s); setRenameValue(s.title); }}><PencilIcon /></Button>
                <Button variant="ghost" size="icon-sm" aria-label="Delete" onClick={() => { deleteSession(s.id); if (activeId === s.id) setActiveId(null); }}><TrashIcon /></Button>
              </div>
            </div>
          ))}
          {filteredSessions.length === 0 && <p className="text-muted-foreground px-2 py-6 text-center text-xs">No conversations</p>}
        </div>
        <p className="text-muted-foreground border-t p-3 text-[11px]">Only the 10 most recent sessions are stored.</p>
      </aside>

      {/* Conversation */}
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg"><SparklesIcon className="size-5" /></div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{active?.title ?? "HRD Assistant"}</p>
              <p className="text-muted-foreground truncate text-xs">
                {active?.scope.type === "folder" ? `Folder-specific · ${scopeFolderNode?.name} · ${active.scope.fileIds.length} file${active.scope.fileIds.length === 1 ? "" : "s"}` : "General HRD assistant · RAG + local LLM · English"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={activeId ?? ""} onValueChange={setActiveId}>
              <SelectTrigger size="sm" className="w-44 md:hidden"><SelectValue placeholder="Conversation" /></SelectTrigger>
              <SelectContent>{sessions.map((s) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={openScope} disabled={!active}><FolderIcon /> {active?.scope.type === "folder" ? "Change scope" : "Folder scope"}</Button>
            <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="New chat" onClick={() => newSession()}><PlusIcon /></Button>
          </div>
        </header>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-5">
          {!active || active.messages.length === 0 ? (
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
              <div className="bg-primary/10 text-primary mb-4 flex size-14 items-center justify-center rounded-2xl"><SparklesIcon className="size-7" /></div>
              <h2 className="text-lg font-semibold">How can I help with HRD today?</h2>
              <p className="text-muted-foreground mt-1 max-w-md text-sm">
                Ask about students, attendance, scores, allowances, alumni or HRD policies. I can generate summaries, charts, files and draft emails (with your confirmation).
              </p>
              <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button key={p} type="button" onClick={() => send(p)} className="hover:bg-accent cursor-pointer rounded-lg border px-3 py-2.5 text-left text-sm transition-colors">{p}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-5">
              {folderScope && (
                <div className="bg-muted/60 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 text-xs">
                  <FolderIcon className="size-4" /> Answering strictly from:
                  {scopeFileNodes.filter((f) => folderScope.fileIds.includes(f.id)).map((f) => (
                    <Badge key={f.id} variant="outline" className="gap-1"><FileIcon kind="file" ext={f.ext} className="size-3" />{f.name}</Badge>
                  ))}
                </div>
              )}
              {active.messages.map((m) => (
                <div key={m.id} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
                  {m.role === "assistant" && <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg"><SparklesIcon className="size-4" /></div>}
                  <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm", m.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md")}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    {m.attachment && (
                      <MessageAttachment
                        attachment={m.attachment}
                        onUpdate={(patch) => updateAttachment(active.id, m.id, patch)}
                        onToast={(title, description) => toast({ title, description, variant: "success" })}
                      />
                    )}
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {m.sources.map((s) => <Badge key={s} variant="outline" className="bg-card text-[10px] font-normal">{s}</Badge>)}
                      </div>
                    )}
                    <p className={cn("mt-1.5 text-[10px]", m.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground")}>{formatDateTime(m.createdAt)}</p>
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex gap-3">
                  <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg"><SparklesIcon className="size-4" /></div>
                  <div className="bg-muted flex items-center gap-1 rounded-2xl rounded-bl-md px-4 py-3">
                    <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:-0.3s]" />
                    <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:-0.15s]" />
                    <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="border-t p-3">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant={listening ? "destructive" : "outline"} size="icon" onClick={toggleVoice} aria-label="Voice input" className={cn(listening && "animate-pulse")}>
                  {listening ? <XMarkIcon /> : <MicrophoneIcon />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{listening ? "Stop listening" : "Speech-to-text (English)"}</TooltipContent>
            </Tooltip>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={listening ? "Listening…" : "Ask about students, attendance, alumni, policies… (Enter to send)"}
              rows={1}
              className="max-h-40 min-h-10 resize-none"
            />
            <Button size="icon" onClick={() => send()} disabled={!input.trim() || thinking} aria-label="Send"><PaperAirplaneIcon /></Button>
          </div>
          <p className="text-muted-foreground mx-auto mt-2 max-w-3xl text-[11px]">Responses are generated locally from authorised HRD data. Email actions always require your confirmation.</p>
        </div>
      </section>

      {/* Rename dialog */}
      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Rename conversation</DialogTitle></DialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} autoFocus onKeyDown={(e) => { if (e.key === "Enter" && renaming) { renameSession(renaming.id, renameValue.trim() || renaming.title); setRenaming(null); } }} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenaming(null)}>Cancel</Button>
            <Button onClick={() => { if (renaming) renameSession(renaming.id, renameValue.trim() || renaming.title); setRenaming(null); }}><CheckIcon /> Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scope dialog */}
      <Dialog open={scopeOpen} onOpenChange={setScopeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Folder-specific chat</DialogTitle>
            <DialogDescription>The assistant will answer strictly from the selected files. It can also generate slides from them.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Select value={scopeFolder} onValueChange={(v) => { setScopeFolder(v); setScopeFiles(files.filter((f) => f.parentId === v && f.kind === "file").map((f) => f.id)); }}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Choose a folder" /></SelectTrigger>
              <SelectContent>{accessibleFolders.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
            </Select>
            <div className="max-h-56 overflow-y-auto rounded-lg border">
              {files.filter((f) => f.parentId === scopeFolder && f.kind === "file").map((f) => (
                <label key={f.id} className="hover:bg-accent/50 flex cursor-pointer items-center gap-3 border-b px-3 py-2 text-sm last:border-0">
                  <Checkbox checked={scopeFiles.includes(f.id)} onCheckedChange={(v) => setScopeFiles((prev) => (v === true ? [...prev, f.id] : prev.filter((x) => x !== f.id)))} />
                  <FileIcon kind="file" ext={f.ext} className="size-4" />
                  <span className="truncate">{f.name}</span>
                </label>
              ))}
              {scopeFolder && files.filter((f) => f.parentId === scopeFolder && f.kind === "file").length === 0 && <p className="text-muted-foreground px-3 py-4 text-xs">This folder has no files.</p>}
            </div>
          </div>
          <DialogFooter>
            {active?.scope.type === "folder" && <Button variant="ghost" onClick={() => applyScope(true)}>Switch to general</Button>}
            <Button variant="outline" onClick={() => setScopeOpen(false)}>Cancel</Button>
            <Button onClick={() => applyScope(false)} disabled={!scopeFolder || scopeFiles.length === 0}>Use {scopeFiles.length} file{scopeFiles.length === 1 ? "" : "s"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
