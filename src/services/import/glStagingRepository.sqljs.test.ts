import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { Database } from 'sql.js';
import { createGLStagingRepository, type StagingStoragePort } from './glStagingRepository';
import {
  stageGLImport,
  discoverStagingSessions,
  readStagingQuarantinePage,
  discardStagingBatch,
} from './glStagingCoordinator';
import {
  promoteStagingBatch,
  readPromotedLedgerBatch,
  readPromotedLedgerEntries,
} from './glStagingPromotion';
import { SmartImportMapper } from '@/engines/SmartImportMapper';

// Substitute only the SQL transport. Production masterStorage encryption,
// serialization and chunk envelopes still run against the real WASM database.
const boundary = vi.hoisted(() => ({
  port: null as (StagingStoragePort & { removeItem(key: string): Promise<void> }) | null,
}));
vi.mock('@/utils/sqlJsStorage', () => ({
  sqlJsStorage: {
    getItem: async (key: string) => boundary.port!.getItem(key),
    setItem: async (key: string, value: unknown) => boundary.port!.setItem(key, value),
    removeItem: async (key: string) => boundary.port!.removeItem(key),
  },
}));

/** Real SQLite/WASM persistence oracle; injected SQL port, not native/Tauri certification. */
function portFor(db: Database): StagingStoragePort & { removeItem(key: string): Promise<void> } {
  db.run('CREATE TABLE IF NOT EXISTS stores (id TEXT PRIMARY KEY, value TEXT)');
  return {
    removeItem: async (id) => {
      db.run('DELETE FROM stores WHERE id = ?', [id]);
    },
    getItem: async (id) => {
      const result = db.exec('SELECT value FROM stores WHERE id = ?', [id]);
      const text = result[0]?.values[0]?.[0];
      return typeof text === 'string' ? JSON.parse(text) : null;
    },
    setItem: async (id, value) => {
      db.run('INSERT OR REPLACE INTO stores (id, value) VALUES (?, ?)', [
        id,
        typeof value === 'string' ? value : JSON.stringify(value),
      ]);
    },
  };
}
describe('staging repository with real SQL.js/WASM', () => {
  it('survives exporting/reopening the SQLite image with exact amounts and unchanged raw quarantine', async () => {
    // Bypass only the global test setup's sql.js mock, never the financial engine.
    const actual = await vi.importActual<typeof import('sql.js')>('sql.js');
    const SQL = await actual.default({
      wasmBinary: readFileSync(resolve('node_modules/sql.js/dist/sql-wasm.wasm')),
    });
    const db = new SQL.Database();
    let reopened: Database | undefined;
    try {
      boundary.port = portFor(db);
      const repository = createGLStagingRepository();
      const config = {
        headers: ['Account', 'Date', 'Debit', 'Credit', 'Entity', 'Currency'],
        sourceId: 'ERP',
        dateOrder: 'MDY' as const,
        knownAccountCodes: ['1000', '4000'],
        knownEntityIds: ['P'],
        expectedCurrency: 'USD',
      };
      const debit = {
        Account: '1000',
        Date: '2026-09-30',
        Debit: '9007199254740993.01',
        Credit: '',
        Entity: 'P',
        Currency: 'USD',
      };
      const credit = { ...debit, Account: '4000', Debit: '', Credit: '9007199254740993.01' };
      const invalid = { ...debit, Debit: '$d:123.00', Date: 'bad' };
      async function* chunks() {
        yield [debit];
        yield [credit, invalid];
      }
      const manifest = await stageGLImport(
        { batchId: 'sqlite-oracle', fileHash: 'f'.repeat(64), config, chunks: chunks() },
        { repository, compute: async (input) => SmartImportMapper.ingest(input) }
      );
      expect(manifest.status).toBe('blocked');
      const atRest = JSON.stringify(db.exec('SELECT value FROM stores'));
      expect(atRest).not.toContain('9007199254740993.01');
      expect(atRest).not.toContain('$d:123.00');
      reopened = new SQL.Database(db.export());
      boundary.port = portFor(reopened);
      const restored = createGLStagingRepository();
      expect(await restored.readManifest('sqlite-oracle')).toEqual(manifest);
      const secondChunk = await restored.readChunk('sqlite-oracle', 1);
      expect(secondChunk?.acceptedRows[0]?.credit).toBe('9007199254740993.01');
      expect(secondChunk?.quarantinedRows[0]?.raw).toEqual(invalid);
      expect(secondChunk?.quarantinedRows[0]?.sourceRow).toBe(4);
      const discovered = await discoverStagingSessions({ repository: restored });
      expect(discovered.map((s) => ({ batchId: s.batchId, state: s.sessionState }))).toEqual([
        { batchId: 'sqlite-oracle', state: 'blocked' },
      ]);
      const quarantinePage = await readStagingQuarantinePage(
        'sqlite-oracle',
        { offset: 0, limit: 10 },
        { repository: restored }
      );
      expect(quarantinePage.rows[0]?.raw).toEqual(invalid);
      await discardStagingBatch('sqlite-oracle', { repository: restored });
      expect(await discoverStagingSessions({ repository: restored })).toEqual([]);
      expect(await restored.readManifest('sqlite-oracle')).toBeNull();

      // Now stage a balanced ready batch, promote it, and verify SQLite binary export/reopen
      async function* balancedChunks() {
        yield [debit, credit];
      }
      const readyManifest = await stageGLImport(
        { batchId: 'sqlite-promoted', fileHash: 'e'.repeat(64), config, chunks: balancedChunks() },
        { repository: restored, compute: async (input) => SmartImportMapper.ingest(input) }
      );
      expect(readyManifest.status).toBe('ready');
      await promoteStagingBatch('sqlite-promoted', {
        repository: restored,
        periodAuthority: { entries: {}, checklists: {} },
        periodHydrated: true,
        promotedAt: '2026-10-16T10:00:00.000Z',
      });

      const reopenedAfterPromote = new SQL.Database(reopened.export());
      try {
        boundary.port = portFor(reopenedAfterPromote);
        const promotedBatch = await readPromotedLedgerBatch('sqlite-promoted');
        expect(promotedBatch?.controlTotals).toEqual({
          debit: '9007199254740993.01',
          credit: '9007199254740993.01',
          imbalance: '0.00',
        });
        const promotedEntries = await readPromotedLedgerEntries('sqlite-promoted');
        expect(promotedEntries).toHaveLength(2);
        expect(promotedEntries[0]?.debit).toBe('9007199254740993.01');
        expect(promotedEntries[1]?.credit).toBe('9007199254740993.01');
      } finally {
        reopenedAfterPromote.close();
      }
    } finally {
      reopened?.close();
      db.close();
    }
  });
});
