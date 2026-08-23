import { describe, it, expect } from 'vitest';
import { parseFinancialAmount } from './parseFinancialAmount';

/**
 * W6-P0-10: bare parseFloat silently truncates comma-formatted amounts
 * ("1,234.56" → 1). parseFinancialAmount implements a separator heuristic:
 *   - both , and . present  → rightmost is the decimal separator, the other
 *     is thousands grouping (each post-first group must be exactly 3 digits)
 *   - one symbol only       → decimal when followed by exactly 1-2 digits at
 *                             the end, else thousands
 *   - currency symbols / spaces stripped; (500) → -500
 */
describe('parseFinancialAmount', () => {
  it.each([
    ['1234.56', 1234.56],
    ['0', 0],
    ['100', 100],
  ])('parses plain numbers: %s', (raw, expected) => {
    expect(parseFinancialAmount(raw)).toBe(expected);
  });

  it.each([
    ['1,234.56', 1234.56], // US format: rightmost "." is decimal
    ['1,234,567.89', 1234567.89],
    ['1.234,56', 1234.56], // EU format: rightmost "," is decimal
    ['1.234.567,89', 1234567.89],
  ])('resolves dual separators by rightmost rule: %s', (raw, expected) => {
    expect(parseFinancialAmount(raw)).toBe(expected);
  });

  it.each([
    ['1.5', 1.5], // single "." + 1 digit at end → decimal
    ['12.34', 12.34], // single "." + 2 digits at end → decimal
    ['1,23', 1.23], // single "," + 2 digits at end → decimal
    ['1,5', 1.5], // single "," + 1 digit at end → decimal
  ])('single separator followed by 1-2 digits at end is decimal: %s', (raw, expected) => {
    expect(parseFinancialAmount(raw)).toBe(expected);
  });

  it.each([
    ['1,000', 1000], // single "," followed by 3 digits → thousands
    ['1,234', 1234],
    ['1.234', 1234], // single "." followed by 3 digits → thousands
    ['12,34,567', 1234567], // Indian-style grouping
    ['1,234,567', 1234567],
  ])('single separator not matching decimal shape is thousands: %s', (raw, expected) => {
    expect(parseFinancialAmount(raw)).toBe(expected);
  });

  it('treats parenthesized amounts as negative: (500) -> -500', () => {
    expect(parseFinancialAmount('(500)')).toBe(-500);
    expect(parseFinancialAmount('(1,234.50)')).toBe(-1234.5);
  });

  it.each([
    ['$1,000', 1000],
    ['-1,234.56', -1234.56],
    ['+250', 250],
    ['€1.234,56', 1234.56],
    ['£500', 500],
    ['$(1,234.50)', -1234.5],
    [' 1 234,56 ', 1234.56], // spaces/NBSP stripped
  ])('strips currency symbols, signs and spaces: %s', (raw, expected) => {
    expect(parseFinancialAmount(raw)).toBe(expected);
  });

  it.each([
    ['', 'empty string'],
    ['   ', 'whitespace only'],
    ['abc', 'letters'],
    ['12a3', 'embedded letters'],
    ['$', 'currency symbol only'],
    ['.', 'dot only'],
    [',', 'comma only'],
    ['1..2', 'double dot'],
    ['1,2,3', 'invalid grouping'],
    ['1,2345', 'non-3-digit group'],
    ['1,234.56.78', 'two decimal candidates'],
    ['1,234,5678.90', 'malformed grouping before decimal'],
  ])('returns NaN for garbage: %s (%s)', (raw) => {
    expect(Number.isNaN(parseFinancialAmount(raw))).toBe(true);
  });

  it('rejects non-string input defensively', () => {
    // The wizard feeds String(...) output, but the util must not crash on
    // unexpected types flowing in from untrusted rows.
    expect(Number.isNaN(parseFinancialAmount(undefined as unknown as string))).toBe(true);
    expect(Number.isNaN(parseFinancialAmount(null as unknown as string))).toBe(true);
  });
});
