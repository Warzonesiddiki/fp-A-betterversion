/**
 * SPINE ACCEPTANCE — VISION §1: "The spine must work end-to-end on a synthetic
 * D365-shaped file before the product can be called a one-stop solution."
 *
 * WHY THIS EXISTS
 * ---------------
 * The repo already proves the spine on a GENERIC CSV shape
 * (`monthEndClosePipeline.integration.test.ts`: AccountCode/PostDate/Debit/
 * Credit/EntityId/Currency/JournalId). VISION requires a **D365-shaped** file,
 * and `d365Parser.ts` was standalone — never wired into the staging pipeline.
 *
 * MEASURED 2026-10-21, before the fix in this commit: feeding the documented
 * "General ledger statement by main account" headers to `ingestGLRows` mapped
 * only debit/credit/description and rejected the file with
 *
 *     Missing required column: accountCode
 *     Missing required column: postDate
 *     Missing required column: entityId
 *     Missing required column: currency
 *
 * So the spine did NOT accept a real D365 export. Two documented realities had
 * to be modelled rather than assumed away:
 *   1. header names differ ("Transaction posting date", "Main account",
 *      "Transaction number", "Transaction currency") — exact aliases added;
 *   2. the entity is EXPORT CONTEXT, not a column (the statement is produced per
 *      legal entity) — `defaultEntityId` added, never inferred.
 *
 * This test is the acceptance gate for DEC-042's supported scope. It asserts the
 * full path: D365-shaped CSV → stage → quarantine reasons → period write guard →
 * promote → promoted ledger → control-total tie-out → round-trip stability.
 *
 * BOUNDARY (O1/DEC-043): the fixture is SYNTHETIC and the shape stays
 * "mapping-driven, unverified". Passing proves the pipeline accepts this column
 * set; it does NOT certify any D365 export format, version or configuration.
 */
import { describe, expect, it } from 'vitest';
import { createGLStagingRepository, type StagingStoragePort } from './glStagingRepository';
import { readStagingQuarantinePage } from './glStagingCoordinator';
import { stageGLCsvImport } from './glCsvTokenizer';
import {
  listPromotedLedgerBatches,
  promoteStagingBatch,
  readPromotedLedgerEntries,
} from './glStagingPromotion';
import type { GLPeriodAuthority } from './glPeriodWriteGuard';
import type { PeriodCloseEntry } from '@/engines/PeriodCloseStateMachine';
import { ingestGLRows } from '@/engines/SmartImportMapper';

function createInMemoryStoragePort(): StagingStoragePort {
  const store = new Map<string, string>();
  return {
    getItem: async (k) => store.get(k) ?? null,
    setItem: async (k, v) => {
      store.set(k, v);
    },
    removeItem: async (k) => {
      store.delete(k);
    },
  };
}

/** The documented D365 "General ledger statement by main account" header order. */
const D365_HEADERS = [
  'Transaction posting date',
  'Transaction number',
  'Main account',
  'Main account name',
  'Counterparty number',
  'Counterparty name',
  'Ledger account',
  'Description',
  'Transaction currency',
  'Debit in transaction currency',
  'Credit in transaction currency',
  'Debit',
  'Credit',
] as const;

/**
 * Build a D365-shaped CSV. `Debit`/`Credit` (accounting currency) are the pair
 * we map; the transaction-currency pair is carried but unused, exactly as in a
 * real export. There is deliberately NO entity column.
 */
function d365Csv(
  rows: readonly (readonly [string, string, string, string, string, string, string])[]
): string {
  const lines = [D365_HEADERS.join(',')];
  for (const [date, voucher, mainAccount, accountName, description, debit, credit] of rows) {
    lines.push(
      [
        date,
        voucher,
        mainAccount,
        accountName,
        '',
        '',
        mainAccount,
        description,
        'USD',
        debit,
        credit,
        debit,
        credit,
      ].join(',')
    );
  }
  return lines.join('\n');
}

const OPEN_MARCH: GLPeriodAuthority = {
  entries: {
    '2026-03': { periodId: '2026-03', entityId: 'US01', state: 'open' } as PeriodCloseEntry,
  },
  checklists: {
    '2026-03': {
      fiscalScope: { startDate: '2026-03-01', endDate: '2026-03-31', isAdjustingPeriod: false },
    },
  },
};

const CLOSED_MARCH: GLPeriodAuthority = {
  entries: {
    '2026-03': { periodId: '2026-03', entityId: 'US01', state: 'hard_close' } as PeriodCloseEntry,
  },
  checklists: {
    '2026-03': {
      fiscalScope: { startDate: '2026-03-01', endDate: '2026-03-31', isAdjustingPeriod: false },
    },
  },
};

/** D365 export context: the legal entity and currency are not columns. */
const D365_CONFIG = {
  sourceId: 'd365-fo-us01',
  knownAccountCodes: ['1000', '1290', '3000', '4000', '4900', '5000'],
  knownEntityIds: ['US01'],
  expectedCurrency: 'USD',
  defaultEntityId: 'US01',
  defaultCurrency: 'USD',
  dateOrder: 'ISO_ONLY' as const,
};

/** Balanced: debits 100000.17 + 11000.00 + 24250.00 = 135250.17; credits match. */
const CLEAN_ROWS = [
  ['2026-03-31', 'US-J1', '1000', 'Cash & Equivalents', 'Opening cash', '100000.17', '0.00'],
  ['2026-03-31', 'US-J1', '1290', 'IC Receivable - DE01', 'IC receivable', '11000.00', '0.00'],
  ['2026-03-31', 'US-J1', '5000', 'Operating Expense', 'March opex', '24250.00', '0.00'],
  ['2026-03-31', 'US-J1', '3000', 'Common Stock', 'Share capital', '0.00', '80000.17'],
  ['2026-03-31', 'US-J1', '4000', 'Product Revenue', 'March revenue', '0.00', '50000.00'],
  ['2026-03-31', 'US-J1', '4900', 'IC Fee Revenue', 'IC fee income', '0.00', '5250.00'],
] as const;

describe('spine acceptance — synthetic D365-shaped export', () => {
  it('accepts the documented D365 column set (regression: it was rejected before 2026-10-21)', async () => {
    const repository = createGLStagingRepository(createInMemoryStoragePort());
    const manifest = await stageGLCsvImport(
      {
        batchId: 'batch-d365-clean',
        config: D365_CONFIG,
        source: d365Csv(CLEAN_ROWS),
        delimiter: ',',
      },
      { repository, compute: async (chunk) => ingestGLRows(chunk) }
    );

    // The whole point of the fix: this used to be 'blocked' on four schema errors.
    expect(manifest.status).toBe('ready');
    expect(manifest.rowCount).toBe(6);
    expect(manifest.acceptedCount).toBe(6);
    expect(manifest.quarantinedCount).toBe(0);
    expect(manifest.schemaErrors).toEqual([]);
    expect(manifest.unbalancedVouchers).toHaveLength(0);
  });

  it('quarantines D365 rows with reasons and never promotes a blocked batch', async () => {
    const storage = createInMemoryStoragePort();
    const repository = createGLStagingRepository(storage);

    const messy = d365Csv([
      // invalid amount (quoted so the comma belongs to the cell, not the record)
      ['2026-03-31', 'US-BAD', '1000', 'Cash', 'bad amount', '"1,2,3"', '0.00'],
      // impossible calendar date
      ['2026-13-45', 'US-BAD', '3000', 'Stock', 'bad date', '0.00', '100.00'],
      // account outside the supplied chart
      ['2026-03-31', 'US-BAD', '9999', 'Unknown', 'unknown account', '10.00', '0.00'],
    ]);

    const manifest = await stageGLCsvImport(
      { batchId: 'batch-d365-messy', config: D365_CONFIG, source: messy, delimiter: ',' },
      { repository, compute: async (chunk) => ingestGLRows(chunk) }
    );

    expect(manifest.status).toBe('blocked');

    const page = await readStagingQuarantinePage(
      'batch-d365-messy',
      { offset: 0, limit: 20 },
      { repository }
    );
    expect(page.totalQuarantined).toBe(3);
    const byRow = new Map(page.rows.map((r) => [r.sourceRow, r.reasons.map((x) => x.code)]));
    expect(byRow.get(2)).toContain('INVALID_AMOUNT');
    expect(byRow.get(3)).toContain('INVALID_DATE');
    expect(byRow.get(4)).toContain('UNKNOWN_ACCOUNT');

    // Every rejection names a source row and a reason — nothing silently dropped.
    expect(page.rows.every((r) => r.reasons.length > 0)).toBe(true);

    await expect(
      promoteStagingBatch('batch-d365-messy', {
        storage,
        repository,
        periodAuthority: OPEN_MARCH,
        periodHydrated: true,
      })
    ).rejects.toThrow(/status is "blocked", expected "ready"/i);
    expect(await listPromotedLedgerBatches({ storage })).toHaveLength(0);
  });

  it('enforces the period-close write guard on a D365 batch', async () => {
    const storage = createInMemoryStoragePort();
    const repository = createGLStagingRepository(storage);
    await stageGLCsvImport(
      {
        batchId: 'batch-d365-guard',
        config: D365_CONFIG,
        source: d365Csv(CLEAN_ROWS),
        delimiter: ',',
      },
      { repository, compute: async (chunk) => ingestGLRows(chunk) }
    );

    await expect(
      promoteStagingBatch('batch-d365-guard', {
        storage,
        repository,
        periodAuthority: CLOSED_MARCH,
        periodHydrated: true,
      })
    ).rejects.toThrow(/hard_close|closed/i);
    expect(await listPromotedLedgerBatches({ storage })).toHaveLength(0);
  });

  it('promotes to the ledger and ties out to exact control totals', async () => {
    const storage = createInMemoryStoragePort();
    const repository = createGLStagingRepository(storage);

    const manifest = await stageGLCsvImport(
      {
        batchId: 'batch-d365-promote',
        config: D365_CONFIG,
        source: d365Csv(CLEAN_ROWS),
        delimiter: ',',
      },
      { repository, compute: async (chunk) => ingestGLRows(chunk) }
    );

    await promoteStagingBatch('batch-d365-promote', {
      storage,
      repository,
      periodAuthority: OPEN_MARCH,
      periodHydrated: true,
    });

    const entries = await readPromotedLedgerEntries('batch-d365-promote', { storage });
    expect(entries).toHaveLength(6);

    // Entity came from export context, not from a column.
    expect(entries.every((e) => e.entityId === 'US01')).toBe(true);
    expect(entries.every((e) => e.currency === 'USD')).toBe(true);

    // Provenance: every entry can be traced back to a physical source line.
    expect(entries.every((e) => e.provenance?.sourceRow !== undefined)).toBe(true);

    const totalDebit = entries.reduce((sum, e) => sum + Number(e.debit), 0);
    const totalCredit = entries.reduce((sum, e) => sum + Number(e.credit), 0);
    expect(totalDebit.toFixed(2)).toBe('135250.17');
    expect(totalCredit.toFixed(2)).toBe('135250.17');
    expect(totalDebit.toFixed(2)).toBe(totalCredit.toFixed(2));

    // Control totals agree with the manifest, which agrees with the ledger.
    expect(manifest.controlTotals.debit).toBe('135250.17');
    expect(manifest.controlTotals.credit).toBe('135250.17');
    expect(manifest.controlTotals.imbalance).toBe('0.00');
    expect(manifest.status).toBe('ready');
  });

  it('is deterministic: the same bytes produce the same batch twice', async () => {
    const csv = d365Csv(CLEAN_ROWS);

    const run = async () => {
      const storage = createInMemoryStoragePort();
      const repository = createGLStagingRepository(storage);
      const manifest = await stageGLCsvImport(
        { batchId: 'batch-d365-determinism', config: D365_CONFIG, source: csv, delimiter: ',' },
        { repository, compute: async (chunk) => ingestGLRows(chunk) }
      );
      await promoteStagingBatch('batch-d365-determinism', {
        storage,
        repository,
        periodAuthority: OPEN_MARCH,
        periodHydrated: true,
      });
      const entries = await readPromotedLedgerEntries('batch-d365-determinism', { storage });
      return { fileHash: manifest.fileHash, entries };
    };

    const first = await run();
    const second = await run();
    expect(second.fileHash).toBe(first.fileHash);
    // Row-for-row stability of the financial substance (identity fields such as
    // generated timestamps are excluded by comparing the projection below).
    const project = (xs: readonly Record<string, unknown>[]) =>
      xs.map((e) => ({
        accountCode: e.accountCode,
        entityId: e.entityId,
        currency: e.currency,
        postDate: e.postDate,
        debit: e.debit,
        credit: e.credit,
        sourceRow: (e.provenance as { sourceRow?: number } | undefined)?.sourceRow,
      }));
    expect(project(second.entries as readonly Record<string, unknown>[])).toEqual(
      project(first.entries as readonly Record<string, unknown>[])
    );
  });
});
