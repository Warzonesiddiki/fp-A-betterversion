/**
 * Spreadsheet formula-injection defense (F-0017) — OWASP CSV Injection.
 *
 * Any cell value whose first non-whitespace character is one of
 *   =  +  -  @  TAB  CR
 * can execute as a formula/DDE payload when the exported CSV/XLSX is opened
 * in Excel, LibreOffice, or Google Sheets. Every CSV writer, ExcelJS writer,
 * and clipboard export MUST route string cells through this sanitizer.
 *
 * Neutralization: prefix the value with a single quote (') so spreadsheet
 * applications treat it as literal text.
 */

const DANGEROUS_FIRST = /^[=+\-@\t\r]/;
const LEADING_WS_THEN_DANGEROUS = /^\s+[=+\-@\t\r]/;

/** Returns true when a string value would be interpreted as a formula. */
export function isDangerousSpreadsheetCell(value: string): boolean {
  if (value.length === 0) return false;
  return DANGEROUS_FIRST.test(value) || LEADING_WS_THEN_DANGEROUS.test(value);
}

/**
 * Neutralizes a single cell. Non-strings (numbers, booleans, null) are
 * returned unchanged — they cannot carry formula payloads.
 */
export function sanitizeSpreadsheetCell<T>(value: T): T | string {
  if (typeof value !== 'string') return value;
  if (!isDangerousSpreadsheetCell(value)) return value;
  return `'${value}`;
}

/**
 * Variant used by CSV/text writers where every cell is serialized as a
 * string. Always returns a string and neutralizes dangerous content.
 */
export function sanitizeSpreadsheetText(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return isDangerousSpreadsheetCell(str) ? `'${str}` : str;
}
