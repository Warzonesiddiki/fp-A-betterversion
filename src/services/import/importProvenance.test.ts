import { describe, it, expect } from 'vitest';
import {
  computeControlTotals,
  computeImportScope,
  defaultSourceRows,
  findPriorImport,
  hashFileBytes,
  hashRowContent,
  makeBatchId,
  stampProvenance,
} from './importProvenance';

describe('importProvenance', () => {
  describe('hashFileBytes', () => {
    it('is the SHA-256 of the bytes (NIST "abc" vector)', () => {
      const bytes = new TextEncoder().encode('abc');
      expect(hashFileBytes(bytes)).toBe(
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
      );
    });
    it('accepts an ArrayBuffer and yields the same digest', () => {
      const u8 = new TextEncoder().encode('account,date,debit\n1000,2026-01-31,10.00\n');
      const copy = new Uint8Array(u8); // fresh buffer, no byteOffset
      expect(hashFileBytes(copy.buffer)).toBe(hashFileBytes(u8));
    });
    it('differs for a one-byte change', () => {
      const a = new TextEncoder().encode('1000,2026-01-31,10.00');
      const b = new TextEncoder().encode('1000,2026-01-31,10.01');
      expect(hashFileBytes(a)).not.toBe(hashFileBytes(b));
    });
  });

  describe('hashRowContent', () => {
    const rows = [
      { accountCode: '1000', postDate: '2026-01-31', debit: 10, credit: 0, description: 'a' },
      { accountCode: '2000', postDate: '2026-01-31', debit: 0, credit: 10, description: 'b' },
    ];
    it('is stable across calls and key order', () => {
      const reordered = rows.map((r) => ({
        description: r.description,
        credit: r.credit,
        debit: r.debit,
        postDate: r.postDate,
        accountCode: r.accountCode,
      }));
      expect(hashRowContent(rows)).toBe(hashRowContent(reordered));
    });
    it('ignores fields that do not define a GL line (id, accountName)', () => {
      const withIds = rows.map((r, i) => ({ ...r, id: `x-${i}`, accountName: 'whatever' }));
      expect(hashRowContent(withIds)).toBe(hashRowContent(rows));
    });
    it('changes when an amount changes', () => {
      const changed = [rows[0]!, { ...rows[1]!, credit: 11 }];
      expect(hashRowContent(changed)).not.toBe(hashRowContent(rows));
    });
    it('changes when row order changes (order is part of the file identity)', () => {
      expect(hashRowContent([rows[1]!, rows[0]!])).not.toBe(hashRowContent(rows));
    });
  });

  describe('makeBatchId', () => {
    it('is deterministic for the same hash and instant', () => {
      expect(makeBatchId('abc', '2026-10-15T10:00:00.000Z')).toBe(
        makeBatchId('abc', '2026-10-15T10:00:00.000Z')
      );
    });
    it('differs by instant and by content', () => {
      const a = makeBatchId('abc', '2026-10-15T10:00:00.000Z');
      expect(makeBatchId('abc', '2026-10-15T10:00:01.000Z')).not.toBe(a);
      expect(makeBatchId('abd', '2026-10-15T10:00:00.000Z')).not.toBe(a);
    });
    it('has a fixed shape', () => {
      expect(makeBatchId('abc', '2026-10-15T10:00:00.000Z')).toMatch(/^batch-[0-9a-f]{20}$/);
    });
  });

  describe('stampProvenance', () => {
    const batch = { batchId: 'batch-1', fileHash: 'h', sourceFile: 'gl.csv' };
    it('attaches batch, hash, file and the aligned source row to every entry', () => {
      const out = stampProvenance([{ accountCode: '1' }, { accountCode: '2' }], batch, [2, 7]);
      expect(out.map((e) => e.provenance)).toEqual([
        { batchId: 'batch-1', fileHash: 'h', sourceFile: 'gl.csv', sourceRow: 2 },
        { batchId: 'batch-1', fileHash: 'h', sourceFile: 'gl.csv', sourceRow: 7 },
      ]);
      expect(out[0]!.accountCode).toBe('1');
    });
    it('refuses misaligned source rows rather than guessing', () => {
      expect(() => stampProvenance([{ accountCode: '1' }], batch, [2, 3])).toThrow(/length/);
    });
    it('defaultSourceRows starts at row 2 (header is row 1)', () => {
      expect(defaultSourceRows(3)).toEqual([2, 3, 4]);
      expect(defaultSourceRows(0)).toEqual([]);
    });
  });

  describe('computeControlTotals', () => {
    it('sums in integer cents and reports decimal strings', () => {
      const totals = computeControlTotals([
        { debit: 0.1, credit: 0 },
        { debit: 0.2, credit: 0 },
        { debit: 0, credit: 0.3 },
      ]);
      // 0.1 + 0.2 is 0.30000000000000004 in floats; cents make it exact.
      expect(totals).toEqual({ rows: 3, debit: '0.30', credit: '0.30', net: '0.00' });
    });
    it('reports a non-zero net for an unbalanced batch', () => {
      expect(computeControlTotals([{ debit: 100, credit: 40 }])).toEqual({
        rows: 1,
        debit: '100.00',
        credit: '40.00',
        net: '60.00',
      });
    });
    it('is zero for an empty batch', () => {
      expect(computeControlTotals([])).toEqual({
        rows: 0,
        debit: '0.00',
        credit: '0.00',
        net: '0.00',
      });
    });
  });

  describe('findPriorImport', () => {
    const history = [
      { id: 'a', fileHash: 'h1', status: 'success', batchId: 'batch-a' },
      { id: 'b', fileHash: 'h2', status: 'error', batchId: 'batch-b' },
      { id: 'c', status: 'success' }, // legacy row without hash
    ];
    it('finds a successful import of the same content', () => {
      expect(findPriorImport(history, 'h1')?.batchId).toBe('batch-a');
    });
    it('ignores failed imports (they committed nothing)', () => {
      expect(findPriorImport(history, 'h2')).toBeUndefined();
    });
    it('never matches legacy rows without a hash', () => {
      expect(findPriorImport(history, undefined as unknown as string)).toBeUndefined();
    });
  });

  describe('computeImportScope', () => {
    const at = '2026-10-15T09:30:00.000Z';
    it('reports sorted periods, the date range and the import instant', () => {
      const scope = computeImportScope(
        [
          { date: '2026-09-30', postDate: '2026-09-30', period: '2026-09' },
          { date: '2026-08-02', postDate: '2026-08-02', period: '2026-08' },
          { date: '2026-09-01', postDate: '2026-09-01', period: '2026-09' },
        ],
        at
      );
      expect(scope.periods).toEqual(['2026-08', '2026-09']);
      expect(scope.dateRange).toEqual({ from: '2026-08-02', to: '2026-09-30' });
      expect(scope.importedAt).toBe(at);
    });
    it("says 'unavailable' for entity and currency when no row carries them — never a default", () => {
      const scope = computeImportScope(
        [{ date: '2026-09-30', postDate: '2026-09-30', period: '2026-09' }],
        at
      );
      expect(scope.entities).toBe('unavailable');
      expect(scope.currencies).toBe('unavailable');
    });
    it('lists distinct entities and currencies when present', () => {
      const scope = computeImportScope(
        [
          {
            date: '2026-09-30',
            postDate: '2026-09-30',
            period: '2026-09',
            entityId: 'E2',
            currency: 'USD',
          },
          {
            date: '2026-09-30',
            postDate: '2026-09-30',
            period: '2026-09',
            entityId: 'E1',
            currency: 'USD',
          },
          { date: '2026-09-30', postDate: '2026-09-30', period: '2026-09', entityId: 'E1' },
        ],
        at
      );
      expect(scope.entities).toEqual(['E1', 'E2']);
      expect(scope.currencies).toEqual(['USD']);
    });
    it('is empty-safe', () => {
      expect(computeImportScope([], at)).toEqual({
        periods: [],
        dateRange: null,
        entities: 'unavailable',
        currencies: 'unavailable',
        importedAt: at,
      });
    });
  });
});
