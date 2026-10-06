/** Chart palette – maps to the CSS variables defined in globals.css. */
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export const STATUS_COLORS: Record<string, string> = {
  Present: "var(--chart-2)",
  Late: "var(--chart-3)",
  Absent: "var(--chart-4)",
  Permission: "var(--chart-1)",
  Male: "var(--chart-1)",
  Female: "var(--chart-5)",
  employed: "var(--chart-2)",
  "self-employed": "var(--chart-1)",
  studying: "var(--chart-3)",
  unemployed: "var(--chart-4)",
  High: "var(--chart-4)",
  Medium: "var(--chart-3)",
  Low: "var(--chart-1)",
};

export const colorFor = (name: string, index: number) => STATUS_COLORS[name] ?? CHART_COLORS[index % CHART_COLORS.length];
