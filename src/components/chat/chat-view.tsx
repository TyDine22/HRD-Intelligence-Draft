"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpRightIcon,
  BriefcaseIcon,
  ChartBarIcon,
  CheckIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  TrophyIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SearchInput } from "@/components/shared/search-input";
import { useAuth } from "@/lib/auth/auth-context";
import { useAppStore } from "@/lib/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { MAX_SESSIONS, SUGGESTED_PROMPTS, generateReply } from "@/lib/data/chat";
import { relativeTime } from "@/lib/utils/format";
import type { ChatMessage, ChatScope, ChatSession } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { AssistantAvatar, MessageBubble, ThinkingBubble } from "@/components/chat/chat-parts";

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

const PROMPT_STYLES = [
  { icon: ChartBarIcon, tone: "bg-primary/10 text-primary" },
  { icon: TrophyIcon, tone: "bg-chart-3/15 text-chart-3" },
  { icon: ExclamationTriangleIcon, tone: "bg-chart-4/10 text-chart-4" },
  { icon: BriefcaseIcon, tone: "bg-chart-2/15 text-chart-2" },
  { icon: EnvelopeIcon, tone: "bg-chart-5/10 text-chart-5" },
  { icon: DocumentTextIcon, tone: "bg-info/15 text-info" },
];

function groupSessions(list: ChatSession[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 24 * 60 * 60 * 1000;
  const groups: { label: string; items: ChatSession[] }[] = [
    { label: "Today", items: [] },
    { label: "Previous 7 days", items: [] },
    { label: "Older", items: [] },
  ];
  for (const s of list) {
    const t = new Date(s.updatedAt).getTime();
    if (t >= startOfToday) groups[0].items.push(s);
    else if (t >= startOfToday - 7 * day) groups[1].items.push(s);
    else groups[2].items.push(s);
  }
  return groups.filter((g) => g.items.length > 0);
}

export function ChatView() {
  const { user, role } = useAuth();
  const { sessions, createSession, renameSession, deleteSession, appendMessage } = useAppStore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const sessionParam = searchParams.get("session");

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [sessionQuery, setSessionQuery] = React.useState("");
  const [input, setInput] = React.useState("");
  const [thinking, setThinking] = React.useState(false);
  const [listening, setListening] = React.useState(false);
  const [renaming, setRenaming] = React.useState<ChatSession | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);
  const me = user?.id ?? "";
  const active = sessions.find((s) => s.id === activeId) ?? null;

  // Open a specific conversation when expanded from the floating assistant (?session=ID)
  const handledSessionParam = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!sessionParam || handledSessionParam.current === sessionParam) return;
    if (!sessions.some((s) => s.id === sessionParam)) return;
    handledSessionParam.current = sessionParam;
    setActiveId(sessionParam);
  }, [sessionParam, sessions]);

  React.useEffect(() => {
    if (!activeId && sessions.length && !sessionParam) setActiveId(sessions[0].id);
  }, [activeId, sessions, sessionParam]);

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

  const sessionGroups = groupSessions(filteredSessions);
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="relative flex h-[calc(100dvh-4rem)] min-h-[520px] overflow-hidden">
      {/* Sessions */}
      <aside className="bg-muted/40 hidden w-72 shrink-0 flex-col md:flex">
        <div className="space-y-3 p-4">
          <Button
            className="from-primary to-chart-5 h-10 w-full rounded-xl bg-gradient-to-r shadow-md shadow-primary/20 transition-shadow hover:shadow-lg hover:shadow-primary/30"
            onClick={() => newSession()}
          >
            <PlusIcon /> New chat
          </Button>
          <SearchInput value={sessionQuery} onChange={setSessionQuery} placeholder="Search conversations…" className="[&_input]:rounded-xl [&_input]:border-0 [&_input]:shadow-sm" />
        </div>
        <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-3 pb-3">
          {sessionGroups.map((g) => (
            <div key={g.label}>
              <p className="text-muted-foreground px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider">{g.label}</p>
              <div className="space-y-0.5">
                {g.items.map((s) => {
                  const selected = s.id === activeId;
                  return (
                    <div
                      key={s.id}
                      className={cn(
                        "group relative flex items-center gap-1 rounded-xl pr-1 transition-all",
                        selected ? "bg-card shadow-sm" : "hover:bg-card/60"
                      )}
                    >
                      {selected && <span className="from-primary to-chart-5 absolute top-2.5 bottom-2.5 left-0 w-1 rounded-full bg-gradient-to-b" />}
                      <button type="button" onClick={() => setActiveId(s.id)} className="min-w-0 flex-1 cursor-pointer px-3 py-2.5 text-left">
                        <p className={cn("truncate text-sm", selected ? "font-semibold" : "font-medium")}>{s.title}</p>
                        <p className="text-muted-foreground flex items-center gap-1 truncate text-[11px]">
                          {relativeTime(s.updatedAt)} · {s.messages.length} msg
                        </p>
                      </button>
                      <div className="hidden shrink-0 items-center group-hover:flex">
                        <Button variant="ghost" size="icon-sm" className="rounded-lg" aria-label="Rename" onClick={() => { setRenaming(s); setRenameValue(s.title); }}><PencilIcon /></Button>
                        <Button variant="ghost" size="icon-sm" className="hover:text-destructive rounded-lg" aria-label="Delete" onClick={() => { deleteSession(s.id); if (activeId === s.id) setActiveId(null); }}><TrashIcon /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {filteredSessions.length === 0 && <p className="text-muted-foreground px-2 py-6 text-center text-xs">No conversations</p>}
        </div>
        <div className="px-4 pb-4">
          <div className="bg-card rounded-xl p-3 shadow-sm">
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground font-medium">Stored sessions</span>
              <span className="font-semibold">{sessions.length}/{MAX_SESSIONS}</span>
            </div>
            <div className="bg-muted h-1.5 overflow-hidden rounded-full">
              <div className="from-primary to-chart-5 h-full rounded-full bg-gradient-to-r transition-all" style={{ width: `${Math.min(100, (sessions.length / MAX_SESSIONS) * 100)}%` }} />
            </div>
            <p className="text-muted-foreground mt-1.5 text-[10px]">Only the 10 most recent sessions are kept.</p>
          </div>
        </div>
      </aside>

      {/* Conversation */}
      <section className="bg-background relative flex min-w-0 flex-1 flex-col">
        {/* Ambient glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="bg-primary/10 absolute -top-32 left-1/2 size-[520px] -translate-x-1/2 rounded-full blur-3xl" />
          <div className="bg-chart-2/10 absolute -right-24 bottom-10 size-80 rounded-full blur-3xl" />
        </div>

        <header className="relative z-10 flex items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <AssistantAvatar className="size-9" />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold">{active?.title ?? "HRD Assistant"}</p>
              <p className="text-muted-foreground flex items-center gap-1.5 truncate text-xs">
                <span className="bg-success relative flex size-1.5 rounded-full"><span className="bg-success absolute inline-flex size-full animate-ping rounded-full opacity-60" /></span>
                Online · RAG + local LLM
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={activeId ?? ""} onValueChange={setActiveId}>
              <SelectTrigger size="sm" className="w-40 rounded-xl border-0 shadow-sm md:hidden"><SelectValue placeholder="Conversation" /></SelectTrigger>
              <SelectContent>{sessions.map((s) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="ghost" size="icon-sm" className="bg-card rounded-xl shadow-sm md:hidden" aria-label="New chat" onClick={() => newSession()}><PlusIcon /></Button>
          </div>
        </header>

        <div className="scrollbar-thin relative z-10 flex-1 overflow-y-auto px-4 md:px-6">
          {!active || active.messages.length === 0 ? (
            <div className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center py-10 text-center">
              <div className="relative mb-6">
                <div className="from-primary to-chart-5 absolute inset-0 rounded-[28px] bg-gradient-to-br opacity-40 blur-xl" />
                <AssistantAvatar className="relative size-16 rounded-[22px]" iconClassName="size-8" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Hi {firstName},{" "}
                <span className="from-primary to-chart-5 bg-gradient-to-r bg-clip-text text-transparent">how can I help today?</span>
              </h2>
              <p className="text-muted-foreground mt-2 max-w-lg text-sm">
                Ask about students, attendance, scores, allowances, alumni or HRD policies. I can build summaries, charts, files and draft emails (with your confirmation).
              </p>
              <div className="mt-8 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {SUGGESTED_PROMPTS.map((p, i) => {
                  const { icon: Icon, tone } = PROMPT_STYLES[i % PROMPT_STYLES.length];
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => send(p)}
                      className="bg-card group flex cursor-pointer flex-col items-start gap-3 rounded-2xl p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <span className={cn("flex size-9 items-center justify-center rounded-xl", tone)}><Icon className="size-5" /></span>
                      <span className="text-sm leading-snug font-medium">{p}</span>
                      <ArrowUpRightIcon className="text-muted-foreground group-hover:text-primary mt-auto size-4 self-end transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6 pt-2 pb-6">
              {active.messages.map((m) => <MessageBubble key={m.id} message={m} sessionId={active.id} />)}
              {thinking && <ThinkingBubble />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="relative z-10 px-4 pt-2 pb-4 md:px-6">
          <div className="mx-auto max-w-3xl">
            <div
              className={cn(
                "bg-card rounded-3xl p-2 shadow-lg shadow-black/5 ring-1 ring-transparent transition-shadow focus-within:shadow-xl focus-within:ring-primary/25",
                listening && "ring-destructive/40"
              )}
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={listening ? "Listening…" : "Ask about students, attendance, alumni, policies…"}
                rows={1}
                className="max-h-40 min-h-11 resize-none border-0 bg-transparent px-3 py-2.5 shadow-none focus-visible:ring-0 dark:bg-transparent"
              />
              <div className="flex items-center justify-between gap-2 px-1 pt-1">
                <div className="flex min-w-0 items-center gap-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={toggleVoice}
                        aria-label="Voice input"
                        className={cn("rounded-full", listening && "bg-destructive text-destructive-foreground hover:bg-destructive/90 animate-pulse")}
                      >
                        {listening ? <XMarkIcon /> : <MicrophoneIcon />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{listening ? "Stop listening" : "Speech-to-text (English)"}</TooltipContent>
                  </Tooltip>
                  <span className="bg-muted text-muted-foreground inline-flex min-w-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium">
                    <GlobeAltIcon className="size-3.5 shrink-0" />
                    <span className="truncate">General knowledge</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground hidden text-[10px] sm:inline">Enter to send · Shift+Enter for new line</span>
                  <Button
                    size="icon"
                    onClick={() => send()}
                    disabled={!input.trim() || thinking}
                    aria-label="Send"
                    className="from-primary to-chart-5 rounded-full bg-gradient-to-br shadow-md shadow-primary/25"
                  >
                    <PaperAirplaneIcon />
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground mt-2 text-center text-[11px]">Responses are generated locally from authorised HRD data. Email actions always require your confirmation.</p>
          </div>
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

    </div>
  );
}
