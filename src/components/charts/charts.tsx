"use client";

import * as React from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";
import { colorFor } from "./palette";

export interface NamedValue {
  name: string;
  value: number;
}

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

const AXIS = {
  tick: { fill: "var(--muted-foreground)", fontSize: 11, fontWeight: 500 },
  axisLine: false as const,
  tickLine: false as const,
};

interface TooltipPayloadItem {
  name?: string | number;
  value?: string | number;
  color?: string;
  payload?: { name?: string; fill?: string };
}

/** Rounded, theme-aware tooltip card used by every chart. */
function ChartTooltip({
  active,
  payload,
  label,
  suffix = "",
  total,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  suffix?: string;
  total?: number;
}) {
  if (!active || !payload?.length) return null;
  const seen = new Set<string>();
  const rows = payload.filter((p) => {
    const key = String(p.payload?.name ?? p.name ?? "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return (
    <div className="bg-popover/95 text-popover-foreground min-w-36 rounded-xl border px-3 py-2.5 text-xs shadow-lg backdrop-blur">
      {label !== undefined && label !== "" && <p className="text-muted-foreground mb-1.5 font-medium">{String(label)}</p>}
      {rows.map((p, i) => {
        const v = Number(p.value ?? 0);
        const name = String(p.payload?.name ?? p.name ?? "");
        const color = p.payload?.fill ?? p.color ?? "var(--chart-1)";
        return (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: color }} />
              <span>{name}</span>
            </span>
            <span className="font-semibold tabular-nums">
              {v.toLocaleString()}
              {suffix}
              {total ? <span className="text-muted-foreground ml-1 font-normal">({Math.round((v / total) * 100)}%)</span> : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Inline HTML legend – crisper than the SVG legend and wraps nicely. */
export function ChartLegend({
  items,
  total,
  className,
  showValues = true,
}: {
  items: { name: string; value: number; color: string }[];
  total?: number;
  className?: string;
  showValues?: boolean;
}) {
  return (
    <ul className={cn("flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs", className)}>
      {items.map((it) => (
        <li key={it.name} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: it.color }} />
          <span className="text-muted-foreground">{it.name}</span>
          {showValues && <span className="font-semibold tabular-nums">{it.value.toLocaleString()}</span>}
          {showValues && total ? <span className="text-muted-foreground tabular-nums">· {Math.round((it.value / total) * 100)}%</span> : null}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Donut                                                               */
/* ------------------------------------------------------------------ */

export function DonutChart({
  data,
  height = 240,
  centerLabel,
  valueSuffix = "",
  legend = true,
}: {
  data: NamedValue[];
  height?: number;
  centerLabel?: { value: string; label: string };
  valueSuffix?: string;
  legend?: boolean;
}) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const items = data.map((d, i) => ({ ...d, color: colorFor(d.name, i) }));
  const ringHeight = legend ? height - 36 : height;
  return (
    <div>
      <div className="relative" style={{ height: ringHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={items}
              dataKey="value"
              nameKey="name"
              innerRadius="70%"
              outerRadius="92%"
              paddingAngle={3}
              cornerRadius={6}
              stroke="none"
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              {items.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip suffix={valueSuffix} total={total} />} cursor={false} />
          </PieChart>
        </ResponsiveContainer>
        {centerLabel && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">{centerLabel.value}</span>
            <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">{centerLabel.label}</span>
          </div>
        )}
      </div>
      {legend && <ChartLegend items={items} total={total} className="mt-2" />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bars                                                                */
/* ------------------------------------------------------------------ */

export function SimpleBarChart({
  data,
  height = 240,
  layout = "vertical",
  valueSuffix = "",
  color,
  colorByName = false,
  showValues = true,
}: {
  data: NamedValue[];
  height?: number;
  /** "vertical" = bars grow upward; "horizontal" = bars grow to the right */
  layout?: "vertical" | "horizontal";
  valueSuffix?: string;
  color?: string;
  colorByName?: boolean;
  showValues?: boolean;
}) {
  const horizontal = layout === "horizontal";
  const items = data.map((d, i) => ({ ...d, fill: color ?? (colorByName ? colorFor(d.name, i) : "var(--chart-1)") }));
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={items}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: showValues && !horizontal ? 18 : 8, right: horizontal ? 36 : 12, left: horizontal ? 4 : -16, bottom: 0 }}
          barCategoryGap="32%"
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 6" vertical={horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" {...AXIS} hide />
              <YAxis type="category" dataKey="name" width={120} {...AXIS} />
            </>
          ) : (
            <>
              <XAxis dataKey="name" {...AXIS} interval={0} dy={4} />
              <YAxis {...AXIS} />
            </>
          )}
          <Tooltip content={<ChartTooltip suffix={valueSuffix} />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
          <Bar
            dataKey="value"
            radius={(horizontal ? [0, 8, 8, 0] : [8, 8, 0, 0]) as [number, number, number, number]}
            maxBarSize={horizontal ? 18 : 40}
            background={{ fill: "var(--muted)", opacity: 0.6 }}
            isAnimationActive={false}
          >
            {items.map((d) => (
              <Cell key={d.name} fill={d.fill} />
            ))}
            {showValues && (
              <LabelList
                dataKey="value"
                position={horizontal ? "right" : "top"}
                formatter={(v: unknown) => `${v}${valueSuffix}`}
                style={{ fill: "var(--foreground)", fontSize: 11, fontWeight: 600 }}
              />
            )}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Line (with soft area)                                               */
/* ------------------------------------------------------------------ */

export function SimpleLineChart({
  data,
  xKey,
  series,
  height = 240,
  domain,
  valueSuffix = "",
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: { key: string; label: string; color?: string }[];
  height?: number;
  domain?: [number, number];
  valueSuffix?: string;
}) {
  const id = `grad${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <div style={{ height }} className="min-w-0">
      <ResponsiveContainer width="100%" height="100%" debounce={50}>
        <ComposedChart data={data} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
          <defs>
            {series.map((s, i) => {
              const c = s.color ?? colorFor(s.label, i);
              return (
                <linearGradient key={s.key} id={`${id}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={c} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 6" vertical={false} />
          <XAxis dataKey={xKey} {...AXIS} minTickGap={18} dy={4} />
          <YAxis {...AXIS} domain={domain ?? ["auto", "auto"]} width={40} />
          <Tooltip content={<ChartTooltip suffix={valueSuffix} />} cursor={{ stroke: "var(--border)", strokeDasharray: "3 3" }} />
          {series.map((s) => (
            <Area
              key={`area-${s.key}`}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              fill={`url(#${id}-${s.key})`}
              stroke="none"
              activeDot={false}
              tooltipType="none"
              legendType="none"
              isAnimationActive={false}
            />
          ))}
          {series.map((s, i) => {
            const c = s.color ?? colorFor(s.label, i);
            return (
              <Line
                key={`line-${s.key}`}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={c}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 3, stroke: "var(--card)", fill: c }}
                isAnimationActive={false}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
      {series.length > 1 && (
        <ChartLegend items={series.map((s, i) => ({ name: s.label, value: 0, color: s.color ?? colorFor(s.label, i) }))} className="mt-1" showValues={false} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Labelled pie (share-of-total with value + % inside each slice)      */
/* ------------------------------------------------------------------ */

export interface PieSlice extends NamedValue {
  color: string;
}

interface PieLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
  value?: number;
}

function renderSliceLabel(props: PieLabelProps) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0, value = 0 } = props;
  if (percent < 0.04) return null; // too thin to label
  const RAD = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * (percent > 0.3 ? 0.55 : 0.68);
  const x = cx + r * Math.cos(-midAngle * RAD);
  const y = cy + r * Math.sin(-midAngle * RAD);
  const big = percent >= 0.12;
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" style={{ pointerEvents: "none" }}>
      <tspan x={x} dy={big ? -7 : -5} fontSize={big ? 18 : 13} fontWeight={700}>
        {value}
      </tspan>
      <tspan x={x} dy={big ? 18 : 14} fontSize={big ? 12 : 10} fontWeight={600} opacity={0.9}>
        {Math.round(percent * 100)}%
      </tspan>
    </text>
  );
}

export function LabelledPieChart({ data, height = 300 }: { data: PieSlice[]; height?: number }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={0}
            outerRadius="96%"
            stroke="var(--card)"
            strokeWidth={3}
            startAngle={90}
            endAngle={-270}
            labelLine={false}
            label={renderSliceLabel}
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip total={total} />} cursor={false} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Card wrapper                                                        */
/* ------------------------------------------------------------------ */

export function ChartCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-card flex flex-col rounded-xl shadow-sm", className)}>
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && <p className="text-muted-foreground text-xs">{description}</p>}
        </div>
        {action}
      </div>
      <div className="px-3 pt-3 pb-4">{children}</div>
    </div>
  );
}