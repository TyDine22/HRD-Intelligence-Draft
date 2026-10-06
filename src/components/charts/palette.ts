/** Chart palette – maps to the CSS variables defined in globals.css. */
export const CHART_COLORS = [
  "var(--chart-1)", // blue
  "var(--chart-2)", // green
  "var(--chart-3)", // amber
  "var(--chart-4)", // red
  "var(--chart-5)", // purple
  "var(--chart-6)", // orange
  "var(--chart-7)", // slate
];

/** Semantic colour assignments so the same category always gets the same hue. */
export const STATUS_COLORS: Record<string, string> = {
  Present: "var(--chart-2)",
  Late: "var(--chart-3)",
  Absent: "var(--chart-4)",
  Permission: "var(--chart-1)",
  Male: "var(--chart-1)",
  Female: "var(--chart-5)",
  "Local SW Developer": "var(--chart-1)",
  "International SW Developer": "var(--chart-2)",
  Banks: "var(--chart-4)",
  "Government Officials": "var(--chart-7)",
  "Full Scholarship Abroad": "var(--chart-3)",
  "IT Instructor in HRD Center": "var(--chart-5)",
  Other: "var(--chart-6)",
  High: "var(--chart-4)",
  Medium: "var(--chart-3)",
  Low: "var(--chart-1)",
};

export const colorFor = (name: string, index: number) => STATUS_COLORS[name] ?? CHART_COLORS[index % CHART_COLORS.length];