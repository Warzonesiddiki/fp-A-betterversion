/**
 * N-0006 regression suite — spreadsheet injection via hidden prefixes.
 *
 * Audit ZCFA-2026-07-29-002 reproduced two live bypasses of the F-0017
 * sanitizer:
 *     "\u0000=1+1"  -> not flagged, exported raw
 *     "\u202E=1+1"  -> not flagged, exported raw
 * Spreadsheet parsers skip these characters, so the payload still executes.
 *
 * This suite locks the parser-view detection model: any value whose FIRST
 * MEANINGFUL character is = + - or @ must be neutralized, no matter how many
 * invisible characters precede it.
 */
import { describe, it, expect } from 'vitest';
import {
  isDangerousSpreadsheetCell,
  sanitizeSpreadsheetCell,
  sanitizeSpreadsheetText,
} from '../spreadsheetSanitize';

const TRIGGERS = ['=', '+', '-', '@'];

/** Every character class a spreadsheet parser ignores before the first token. */
const HIDDEN_PREFIXES: Record<string, string> = {
  'NUL U+0000': '\u0000',
  'SOH U+0001': '\u0001',
  'BEL U+0007': '\u0007',
  'TAB U+0009': '\u0009',
  'LF U+000A': '\u000A',
  'CR U+000D': '\u000D',
  'US U+001F': '\u001F',
  'space U+0020': '\u0020',
  'DEL U+007F': '\u007F',
  'C1 U+0085': '\u0085',
  'C1 U+009F': '\u009F',
  'NBSP U+00A0': '\u00A0',
  'ALM U+061C': '\u061C',
  'ZWSP U+200B': '\u200B',
  'ZWNJ U+200C': '\u200C',
  'ZWJ U+200D': '\u200D',
  'LRM U+200E': '\u200E',
  'RLM U+200F': '\u200F',
  'LRE U+202A': '\u202A',
  'RLE U+202B': '\u202B',
  'PDF U+202C': '\u202C',
  'LRO U+202D': '\u202D',
  'RLO U+202E': '\u202E',
  'word joiner U+2060': '\u2060',
  'LRI U+2066': '\u2066',
  'RLI U+2067': '\u2067',
  'FSI U+2068': '\u2068',
  'PDI U+2069': '\u2069',
  'BOM U+FEFF': '\uFEFF',
  'ideographic space U+3000': '\u3000',
};

describe('N-0006: hidden-prefix formula injection', () => {
  it('flags every trigger behind every ignorable prefix', () => {
    const missed: string[] = [];
    for (const [label, prefix] of Object.entries(HIDDEN_PREFIXES)) {
      for (const trigger of TRIGGERS) {
        const payload = `${prefix}${trigger}1+1`;
        if (!isDangerousSpreadsheetCell(payload)) missed.push(`${label} + "${trigger}"`);
      }
    }
    expect(missed).toEqual([]);
  });

  it('neutralizes the two payloads the audit reproduced', () => {
    expect(sanitizeSpreadsheetText('\u0000=1+1')).toBe("'\u0000=1+1");
    expect(sanitizeSpreadsheetText('\u202E=1+1')).toBe("'\u202E=1+1");
  });

  it('flags stacked/repeated invisible prefixes', () => {
    const stacked = "\uFEFF\u200B\u202E\u0000\t  =cmd|'/c calc'!A1";
    expect(isDangerousSpreadsheetCell(stacked)).toBe(true);
    expect(sanitizeSpreadsheetText(stacked).startsWith("'")).toBe(true);
  });

  it('still neutralizes the classic unprefixed payloads', () => {
    const classics = [
      '=1+1',
      '+1+1',
      '-1+1',
      '@SUM(A1)',
      "=cmd|'/c calc'!A1",
      '=HYPERLINK("http://evil","click")',
      '\t=1+1',
      '\r=1+1',
      "=1+1+cmd|' /C calc'!A0",
      "@SUM(1+9)*cmd|' /C calc'!A0",
    ];
    for (const p of classics) {
      expect(isDangerousSpreadsheetCell(p)).toBe(true);
      expect(sanitizeSpreadsheetText(p).startsWith("'")).toBe(true);
    }
  });

  it('does NOT corrupt legitimate financial text', () => {
    const safe = [
      'Revenue',
      'Q1 2026',
      '1000.00',
      'Cost of Goods Sold',
      'A-1 Supplier Ltd', // hyphen NOT first
      'user@example.com', // @ NOT first
      'Net income (loss)',
      'FX: EUR->USD',
      '',
      '  Revenue  ',
      'Café Ltd',
      '日本語勘定',
    ];
    for (const s of safe) {
      expect(isDangerousSpreadsheetCell(s)).toBe(false);
      expect(sanitizeSpreadsheetText(s)).toBe(s);
    }
  });

  it('a value that is ONLY invisible characters is not flagged', () => {
    expect(isDangerousSpreadsheetCell('\u0000\u200B\uFEFF')).toBe(false);
  });

  it('leaves non-string cells untouched', () => {
    expect(sanitizeSpreadsheetCell(1234.56)).toBe(1234.56);
    expect(sanitizeSpreadsheetCell(null)).toBeNull();
    expect(sanitizeSpreadsheetCell(true)).toBe(true);
    expect(sanitizeSpreadsheetCell(undefined)).toBeUndefined();
  });

  it('negative numbers passed as strings are neutralized (they start with -)', () => {
    // Correct and intentional: Excel treats a leading "-" as a formula start.
    // Numeric cells must be written as NUMBERS, not strings, to avoid the quote.
    expect(sanitizeSpreadsheetText('-500.00')).toBe("'-500.00");
    expect(sanitizeSpreadsheetCell(-500.0)).toBe(-500.0);
  });
});
