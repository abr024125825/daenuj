/**
 * CSV Injection Prevention Utilities
 * Prevents formula injection (=, +, -, @, |, %) in CSV exports
 */

/**
 * Sanitizes a single CSV field to prevent CSV Injection / Formula Injection.
 * Prefixes dangerous characters with a tab character and strips newlines.
 */
export function sanitizeCsvField(value: unknown): string {
  const str = String(value ?? '').replace(/[\r\n]/g, ' ');
  const dangerous = /^[=@+\-|%]/;
  return dangerous.test(str) ? `\t${str}` : str;
}

/**
 * Builds a properly quoted and sanitized CSV row from an array of field values.
 */
export function buildCsvRow(fields: (string | number | null | undefined)[]): string {
  return fields
    .map(f => sanitizeCsvField(f))
    .map(f => `"${f.replace(/"/g, '""')}"`)
    .join(',');
}
