"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";
import { colorFor } from "@/components/charts/palette";

/* ------------------------------------------------------------------ */
/* Surfaces – borderless cards with a soft, layered shadow              */
/* ------------------------------------------------------------------ */

export const surface =
  "bg-card text-card-foreground rounded-2xl shadow-[0_1px_2px_rgba(18,25,32,0.04),0_8px_24px_-12px_rgba(18,25,32,0.10)] dark:shadow-none";

export function Panel({
  title,
  description,
  icon,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn(surface, "flex min-w-0 flex-col", className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="flex min-w-[12rem] flex-1 items-start gap-3">
            {icon && (
              <span className="bg-muted text-foreground/70 flex size-9 shrink-0 items-center justify-center rounded-xl [&>svg]:size-[18px]">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {title && <h3 className="text-[15px] leading-tight font-semibold tracking-tight">{title}</h3>}
              {description && <p className="text-muted-foreground mt-1 text-xs">{description}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn("flex-1 px-5 pt-4 pb-5 sm:px-6 sm:pb-6", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground flex h-full min-h-40 items-center justify-center text-center text-sm">{children}</p>;
}

/* ------------------------------------------------------------------ */
/* KPI tile                                                            */
/* ------------------------------------------------------------------ */

type Tone = "primary" | "success" | "danger" | "info" | "warning";

const toneStyles: Record<Tone, { color: string; icon: string; glow: string }> = {
  primary: {
    color: "var(--primary)",
    icon: "bg-[linear-gradient(135deg,#3980c2,#03528d)] shadow-[0_8px_18px_-6px_rgba(3,82,141,0.55)]",
    glow: "bg-primary/15",
  },
  success: {
    color: "var(--success)",
    icon: "bg-[linear-gradient(135deg,#2ea65a,#15803d)] shadow-[0_8px_18px_-6px_rgba(21,128,61,0.55)]",
    glow: "bg-success/20",
  },
  info: {
    color: "var(--info)",
    icon: "bg-[linear-gradient(135deg,#5b9ad7,#1c67a7)] shadow-[0_8px_18px_-6px_rgba(28,103,167,0.55)]",
    glow: "bg-info/20",
  },
  danger: {
    color: "var(--destructive)",
    icon: "bg-[linear-gradient(135deg,#ff5754,#ed1c2e)] shadow-[0_8px_18px_-6px_rgba(237,28,46,0.55)]",
    glow: "bg-destructive/15",
  },
  warning: {
    color: "var(--warning)",
    icon: "bg-[linear-gradient(135deg,#ffc24a,#f5a300)] shadow-[0_8px_18px_-6px_rgba(245,163,0,0.55)]",
    glow: "bg-warning/25",
  },
};

/** Small circular meter used inside KPI tiles. */
function RingMeter({ value, color, size = 52 }: { value: number; color: string; size?: number }) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums">{v}%</span>
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = "primary",
  share,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: React.ReactNode;
  tone?: Tone;
  /** 0–100, rendered as a ring meter */
  share?: number;
}) {
  const t = toneStyles[tone];
  return (
    <div
      className={cn(
        surface,
        "group relative isolate flex min-w-0 flex-col justify-between gap-5 overflow-hidden rounded-3xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(18,25,32,0.04),0_18px_36px_-14px_rgba(18,25,32,0.18)]"
      )}
    >
      <span aria-hidden className={cn("pointer-events-none absolute -top-16 -right-16 -z-10 size-44 rounded-full blur-3xl transition-transform duration-500 group-hover:scale-125", t.glow)} />
      <div className="flex items-center gap-3">
        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl text-white [&>svg]:size-5", t.icon)}>{icon}</span>
        <p className="text-muted-foreground text-sm leading-tight font-medium">{label}</p>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-3xl leading-none font-semibold tracking-tight tabular-nums sm:text-4xl">{value}</p>
          {hint && <p className="text-muted-foreground mt-2 line-clamp-2 text-xs">{hint}</p>}
        </div>
        {share !== undefined && <RingMeter value={share} color={t.color} />}
      </div>
    </div>
  );
}

/** Highlighted KPI on a gradient, with a stacked composition bar. */
export function FeaturedStatTile({
  label,
  value,
  hint,
  icon,
  segments,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: React.ReactNode;
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  return (
    <div className="relative isolate flex min-w-0 flex-col justify-between gap-5 overflow-hidden rounded-3xl bg-[linear-gradient(140deg,#1c67a7,#003c6b)] p-5 text-white shadow-[0_14px_32px_-14px_rgba(3,82,141,0.7)] transition-transform duration-300 hover:-translate-y-0.5">
      <span aria-hidden className="pointer-events-none absolute -top-12 -right-12 -z-10 size-40 rounded-full bg-white/15 blur-2xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-16 -left-8 -z-10 size-36 rounded-full bg-[rgba(91,154,215,0.45)] blur-2xl" />
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur [&>svg]:size-5">{icon}</span>
        <p className="text-sm leading-tight font-medium text-white/80">{label}</p>
      </div>
      <div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
          <p className="text-3xl leading-none font-semibold tracking-tight tabular-nums sm:text-4xl">{value}</p>
          {hint && <p className="pb-0.5 text-xs text-white/70">{hint}</p>}
        </div>
        <div className="mt-4 flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full bg-white/15">
          {segments.map((s) =>
            s.value ? <span key={s.label} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${total ? (s.value / total) * 100 : 0}%`, background: s.color }} /> : null
          )}
        </div>
        <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/75">
          {segments.map((s) => (
            <li key={s.label} className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full" style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Segmented control (borderless pill tabs)                            */
/* ------------------------------------------------------------------ */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "sm",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  size?: "sm" | "md";
}) {
  return (
    <div role="tablist" className="bg-muted inline-flex items-center gap-0.5 rounded-full p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "focus-visible:ring-ring/50 rounded-full font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px]",
              size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
              active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Charts                                                              */
/* ------------------------------------------------------------------ */

const tooltipProps = {
  contentStyle: {
    background: "var(--popover)",
    border: "none",
    borderRadius: 12,
    color: "var(--popover-foreground)",
    fontSize: 12,
    padding: "8px 12px",
    boxShadow: "0 10px 30px -8px rgba(18,25,32,.18)",
  },
  labelStyle: { color: "var(--muted-foreground)", fontWeight: 600, marginBottom: 2 },
  itemStyle: { color: "var(--popover-foreground)", padding: 0 },
};

const axisProps = {
  tick: { fill: "var(--muted-foreground)", fontSize: 11 },
  axisLine: false as const,
  tickLine: false as const,
};

export function TrendAreaChart({
  data,
  xKey,
  yKey,
  label,
  color = "var(--chart-1)",
  height = 260,
  domain,
  valueSuffix = "",
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  label: string;
  color?: string;
  height?: number;
  domain?: [number, number];
  valueSuffix?: string;
}) {
  const id = React.useId().replace(/:/g, "");
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--muted)" vertical={false} />
          <XAxis dataKey={xKey} {...axisProps} minTickGap={20} dy={6} />
          <YAxis {...axisProps} domain={domain ?? ["auto", "auto"]} tickFormatter={(v) => `${v}${valueSuffix}`} width={44} />
          <Tooltip
            {...tooltipProps}
            cursor={{ stroke: color, strokeOpacity: 0.3, strokeDasharray: "4 4" }}
            formatter={(value) => [`${value}${valueSuffix}`, label]}
          />
          <Area
            type="monotone"
            dataKey={yKey}
            name={label}
            stroke={color}
            strokeWidth={2.5}
            fill={`url(#fill-${id})`}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 3, stroke: "var(--card)", fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface NamedValue {
  name: string;
  value: number;
  color?: string;
}

const fillOf = (d: NamedValue, i: number) => d.color ?? colorFor(d.name, i);

/** Donut with a centred figure and a clean legend list underneath. */
export function DonutWithLegend({
  data,
  center,
  height = 190,
}: {
  data: NamedValue[];
  center?: { value: string; label: string };
  height?: number;
}) {
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="flex flex-col gap-5">
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="72%"
              outerRadius="100%"
              paddingAngle={3}
              cornerRadius={6}
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={fillOf(d, i)} />
              ))}
            </Pie>
            <Tooltip
              {...tooltipProps}
              formatter={(value, name) => {
                const v = Number(value);
                return [`${v} (${total ? Math.round((v / total) * 100) : 0}%)`, String(name)];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {center && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">{center.value}</span>
            <span className="text-muted-foreground text-xs">{center.label}</span>
          </div>
        )}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: fillOf(d, i) }} />
            <span className="text-muted-foreground truncate">{d.name}</span>
            <span className="ml-auto font-medium tabular-nums">{total ? Math.round((d.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ColumnChart({
  data,
  height = 220,
  color = "var(--chart-1)",
  colorByName = false,
}: {
  data: NamedValue[];
  height?: number;
  color?: string;
  colorByName?: boolean;
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }} barCategoryGap="32%">
          <CartesianGrid stroke="var(--muted)" vertical={false} />
          <XAxis dataKey="name" {...axisProps} interval={0} dy={6} />
          <YAxis {...axisProps} allowDecimals={false} />
          <Tooltip {...tooltipProps} cursor={{ fill: "var(--muted)", opacity: 0.5, radius: 8 } as object} formatter={(v) => [String(v), "Students"]} />
          <Bar dataKey="value" radius={[10, 10, 10, 10]} maxBarSize={48}>
            {data.map((d, i) => (
              <Cell key={d.name} fill={colorByName ? fillOf(d, i) : (d.color ?? color)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal progress-style bars – lighter than a full chart for a few categories. */
export function BarList({ data, valueLabel }: { data: NamedValue[]; valueLabel?: (d: NamedValue) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <ul className="space-y-4">
      {data.map((d, i) => (
        <li key={d.name}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: fillOf(d, i) }} />
              {d.name}
            </span>
            <span className="text-muted-foreground tabular-nums">
              {valueLabel ? valueLabel(d) : `${d.value} · ${total ? Math.round((d.value / total) * 100) : 0}%`}
            </span>
          </div>
          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div className="h-full rounded-full transition-all" style={{ width: `${(d.value / max) * 100}%`, background: fillOf(d, i) }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

