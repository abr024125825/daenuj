/**
 * Shared time utilities for consistent time comparisons across the app.
 * Solves: string-based time comparison bugs (e.g. '9:00' < '10:00' → false).
 */

/** Normalize a time string like "9:00" or "09:00" to minutes since midnight */
export function timeToMinutes(time: string): number {
  const parts = time.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

/** Pad a time string to HH:MM format (e.g. "9:00" → "09:00") */
export function normalizeTimeString(time: string): string {
  const [h, m] = time.split(':');
  return `${h.padStart(2, '0')}:${(m || '00').padStart(2, '0')}`;
}

/** Check if two time ranges overlap using numeric comparison */
export function timeRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const a0 = timeToMinutes(startA);
  const a1 = timeToMinutes(endA);
  const b0 = timeToMinutes(startB);
  const b1 = timeToMinutes(endB);
  return a0 < b1 && a1 > b0;
}

/** Build a Date from a date string + time string (e.g. "2025-06-15" + "09:00") */
export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(dateStr);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}
