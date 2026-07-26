import { describe, expect, it } from 'vitest';
import { hasDuplicateHeaders, parseCSV, parseCSVRecords, toCSV } from './csv';

describe('csv utilities', () => {
  it('parses BOM-prefixed CSV with headers and rows', () => {
    expect(parseCSV('\ufeffaccount,date,debit\n4000,2026-01-01,100').rows[0]).toEqual({
      account: '4000',
      date: '2026-01-01',
      debit: '100',
    });
  });
  it('handles quoted commas, escaped quotes, and embedded newlines', () => {
    const parsed = parseCSV(
      'id,description,amount\n1,"Hello, world",10\n2,"Line ""two""\ncontinued",20'
    );
    expect(parsed.rows[0]!.description).toBe('Hello, world');
    expect(parsed.rows[1]!.description).toBe('Line "two"\ncontinued');
  });
  it('skips empty rows by default', () => {
    expect(parseCSVRecords('a,b\n\n1,2\n').length).toBe(2);
  });
  it('detects duplicate headers', () => {
    expect(hasDuplicateHeaders(['a', 'b', 'a'])).toBe(true);
  });
  it('serializes CSV with escaping', () => {
    expect(toCSV([{ a: 'x,y', b: 'quote " here' }], ['a', 'b'])).toBe('a,b\n"x,y","quote "" here"');
  });
});
