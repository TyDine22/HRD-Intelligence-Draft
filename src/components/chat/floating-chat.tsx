"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowsPointingOutIcon, ChevronDownIcon, PaperAirplaneIcon, PlusIcon, SparklesIcon } from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth/auth-context";
import { useAppStore } from "@/lib/store/app-store";
import { SUGGESTED_PROMPTS } from "@/lib/data/chat";
import type { ChatScope } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { MessageBubble, ThinkingBubble, useAssistant } from "../chat/chat-parts";

const GENERAL_SCOPE: ChatScope = { type: "general" };

/** General-purpose assistant that floats over every page. Expanding opens the same conversation on /chat. */
export function FloatingChat() {
  const router = useRouter();
  const { user } = useAuth();
  const { sessions } = useAppStore();
  const { send, thinking } = useAssistant(GENERAL_SCOPE);
  const [open, setOpen] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [input, setInput] = React.useState("");
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const session = sessions.find((s) => s.id === sessionId) ?? null;
  const firstName = user?.name?.split(" ")[0] ?? "there";

  React.useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [open, session?.messages.length, thinking]);

  const submit = (text?: string) => {
    const s = send(text ?? input, session);
    if (s) {
      setSessionId(s.id);
      setInput("");
    }
  };

  const expand = () => {
    setOpen(false);
    router.push(session ? `/chat?session=${session.id}` : "/chat");
  };

  return (
    <div className="no-print fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {open && (
        <div className="bg-background animate-in fade-in slide-in-from-bottom-4 zoom-in-95 flex h-[min(620px,calc(100dvh-7rem))] w-[calc(100vw-2rem)] origin-bottom-right flex-col overflow-hidden rounded-3xl shadow-2xl shadow-black/15 duration-200 sm:w-[400px]">
          {/* Header */}
          <div className="from-primary to-chart-5 text-primary-foreground relative flex items-center gap-3 overflow-hidden bg-gradient-to-br px-4 py-3.5">
            <div aria-hidden className="absolute -top-10 -right-6 size-32 rounded-full bg-white/10 blur-2xl" />
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur"><SparklesIcon className="size-5" /></div>
            <div className="relative min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{session?.title ?? "HRD Assistant"}</p>
              <p className="flex items-center gap-1.5 text-[11px] opacity-80">
                <span className="size-1.5 rounded-full bg-emerald-300" /> General assistant
              </p>
            </div>
            <div className="relative flex items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="New chat" className="rounded-lg text-inherit hover:bg-white/15 hover:text-inherit" onClick={() => { setSessionId(null); setInput(""); }}><PlusIcon /></Button>
                </TooltipTrigger>
                <TooltipContent>New chat</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="Open full page" className="rounded-lg text-inherit hover:bg-white/15 hover:text-inherit" onClick={expand}><ArrowsPointingOutIcon /></Button>
                </TooltipTrigger>
                <TooltipContent>Open full page</TooltipContent>
              </Tooltip>
              <Button variant="ghost" size="icon-sm" aria-label="Minimise" className="rounded-lg text-inherit hover:bg-white/15 hover:text-inherit" onClick={() => setOpen(false)}><ChevronDownIcon /></Button>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-muted/30 scrollbar-thin flex-1 overflow-y-auto px-4 py-4">
            {!session || session.messages.length === 0 ? (
              <div className="flex h-full flex-col justify-end gap-4">
                <div>
                  <p className="text-lg font-semibold tracking-tight">Hi {firstName} 👋</p>
                  <p className="text-muted-foreground text-sm">Ask me anything about students, attendance, alumni or HRD policies.</p>
                </div>
                <div className="flex flex-col gap-2">
                  {SUGGESTED_PROMPTS.slice(0, 4).map((p) => (
                    <button key={p} type="button" onClick={() => submit(p)} className="bg-card hover:text-primary cursor-pointer rounded-2xl px-3.5 py-2.5 text-left text-sm shadow-sm transition-all hover:shadow-md">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {session.messages.map((m) => <MessageBubble key={m.id} message={m} sessionId={session.id} compact />)}
                {thinking && <ThinkingBubble compact />}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="bg-background p-3">
            <div className="bg-card focus-within:ring-primary/25 flex items-end gap-2 rounded-2xl p-1.5 shadow-md ring-1 ring-transparent transition-shadow">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="Message HRD Assistant…"
                rows={1}
                className="max-h-28 min-h-9 resize-none border-0 bg-transparent px-2.5 py-2 shadow-none focus-visible:ring-0 dark:bg-transparent"
              />
              <Button size="icon-sm" onClick={() => submit()} disabled={!input.trim() || thinking} aria-label="Send" className="from-primary to-chart-5 mb-0.5 rounded-xl bg-gradient-to-br">
                <PaperAirplaneIcon />
              </Button>
            </div>
            <button type="button" onClick={expand} className="text-muted-foreground hover:text-primary mx-auto mt-2 flex cursor-pointer items-center gap-1 text-[11px] transition-colors">
              <ArrowsPointingOutIcon className="size-3" /> Open in full page
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : "Open AI assistant"}
        className={cn(
          "from-primary to-chart-5 text-primary-foreground group relative flex size-14 cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40",
          open && "rounded-full"
        )}
      >
        {!open && <span className="from-primary to-chart-5 absolute inset-0 -z-10 animate-ping rounded-2xl bg-gradient-to-br opacity-20 [animation-duration:2.5s]" />}
        {open ? <ChevronDownIcon className="size-6" /> : <AssistantGlyph />}
      </button>
    </div>
  );
}

function AssistantGlyph() {
  return <SparklesIcon className="size-7 transition-transform group-hover:rotate-12" />;
}
