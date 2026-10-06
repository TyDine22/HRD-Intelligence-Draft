"use client";

import * as React from "react";

import type {
  Agent,
  AllowanceType,
  Alumni,
  ChatAttachment,
  ChatMessage,
  ChatScope,
  ChatSession,
  ExtraClassRecord,
  FeedbackEntry,
  FileNode,
  FilePermission,
  Notification,
} from "@/lib/data/types";
import { FEEDBACK } from "@/lib/data/feedback";
import { ALUMNI } from "@/lib/data/alumni";
import { FILES } from "@/lib/data/files";
import { NOTIFICATIONS } from "@/lib/data/notifications";
import { INITIAL_SESSIONS, MAX_SESSIONS } from "@/lib/data/chat";
import { AGENTS } from "@/lib/data/agents";
import { ALLOWANCE_TYPES } from "@/lib/data/allowances";
import { EXTRA_CLASSES } from "@/lib/data/academics";

export interface OvertimeReport {
  id: string;
  instructorId: string;
  date: string;
  classroom: string;
  hours: number;
  subject: string;
  notes?: string;
  status: "submitted" | "approved";
}

interface AppStoreValue {
  feedback: FeedbackEntry[];
  addFeedback: (entry: Omit<FeedbackEntry, "id">) => FeedbackEntry;
  updateFeedback: (id: string, patch: Partial<FeedbackEntry>) => void;
  removeFeedback: (id: string) => void;

  alumni: Alumni[];
  addAlumni: (a: Omit<Alumni, "id">) => Alumni;
  updateAlumni: (id: string, patch: Partial<Alumni>) => void;
  sendUpdateRequest: (id: string, by: "admin" | "ai") => void;
  autoAlumniRequests: boolean;
  setAutoAlumniRequests: (v: boolean) => void;

  files: FileNode[];
  createFolder: (parentId: string | null, name: string, ownerId: string) => FileNode;
  uploadFiles: (parentId: string | null, names: string[], ownerId: string) => void;
  renameNode: (id: string, name: string) => void;
  moveNode: (id: string, parentId: string | null) => void;
  duplicateNode: (id: string) => void;
  deleteNode: (id: string) => void;
  shareNode: (id: string, userId: string, permission: FilePermission) => void;
  unshareNode: (id: string, userId: string) => void;

  notifications: Notification[];
  markRead: (id: string) => void;
  markAllRead: (roleFilter?: (n: Notification) => boolean) => void;
  pushNotification: (n: Omit<Notification, "id" | "createdAt" | "read">) => void;

  sessions: ChatSession[];
  createSession: (scope: ChatScope, title?: string) => ChatSession;
  renameSession: (id: string, title: string) => void;
  deleteSession: (id: string) => void;
  appendMessage: (sessionId: string, message: ChatMessage) => void;
  updateAttachment: (sessionId: string, messageId: string, patch: Partial<ChatAttachment>) => void;
  setSessionScope: (id: string, scope: ChatScope) => void;

  agents: Agent[];
  toggleAgent: (id: string, enabled: boolean) => void;
  runAgent: (id: string) => void;

  allowanceTypes: AllowanceType[];
  updateAllowanceType: (id: string, patch: Partial<AllowanceType>) => void;

  extraClasses: ExtraClassRecord[];
  setExtraClassStatus: (id: string, status: ExtraClassRecord["status"]) => void;

  overtimeReports: OvertimeReport[];
  addOvertimeReport: (r: Omit<OvertimeReport, "id" | "status">) => void;
}

const AppStoreContext = React.createContext<AppStoreValue | null>(null);

let seq = 1000;
const nextId = (prefix: string) => `${prefix}-${++seq}`;
const nowIso = () => new Date().toISOString().slice(0, 19);
const todayIso = () => new Date().toISOString().slice(0, 10);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [feedback, setFeedback] = React.useState<FeedbackEntry[]>(FEEDBACK);
  const [alumni, setAlumni] = React.useState<Alumni[]>(ALUMNI);
  const [autoAlumniRequests, setAutoAlumniRequests] = React.useState(true);
  const [files, setFiles] = React.useState<FileNode[]>(FILES);
  const [notifications, setNotifications] = React.useState<Notification[]>(NOTIFICATIONS);
  const [sessions, setSessions] = React.useState<ChatSession[]>(INITIAL_SESSIONS);
  const [agents, setAgents] = React.useState<Agent[]>(AGENTS);
  const [allowanceTypes, setAllowanceTypes] = React.useState<AllowanceType[]>(ALLOWANCE_TYPES);
  const [extraClasses, setExtraClasses] = React.useState<ExtraClassRecord[]>(EXTRA_CLASSES);
  const [overtimeReports, setOvertimeReports] = React.useState<OvertimeReport[]>([
    { id: "OT-1", instructorId: "USR-INS-01", date: "2026-09-25", classroom: "SP13-A", hours: 2, subject: "Spring Cloud", notes: "Config server lab", status: "approved" },
    { id: "OT-2", instructorId: "USR-INS-01", date: "2026-10-02", classroom: "SP13-B", hours: 2.5, subject: "Spring Boot", status: "submitted" },
    { id: "OT-3", instructorId: "USR-INS-02", date: "2026-09-29", classroom: "DA13", hours: 2, subject: "Statistics", status: "approved" },
  ]);

  /* ---------------- feedback ---------------- */
  const addFeedback = React.useCallback<AppStoreValue["addFeedback"]>((entry) => {
    const created: FeedbackEntry = { id: nextId("FB"), ...entry };
    setFeedback((prev) => [created, ...prev]);
    return created;
  }, []);
  const updateFeedback = React.useCallback<AppStoreValue["updateFeedback"]>((id, patch) => {
    setFeedback((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);
  const removeFeedback = React.useCallback<AppStoreValue["removeFeedback"]>((id) => {
    setFeedback((prev) => prev.filter((f) => f.id !== id));
  }, []);

  /* ---------------- alumni ---------------- */
  const addAlumni = React.useCallback<AppStoreValue["addAlumni"]>((a) => {
    const created: Alumni = { id: nextId("ALM"), ...a };
    setAlumni((prev) => [created, ...prev]);
    return created;
  }, []);
  const updateAlumni = React.useCallback<AppStoreValue["updateAlumni"]>((id, patch) => {
    setAlumni((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);
  const sendUpdateRequest = React.useCallback<AppStoreValue["sendUpdateRequest"]>((id, by) => {
    setAlumni((prev) =>
      prev.map((a) => (a.id === id ? { ...a, updateRequest: { sentAt: nowIso(), sentBy: by, status: "pending" } } : a))
    );
  }, []);

  /* ---------------- files ---------------- */
  const createFolder = React.useCallback<AppStoreValue["createFolder"]>((parentId, name, ownerId) => {
    const node: FileNode = {
      id: nextId("F"),
      name,
      kind: "folder",
      ownerId,
      parentId,
      createdAt: todayIso(),
      updatedAt: todayIso(),
      shares: [],
    };
    setFiles((prev) => [...prev, node]);
    return node;
  }, []);
  const uploadFiles = React.useCallback<AppStoreValue["uploadFiles"]>((parentId, names, ownerId) => {
    const nodes: FileNode[] = names.map((n, i) => ({
      id: nextId("F") + i,
      name: n,
      kind: "file",
      ext: n.split(".").pop()?.toLowerCase(),
      size: 50_000 + ((n.length * 7919) % 900_000),
      ownerId,
      parentId,
      createdAt: todayIso(),
      updatedAt: todayIso(),
      shares: [],
    }));
    setFiles((prev) => [...prev, ...nodes]);
  }, []);
  const renameNode = React.useCallback<AppStoreValue["renameNode"]>((id, name) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, name, updatedAt: todayIso() } : f)));
  }, []);
  const moveNode = React.useCallback<AppStoreValue["moveNode"]>((id, parentId) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, parentId, updatedAt: todayIso() } : f)));
  }, []);
  const duplicateNode = React.useCallback<AppStoreValue["duplicateNode"]>((id) => {
    setFiles((prev) => {
      const src = prev.find((f) => f.id === id);
      if (!src) return prev;
      const copies: FileNode[] = [];
      const clone = (node: FileNode, parentId: string | null, rename: boolean) => {
        const copyId = nextId("F");
        const dot = node.name.lastIndexOf(".");
        const name = rename
          ? node.kind === "file" && dot > 0
            ? `${node.name.slice(0, dot)} (copy)${node.name.slice(dot)}`
            : `${node.name} (copy)`
          : node.name;
        copies.push({ ...node, id: copyId, name, parentId, createdAt: todayIso(), updatedAt: todayIso(), shares: [] });
        prev.filter((c) => c.parentId === node.id).forEach((child) => clone(child, copyId, false));
      };
      clone(src, src.parentId, true);
      return [...prev, ...copies];
    });
  }, []);
  const deleteNode = React.useCallback<AppStoreValue["deleteNode"]>((id) => {
    setFiles((prev) => {
      const toDelete = new Set<string>([id]);
      let changed = true;
      while (changed) {
        changed = false;
        prev.forEach((f) => {
          if (f.parentId && toDelete.has(f.parentId) && !toDelete.has(f.id)) {
            toDelete.add(f.id);
            changed = true;
          }
        });
      }
      return prev.filter((f) => !toDelete.has(f.id));
    });
  }, []);
  const shareNode = React.useCallback<AppStoreValue["shareNode"]>((id, userId, permission) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, shares: [...f.shares.filter((s) => s.userId !== userId), { userId, permission }] }
          : f
      )
    );
  }, []);
  const unshareNode = React.useCallback<AppStoreValue["unshareNode"]>((id, userId) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, shares: f.shares.filter((s) => s.userId !== userId) } : f)));
  }, []);

  /* ---------------- notifications ---------------- */
  const markRead = React.useCallback<AppStoreValue["markRead"]>((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);
  const markAllRead = React.useCallback<AppStoreValue["markAllRead"]>((filter) => {
    setNotifications((prev) => prev.map((n) => (!filter || filter(n) ? { ...n, read: true } : n)));
  }, []);
  const pushNotification = React.useCallback<AppStoreValue["pushNotification"]>((n) => {
    setNotifications((prev) => [{ id: nextId("NTF"), createdAt: nowIso(), read: false, ...n }, ...prev]);
  }, []);

  /* ---------------- chat ---------------- */
  const createSession = React.useCallback<AppStoreValue["createSession"]>((scope, title) => {
    const session: ChatSession = {
      id: nextId("CHAT"),
      title: title ?? "New conversation",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      scope,
      messages: [],
    };
    setSessions((prev) => [session, ...prev].slice(0, MAX_SESSIONS));
    return session;
  }, []);
  const renameSession = React.useCallback<AppStoreValue["renameSession"]>((id, title) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
  }, []);
  const deleteSession = React.useCallback<AppStoreValue["deleteSession"]>((id) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);
  const appendMessage = React.useCallback<AppStoreValue["appendMessage"]>((sessionId, message) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        const title =
          s.messages.length === 0 && message.role === "user"
            ? message.content.slice(0, 48) + (message.content.length > 48 ? "…" : "")
            : s.title;
        return { ...s, title, updatedAt: message.createdAt, messages: [...s.messages, message] };
      })
    );
  }, []);
  const updateAttachment = React.useCallback<AppStoreValue["updateAttachment"]>((sessionId, messageId, patch) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id !== sessionId
          ? s
          : {
              ...s,
              messages: s.messages.map((m) =>
                m.id === messageId && m.attachment ? { ...m, attachment: { ...m.attachment, ...patch } as ChatAttachment } : m
              ),
            }
      )
    );
  }, []);
  const setSessionScope = React.useCallback<AppStoreValue["setSessionScope"]>((id, scope) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, scope } : s)));
  }, []);

  /* ---------------- agents ---------------- */
  const toggleAgent = React.useCallback<AppStoreValue["toggleAgent"]>((id, enabled) => {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, enabled } : a)));
  }, []);
  const runAgent = React.useCallback<AppStoreValue["runAgent"]>((id) => {
    const runId = nextId("RUN");
    const startedAt = nowIso();
    setAgents((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, lastRun: startedAt, runs: [{ id: runId, startedAt, status: "running", summary: "Running…" }, ...a.runs] }
          : a
      )
    );
    window.setTimeout(() => {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                runs: a.runs.map((r) =>
                  r.id === runId ? { ...r, status: "success", summary: "Manual run completed · outputs delivered" } : r
                ),
              }
            : a
        )
      );
    }, 1800);
  }, []);

  /* ---------------- allowances / extra classes ---------------- */
  const updateAllowanceType = React.useCallback<AppStoreValue["updateAllowanceType"]>((id, patch) => {
    setAllowanceTypes((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);
  const setExtraClassStatus = React.useCallback<AppStoreValue["setExtraClassStatus"]>((id, status) => {
    setExtraClasses((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
  }, []);

  /* ---------------- overtime ---------------- */
  const addOvertimeReport = React.useCallback<AppStoreValue["addOvertimeReport"]>((r) => {
    setOvertimeReports((prev) => [{ id: nextId("OT"), status: "submitted", ...r }, ...prev]);
  }, []);

  const value = React.useMemo<AppStoreValue>(
    () => ({
      feedback,
      addFeedback,
      updateFeedback,
      removeFeedback,
      alumni,
      addAlumni,
      updateAlumni,
      sendUpdateRequest,
      autoAlumniRequests,
      setAutoAlumniRequests,
      files,
      createFolder,
      uploadFiles,
      renameNode,
      moveNode,
      duplicateNode,
      deleteNode,
      shareNode,
      unshareNode,
      notifications,
      markRead,
      markAllRead,
      pushNotification,
      sessions,
      createSession,
      renameSession,
      deleteSession,
      appendMessage,
      updateAttachment,
      setSessionScope,
      agents,
      toggleAgent,
      runAgent,
      allowanceTypes,
      updateAllowanceType,
      extraClasses,
      setExtraClassStatus,
      overtimeReports,
      addOvertimeReport,
    }),
    [
      feedback, addFeedback, updateFeedback, removeFeedback,
      alumni, addAlumni, updateAlumni, sendUpdateRequest, autoAlumniRequests,
      files, createFolder, uploadFiles, renameNode, moveNode, duplicateNode, deleteNode, shareNode, unshareNode,
      notifications, markRead, markAllRead, pushNotification,
      sessions, createSession, renameSession, deleteSession, appendMessage, updateAttachment, setSessionScope,
      agents, toggleAgent, runAgent,
      allowanceTypes, updateAllowanceType,
      extraClasses, setExtraClassStatus,
      overtimeReports, addOvertimeReport,
    ]
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStoreValue {
  const ctx = React.useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}
