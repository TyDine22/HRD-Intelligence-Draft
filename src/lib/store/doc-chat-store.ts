"use client";

import * as React from "react";

import { generateDocReply } from "@/lib/data/doc-chat";
import type { ChatMessage, FileNode } from "@/lib/data/types";

/**
 * Conversations of the Data Management document assistant. Kept apart from the AI Chatbot's
 * sessions so the general chatbot never lists or scopes to documents. Each conversation has a key:
 * "panel" for the Ask AI panel, "file:<id>" for the chat beside a file preview.
 */
export interface DocChat {
  fileIds: string[];
  messages: ChatMessage[];
  thinking: boolean;
}

const EMPTY: DocChat = { fileIds: [], messages: [], thinking: false };
const chats = new Map<string, DocChat>();
const listeners = new Set<() => void>();

function update(key: string, fn: (c: DocChat) => DocChat) {
  chats.set(key, fn(chats.get(key) ?? EMPTY));
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const stamp = () => new Date().toISOString().slice(0, 19);

export function useDocChat(key: string) {
  const chat = React.useSyncExternalStore(subscribe, () => chats.get(key) ?? EMPTY, () => EMPTY);

  const setFiles = React.useCallback((fn: (ids: string[]) => string[]) => update(key, (c) => ({ ...c, fileIds: fn(c.fileIds) })), [key]);
  const reset = React.useCallback((fileIds: string[] = []) => update(key, () => ({ ...EMPTY, fileIds })), [key]);

  /** Appends the user's message, then a reply grounded only in `files` (the attached documents). */
  const send = React.useCallback(
    (text: string, files: FileNode[]) => {
      const content = text.trim();
      if (!content || (chats.get(key) ?? EMPTY).thinking) return false;
      update(key, (c) => ({ ...c, thinking: true, messages: [...c.messages, { id: `d-${Date.now()}`, role: "user", content, createdAt: stamp() }] }));
      window.setTimeout(() => {
        const reply = generateDocReply(content, files);
        update(key, (c) => ({ ...c, thinking: false, messages: [...c.messages, { id: `d-${Date.now()}-a`, createdAt: stamp(), ...reply }] }));
      }, 900 + Math.min(1200, content.length * 12));
      return true;
    },
    [key]
  );

  return { chat, setFiles, reset, send };
}
