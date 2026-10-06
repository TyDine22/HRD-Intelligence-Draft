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
  folder: { icon: FolderIcon, className: "text-[oklch(0.75_0.15_80)]" },
  pdf: { icon: DocumentTextIcon, className: "text-[oklch(0.6_0.2_25)]" },
  docx: { icon: DocumentTextIcon, className: "text-[oklch(0.55_0.17_262)]" },
  txt: { icon: DocumentIcon, className: "text-muted-foreground" },
  md: { icon: DocumentIcon, className: "text-muted-foreground" },
  xlsx: { icon: TableCellsIcon, className: "text-[oklch(0.55_0.15_155)]" },
  csv: { icon: TableCellsIcon, className: "text-[oklch(0.55_0.15_155)]" },
  pptx: { icon: PresentationChartBarIcon, className: "text-[oklch(0.65_0.19_45)]" },
  png: { icon: PhotoIcon, className: "text-[oklch(0.62_0.18_310)]" },
  jpeg: { icon: PhotoIcon, className: "text-[oklch(0.62_0.18_310)]" },
  jpg: { icon: PhotoIcon, className: "text-[oklch(0.62_0.18_310)]" },
};

export function FileIcon({ kind, ext, className }: { kind: "folder" | "file"; ext?: string; className?: string }) {
  const s = (kind === "folder" ? STYLES.folder : STYLES[ext ?? ""]) ?? { icon: DocumentIcon, className: "text-muted-foreground" };
  const Icon = s.icon;
  return <Icon className={cn("size-5 shrink-0", s.className, className)} />;
}
