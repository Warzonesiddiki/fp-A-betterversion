// =============================================================================
// FORMULA FUNCTION REGISTRY — Text & Date Functions
// =============================================================================
import type { FormulaFunction } from './helpers';
import { roundTo } from '@/utils/money';

// =============================================================================
// TEXT FUNCTIONS
// =============================================================================

export function LEN(v: number): number {
  return String(Math.round(v)).length;
}
export function CODE(v: number): number {
  return String.fromCharCode(Math.round(v)).charCodeAt(0);
}
export function CHAR(v: number): number {
  return Math.round(v);
}
export function VALUE(v: number): number {
  return v;
}
export function T(v: number): number {
  return v;
}
export function N(v: number): number {
  return v;
}
export function EXACT(a: number, b: number): number {
  return a === b ? 1 : 0;
}
export function UPPER(v: number): number {
  return Number(String(v).toUpperCase());
}
export function LOWER(v: number): number {
  return Number(String(v).toLowerCase());
}
export function TEXT(v: number, fmt: number): number {
  const f = String(fmt);
  if (f.includes('%')) return Number(String(v) + '%');
  if (f.includes('$') || f.includes('#,##0')) return roundTo(v, 2);
  if (f.includes('0.')) {
    const decimals = (f.split('.')[1] || '').replace(/[^0]/g, '').length;
    return roundTo(v, decimals);
  }
  return Number(String(v));
}

// =============================================================================
// DATE FUNCTIONS
// =============================================================================
//
// Excel 1900-system serials live in PURE UTC DAY-NUMBER SPACE (serial 1 =
// 1900-01-01; engines use the 1899-12-30 epoch offset). The previous
// implementation mixed UTC-anchored instants (`(s - 25569) * 86400000`) with
// local-midnight epochs and local getters, so every YEAR/MONTH/DAY/WEEKDAY/
// WEEKNUM-style read drifted ±1 day depending on the host timezone (published
// Excel output is the oracle — session 010 lesson — so expected values are
// sacred and the implementation must be zone-independent).

const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30); // 1899-12-30T00:00:00Z

/** Excel serial → UTC-midnight Date (no local-time involvement). */
function serialToDate(s: number): Date {
  return new Date(EXCEL_EPOCH_MS + Math.round(s) * 86400000);
}

/** UTC calendar Date → Excel serial (whole days). */
function dateToSerial(d: Date): number {
  return Math.round((d.getTime() - EXCEL_EPOCH_MS) / 86400000);
}

export function DATE(y: number, m: number, d: number): number {
  // Date.UTC normalizes month>12 / day<=0 overflow exactly like the old
  // constructor-pair math did, but without any local-offset skew.
  return dateToSerial(new Date(Date.UTC(y, m - 1, d)));
}
export function YEAR(s: number): number {
  return serialToDate(s).getUTCFullYear();
}
export function MONTH(s: number): number {
  return serialToDate(s).getUTCMonth() + 1;
}
export function DAY(s: number): number {
  return serialToDate(s).getUTCDate();
}
export function HOUR(s: number): number {
  return Math.floor((s % 1) * 24);
}
export function MINUTE(s: number): number {
  return Math.floor(((s % 1) * 1440) % 60);
}
export function SECOND(s: number): number {
  return Math.floor(((s % 1) * 86400) % 60);
}
export function EOMONTH(s: number, months: number): number {
  const d = serialToDate(s);
  // Day 0 of the following UTC month = last day of the target month
  // (leap-year safe, no local calendar involved).
  return dateToSerial(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months + 1, 0)));
}
export function EDATE(s: number, months: number): number {
  const d = serialToDate(s);
  // Move to the 1st of the target UTC month, then clamp the day to that
  // month's length (Excel clamps: 2024-01-31 + 1M = 2024-02-29, not Mar 2).
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();
  target.setUTCDate(Math.min(d.getUTCDate(), lastDay));
  return dateToSerial(target);
}
export function DATEDIF(s1: number, s2: number, unit: number): number {
  if (unit === 1) return Math.round(s2) - Math.round(s1);
  // Complete calendar months/years between two serials (Excel semantics),
  // computed in UTC day-number space.
  const a = serialToDate(s1);
  const b = serialToDate(s2);
  let months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  if (b.getUTCDate() < a.getUTCDate()) months--;
  if (unit === 2) return months;
  return Math.floor(months / 12);
}
export function DAYS(s1: number, s2: number): number {
  return s2 - s1;
}
export function DAYS360(s1: number, s2: number): number {
  const d1 = Math.round(s1),
    d2 = Math.round(s2);
  const y1 = YEAR(d1),
    m1 = MONTH(d1),
    dy1 = Math.min(DAY(d1), 30);
  const y2 = YEAR(d2),
    m2 = MONTH(d2),
    dy2 = Math.min(DAY(d2), 30);
  return (y2 - y1) * 360 + (m2 - m1) * 30 + (dy2 - dy1);
}
export function YEARFRAC(s1: number, s2: number): number {
  return DAYS360(s1, s2) / 360;
}
export function NOW(): number {
  // Pure UTC epoch math — no local-midnight epoch mixing.
  return (Date.now() - EXCEL_EPOCH_MS) / 86400000;
}
export function TODAY(): number {
  return Math.floor(NOW());
}
export function TIME(h: number, m: number, s: number): number {
  return (h * 3600 + m * 60 + s) / 86400;
}
export function WEEKNUM(s: number): number {
  const d = serialToDate(s);
  const jan1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Excel default (type 1): weeks start Sunday; the week containing Jan 1
  // is week 1.
  const dayOfYear = Math.round(s) - dateToSerial(jan1) + 1;
  return Math.floor((dayOfYear + jan1.getUTCDay() - 1) / 7) + 1;
}
export function ISOWEEKNUM(s: number): number {
  const d = serialToDate(s);
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  utc.setUTCDate(utc.getUTCDate() + 4 - (utc.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
export function NETWORKDAYS(s1: number, s2: number): number {
  let count = 0;
  const start = Math.round(s1),
    end = Math.round(s2);
  for (let d = start; d <= end; d++) {
    const dow = serialToDate(d).getUTCDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}
export function WEEKDAY(s: number, returnType = 1): number {
  const day = serialToDate(s).getUTCDay(); // 0=Sunday
  if (returnType === 2) return day === 0 ? 7 : day; // 1=Monday, 7=Sunday
  if (returnType === 3) return day === 0 ? 6 : day - 1; // 0=Monday, 6=Sunday
  return day + 1; // 1=Sunday, 7=Saturday (default)
}
export function WORKDAY(s: number, days: number): number {
  let d = Math.round(s),
    remaining = Math.abs(days);
  const dir = days > 0 ? 1 : -1;
  while (remaining > 0) {
    d += dir;
    const dow = serialToDate(d).getUTCDay();
    if (dow !== 0 && dow !== 6) remaining--;
  }
  return d;
}

// =============================================================================
// REGISTER ALL TEXT & DATE FUNCTIONS
// =============================================================================

export function registerTextFunctions(r: (fn: FormulaFunction) => void): void {
  // Text
  r({
    name: 'LEN',
    category: 'text',
    description: 'Length of text',
    minArgs: 1,
    maxArgs: 1,
    impl: LEN,
  });
  r({
    name: 'CODE',
    category: 'text',
    description: 'Character code',
    minArgs: 1,
    maxArgs: 1,
    impl: CODE,
  });
  r({
    name: 'CHAR',
    category: 'text',
    description: 'Character from code',
    minArgs: 1,
    maxArgs: 1,
    impl: CHAR,
  });
  r({
    name: 'VALUE',
    category: 'text',
    description: 'Convert to number',
    minArgs: 1,
    maxArgs: 1,
    impl: VALUE,
  });
  r({ name: 'T', category: 'text', description: 'Text value', minArgs: 1, maxArgs: 1, impl: T });
  r({ name: 'N', category: 'text', description: 'Numeric value', minArgs: 1, maxArgs: 1, impl: N });
  r({
    name: 'EXACT',
    category: 'text',
    description: 'Exact match',
    minArgs: 2,
    maxArgs: 2,
    impl: EXACT,
  });
  r({
    name: 'REGEXMATCH',
    category: 'text',
    description: 'Check if text matches regex pattern (1/0)',
    minArgs: 2,
    maxArgs: 2,
    impl: (text: number, _pattern: number) => {
      try {
        return new RegExp(String(_pattern)).test(String(text)) ? 1 : 0;
      } catch {
        return 0;
      }
    },
  });
  r({
    name: 'REGEXREPLACE',
    category: 'text',
    description: 'Replace text using regex',
    minArgs: 3,
    maxArgs: 3,
    impl: (text: number, pattern: number, replacement: number) => {
      try {
        return Number(String(text).replace(new RegExp(String(pattern)), String(replacement)));
      } catch {
        return text;
      }
    },
  });
  r({
    name: 'REGEXEXTRACT',
    category: 'text',
    description: 'Extract first regex match',
    minArgs: 2,
    maxArgs: 2,
    impl: (text: number, pattern: number) => {
      try {
        const m = String(text).match(new RegExp(String(pattern)));
        return m ? Number(m[0]!) : 0;
      } catch {
        return 0;
      }
    },
  });
  r({
    name: 'UNICODE',
    category: 'text',
    description: 'Unicode code point',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => String(v).charCodeAt(0),
  });
  r({
    name: 'UNICHAR',
    category: 'text',
    description: 'Character from Unicode',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => String.fromCharCode(v).charCodeAt(0),
  });
  r({
    name: 'PROPER',
    category: 'text',
    description: 'Proper case',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => {
      const s = String(v);
      return Number(s.charAt(0).toUpperCase() + s.slice(1).toLowerCase());
    },
  });
  r({
    name: 'TRIM',
    category: 'text',
    description: 'Trim whitespace',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Number(String(v).trim()),
  });
  r({
    name: 'CLEAN',
    category: 'text',
    description: 'Remove non-printable',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) =>
      Number(
        String(v)
          .split('')
          .filter((c) => {
            const code = c.charCodeAt(0);
            return code >= 32 && code !== 127;
          })
          .join('')
      ),
  });
  r({
    name: 'FIND',
    category: 'text',
    description: 'Find substring',
    minArgs: 2,
    maxArgs: 3,
    impl: (find: number, within: number, start = 0) =>
      String(within).indexOf(String(find), start) + 1,
  });
  r({
    name: 'SEARCH',
    category: 'text',
    description: 'Search substring (case-insensitive)',
    minArgs: 2,
    maxArgs: 3,
    impl: (find: number, within: number, start = 0) =>
      String(within).toLowerCase().indexOf(String(find).toLowerCase(), start) + 1,
  });
  r({
    name: 'LEFT',
    category: 'text',
    description: 'Left N characters',
    minArgs: 2,
    maxArgs: 2,
    impl: (v: number, n: number) => Number(String(v).substring(0, n)),
  });
  r({
    name: 'RIGHT',
    category: 'text',
    description: 'Right N characters',
    minArgs: 2,
    maxArgs: 2,
    impl: (v: number, n: number) => {
      const s = String(v);
      return Number(s.substring(s.length - n));
    },
  });
  r({
    name: 'MID',
    category: 'text',
    description: 'Substring from position',
    minArgs: 3,
    maxArgs: 3,
    impl: (v: number, start: number, len: number) =>
      Number(String(v).substring(start - 1, start - 1 + len)),
  });
  r({
    name: 'SUBSTITUTE',
    category: 'text',
    description: 'Replace all occurrences',
    minArgs: 3,
    maxArgs: 3,
    impl: (text: number, old: number, rep: number) =>
      Number(String(text).split(String(old)).join(String(rep))),
  });
  r({
    name: 'REPLACE',
    category: 'text',
    description: 'Replace at position',
    minArgs: 4,
    maxArgs: 4,
    impl: (text: number, start: number, len: number, rep: number) => {
      const s = String(text);
      return Number(s.substring(0, start - 1) + String(rep) + s.substring(start - 1 + len));
    },
  });
  r({
    name: 'CONCATENATE',
    category: 'text',
    description: 'Concatenate values',
    minArgs: 1,
    maxArgs: -1,
    impl: (...args: number[]) => Number(args.map(String).join('')),
  });
  r({
    name: 'REPT',
    category: 'text',
    description: 'Repeat text N times',
    minArgs: 2,
    maxArgs: 2,
    impl: (v: number, n: number) => Number(String(v).repeat(n)),
  });
  r({
    name: 'DOLLAR',
    category: 'text',
    description: 'Format as currency',
    minArgs: 1,
    maxArgs: 2,
    impl: (v: number, decimals = 2) => roundTo(v, decimals),
  });
  r({
    name: 'FIXED',
    category: 'text',
    description: 'Format as fixed decimal',
    minArgs: 1,
    maxArgs: 2,
    impl: (v: number, decimals = 2) => roundTo(v, decimals),
  });
  r({
    name: 'JIS',
    category: 'text',
    description: 'JIS encoding',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => v,
  });
  r({
    name: 'ASC',
    category: 'text',
    description: 'ASCII encoding',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => v,
  });
  r({
    name: 'CONCAT',
    category: 'text',
    description: 'Concatenate as numbers',
    minArgs: 1,
    maxArgs: -1,
    impl: (...args: number[]) => Number(args.map(String).join('')),
  });
  r({
    name: 'TEXTJOIN',
    category: 'text',
    description: 'Join with delimiter',
    minArgs: 2,
    maxArgs: -1,
    impl: (delim: number, ...args: number[]) => Number(args.map(String).join(String(delim))),
  });
  r({
    name: 'UPPER',
    category: 'text',
    description: 'Convert to uppercase',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Number(String(v).toUpperCase()),
  });
  r({
    name: 'LOWER',
    category: 'text',
    description: 'Convert to lowercase',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Number(String(v).toLowerCase()),
  });
  r({
    name: 'TEXT',
    category: 'text',
    description: 'Format number as text',
    minArgs: 2,
    maxArgs: 2,
    impl: (v: number, fmt: number) => {
      const f = String(fmt);
      const s = String(v);
      // Handle common Excel format patterns
      if (f.includes('%')) return Number(s + '%');
      if (f.includes('$') || f.includes('#,##0')) return roundTo(v, 2);
      if (f.includes('0.')) {
        const decimals = (f.split('.')[1] || '').replace(/[^0]/g, '').length;
        return roundTo(v, decimals);
      }
      return Number(s);
    },
  });

  // Date
  r({
    name: 'DATE',
    category: 'date',
    description: 'Date from year, month, day',
    minArgs: 3,
    maxArgs: 3,
    impl: DATE,
  });
  r({
    name: 'YEAR',
    category: 'date',
    description: 'Year from serial',
    minArgs: 1,
    maxArgs: 1,
    impl: YEAR,
  });
  r({
    name: 'MONTH',
    category: 'date',
    description: 'Month from serial',
    minArgs: 1,
    maxArgs: 1,
    impl: MONTH,
  });
  r({
    name: 'DAY',
    category: 'date',
    description: 'Day from serial',
    minArgs: 1,
    maxArgs: 1,
    impl: DAY,
  });
  r({
    name: 'HOUR',
    category: 'date',
    description: 'Hour from serial',
    minArgs: 1,
    maxArgs: 1,
    impl: HOUR,
  });
  r({
    name: 'MINUTE',
    category: 'date',
    description: 'Minute from serial',
    minArgs: 1,
    maxArgs: 1,
    impl: MINUTE,
  });
  r({
    name: 'SECOND',
    category: 'date',
    description: 'Second from serial',
    minArgs: 1,
    maxArgs: 1,
    impl: SECOND,
  });
  r({
    name: 'EOMONTH',
    category: 'date',
    description: 'End of month',
    minArgs: 2,
    maxArgs: 2,
    impl: EOMONTH,
  });
  r({
    name: 'EDATE',
    category: 'date',
    description: 'Date plus months',
    minArgs: 2,
    maxArgs: 2,
    impl: EDATE,
  });
  r({
    name: 'DATEDIF',
    category: 'date',
    description: 'Date difference',
    minArgs: 3,
    maxArgs: 3,
    impl: DATEDIF,
  });
  r({
    name: 'DAYS',
    category: 'date',
    description: 'Days between dates',
    minArgs: 2,
    maxArgs: 2,
    impl: DAYS,
  });
  r({
    name: 'DAYS360',
    category: 'date',
    description: 'Days (360-day year)',
    minArgs: 2,
    maxArgs: 2,
    impl: DAYS360,
  });
  r({
    name: 'YEARFRAC',
    category: 'date',
    description: 'Year fraction',
    minArgs: 2,
    maxArgs: 2,
    impl: YEARFRAC,
  });
  r({
    name: 'NOW',
    category: 'date',
    description: 'Current date and time',
    minArgs: 0,
    maxArgs: 0,
    impl: NOW,
  });
  r({
    name: 'TODAY',
    category: 'date',
    description: 'Current date',
    minArgs: 0,
    maxArgs: 0,
    impl: TODAY,
  });
  r({
    name: 'TIME',
    category: 'date',
    description: 'Time from h,m,s',
    minArgs: 3,
    maxArgs: 3,
    impl: TIME,
  });
  r({
    name: 'WEEKNUM',
    category: 'date',
    description: 'Week number',
    minArgs: 1,
    maxArgs: 1,
    impl: WEEKNUM,
  });
  r({
    name: 'ISOWEEKNUM',
    category: 'date',
    description: 'ISO week number',
    minArgs: 1,
    maxArgs: 1,
    impl: ISOWEEKNUM,
  });
  r({
    name: 'NETWORKDAYS',
    category: 'date',
    description: 'Net working days',
    minArgs: 2,
    maxArgs: 2,
    impl: NETWORKDAYS,
  });
  r({
    name: 'WORKDAY',
    category: 'date',
    description: 'Working day after N days',
    minArgs: 2,
    maxArgs: 2,
    impl: WORKDAY,
  });
  r({
    name: 'WEEKDAY',
    category: 'date',
    description: 'Day of week (1=Sunday)',
    minArgs: 1,
    maxArgs: 2,
    impl: (s: number, returnType = 1) => {
      const day = serialToDate(s).getUTCDay(); // 0=Sunday (pure UTC serial math)
      if (returnType === 2) return day + 1 === 7 ? 7 : day + 1; // 1=Monday, 7=Sunday
      if (returnType === 3) return day === 0 ? 6 : day - 1; // 0=Monday, 6=Sunday
      return day + 1; // 1=Sunday, 7=Saturday (default)
    },
  });
}
