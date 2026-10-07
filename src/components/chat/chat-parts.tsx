"use client";

import * as React from "react";
import { DocumentTextIcon, SparklesIcon } from "@heroicons/react/24/outline";

import { useAuth } from "@/lib/auth/auth-context";
import { useAppStore } from "@/lib/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { generateReply } from "@/lib/data/chat";
import { formatDateTime } from "@/lib/utils/format";
import type { ChatMessage, ChatScope, ChatSession } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { MessageAttachment } from "./message-attachment";

/** Gradient sparkle badge used wherever the assistant appears. */
export function AssistantAvatar({ className, iconClassName }: { className?: string; iconClassName?: string }) {
  return (
    <div className={cn("from-primary to-chart-5 text-primary-foreground flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm", className)}>
      <SparklesIcon className={cn("size-5", iconClassName)} />
    </div>
  );
}

/** Sends a prompt into a session (creating one if needed) and appends a simulated assistant reply. */
export function useAssistant(scope: ChatScope) {
  const { role } = useAuth();
  const { createSession, appendMessage } = useAppStore();
  const [thinking, setThinking] = React.useState(false);

  const send = React.useCallback(
    (content: string, session: ChatSession | null, title?: string): ChatSession | null => {
      const text = content.trim();
      if (!text || thinking) return null;
      const target = session ?? createSession(scope, title);
      const targetScope = session?.scope ?? scope;
      appendMessage(target.id, { id: `m-${Date.now()}`, role: "user", content: text, createdAt: new Date().toISOString().slice(0, 19) });
      setThinking(true);
      window.setTimeout(() => {
        const reply = generateReply(text, targetScope, role ?? "INSTRUCTOR");
        appendMessage(target.id, { id: `m-${Date.now()}-a`, createdAt: new Date().toISOString().slice(0, 19), ...reply });
        setThinking(false);
      }, 900 + Math.min(1200, text.length * 12));
      return target;
    },
    [thinking, createSession, appendMessage, scope, role]
  );

  return { send, thinking };
}

/** One message row: gradient bubble for the user, soft card for the assistant. */
export function MessageBubble({ message, sessionId, compact = false }: { message: ChatMessage; sessionId: string; compact?: boolean }) {
  const { updateAttachment } = useAppStore();
  const { toast } = useToast();

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%]">
          <div className="from-primary to-chart-5 text-primary-foreground rounded-3xl rounded-br-lg bg-gradient-to-br px-4 py-2.5 text-sm shadow-md shadow-primary/20">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          {!compact && <p className="text-muted-foreground mt-1 pr-2 text-right text-[10px]">{formatDateTime(message.createdAt)}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex", compact ? "gap-2" : "gap-3")}>
      <AssistantAvatar className={cn("mt-0.5", compact ? "size-7 rounded-lg" : "size-8")} iconClassName={compact ? "size-3.5" : "size-4"} />
      <div className="min-w-0 max-w-[90%] flex-1">
        <div className="bg-card rounded-3xl rounded-tl-lg px-4 py-3 text-sm shadow-sm">
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          {message.attachment && (
            <MessageAttachment
              attachment={message.attachment}
              onUpdate={(patch) => updateAttachment(sessionId, message.id, patch)}
              onToast={(title, description) => toast({ title, description, variant: "success" })}
            />
          )}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Sources</span>
              {message.sources.map((s) => (
                <span key={s} className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]">
                  <DocumentTextIcon className="size-3" />{s}
                </span>
              ))}
            </div>
          )}
        </div>
        {!compact && <p className="text-muted-foreground mt-1 pl-2 text-[10px]">{formatDateTime(message.createdAt)}</p>}
      </div>
    </div>
  );
}

export function ThinkingBubble({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex", compact ? "gap-2" : "gap-3")}>
      <AssistantAvatar className={cn("animate-pulse", compact ? "size-7 rounded-lg" : "size-8")} iconClassName={compact ? "size-3.5" : "size-4"} />
      <div className="bg-card flex items-center gap-2 rounded-3xl rounded-tl-lg px-4 py-3 shadow-sm">
        <span className="flex items-center gap-1">
          <span className="bg-primary/70 size-1.5 animate-bounce rounded-full [animation-delay:-0.3s]" />
          <span className="bg-primary/70 size-1.5 animate-bounce rounded-full [animation-delay:-0.15s]" />
          <span className="bg-primary/70 size-1.5 animate-bounce rounded-full" />
        </span>
        <span className="text-muted-foreground text-xs">Thinking…</span>
      </div>
    </div>
  );
}
