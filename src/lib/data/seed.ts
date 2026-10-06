/**
 * Deterministic pseudo-random helpers.
 * The data layer must produce identical output on the server and the client,
 * so Math.random() is never used – everything is derived from fixed seeds.
 */

export const TODAY = "2026-10-06";

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = () => number;

export function pick<T>(rng: Rng, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length)];
}

export function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function toISODate(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

export function isWeekend(iso: string): boolean {
  const day = parseISODate(iso).getUTCDay();
  return day === 0 || day === 6;
}

export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

/** List of weekday dates between two ISO dates (inclusive). */
export function weekdaysBetween(start: string, end: string): string[] {
  const out: string[] = [];
  let cur = start;
  while (cur <= end) {
    if (!isWeekend(cur)) out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}
