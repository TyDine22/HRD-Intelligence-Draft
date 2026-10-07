import {
  DocumentIcon,
  DocumentTextIcon,
  FolderIcon,
  PhotoIcon,
  PresentationChartBarIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";

import { cn } from "@/lib/utils";

const STYLES: Record<string, { icon: typeof DocumentIcon; className: string }> = {
  folder: { icon: FolderIcon, className: "text-[#f5a300]" },
  pdf: { icon: DocumentTextIcon, className: "text-[#c4001e]" },
  docx: { icon: DocumentTextIcon, className: "text-[#1c67a7]" },
  txt: { icon: DocumentIcon, className: "text-muted-foreground" },
  md: { icon: DocumentIcon, className: "text-muted-foreground" },
  xlsx: { icon: TableCellsIcon, className: "text-[#15803d]" },
  csv: { icon: TableCellsIcon, className: "text-[#15803d]" },
  pptx: { icon: PresentationChartBarIcon, className: "text-[#ed1c2e]" },
  png: { icon: PhotoIcon, className: "text-[#3980c2]" },
  jpeg: { icon: PhotoIcon, className: "text-[#3980c2]" },
  jpg: { icon: PhotoIcon, className: "text-[#3980c2]" },
};

export function FileIcon({ kind, ext, className }: { kind: "folder" | "file"; ext?: string; className?: string }) {
  const s = (kind === "folder" ? STYLES.folder : STYLES[ext ?? ""]) ?? { icon: DocumentIcon, className: "text-muted-foreground" };
  const Icon = s.icon;
  return <Icon className={cn("size-5 shrink-0", s.className, className)} />;
}
