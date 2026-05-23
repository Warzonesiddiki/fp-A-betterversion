/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { StreamImportEngine } from './StreamImportEngine';

describe('StreamImportEngine', () => {
  let engine: StreamImportEngine;

  beforeEach(() => {
    engine = new StreamImportEngine();
  });

  describe('parseCSV', () => {
    it('parses CSV data', async () => {
      const csv = 'name,amount\nRevenue,1000\nExpense,500';
      const result = await engine.parseCSV(csv);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Revenue');
    });

    it('handles empty CSV', async () => {
      const result = await engine.parseCSV('');
      expect(result.length).toBe(0);
    });
  });

  describe('validate', () => {
    it('validates data rows', () => {
      const rows = [{ name: 'Revenue', amount: 1000 }];
      const result = engine.validate(rows);
      expect(result.valid.length).toBe(1);
      expect(result.errors.length).toBe(0);
    });

    it('identifies invalid rows', () => {
      const rows = [{ name: '', amount: -1 }];
      const result = engine.validate(rows);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
