"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownTrayIcon,
  ArrowsRightLeftIcon,
  ChevronRightIcon,
  CloudArrowUpIcon,
  DocumentDuplicateIcon,
  EllipsisVerticalIcon,
  FolderPlusIcon,
  HomeIcon,
  ListBulletIcon,
  PencilIcon,
  ShareIcon,
  SparklesIcon,
  Squares2X2Icon,
  TrashIcon,
  UserIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-context";
import { useAppStore } from "@/lib/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { USERS, userById } from "@/lib/data/users";
import { SUPPORTED_EXTENSIONS, formatBytes } from "@/lib/data/files";
import { formatDate } from "@/lib/utils/format";
import { exportText, exportZipManifest } from "@/lib/utils/export";
import type { FileNode, FilePermission } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { FileIcon } from "./file-icon";
import { ASK_AI_PANEL, AskAiPanel } from "./ask-ai-panel";
import { useDocChat } from "@/lib/store/doc-chat-store";

type Access = "owner" | "editor" | "viewer";
type DialogState =
  | { type: "new-folder" }
  | { type: "rename"; node: FileNode }
  | { type: "move"; node: FileNode }
  | { type: "share"; node: FileNode }
  | { type: "delete"; node: FileNode }
  | null;

export function FilesView() {
  const { user } = useAuth();
  const { files, createFolder, uploadFiles, renameNode, moveNode, duplicateNode, deleteNode, shareNode, unshareNode } = useAppStore();
  const { toast } = useToast();
  const router = useRouter();
  const [current, setCurrent] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [ext, setExt] = React.useState("all");
  const [owner, setOwner] = React.useState("all");
  const [sort, setSort] = React.useState<"name" | "date">("name");
  const [view, setView] = React.useState<"list" | "grid">("list");
  const [dialog, setDialog] = React.useState<DialogState>(null);
  const [nameInput, setNameInput] = React.useState("");
  const [moveTarget, setMoveTarget] = React.useState<string>("root");
  const [shareUser, setShareUser] = React.useState("");
  const [sharePerm, setSharePerm] = React.useState<FilePermission>("viewer");
  const [aiOpen, setAiOpen] = React.useState(false);
  const { setFiles: setAiFiles } = useDocChat(ASK_AI_PANEL);
  const fileInput = React.useRef<HTMLInputElement>(null);

  const byId = React.useMemo(() => new Map(files.map((f) => [f.id, f])), [files]);
  const me = user?.id ?? "";

  const access = React.useCallback(
    (node: FileNode): Access | null => {
      let cur: FileNode | undefined = node;
      let best: Access | null = null;
      while (cur) {
        if (cur.ownerId === me) return "owner";
        const share = cur.shares.find((s) => s.userId === me);
        if (share) {
          if (share.permission === "editor") best = "editor";
          else if (!best) best = "viewer";
        }
        cur = cur.parentId ? byId.get(cur.parentId) : undefined;
      }
      return best;
    },
    [byId, me]
  );

  const currentNode = current ? byId.get(current) : undefined;
  const currentAccess = currentNode ? access(currentNode) : "owner";

  const breadcrumb = React.useMemo(() => {
    const trail: FileNode[] = [];
    let cur = currentNode;
    while (cur) {
      trail.unshift(cur);
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    return trail;
  }, [currentNode, byId]);

  const listing = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let items: FileNode[];
    if (q) {
      items = files.filter((f) => access(f) && f.name.toLowerCase().includes(q));
    } else if (current === null) {
      items = files.filter((f) => {
        if (!access(f)) return false;
        if (f.parentId === null) return true;
        const parent = byId.get(f.parentId);
        return !!(parent && !access(parent) && f.shares.some((s) => s.userId === me));
      });
    } else {
      items = files.filter((f) => f.parentId === current && access(f));
    }
    items = items.filter((f) => (ext === "all" ? true : f.kind === "file" && f.ext === ext) && (owner === "all" || f.ownerId === owner));
    return [...items].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
      if (sort === "name") return a.name.localeCompare(b.name);
      return a.updatedAt < b.updatedAt ? 1 : -1;
    });
  }, [files, query, current, ext, owner, sort, access, byId, me]);

  const folderOptions = React.useMemo(
    () => files.filter((f) => f.kind === "folder" && (access(f) === "owner" || access(f) === "editor")),
    [files, access]
  );

  const descendants = (id: string): Set<string> => {
    const out = new Set<string>([id]);
    let changed = true;
    while (changed) {
      changed = false;
      files.forEach((f) => {
        if (f.parentId && out.has(f.parentId) && !out.has(f.id)) {
          out.add(f.id);
          changed = true;
        }
      });
    }
    return out;
  };

  const download = (node: FileNode) => {
    exportText(node.name, `Mock content for ${node.name}\nOwner: ${userById(node.ownerId)?.name}\nSize: ${formatBytes(node.size)}`);
    toast({ title: "Download started", description: node.name });
  };

  // Folders open in place; files open the document viewer with its own AI chat (Drive style)
  const open = (node: FileNode) => {
    if (node.kind === "folder") {
      setCurrent(node.id);
      setQuery("");
    } else {
      router.push(`/files/${node.id}`);
    }
  };

  const submitDialog = () => {
    if (!dialog) return;
    if (dialog.type === "new-folder") {
      if (!nameInput.trim()) return;
      createFolder(current, nameInput.trim(), me);
      toast({ title: "Folder created", description: `${nameInput.trim()} · you are the owner.`, variant: "success" });
    }
    if (dialog.type === "rename") {
      if (!nameInput.trim()) return;
      renameNode(dialog.node.id, nameInput.trim());
      toast({ title: "Renamed", variant: "success" });
    }
    if (dialog.type === "move") {
      moveNode(dialog.node.id, moveTarget === "root" ? null : moveTarget);
      toast({ title: "Moved", description: `${dialog.node.name} → ${moveTarget === "root" ? "My files" : byId.get(moveTarget)?.name}`, variant: "success" });
    }
    if (dialog.type === "delete") {
      deleteNode(dialog.node.id);
      toast({ title: "Deleted permanently", description: dialog.node.name });
      if (dialog.node.id === current) setCurrent(dialog.node.parentId);
    }
    setDialog(null);
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const names = Array.from(e.target.files ?? []).map((f) => f.name);
    const accepted = names.filter((n) => SUPPORTED_EXTENSIONS.includes((n.split(".").pop() ?? "").toLowerCase() as (typeof SUPPORTED_EXTENSIONS)[number]));
    if (accepted.length) {
      uploadFiles(current, accepted, me);
      toast({ title: `${accepted.length} file${accepted.length > 1 ? "s" : ""} uploaded`, description: accepted.join(", "), variant: "success" });
    }
    if (accepted.length !== names.length) toast({ title: "Some files were skipped", description: "Supported: TXT, MD, XLSX, CSV, PDF, DOCX, PPTX, PNG, JPEG.", variant: "error" });
    e.target.value = "";
  };

  const canWriteHere = currentAccess === "owner" || currentAccess === "editor";
  const shareDialogNode = dialog?.type === "share" ? byId.get(dialog.node.id) : undefined;

  // Opens the Ask AI panel, attaching the given documents to the conversation
  const openAskAi = React.useCallback((ids: string[] = []) => {
    if (ids.length) setAiFiles((prev) => [...prev, ...ids.filter((id) => !prev.includes(id))].slice(0, 10));
    setAiOpen(true);
  }, [setAiFiles]);

  const accessibleFiles = React.useMemo(() => files.filter((f) => f.kind === "file" && access(f)), [files, access]);

  const renderActions = (node: FileNode) => {
    const a = access(node);
    const canEdit = a === "owner" || a === "editor";
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Actions" onClick={(e) => e.stopPropagation()}><EllipsisVerticalIcon /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {node.kind === "folder" ? (
            <DropdownMenuItem onSelect={() => openAskAi(files.filter((f) => f.parentId === node.id && f.kind === "file").map((f) => f.id))}>
              <SparklesIcon /> Ask AI about this folder
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => openAskAi([node.id])}>
              <SparklesIcon /> Ask AI about this file
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => (node.kind === "folder" ? exportZipManifest(node.name, files.filter((f) => descendants(node.id).has(f.id) && f.id !== node.id).map((f) => f.name)) : download(node))}>
            <ArrowDownTrayIcon /> {node.kind === "folder" ? "Export as ZIP" : "Download"}
          </DropdownMenuItem>
          {canEdit && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => { setNameInput(node.name); setDialog({ type: "rename", node }); }}><PencilIcon /> Rename</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => { setMoveTarget(node.parentId ?? "root"); setDialog({ type: "move", node }); }}><ArrowsRightLeftIcon /> Move</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => { duplicateNode(node.id); toast({ title: "Duplicated", description: `${node.name} (copy)` }); }}><DocumentDuplicateIcon /> Duplicate</DropdownMenuItem>
            </>
          )}
          {a === "owner" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => { setShareUser(""); setSharePerm("viewer"); setDialog({ type: "share", node }); }}><ShareIcon /> Share & permissions</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setDialog({ type: "delete", node })}><TrashIcon /> Delete permanently</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data management"
        description="Upload, organise and share HRD documents. Supported: TXT, MD, XLSX, CSV, PDF, DOCX, PPTX, PNG, JPEG."
        actions={
          <>
            <input ref={fileInput} type="file" multiple accept=".txt,.md,.xlsx,.csv,.pdf,.docx,.pptx,.png,.jpeg,.jpg" className="hidden" onChange={onUpload} />
            <Button onClick={() => (aiOpen ? setAiOpen(false) : openAskAi())} className={cn("from-primary to-chart-5 bg-gradient-to-r shadow-md shadow-primary/20", aiOpen && "ring-primary/30 ring-4")}><SparklesIcon /> Ask AI</Button>
            <Button variant="outline" disabled={!canWriteHere} onClick={() => { setNameInput(""); setDialog({ type: "new-folder" }); }}><FolderPlusIcon /> New folder</Button>
            <Button disabled={!canWriteHere} onClick={() => fileInput.current?.click()}><CloudArrowUpIcon /> Upload</Button>
          </>
        }
      />

      <div className="flex items-start gap-6">
      <div className="bg-card min-w-0 flex-1 rounded-2xl shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4">
          <nav className="flex flex-wrap items-center gap-1 text-sm" aria-label="Breadcrumb">
            <button type="button" onClick={() => { setCurrent(null); setQuery(""); }} className={cn("hover:bg-accent flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5", current === null && "font-semibold")}>
              <HomeIcon className="size-4" /> My files
            </button>
            {breadcrumb.map((b, i) => (
              <React.Fragment key={b.id}>
                <ChevronRightIcon className="text-muted-foreground size-3.5" />
                <button type="button" onClick={() => setCurrent(b.id)} className={cn("hover:bg-accent cursor-pointer rounded px-1.5 py-0.5", i === breadcrumb.length - 1 && "font-semibold")}>{b.name}</button>
              </React.Fragment>
            ))}
            {currentNode && (
              <Badge variant="outline" className="ml-2 capitalize">{currentAccess ?? "no access"}</Badge>
            )}
          </nav>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchInput value={query} onChange={setQuery} placeholder="Search files and folders…" className="lg:w-72" />
            <div className="flex flex-wrap items-center gap-2">
              <Select value={ext} onValueChange={setExt}>
                <SelectTrigger size="sm" className="bg-card w-32"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All types</SelectItem>{SUPPORTED_EXTENSIONS.map((e) => <SelectItem key={e} value={e}>.{e}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={owner} onValueChange={setOwner}>
                <SelectTrigger size="sm" className="bg-card w-40"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All owners</SelectItem>{USERS.map((u) => <SelectItem key={u.id} value={u.id}>{u.id === me ? "Me" : u.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                <SelectTrigger size="sm" className="bg-card w-40"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="name">Sort: A → Z</SelectItem><SelectItem value="date">Sort: Upload date</SelectItem></SelectContent>
              </Select>
              <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
                <TabsList className="h-8">
                  <TabsTrigger value="list" aria-label="List view"><ListBulletIcon /></TabsTrigger>
                  <TabsTrigger value="grid" aria-label="Grid view"><Squares2X2Icon /></TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        {listing.length === 0 ? (
          <EmptyState title={query ? "No matches" : "This folder is empty"} description={query ? "Try another name or clear the filters." : canWriteHere ? "Upload files or create a folder to get started." : "Nothing has been shared with you here."} />
        ) : view === "list" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Access</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Modified</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {listing.map((node) => {
                const a = access(node);
                const parent = node.parentId ? byId.get(node.parentId) : undefined;
                return (
                  <TableRow key={node.id} className="cursor-pointer" onClick={() => open(node)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <FileIcon kind={node.kind} ext={node.ext} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{node.name}</p>
                          {query && parent && <p className="text-muted-foreground text-xs">in {parent.name}</p>}
                        </div>
                        {node.shares.length > 0 && <UsersIcon className="text-muted-foreground size-4" aria-label="Shared" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{node.ownerId === me ? "Me" : userById(node.ownerId)?.name}</TableCell>
                    <TableCell><Badge variant={a === "owner" ? "default" : a === "editor" ? "info" : "secondary"} className="capitalize">{a}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-xs tabular-nums">{node.kind === "folder" ? `${files.filter((f) => f.parentId === node.id).length} items` : formatBytes(node.size)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{formatDate(node.updatedAt)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>{renderActions(node)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {listing.map((node) => (
              <div key={node.id} role="button" tabIndex={0} onClick={() => open(node)} onKeyDown={(e) => e.key === "Enter" && open(node)} className="bg-muted/40 hover:bg-accent/60 group flex cursor-pointer flex-col gap-3 rounded-2xl p-3 transition-all hover:shadow-sm">
                <div className="flex items-start justify-between">
                  <FileIcon kind={node.kind} ext={node.ext} className="size-8" />
                  <span onClick={(e) => e.stopPropagation()}>{renderActions(node)}</span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{node.name}</p>
                  <p className="text-muted-foreground text-xs">{node.kind === "folder" ? `${files.filter((f) => f.parentId === node.id).length} items` : formatBytes(node.size)} · {formatDate(node.updatedAt)}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <UserIcon className="text-muted-foreground size-3.5" />
                  <span className="text-muted-foreground">{node.ownerId === me ? "Me" : userById(node.ownerId)?.name}</span>
                  {node.shares.length > 0 && <Badge variant="secondary" className="ml-auto">{node.shares.length} shared</Badge>}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-muted-foreground border-t px-4 py-2.5 text-xs">{listing.length} item{listing.length === 1 ? "" : "s"} · You can only see documents you own or that were shared with you.</p>
      </div>

      {/* Ask AI: docked beside the files on desktop, full-screen sheet on mobile */}
      {aiOpen && (
        <AskAiPanel
          onClose={() => setAiOpen(false)}
          currentFolder={current}
          accessibleFiles={accessibleFiles}
          className="fixed inset-2 z-50 sm:inset-auto sm:top-20 sm:right-4 sm:bottom-4 sm:w-[400px] xl:sticky xl:top-20 xl:right-auto xl:bottom-auto xl:z-auto xl:h-[calc(100dvh-13rem)] xl:min-h-[480px] xl:w-[400px] xl:shrink-0"
        />
      )}
      </div>

      {/* Name dialog (new folder / rename) */}
      <Dialog open={dialog?.type === "new-folder" || dialog?.type === "rename"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{dialog?.type === "rename" ? "Rename" : "New folder"}</DialogTitle>
            <DialogDescription>{dialog?.type === "rename" ? `Rename “${dialog.node.name}”.` : "The folder is created in the current location and you become its owner."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="fname">Name</Label>
            <Input id="fname" autoFocus value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitDialog()} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={submitDialog} disabled={!nameInput.trim()}>{dialog?.type === "rename" ? "Rename" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move dialog */}
      <Dialog open={dialog?.type === "move"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Move “{dialog?.type === "move" ? dialog.node.name : ""}”</DialogTitle>
            <DialogDescription>Choose a destination folder you own or can edit.</DialogDescription>
          </DialogHeader>
          <Select value={moveTarget} onValueChange={setMoveTarget}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="root">My files (root)</SelectItem>
              {dialog?.type === "move" &&
                folderOptions.filter((f) => !descendants(dialog.node.id).has(f.id)).map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={submitDialog}>Move here</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share dialog */}
      <Dialog open={dialog?.type === "share"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share “{shareDialogNode?.name}”</DialogTitle>
            <DialogDescription>Viewers have read-only access; editors can read and edit. Only the owner can delete permanently.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-[1fr_auto_auto] items-end gap-2">
              <div className="grid gap-1.5">
                <Label>User</Label>
                <Select value={shareUser} onValueChange={setShareUser}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select a user" /></SelectTrigger>
                  <SelectContent>
                    {USERS.filter((u) => u.id !== me && !shareDialogNode?.shares.some((s) => s.userId === u.id)).map((u) => <SelectItem key={u.id} value={u.id}>{u.name} · {u.role === "ADMIN" ? "Admin" : "Instructor"}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Permission</Label>
                <Select value={sharePerm} onValueChange={(v) => setSharePerm(v as FilePermission)}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="viewer">Viewer</SelectItem><SelectItem value="editor">Editor</SelectItem></SelectContent>
                </Select>
              </div>
              <Button disabled={!shareUser} onClick={() => { if (shareDialogNode) { shareNode(shareDialogNode.id, shareUser, sharePerm); setShareUser(""); toast({ title: "Shared", description: `${userById(shareUser)?.name} can now ${sharePerm === "editor" ? "edit" : "view"}.`, variant: "success" }); } }}>Add</Button>
            </div>
            <div className="rounded-lg border">
              <p className="text-muted-foreground border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide">People with access</p>
              <ul className="divide-y text-sm">
                <li className="flex items-center justify-between px-3 py-2">
                  <span>{user?.name} (you)</span>
                  <Badge>Owner</Badge>
                </li>
                {shareDialogNode?.shares.map((s) => (
                  <li key={s.userId} className="flex items-center justify-between gap-2 px-3 py-2">
                    <span>{userById(s.userId)?.name}</span>
                    <div className="flex items-center gap-2">
                      <Select value={s.permission} onValueChange={(v) => shareNode(shareDialogNode.id, s.userId, v as FilePermission)}>
                        <SelectTrigger size="sm" className="w-24"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="viewer">Viewer</SelectItem><SelectItem value="editor">Editor</SelectItem></SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon-sm" aria-label="Remove access" onClick={() => unshareNode(shareDialogNode.id, s.userId)}><TrashIcon /></Button>
                    </div>
                  </li>
                ))}
                {shareDialogNode?.shares.length === 0 && <li className="text-muted-foreground px-3 py-3 text-xs">Not shared with anyone yet.</li>}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setDialog(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={dialog?.type === "delete"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete permanently?</DialogTitle>
            <DialogDescription>
              “{dialog?.type === "delete" ? dialog.node.name : ""}”{dialog?.type === "delete" && dialog.node.kind === "folder" ? " and everything inside it" : ""} will be removed for all users. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={submitDialog}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
