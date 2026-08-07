/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StreamImportEngine } from './StreamImportEngine';

// Mock IndexedDB
const mockPut = vi.fn();
const mockTransaction = vi.fn(() => {
  const tx: any = {
    objectStore: vi.fn(() => ({
      put: mockPut,
    })),
    oncomplete: null as any,
    onerror: null as any,
  };
  setTimeout(() => {
    if (tx.oncomplete) tx.oncomplete();
  }, 0);
  return tx;
});

vi.mock('@/utils/indexedDBStorage', () => ({
  openDB: vi.fn().mockResolvedValue({
    transaction: mockTransaction,
  }),
}));

describe('StreamImportEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

    it('should parse TSV data when tab delimiter is detected', async () => {
      const file = new File(
        ['name\tamount\tcategory\nSalary\t5000\tOpEx\nRent\t2000\tG&A'],
        'test.tsv',
        {
          type: 'text/tab-separated-values',
        }
      );
      const rows: any[] = [];
      for await (const row of StreamImportEngine.streamParse(file)) {
        rows.push(row);
      }
      expect(rows).toHaveLength(2);
      expect(rows[0].data).toEqual({ name: 'Salary', amount: '5000', category: 'OpEx' });
    });

    it('should handle quoted CSV fields with commas and escaped quotes', async () => {
      const content = 'id,description,total\n1,"Acme, Inc.",1500\n2,"He said ""Hello""",2000';
      const file = new File([content], 'quotes.csv', { type: 'text/csv' });
      const rows: any[] = [];
      for await (const row of StreamImportEngine.streamParse(file)) {
        rows.push(row);
      }
      expect(rows).toHaveLength(2);
      expect(rows[0].data.description).toBe('Acme, Inc.');
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

    it('should accept valid rows with numeric values containing commas', async () => {
      const file = new File(['x,y\n1,"1,250.50"'], 'test.csv', { type: 'text/csv' });
      const parsed = StreamImportEngine.streamParse(file);
      for await (const row of StreamImportEngine.validateStream(parsed, ['x'])) {
        expect(row.valid).toBe(true);
        expect(row.errors).toHaveLength(0);
      }
    });
  });

  describe('bulkWrite and importWithProgress', () => {
    it('writes validated rows to storage in chunks', async () => {
      async function* generateRows() {
        yield {
          rowIndex: 0,
          data: { name: 'A', amount: 100 },
          raw: 'A,100',
          valid: true,
          errors: [],
        };
        yield {
          rowIndex: 1,
          data: { name: 'B', amount: 200 },
          raw: 'B,200',
          valid: true,
          errors: [],
        };
        yield {
          rowIndex: 2,
          data: { name: '', amount: 300 },
          raw: ',300',
          valid: false,
          errors: ['Missing name'],
        };
      }

      const result = await StreamImportEngine.bulkWrite(generateRows(), 'gl_entries', 1);

      expect(result.totalRows).toBe(3);
      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(mockPut).toHaveBeenCalled();
    });

    it('runs the full importWithProgress pipeline', async () => {
      const fileContent = 'account,debit,credit\n1000,500,0\n2000,0,500\n3000,,';
      const file = new File([fileContent], 'gl.csv', { type: 'text/csv' });
      const onProgress = vi.fn();

      const result = await StreamImportEngine.importWithProgress(file, 'gl_entries', {
        requiredFields: ['account'],
        chunkSize: 2,
        onProgress,
      });

      expect(result.totalRows).toBe(3);
      expect(onProgress).toHaveBeenCalledWith(100, 3);
    });
  });
});
