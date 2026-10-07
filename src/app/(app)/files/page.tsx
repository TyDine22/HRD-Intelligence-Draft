import type { Metadata } from "next";

import { FilesView } from "@/components/files/files-view";

export const metadata: Metadata = { title: "Data Management" };

export default function FilesPage() {
  return <FilesView />;
}
