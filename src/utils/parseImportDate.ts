/**
 * W6-P0-09: strict posting-date parser for the GL import path.
 *
 * The wizard previously stored the raw cell ("31/02/2023".slice(0,7) became
 * period "31/02"). This parser accepts ISO YYYY-MM-DD (the app's canonical
 * storage format, also with / or . separators and unpadded components) plus
 * the unambiguous US M/D/YYYY variant GL exports commonly ship. It validates
 * calendar correctness via a UTC round-trip (rejects 2023-02-29, month 13,
 * etc.) and returns canonical YYYY-MM-DD — or null so the caller can surface
 * a per-row error instead of silently storing garbage.
 */
const ISO_ORDER = /^(\d{4})([-/.])(\d{1,2})\2(\d{1,2})$/;
const US_ORDER = /^(\d{1,2})([-/.])(\d{1,2})\2(\d{4})$/;

function toCanonical(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  // Round-trip catches calendar-invalid dates like 2024-02-30.
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    return null;
  }
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function parseImportDate(raw: string): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  const iso = ISO_ORDER.exec(s);
  if (iso) {
    return toCanonical(Number(iso[1]), Number(iso[3]), Number(iso[4]));
  }
  const us = US_ORDER.exec(s);
  if (us) {
    return toCanonical(Number(us[4]), Number(us[1]), Number(us[3]));
  }
  return null;
}
