import { describe, it, expect } from 'vitest';
import { parseImportDate } from './parseImportDate';

/**
 * W6-P0-09: imported dates are stored raw (garbage periods). parseImportDate
 * strictly accepts ISO YYYY-MM-DD (the app's canonical storage format) plus
 * the unambiguous variants GL exports actually ship (YYYY/MM/DD, YYYY.MM.DD,
 * US M/D/YYYY), validates calendar correctness, and returns canonical
 * YYYY-MM-DD — or null so the caller can surface a per-row error.
 */
describe('parseImportDate', () => {
  it.each([
    ['2024-01-15', '2024-01-15'],
    ['2024/02/03', '2024-02-03'],
    ['2024.12.31', '2024-12-31'],
    ['2024-1-5', '2024-01-05'], // unpadded components normalized
    [' 2024-03-01 ', '2024-03-01'], // surrounding whitespace tolerated
  ])('accepts ISO-ordered dates: %s -> %s', (raw, expected) => {
    expect(parseImportDate(raw)).toBe(expected);
  });

  it.each([
    ['01/15/2024', '2024-01-15'], // US M/D/YYYY
    ['1/5/2024', '2024-01-05'],
    ['12-31-2024', '2024-12-31'],
    ['02.29.2024', '2024-02-29'], // leap day
  ])('accepts US-ordered dates: %s -> %s', (raw, expected) => {
    expect(parseImportDate(raw)).toBe(expected);
  });

  it('rejects calendar-invalid dates', () => {
    expect(parseImportDate('2023-02-29')).toBeNull(); // not a leap year
    expect(parseImportDate('2024-02-30')).toBeNull();
    expect(parseImportDate('2024-13-01')).toBeNull(); // month 13
    expect(parseImportDate('2024-00-10')).toBeNull();
    expect(parseImportDate('2024-04-31')).toBeNull();
    expect(parseImportDate('06/31/2024')).toBeNull(); // June has 30 days
  });

  it.each([
    ['', 'empty'],
    ['not-a-date', 'text'],
    ['15/2024/01', 'day-first with 4-digit middle group'],
    ['20240115', 'compact form'],
    ['2024-01', 'year-month only'],
    ['2024-01-15T10:00:00', 'datetime with time component'],
    ['Jan 15, 2024', 'long form'],
    ['015-01-15', 'three-digit year'],
  ])('rejects unparseable input: %s (%s)', (raw) => {
    expect(parseImportDate(raw)).toBeNull();
  });
});
