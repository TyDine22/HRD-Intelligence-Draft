import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#03528d] to-[#3980c2] text-white shadow-md", className)}>
      <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
        <path d="M5 18V6M12 18V10M19 18V3" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="19" cy="3" r="1.6" fill="currentColor" />
      </svg>
    </div>
  );
}

export function BrandWordmark({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark />
      <div className="leading-tight">
        <p className={cn("text-sm font-semibold tracking-tight", light ? "text-white" : "text-foreground")}>HRD Intelligence</p>
        <p className={cn("text-[11px]", light ? "text-white/60" : "text-muted-foreground")}>AI-powered HRD platform</p>
      </div>
    </div>
  );
}
