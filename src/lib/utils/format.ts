const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "2026-10-06" -> "06 Oct 2026" (timezone independent). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${String(d).padStart(2, "0")} ${MONTHS[m - 1]} ${y}`;
}

/** "2026-10-06T08:15:00" -> "06 Oct 2026, 08:15" */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = formatDate(iso);
  const time = iso.length > 10 ? iso.slice(11, 16) : "";
  return time ? `${date}, ${time}` : date;
}

/** "2026-10" -> "October 2026" */
export function formatMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const full = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${full[m - 1]} ${y}`;
}

export function weekdayOf(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function formatCurrency(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function relativeTime(iso: string, now = "2026-10-06T10:30:00"): string {
  const a = new Date(iso).getTime();
  const b = new Date(now).getTime();
  const diffMin = Math.round((b - a) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return formatDate(iso);
}

export function ageFromDob(dob: string, today = "2026-10-06"): number {
  const [y, m, d] = dob.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  let age = ty - y;
  if (tm < m || (tm === m && td < d)) age -= 1;
  return age;
}
