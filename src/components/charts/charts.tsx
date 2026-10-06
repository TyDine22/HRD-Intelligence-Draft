"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { colorFor } from "./palette";

export interface NamedValue {
  name: string;
  value: number;
}

const tooltipStyle = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--popover-foreground)",
    fontSize: 12,
    boxShadow: "0 4px 16px rgba(0,0,0,.08)",
  },
  labelStyle: { color: "var(--muted-foreground)", fontWeight: 600 },
  itemStyle: { color: "var(--popover-foreground)" },
  cursor: { fill: "var(--muted)", opacity: 0.6 },
};

const axisProps = {
  tick: { fill: "var(--muted-foreground)", fontSize: 11 },
  axisLine: false as const,
  tickLine: false as const,
};

export function DonutChart({
  data,
  height = 240,
  centerLabel,
  valueSuffix = "",
}: {
  data: NamedValue[];
  height?: number;
  centerLabel?: { value: string; label: string };
  valueSuffix?: string;
}) {
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={2}
            stroke="var(--card)"
            strokeWidth={2}
          >
            {data.map((d, i) => (
              <Cell key={d.name} fill={colorFor(d.name, i)} />
            ))}
          </Pie>
          <Tooltip
            {...tooltipStyle}
            formatter={(value) => {
              const v = Number(value);
              return [`${v}${valueSuffix} (${total ? Math.round((v / total) * 100) : 0}%)`, ""];
            }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
          />
        </PieChart>
      </ResponsiveContainer>
      {centerLabel && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-6">
          <span className="text-2xl font-semibold tabular-nums">{centerLabel.value}</span>
          <span className="text-muted-foreground text-xs">{centerLabel.label}</span>
        </div>
      )}
    </div>
  );
}

export function SimpleBarChart({
  data,
  height = 240,
  layout = "vertical",
  valueSuffix = "",
  color,
  colorByName = false,
}: {
  data: NamedValue[];
  height?: number;
  /** "vertical" = bars grow upward; "horizontal" = bars grow to the right */
  layout?: "vertical" | "horizontal";
  valueSuffix?: string;
  color?: string;
  colorByName?: boolean;
}) {
  const horizontal = layout === "horizontal";
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 8, right: 16, left: horizontal ? 8 : -12, bottom: 0 }}
          barCategoryGap="28%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" {...axisProps} />
              <YAxis type="category" dataKey="name" width={110} {...axisProps} />
            </>
          ) : (
            <>
              <XAxis dataKey="name" {...axisProps} interval={0} />
              <YAxis {...axisProps} />
            </>
          )}
          <Tooltip {...tooltipStyle} formatter={(value) => [`${value}${valueSuffix}`, ""]} />
          <Bar dataKey="value" radius={(horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]) as [number, number, number, number]} maxBarSize={44}>
            {data.map((d, i) => (
              <Cell key={d.name} fill={color ?? (colorByName ? colorFor(d.name, i) : "var(--chart-1)")} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

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
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey={xKey} {...axisProps} minTickGap={16} />
          <YAxis {...axisProps} domain={domain ?? ["auto", "auto"]} />
          <Tooltip {...tooltipStyle} formatter={(value) => [`${value}${valueSuffix}`, ""]} />
          {series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color ?? colorFor(s.label, i)}
              strokeWidth={2.2}
              dot={{ r: 2.5, strokeWidth: 0, fill: s.color ?? colorFor(s.label, i) }}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

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
    <div className={`bg-card flex flex-col rounded-xl border shadow-sm ${className ?? ""}`}>
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && <p className="text-muted-foreground text-xs">{description}</p>}
        </div>
        {action}
      </div>
      <div className="px-3 pt-3 pb-3">{children}</div>
    </div>
  );
}
