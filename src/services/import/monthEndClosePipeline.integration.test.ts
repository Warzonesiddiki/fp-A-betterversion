import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { createGLStagingRepository, type StagingStoragePort } from './glStagingRepository';
import { readStagingQuarantinePage } from './glStagingCoordinator';
import { stageGLCsvImport } from './glCsvTokenizer';
import { stageGLXlsxImport } from './glXlsxTokenizer';
import {
  listPromotedLedgerBatches,
  promoteStagingBatch,
  readPromotedLedgerEntries,
} from './glStagingPromotion';
import type { GLPeriodAuthority } from './glPeriodWriteGuard';
import type { PeriodCloseEntry } from '@/engines/PeriodCloseStateMachine';
import { ingestGLRows } from '@/engines/SmartImportMapper';
import { ConsolidationEngine } from '@/engines/ConsolidationEngine';
import {
  buildEditableBoardPackPptxBytes,
  buildFormulaPreservingWorkbookBytes,
  inspectFormulaWorkbookBytes,
  parseEditablePptxBytes,
  verifyFinancialPackageTieOut,
} from '@/services/export/financialPackageExport';

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

async function makeEurXlsxBytes(): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('DE01_GL');
  ws.addRow([
    'AccountCode',
    'AccountName',
    'PostDate',
    'Debit',
    'Credit',
    'EntityId',
    'Currency',
    'JournalId',
  ]);
  const rows = [
    ['1000', 'Cash & Equivalents', '2026-03-31', '60000.00', '0.00', 'DE01', 'EUR', 'DE-J1'],
    ['2190', 'IC Payable - US01', '2026-03-31', '0.00', '10000.00', 'DE01', 'EUR', 'DE-J1'],
    ['3000', 'Subscribed Capital', '2026-03-31', '0.00', '40000.00', 'DE01', 'EUR', 'DE-J1'],
    ['4000', 'Product Revenue', '2026-03-31', '0.00', '25000.00', 'DE01', 'EUR', 'DE-J1'],
    ['5000', 'Operating Expense', '2026-03-31', '10000.00', '0.00', 'DE01', 'EUR', 'DE-J1'],
    ['5900', 'IC Management Fee Expense', '2026-03-31', '5000.00', '0.00', 'DE01', 'EUR', 'DE-J1'],
  ];
  for (const r of rows) {
    ws.addRow(r);
  }
  const buf = await wb.xlsx.writeBuffer();
  return new Uint8Array(buf);
}

describe('monthEndClosePipeline integration (DEC-010 Steps 1–4)', () => {
  it('quarantines messy imports atomically, enforces period-close write guard, promotes exact-decimal USD/EUR batches, consolidates with ASC 830 CTA & ASC 810 IC, and ties out XLSX/PPTX outputs', async () => {
    const storage = createInMemoryStoragePort();
    const repository = createGLStagingRepository(storage);

    const usdConfig = {
      sourceId: 'month-end-us01',
      knownAccountCodes: ['1000', '1290', '3000', '4000', '4900', '5000'],
      knownEntityIds: ['US01'],
      expectedCurrency: 'USD',
      dateOrder: 'ISO_ONLY' as const,
    };

    const eurConfig = {
      sourceId: 'month-end-de01',
      knownAccountCodes: ['1000', '2190', '3000', '4000', '5000', '5900'],
      knownEntityIds: ['DE01'],
      expectedCurrency: 'EUR',
      dateOrder: 'ISO_ONLY' as const,
    };

    // -----------------------------------------------------------------------
    // 1. Messy USD CSV import -> blocked/quarantined atomically, never promoted
    // -----------------------------------------------------------------------
    const messyCsv = [
      'AccountCode,AccountName,PostDate,Debit,Credit,EntityId,Currency,JournalId',
      '1000,Cash,2026-03-31,"$12,,300",0.00,US01,USD,JRN-BAD1',
      '3000,Equity,2026-13-45,0.00,12300.00,US01,USD,JRN-BAD1',
      '1000,Cash,2026-03-31,500.00,0.00,US01,USD,JRN-UNBAL',
      '3000,Equity,2026-03-31,0.00,450.00,US01,USD,JRN-UNBAL',
    ].join('\n');

    const messyManifest = await stageGLCsvImport(
      {
        batchId: 'batch-us01-messy',
        config: usdConfig,
        source: messyCsv,
        delimiter: ',',
      },
      {
        repository,
        compute: async (chunk) => ingestGLRows(chunk),
      }
    );

    expect(messyManifest.status).toBe('blocked');
    const quarantinePage = await readStagingQuarantinePage(
      'batch-us01-messy',
      { offset: 0, limit: 20 },
      { repository }
    );
    expect(quarantinePage.totalQuarantined).toBe(2);
    expect(quarantinePage.rows.map((r) => r.sourceRow)).toEqual([2, 3]);
    expect(quarantinePage.rows[0]!.reasons.some((i) => i.code === 'INVALID_AMOUNT')).toBe(true);
    expect(quarantinePage.rows[1]!.reasons.some((i) => i.code === 'INVALID_DATE')).toBe(true);
    expect(messyManifest.unbalancedVouchers).toHaveLength(1);
    expect(messyManifest.unbalancedVouchers[0]!.journalId).toBe('JRN-UNBAL');

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

    await expect(
      promoteStagingBatch('batch-us01-messy', {
        storage,
        repository,
        periodAuthority: openPeriodAuthority,
        periodHydrated: true,
      })
    ).rejects.toThrow(/status is "blocked", expected "ready"/i);
    expect(await listPromotedLedgerBatches({ storage })).toHaveLength(0);

    // -----------------------------------------------------------------------
    // 2. Clean USD CSV + Clean EUR XLSX staged via streaming tokenizers
    // -----------------------------------------------------------------------
    const cleanUsdCsv = [
      'AccountCode,AccountName,PostDate,Debit,Credit,EntityId,Currency,JournalId',
      '1000,Cash & Equivalents,2026-03-31,100000.17,0.00,US01,USD,US-J1',
      '1290,IC Receivable - DE01,2026-03-31,11000.00,0.00,US01,USD,US-J1',
      '3000,Common Stock,2026-03-31,0.00,80000.17,US01,USD,US-J1',
      '4000,Product Revenue,2026-03-31,0.00,50000.00,US01,USD,US-J1',
      '4900,IC Management Fee Revenue,2026-03-31,0.00,5250.00,US01,USD,US-J1',
      '5000,Operating Expense,2026-03-31,24250.00,0.00,US01,USD,US-J1',
    ].join('\n');

    const stagedUsd = await stageGLCsvImport(
      {
        batchId: 'batch-us01-clean',
        config: usdConfig,
        source: cleanUsdCsv,
        delimiter: ',',
      },
      {
        repository,
        compute: async (chunk) => ingestGLRows(chunk),
      }
    );
    expect(stagedUsd.status).toBe('ready');

    const eurXlsxBytes = await makeEurXlsxBytes();
    const stagedEur = await stageGLXlsxImport({
      batchId: 'batch-de01-clean',
      config: eurConfig,
      source: eurXlsxBytes,
      repository,
      compute: async (chunk) => ingestGLRows(chunk),
    });
    expect(stagedEur.status).toBe('ready');

    // -----------------------------------------------------------------------
    // 3. Period-close write guard blocks closed period, then promotes when open
    // -----------------------------------------------------------------------
    const closedMarchAuthority: GLPeriodAuthority = {
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

    await expect(
      promoteStagingBatch('batch-us01-clean', {
        storage,
        repository,
        periodAuthority: closedMarchAuthority,
        periodHydrated: true,
      })
    ).rejects.toThrow(/hard_close|closed/i);

    await promoteStagingBatch('batch-us01-clean', {
      storage,
      repository,
      periodAuthority: openPeriodAuthority,
      periodHydrated: true,
    });
    await promoteStagingBatch('batch-de01-clean', {
      storage,
      repository,
      periodAuthority: openPeriodAuthority,
      periodHydrated: true,
    });

    const usEntries = await readPromotedLedgerEntries('batch-us01-clean', { storage });
    const deEntries = await readPromotedLedgerEntries('batch-de01-clean', { storage });
    expect(usEntries).toHaveLength(6);
    expect(deEntries).toHaveLength(6);

    // -----------------------------------------------------------------------
    // 4. Exact consolidation with ASC 830 CTA & ASC 810 IC elimination
    // -----------------------------------------------------------------------
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
          entityName: 'US Parent Corp',
          functionalCurrency: 'USD',
          entries: usEntries,
        },
        {
          entityId: 'DE01',
          entityName: 'Germany GmbH',
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
        {
          fromEntityId: 'US01',
          fromAccountCode: '4900',
          toEntityId: 'DE01',
          toAccountCode: '5900',
        },
      ],
    });

    expect(consolidated.isBalanced).toBe(true);
    expect(consolidated.accountingEquationImbalance).toBe('0.00');
    expect(consolidated.totalAssets).toBe('166000.17');
    expect(consolidated.totalEquity).toBe('-124500.17');
    expect(consolidated.totalCTA).toBe('-4500.00');
    expect(consolidated.netIncome).toBe('41500.00');

    // -----------------------------------------------------------------------
    // 5. Formula-preserving XLSX & editable 8-slide PPTX tie-out
    // -----------------------------------------------------------------------
    const metadata = {
      companyName: 'FinPlan Global Corp',
      periodLabel: '2026-03',
      preparedBy: 'Automated Close Pipeline',
      generatedAt: '2026-10-16T12:00:00.000Z',
    };

    const xlsxBytes = await buildFormulaPreservingWorkbookBytes(consolidated, metadata);
    const pptxBytes = buildEditableBoardPackPptxBytes(consolidated, metadata);

    const xlsxInspection = await inspectFormulaWorkbookBytes(xlsxBytes);
    const pptxInspection = parseEditablePptxBytes(pptxBytes);
    expect(pptxInspection.slideCount).toBe(8);

    const tieOut = verifyFinancialPackageTieOut(consolidated, xlsxInspection, pptxInspection);
    expect(tieOut.matches).toBe(true);
    expect(tieOut.discrepancies).toEqual([]);
  });
});
