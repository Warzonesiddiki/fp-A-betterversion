/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { StreamImportEngine } from './StreamImportEngine';

describe('StreamImportEngine', () => {
  describe('streamParse', () => {
    it('should parse CSV data as an async generator', async () => {
      const file = new File(['name,amount\nRevenue,1000\nExpense,500'], 'test.csv', {
        type: 'text/csv',
      });
      const rows: unknown[] = [];
      for await (const row of StreamImportEngine.streamParse(file)) {
        rows.push(row);
      }
      expect(rows).toHaveLength(2);
    });

    it('should handle empty CSV', async () => {
      const file = new File([''], 'empty.csv', { type: 'text/csv' });
      const rows: unknown[] = [];
      for await (const row of StreamImportEngine.streamParse(file)) {
        rows.push(row);
      }
      expect(rows).toHaveLength(0);
    });

    it('should yield ImportRow objects with rowIndex, data, raw', async () => {
      const file = new File(['x,y\n1,2'], 'test.csv', { type: 'text/csv' });
      for await (const row of StreamImportEngine.streamParse(file)) {
        expect(row.rowIndex).toBe(0);
        expect(row.data).toEqual({ x: '1', y: '2' });
        expect(typeof row.raw).toBe('string');
      }
    });
  });

  describe('validateStream', () => {
    it('should validate rows using async generator', async () => {
      const file = new File(['name,amount\nRevenue,1000'], 'test.csv', { type: 'text/csv' });
      const parsed = StreamImportEngine.streamParse(file);
      const validRows: unknown[] = [];
      for await (const row of StreamImportEngine.validateStream(parsed, ['name'])) {
        validRows.push(row);
      }
      expect(validRows).toHaveLength(1);
    });

    it('should flag missing required fields', async () => {
      const file = new File(['name,amount\n,1000'], 'test.csv', { type: 'text/csv' });
      const parsed = StreamImportEngine.streamParse(file);
      for await (const row of StreamImportEngine.validateStream(parsed, ['name'])) {
        expect(row.valid).toBe(false);
        expect(row.errors.length).toBeGreaterThan(0);
      }
    });

    it('should accept valid rows', async () => {
      const file = new File(['x,y\n1,2'], 'test.csv', { type: 'text/csv' });
      const parsed = StreamImportEngine.streamParse(file);
      for await (const row of StreamImportEngine.validateStream(parsed, ['x'])) {
        expect(row.valid).toBe(true);
        expect(row.errors).toHaveLength(0);
      }
    });
  });
});
