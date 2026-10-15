import { describe, expect, it } from 'vitest';
import { missingRequiredMappings, parseGLRows } from './parseGLRows';

// Fixture rows are keyed by source column header, exactly as the upload step
// produces them. Mappings are the user's field → column choice.
const MAP = {
  accountCode: 'Account',
  postDate: 'Date',
  debit: 'Debit',
  credit: 'Credit',
  description: 'Memo',
  reference: 'Ref',
  entityId: 'Entity',
  departmentId: 'Dept',
} as const;

const row = (o: Partial<Record<string, string>>): Record<string, string> => ({
  Account: '4000',
  Date: '2026-03-15',
  Debit: '',
  Credit: '',
  Memo: '',
  Ref: '',
  Entity: '',
  Dept: '',
  ...o,
});

describe('parseGLRows — happy path', () => {
  it('maps a well-formed row into a GL entry with canonical period and provenance row', () => {
    const r = parseGLRows(
      [row({ Debit: '1,234.56', Memo: 'Rent', Ref: 'J-1', Entity: 'E1', Dept: 'D9' })],
      MAP
    );
    expect(r.rejections).toEqual([]);
    expect(r.rowErrors).toEqual([]);
    expect(r.sourceRows).toEqual([2]);
    expect(r.entries).toHaveLength(1);
    expect(r.entries[0]).toMatchObject({
      accountCode: '4000',
      accountId: '4000',
      accountName: '4000',
      date: '2026-03-15',
      postDate: '2026-03-15',
      period: '2026-03',
      periodName: '2026-03',
      debit: 1234.56,
      credit: 0,
      description: 'Rent',
      reference: 'J-1',
      entityId: 'E1',
      departmentId: 'D9',
    });
  });

  it('accepts the date formats the parser documents and canonicalises them', () => {
    const r = parseGLRows(
      [
        row({ Date: '2026-3-5' }),
        row({ Date: '2026/03/05' }),
        row({ Date: '2026.03.05' }),
        row({ Date: '3/5/2026' }),
      ],
      MAP
    );
    expect(r.rejections).toEqual([]);
    expect(r.entries.map((e) => e.postDate)).toEqual([
      '2026-03-05',
      '2026-03-05',
      '2026-03-05',
      '2026-03-05',
    ]);
  });

  it('parses locale and accounting amount formats', () => {
    const r = parseGLRows(
      [
        row({ Debit: '1.234,56' }),
        row({ Credit: '(500)' }),
        row({ Debit: '$ 2,000' }),
        row({ Credit: '-75.5' }),
        row({ Debit: '12,34,567.89' }),
      ],
      MAP
    );
    expect(r.rejections).toEqual([]);
    expect(r.entries.map((e) => [e.debit, e.credit])).toEqual([
      [1234.56, 0],
      [0, -500],
      [2000, 0],
      [0, -75.5],
      [1234567.89, 0],
    ]);
  });

  it('treats blank amount cells and unmapped amount columns as 0, not as errors', () => {
    const noAmounts = { accountCode: 'Account', postDate: 'Date' } as const;
    const r = parseGLRows([row({ Debit: 'garbage' })], noAmounts);
    expect(r.rejections).toEqual([]);
    expect(r.entries[0]).toMatchObject({ debit: 0, credit: 0 });

    const r2 = parseGLRows([row({ Debit: '   ', Credit: '' })], MAP);
    expect(r2.rejections).toEqual([]);
    expect(r2.entries[0]).toMatchObject({ debit: 0, credit: 0 });
  });

  it('keeps source order and aligns sourceRows with entries when rows are rejected', () => {
    const r = parseGLRows(
      [row({ Account: '1000' }), row({ Account: '' }), row({ Account: '3000' })],
      MAP
    );
    expect(r.entries.map((e) => e.accountCode)).toEqual(['1000', '3000']);
    expect(r.sourceRows).toEqual([2, 4]);
    expect(r.rejections).toEqual([{ row: 3, code: 'VALIDATION', reason: 'missing accountCode' }]);
  });

  it('honours a custom first row number (e.g. a file with no header row)', () => {
    const r = parseGLRows([row({}), row({ Date: 'x' })], MAP, 1);
    expect(r.sourceRows).toEqual([1]);
    expect(r.rejections[0]?.row).toBe(2);
  });
});

describe('parseGLRows — rejections (FR-002: nothing silently discarded)', () => {
  it('rejects a missing or whitespace-only account code', () => {
    const r = parseGLRows([row({ Account: '' }), row({ Account: '   ' })], MAP);
    expect(r.entries).toEqual([]);
    expect(r.rejections).toEqual([
      { row: 2, code: 'VALIDATION', reason: 'missing accountCode' },
      { row: 3, code: 'VALIDATION', reason: 'missing accountCode' },
    ]);
    expect(r.rowErrors).toEqual(['Row 2: missing accountCode', 'Row 3: missing accountCode']);
  });

  it('rejects missing, malformed and calendar-invalid posting dates with the offending text', () => {
    const r = parseGLRows(
      [
        row({ Date: '' }),
        row({ Date: '31/02/2026' }),
        row({ Date: '2026-02-30' }),
        row({ Date: '2026-13-01' }),
        row({ Date: 'March 5, 2026' }),
        row({ Date: '20260305' }),
      ],
      MAP
    );
    expect(r.entries).toEqual([]);
    expect(r.rejections.map((x) => x.reason)).toEqual([
      'missing posting date',
      'unparseable posting date "31/02/2026"',
      'unparseable posting date "2026-02-30"',
      'unparseable posting date "2026-13-01"',
      'unparseable posting date "March 5, 2026"',
      'unparseable posting date "20260305"',
    ]);
  });

  it('rejects unparseable amounts instead of storing 0 or a truncated value', () => {
    const r = parseGLRows(
      [row({ Debit: 'abc' }), row({ Credit: '1,2345' }), row({ Debit: '1.2.3' })],
      MAP
    );
    expect(r.entries).toEqual([]);
    expect(r.rejections.map((x) => x.reason)).toEqual([
      'unparseable debit amount "abc"',
      'unparseable credit amount "1,2345"',
      'unparseable debit amount "1.2.3"',
    ]);
  });

  it('reports every problem on a row, not just the first', () => {
    const r = parseGLRows([row({ Account: '', Date: 'nope', Debit: 'x', Credit: 'y' })], MAP);
    expect(r.entries).toEqual([]);
    expect(r.rejections.map((x) => x.reason)).toEqual([
      'missing accountCode',
      'unparseable posting date "nope"',
      'unparseable debit amount "x"',
      'unparseable credit amount "y"',
    ]);
    expect(r.rejections.every((x) => x.row === 2)).toBe(true);
  });

  it('returns no entries and no rejections for an empty file', () => {
    expect(parseGLRows([], MAP)).toEqual({
      entries: [],
      sourceRows: [],
      rejections: [],
      rowErrors: [],
    });
  });

  it('is a pure function: same input → identical output, inputs untouched', () => {
    const input = [row({ Debit: '10' }), row({ Date: 'bad' })];
    const snapshot = JSON.stringify(input);
    const a = parseGLRows(input, MAP);
    const b = parseGLRows(input, MAP);
    expect(a).toEqual(b);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

describe('missingRequiredMappings', () => {
  it('lists unmapped required fields in a stable order', () => {
    expect(missingRequiredMappings({})).toEqual(['accountCode', 'postDate']);
    expect(missingRequiredMappings({ accountCode: 'A' })).toEqual(['postDate']);
    expect(missingRequiredMappings({ postDate: 'D' })).toEqual(['accountCode']);
    expect(missingRequiredMappings({ accountCode: 'A', postDate: 'D' })).toEqual([]);
    expect(missingRequiredMappings({ accountCode: '', postDate: 'D' })).toEqual(['accountCode']);
  });
});
