import { describe, expect, it } from 'vitest';
import { createGLStagingRepository, type StagingStoragePort } from './glStagingRepository';
import {
  discardStagingBatch,
  stageGLImport,
  type GLStagingChunkSlice,
} from './glStagingCoordinator';
import {
  promoteStagingBatch,
  readPromotedLedgerBatch,
  readPromotedLedgerEntries,
  listPromotedLedgerBatches,
} from './glStagingPromotion';
import { ingestGLRows } from '@/engines/SmartImportMapper';
import { ConsolidationEngine } from '@/engines/ConsolidationEngine';
import type { GLIngestChunkInput } from '@/types/glIngestion';
import type { GLPeriodAuthority } from './glPeriodWriteGuard';
import type { PeriodCloseEntry } from '@/engines/PeriodCloseStateMachine';

function memoryPort(failOnSetKey?: (key: string) => boolean): StagingStoragePort {
  const map = new Map<string, string>();
  return {
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => {
      if (failOnSetKey?.(key)) {
        throw new Error(`Simulated write failure on ${key}`);
      }
      map.set(key, value);
    },
    removeItem: async (key) => {
      map.delete(key);
    },
  };
}

const baseConfig: Omit<GLIngestChunkInput, 'rows' | 'firstRowNumber' | 'rowNumbers'> = {
  headers: [
    'AccountCode',
    'AccountName',
    'PostDate',
    'Debit',
    'Credit',
    'EntityId',
    'Currency',
    'JournalId',
    'Description',
    'Reference',
  ],
  sourceId: 'd365-promote-spec',
  knownAccountCodes: ['1000', '2000'],
  knownEntityIds: ['US01'],
  expectedCurrency: 'USD',
  dateOrder: 'ISO_ONLY',
};

function makeBalancedRows(amount = '9007199254740993.15'): Readonly<Record<string, string>>[] {
  return [
    {
      AccountCode: '1000',
      AccountName: 'Cash',
      PostDate: '2026-03-31',
      Debit: amount,
      Credit: '0.00',
      EntityId: 'US01',
      Currency: 'USD',
      JournalId: 'J-900',
      Description: 'Exact debit line',
      Reference: 'REF-1',
    },
    {
      AccountCode: '2000',
      AccountName: 'Payables',
      PostDate: '2026-03-31',
      Debit: '0.00',
      Credit: amount,
      EntityId: 'US01',
      Currency: 'USD',
      JournalId: 'J-900',
      Description: 'Exact credit line',
      Reference: 'REF-2',
    },
  ];
}

async function* sliceChunks(
  ...items: GLStagingChunkSlice[]
): AsyncGenerator<GLStagingChunkSlice, void, undefined> {
  for (const item of items) {
    yield item;
  }
}

const openPeriodAuthority: GLPeriodAuthority = {
  entries: {
    '2026-03': {
      periodId: '2026-03',
      entityId: 'US01',
      state: 'open',
    } as PeriodCloseEntry,
  },
  checklists: {
    '2026-03': {
      fiscalScope: {
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        isAdjustingPeriod: false,
      },
    },
  },
};

const closedPeriodAuthority: GLPeriodAuthority = {
  entries: {
    '2026-03': {
      periodId: '2026-03',
      entityId: 'US01',
      state: 'hard_close',
    } as PeriodCloseEntry,
  },
  checklists: {
    '2026-03': {
      fiscalScope: {
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        isAdjustingPeriod: false,
      },
    },
  },
};

describe('promoteStagingBatch — transactional exact-string ledger promotion', () => {
  it('promotes a ready batch with exact decimal strings, provenance, and marks the staging manifest promoted', async () => {
    const port = memoryPort();
    const repository = createGLStagingRepository(port);
    const fileHash = 'a'.repeat(64);

    await stageGLImport(
      {
        batchId: 'batch-promote-1',
        fileHash,
        config: baseConfig,
        chunks: sliceChunks({ rows: makeBalancedRows(), rowNumbers: [2, 5] }),
      },
      {
        repository,
        compute: async (chunk) => ingestGLRows(chunk),
      }
    );

    const promoted = await promoteStagingBatch('batch-promote-1', {
      storage: port,
      repository,
      periodAuthority: openPeriodAuthority,
      periodHydrated: true,
      promotedAt: '2026-10-16T09:30:00.000Z',
    });

    expect(promoted.batchId).toBe('batch-promote-1');
    expect(promoted.fileHash).toBe(fileHash);
    expect(promoted.entryCount).toBe(2);
    expect(promoted.controlTotals).toEqual({
      debit: '9007199254740993.15',
      credit: '9007199254740993.15',
      imbalance: '0.00',
    });

    const updatedStageManifest = await repository.readManifest('batch-promote-1');
    expect(updatedStageManifest?.status).toBe('promoted');
    expect(updatedStageManifest?.promotedAt).toBe('2026-10-16T09:30:00.000Z');

    const batches = await listPromotedLedgerBatches({ storage: port });
    expect(batches).toHaveLength(1);
    expect(batches[0]!.batchId).toBe('batch-promote-1');

    const entries = await readPromotedLedgerEntries('batch-promote-1', { storage: port });
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      entryId: 'batch-promote-1:0:0:2',
      accountCode: '1000',
      postDate: '2026-03-31',
      period: '2026-03',
      debit: '9007199254740993.15',
      credit: '0.00',
      entityId: 'US01',
      currency: 'USD',
      journalId: 'J-900',
      provenance: {
        batchId: 'batch-promote-1',
        fileHash,
        sourceId: 'd365-promote-spec',
        sourceRow: 2,
        promotedAt: '2026-10-16T09:30:00.000Z',
      },
    });
    expect(entries[1]?.provenance.sourceRow).toBe(5);

    // Promoted staging batches must not be discarded
    await expect(discardStagingBatch('batch-promote-1', { repository })).rejects.toThrow(
      /already promoted/i
    );
  });

  it('rejects duplicate batchId or duplicate fileHash promotion without duplicating ledger entries', async () => {
    const port = memoryPort();
    const repository = createGLStagingRepository(port);
    const sameHash = 'b'.repeat(64);

    await stageGLImport(
      {
        batchId: 'batch-dup-1',
        fileHash: sameHash,
        config: baseConfig,
        chunks: sliceChunks({ rows: makeBalancedRows('100.00') }),
      },
      {
        repository,
        compute: async (chunk) => ingestGLRows(chunk),
      }
    );
    await stageGLImport(
      {
        batchId: 'batch-dup-2',
        fileHash: sameHash,
        config: baseConfig,
        chunks: sliceChunks({ rows: makeBalancedRows('100.00') }),
      },
      {
        repository,
        compute: async (chunk) => ingestGLRows(chunk),
      }
    );

    await promoteStagingBatch('batch-dup-1', {
      storage: port,
      repository,
      periodAuthority: openPeriodAuthority,
      periodHydrated: true,
    });

    await expect(
      promoteStagingBatch('batch-dup-1', {
        storage: port,
        repository,
        periodAuthority: openPeriodAuthority,
        periodHydrated: true,
      })
    ).rejects.toThrow(/already promoted/i);

    await expect(
      promoteStagingBatch('batch-dup-2', {
        storage: port,
        repository,
        periodAuthority: openPeriodAuthority,
        periodHydrated: true,
      })
    ).rejects.toThrow(/fileHash.*already promoted/i);

    const batches = await listPromotedLedgerBatches({ storage: port });
    expect(batches).toHaveLength(1);
  });

  it('enforces closed-period write guards (DEC-008) at promotion time', async () => {
    const port = memoryPort();
    const repository = createGLStagingRepository(port);

    await stageGLImport(
      {
        batchId: 'batch-closed-period',
        fileHash: 'c'.repeat(64),
        config: baseConfig,
        chunks: sliceChunks({ rows: makeBalancedRows('50.00') }),
      },
      {
        repository,
        compute: async (chunk) => ingestGLRows(chunk),
      }
    );

    await expect(
      promoteStagingBatch('batch-closed-period', {
        storage: port,
        repository,
        periodAuthority: closedPeriodAuthority,
        periodHydrated: true,
      })
    ).rejects.toThrow(/Fiscal period 2026-03 is hard_close/i);

    const stageManifest = await repository.readManifest('batch-closed-period');
    expect(stageManifest?.status).toBe('ready');
    expect(await listPromotedLedgerBatches({ storage: port })).toHaveLength(0);
  });

  it('rejects tampered staged chunks and rolls back partial writes on storage failure', async () => {
    let failLedgerManifest = false;
    const port = memoryPort(
      (key) =>
        failLedgerManifest &&
        key.endsWith(':batch-rollback:manifest') &&
        key.startsWith('gl-ledger-exact:')
    );
    const repository = createGLStagingRepository(port);

    await stageGLImport(
      {
        batchId: 'batch-rollback',
        fileHash: 'd'.repeat(64),
        config: baseConfig,
        chunks: sliceChunks({ rows: makeBalancedRows('75.25') }),
      },
      {
        repository,
        compute: async (chunk) => ingestGLRows(chunk),
      }
    );

    failLedgerManifest = true;
    await expect(
      promoteStagingBatch('batch-rollback', {
        storage: port,
        repository,
        periodAuthority: openPeriodAuthority,
        periodHydrated: true,
      })
    ).rejects.toThrow(/Simulated write failure/);

    // Staging batch remains ready and promoted ledger index has 0 batches
    expect((await repository.readManifest('batch-rollback'))?.status).toBe('ready');
    expect(await listPromotedLedgerBatches({ storage: port })).toHaveLength(0);
    expect(await readPromotedLedgerBatch('batch-rollback', { storage: port })).toBeNull();

    // Retry succeeds once storage recovers
    failLedgerManifest = false;
    const promoted = await promoteStagingBatch('batch-rollback', {
      storage: port,
      repository,
      periodAuthority: openPeriodAuthority,
      periodHydrated: true,
    });
    expect(promoted.entryCount).toBe(2);
    expect((await repository.readManifest('batch-rollback'))?.status).toBe('promoted');

    // Verify tampered chunk is rejected
    await stageGLImport(
      {
        batchId: 'batch-tampered',
        fileHash: 'f'.repeat(64),
        config: baseConfig,
        chunks: sliceChunks({ rows: makeBalancedRows('50.00') }),
      },
      {
        repository,
        compute: async (chunk) => ingestGLRows(chunk),
      }
    );
    const originalChunk = await repository.readChunk('batch-tampered', 0);
    await repository.writeChunk('batch-tampered', 0, {
      ...originalChunk!,
      acceptedRows: [
        {
          ...originalChunk!.acceptedRows[0]!,
          debit: '50.01',
        },
        originalChunk!.acceptedRows[1]!,
      ],
    });
    await expect(
      promoteStagingBatch('batch-tampered', {
        storage: port,
        repository,
        periodAuthority: openPeriodAuthority,
        periodHydrated: true,
      })
    ).rejects.toThrow(/recomputed totals do not match manifest/i);
  });

  it('bridges promoted exact-string USD and EUR ledger batches directly into ConsolidationEngine.consolidateExact', async () => {
    const port = memoryPort();
    const repository = createGLStagingRepository(port);

    await stageGLImport(
      {
        batchId: 'batch-us01',
        fileHash: '1'.repeat(64),
        config: {
          ...baseConfig,
          knownAccountCodes: ['1000', '1290', '3000', '4000'],
          knownEntityIds: ['US01'],
          expectedCurrency: 'USD',
        },
        chunks: sliceChunks({
          rows: [
            {
              AccountCode: '1000',
              AccountName: 'Cash',
              PostDate: '2026-03-31',
              Debit: '89000.00',
              Credit: '0.00',
              EntityId: 'US01',
              Currency: 'USD',
              JournalId: 'US-J1',
              Description: 'Cash',
              Reference: 'R1',
            },
            {
              AccountCode: '1290',
              AccountName: 'IC Receivable',
              PostDate: '2026-03-31',
              Debit: '11000.00',
              Credit: '0.00',
              EntityId: 'US01',
              Currency: 'USD',
              JournalId: 'US-J1',
              Description: 'IC Rec',
              Reference: 'R2',
            },
            {
              AccountCode: '3000',
              AccountName: 'Common Stock',
              PostDate: '2026-03-31',
              Debit: '0.00',
              Credit: '70000.00',
              EntityId: 'US01',
              Currency: 'USD',
              JournalId: 'US-J1',
              Description: 'Equity',
              Reference: 'R3',
            },
            {
              AccountCode: '4000',
              AccountName: 'Revenue',
              PostDate: '2026-03-31',
              Debit: '0.00',
              Credit: '30000.00',
              EntityId: 'US01',
              Currency: 'USD',
              JournalId: 'US-J1',
              Description: 'Rev',
              Reference: 'R4',
            },
          ],
        }),
      },
      {
        repository,
        compute: async (chunk) => ingestGLRows(chunk),
      }
    );

    await stageGLImport(
      {
        batchId: 'batch-de01',
        fileHash: '2'.repeat(64),
        config: {
          ...baseConfig,
          knownAccountCodes: ['1000', '2190', '3000', '4000'],
          knownEntityIds: ['DE01'],
          expectedCurrency: 'EUR',
        },
        chunks: sliceChunks({
          rows: [
            {
              AccountCode: '1000',
              AccountName: 'Cash',
              PostDate: '2026-03-31',
              Debit: '50000.00',
              Credit: '0.00',
              EntityId: 'DE01',
              Currency: 'EUR',
              JournalId: 'DE-J1',
              Description: 'Cash',
              Reference: 'R5',
            },
            {
              AccountCode: '2190',
              AccountName: 'IC Payable',
              PostDate: '2026-03-31',
              Debit: '0.00',
              Credit: '10000.00',
              EntityId: 'DE01',
              Currency: 'EUR',
              JournalId: 'DE-J1',
              Description: 'IC Pay',
              Reference: 'R6',
            },
            {
              AccountCode: '3000',
              AccountName: 'Subscribed Capital',
              PostDate: '2026-03-31',
              Debit: '0.00',
              Credit: '30000.00',
              EntityId: 'DE01',
              Currency: 'EUR',
              JournalId: 'DE-J1',
              Description: 'Equity',
              Reference: 'R7',
            },
            {
              AccountCode: '4000',
              AccountName: 'Revenue',
              PostDate: '2026-03-31',
              Debit: '0.00',
              Credit: '10000.00',
              EntityId: 'DE01',
              Currency: 'EUR',
              JournalId: 'DE-J1',
              Description: 'Rev',
              Reference: 'R8',
            },
          ],
        }),
      },
      {
        repository,
        compute: async (chunk) => ingestGLRows(chunk),
      }
    );

    await promoteStagingBatch('batch-us01', {
      storage: port,
      repository,
      periodAuthority: openPeriodAuthority,
      periodHydrated: true,
    });
    await promoteStagingBatch('batch-de01', {
      storage: port,
      repository,
      periodAuthority: openPeriodAuthority,
      periodHydrated: true,
    });

    const usEntries = await readPromotedLedgerEntries('batch-us01', { storage: port });
    const deEntries = await readPromotedLedgerEntries('batch-de01', { storage: port });

    const consolidated = ConsolidationEngine.consolidateExact({
      reportingCurrency: 'USD',
      fxRates: [
        {
          fromCurrency: 'EUR',
          toCurrency: 'USD',
          spotRate: '1.10',
          averageRate: '1.05',
          historicalRate: '1.00',
        },
      ],
      entities: [
        {
          entityId: 'US01',
          entityName: 'US Parent',
          functionalCurrency: 'USD',
          entries: usEntries,
        },
        {
          entityId: 'DE01',
          entityName: 'DE Sub',
          functionalCurrency: 'EUR',
          entries: deEntries,
        },
      ],
      icRules: [
        {
          fromEntityId: 'US01',
          fromAccountCode: '1290',
          toEntityId: 'DE01',
          toAccountCode: '2190',
        },
      ],
    });

    // DE01 CTA: Equity -30,000 * (1.10 - 1.00) = -3,000.00; NI -10,000 * (1.10 - 1.05) = -500.00; Total CTA = -3,500.00
    expect(consolidated.totalCTA).toBe('-3500.00');
    expect(consolidated.icReconciliation[0]!.status).toBe('matched');
    expect(consolidated.icReconciliation[0]!.eliminatedAmount).toBe('11000.00');
    expect(consolidated.totalAssets).toBe('144000.00');
    expect(consolidated.totalLiabilities).toBe('0.00');
    expect(consolidated.totalEquity).toBe('-103500.00');
    expect(consolidated.totalRevenueCredit).toBe('40500.00');
    expect(consolidated.accountingEquationImbalance).toBe('0.00');
    expect(consolidated.isBalanced).toBe(true);
  });
});
