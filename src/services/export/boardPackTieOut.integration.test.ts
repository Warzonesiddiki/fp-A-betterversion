import { describe, expect, it } from 'vitest';
import { ConsolidationEngine, type ExactConsolidationInput } from '@/engines/ConsolidationEngine';
import {
  buildEditableBoardPackPptxBytes,
  buildFormulaPreservingWorkbookBytes,
  inspectFormulaWorkbookBytes,
  parseEditablePptxBytes,
  verifyBoardPackRowTieOut,
  verifyFinancialPackageTieOut,
  type FinancialPackageMetadata,
} from '@/services/export/financialPackageExport';
import { toFixedMoneyString } from '@/utils/money';

const testMetadata: FinancialPackageMetadata = {
  companyName: 'Acme Global Holdings Inc.',
  periodLabel: '2026-Q1',
  preparedBy: 'FP&A Automation Engine',
  generatedAt: '2026-03-31T23:59:59.000Z',
};

function createSyntheticMultiEntityFixture(): ExactConsolidationInput {
  return {
    reportingCurrency: 'USD',
    entities: [
      {
        entityId: 'US-HQ',
        entityName: 'Acme US HQ Inc.',
        functionalCurrency: 'USD',
        entries: [
          {
            accountCode: '1000',
            accountName: 'Cash and Cash Equivalents',
            postDate: '2026-03-31',
            debit: '850000.00',
            credit: '0.00',
            entityId: 'US-HQ',
            currency: 'USD',
          },
          {
            accountCode: '1100',
            accountName: 'Accounts Receivable',
            postDate: '2026-03-31',
            debit: '320000.00',
            credit: '0.00',
            entityId: 'US-HQ',
            currency: 'USD',
          },
          {
            accountCode: '1190',
            accountName: 'Intercompany Receivable - EMEA',
            postDate: '2026-03-31',
            debit: '120000.00',
            credit: '0.00',
            entityId: 'US-HQ',
            currency: 'USD',
          },
          {
            accountCode: '2000',
            accountName: 'Accounts Payable',
            postDate: '2026-03-31',
            debit: '0.00',
            credit: '190000.00',
            entityId: 'US-HQ',
            currency: 'USD',
          },
          {
            accountCode: '3000',
            accountName: 'Common Stock',
            postDate: '2026-03-31',
            debit: '0.00',
            credit: '500000.00',
            entityId: 'US-HQ',
            currency: 'USD',
          },
          {
            accountCode: '3100',
            accountName: 'Beginning Retained Earnings',
            postDate: '2026-03-31',
            debit: '0.00',
            credit: '250000.00',
            entityId: 'US-HQ',
            currency: 'USD',
          },
          {
            accountCode: '4000',
            accountName: 'Software Subscription Revenue',
            postDate: '2026-03-31',
            debit: '0.00',
            credit: '650000.00',
            entityId: 'US-HQ',
            currency: 'USD',
          },
          {
            accountCode: '6000',
            accountName: 'Engineering Salaries',
            postDate: '2026-03-31',
            debit: '220000.00',
            credit: '0.00',
            entityId: 'US-HQ',
            currency: 'USD',
          },
          {
            accountCode: '6100',
            accountName: 'Cloud Infrastructure',
            postDate: '2026-03-31',
            debit: '80000.00',
            credit: '0.00',
            entityId: 'US-HQ',
            currency: 'USD',
          },
        ],
      },
      {
        entityId: 'EU-SUB',
        entityName: 'Acme EMEA Operations BV',
        functionalCurrency: 'EUR',
        entries: [
          {
            accountCode: '1000',
            accountName: 'Cash and Cash Equivalents',
            postDate: '2026-03-31',
            debit: '240000.00',
            credit: '0.00',
            entityId: 'EU-SUB',
            currency: 'EUR',
          },
          {
            accountCode: '1100',
            accountName: 'Accounts Receivable',
            postDate: '2026-03-31',
            debit: '95000.00',
            credit: '0.00',
            entityId: 'EU-SUB',
            currency: 'EUR',
          },
          {
            accountCode: '2000',
            accountName: 'Accounts Payable',
            postDate: '2026-03-31',
            debit: '0.00',
            credit: '60000.00',
            entityId: 'EU-SUB',
            currency: 'EUR',
          },
          {
            accountCode: '2190',
            accountName: 'Intercompany Payable - US HQ',
            postDate: '2026-03-31',
            debit: '0.00',
            credit: '109090.91', // At spot 1.10 = $120,000.00
            entityId: 'EU-SUB',
            currency: 'EUR',
          },
          {
            accountCode: '3000',
            accountName: 'Common Stock',
            postDate: '2026-03-31',
            debit: '0.00',
            credit: '100000.00',
            entityId: 'EU-SUB',
            currency: 'EUR',
          },
          {
            accountCode: '4100',
            accountName: 'Professional Services Revenue',
            postDate: '2026-03-31',
            debit: '0.00',
            credit: '120000.00',
            entityId: 'EU-SUB',
            currency: 'EUR',
          },
          {
            accountCode: '6000',
            accountName: 'Engineering Salaries',
            postDate: '2026-03-31',
            debit: '40000.00',
            credit: '0.00',
            entityId: 'EU-SUB',
            currency: 'EUR',
          },
          {
            accountCode: '6200',
            accountName: 'Marketing and Travel',
            postDate: '2026-03-31',
            debit: '14090.91',
            credit: '0.00',
            entityId: 'EU-SUB',
            currency: 'EUR',
          },
        ],
      },
    ],
    fxRates: [
      {
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        spotRate: '1.100000',
        averageRate: '1.080000',
        historicalRate: '1.050000',
      },
    ],
    icRules: [
      {
        fromEntityId: 'US-HQ',
        fromAccountCode: '1190',
        toEntityId: 'EU-SUB',
        toAccountCode: '2190',
        description: 'US-HQ EMEA Intercompany Loan Balance',
      },
    ],
  };
}

describe('Board Pack Export Tie-Out Integration Tests', () => {
  it('asserts exported board pack rows in XLSX and PPTX exactly tie out to in-app GL aggregates', async () => {
    const fixture = createSyntheticMultiEntityFixture();
    const consolidationResult = ConsolidationEngine.consolidateExact(fixture);

    // Verify baseline accounting invariants on engine result
    expect(consolidationResult.accountingEquationImbalance).toBe('0.00');
    expect(consolidationResult.consolidatedTrialBalance.length).toBeGreaterThan(0);

    // Export both artifacts
    const xlsxBytes = await buildFormulaPreservingWorkbookBytes(consolidationResult, testMetadata);
    const pptxBytes = await buildEditableBoardPackPptxBytes(consolidationResult, testMetadata);

    expect(xlsxBytes.byteLength).toBeGreaterThan(1000);
    expect(pptxBytes.byteLength).toBeGreaterThan(1000);

    // Parse and inspect artifacts
    const xlsx = await inspectFormulaWorkbookBytes(xlsxBytes);
    const pptx = await parseEditablePptxBytes(pptxBytes);

    // 1. High-level 3-way headline tie-out
    const headlineTieOut = verifyFinancialPackageTieOut(consolidationResult, xlsx, pptx);
    expect(headlineTieOut.matches).toBe(true);
    expect(headlineTieOut.discrepancies).toEqual([]);

    // 2. Exhaustive row-level tie-out verification across all sheets and slides
    const rowTieOut = verifyBoardPackRowTieOut(consolidationResult, xlsx, pptx);
    expect(rowTieOut.matches).toBe(true);
    expect(rowTieOut.discrepancies).toEqual([]);
    expect(rowTieOut.checkedRowCount).toBeGreaterThan(30);

    // 3. Direct verification of individual XLSX sheet rows
    const tbSheet = xlsx.sheetRows['Consolidated_TB'];
    expect(tbSheet).toBeDefined();
    // Headers are in row 0
    expect(tbSheet[0]).toEqual([
      'Account Code',
      'Account Name',
      'Category',
      'Pre-Elimination Signed',
      'Elimination Signed',
      'Consolidated Signed',
      'Debit',
      'Credit',
    ]);

    // Check specific GL accounts in Consolidated_TB
    const cashRow = tbSheet.find((r) => r[0] === '1000');
    expect(cashRow).toBeDefined();
    const expectedCashConsolidated = consolidationResult.consolidatedTrialBalance.find(
      (a) => a.accountCode === '1000'
    )?.consolidatedSigned;
    expect(toFixedMoneyString(cashRow![5] ?? 0)).toBe(expectedCashConsolidated);

    // Intercompany accounts must be eliminated to 0.00 consolidated
    const icRecRow = tbSheet.find((r) => r[0] === '1190');
    expect(icRecRow).toBeDefined();
    expect(toFixedMoneyString(icRecRow![4] ?? 0)).toBe('-120000.00'); // Elimination credit
    expect(toFixedMoneyString(icRecRow![5] ?? 0)).toBe('0.00'); // Net consolidated balance is zero

    const icPayRow = tbSheet.find((r) => r[0] === '2190');
    expect(icPayRow).toBeDefined();
    expect(toFixedMoneyString(icPayRow![4] ?? 0)).toBe('120000.00'); // Elimination debit
    expect(toFixedMoneyString(icPayRow![5] ?? 0)).toBe('0.00'); // Net consolidated balance is zero

    // Direct verification of XLSX Income Statement rows
    const isSheet = xlsx.sheetRows['Income_Statement'];
    expect(isSheet).toBeDefined();
    const revRow = isSheet.find((r) => r[0] === '4000');
    expect(revRow).toBeDefined();
    expect(revRow![1]).toBe('Software Subscription Revenue');
    expect(toFixedMoneyString(revRow![2] ?? 0)).toBe('650000.00');

    // Direct verification of PPTX slide tables
    expect(pptx.slideCount).toBe(8);

    // Slide 3: Consolidated Income Statement
    const isPptxTable = pptx.slides[2].tables[0];
    expect(isPptxTable).toBeDefined();
    const pptxRevRow = isPptxTable.find((r) => r[0] === '4000');
    expect(pptxRevRow).toBeDefined();
    expect(pptxRevRow![3]).toBe('-650000.00');

    // Slide 6: ASC 810 Intercompany Eliminations
    const icPptxTable = pptx.slides[5].tables[0];
    expect(icPptxTable).toBeDefined();
    const pptxIcRow = icPptxTable.find((r) => r[0] === 'US-HQ:1190 <-> EU-SUB:2190');
    expect(pptxIcRow).toBeDefined();
    expect(pptxIcRow![3]).toBe('120000.00'); // Matched elim amount
    expect(pptxIcRow![4]).toBe('0.00'); // Unmatched difference
    expect(pptxIcRow![5]).toBe('matched');

    // Slide 7: Consolidated Trial Balance Control Table
    const tbPptxTable = pptx.slides[6].tables[0];
    expect(tbPptxTable).toBeDefined();
    const pptxCashRow = tbPptxTable.find((r) => r[0].startsWith('1000 '));
    expect(pptxCashRow).toBeDefined();
    expect(pptxCashRow![3]).toBe(expectedCashConsolidated);
  });

  it('correctly tracks and surfaces intercompany variance rows in exported board pack', async () => {
    const fixture = createSyntheticMultiEntityFixture();
    // Introduce an asymmetric IC variance: US has 120,000.00 receivable, but EU recorded only 80,000.00 EUR (at 1.10 = $88,000.00)
    const euEntity = fixture.entities.find((e) => e.entityId === 'EU-SUB')!;
    const icPayable = euEntity.entries.find((a) => a.accountCode === '2190')!;
    (icPayable as { credit: string }).credit = '80000.00'; // $88,000.00 USD at spot 1.10
    // Adjust Common Stock so local EU trial balance remains balanced
    const commonStock = euEntity.entries.find((a) => a.accountCode === '3000')!;
    (commonStock as { credit: string }).credit = '129090.91';

    const result = ConsolidationEngine.consolidateExact(fixture);

    // IC reconciliation must reflect the unmatched variance of $32,000.00
    const icRec = result.icReconciliation[0];
    expect(icRec).toBeDefined();
    expect(icRec.eliminatedAmount).toBe('88000.00');
    expect(icRec.unmatchedDifference).toBe('32000.00');

    // Export artifacts
    const xlsxBytes = await buildFormulaPreservingWorkbookBytes(result, testMetadata);
    const pptxBytes = await buildEditableBoardPackPptxBytes(result, testMetadata);

    const xlsx = await inspectFormulaWorkbookBytes(xlsxBytes);
    const pptx = await parseEditablePptxBytes(pptxBytes);

    // Row tie out verifies variance is preserved exactly in both exports
    const rowTieOut = verifyBoardPackRowTieOut(result, xlsx, pptx);
    expect(rowTieOut.matches).toBe(true);
    expect(rowTieOut.discrepancies).toEqual([]);

    // Check IC sheet row in XLSX
    const icSheet = xlsx.sheetRows['IC_Eliminations'];
    const icRow = icSheet.find(
      (r) => r[0] === 'US-HQ' && r[1] === '1190' && r[2] === 'EU-SUB' && r[3] === '2190'
    );
    expect(icRow).toBeDefined();
    expect(toFixedMoneyString(icRow![4] ?? 0)).toBe('120000.00'); // fromSigned
    expect(toFixedMoneyString(icRow![5] ?? 0)).toBe('-88000.00'); // toSigned
    expect(toFixedMoneyString(icRow![6] ?? 0)).toBe('88000.00'); // matched elim
    expect(toFixedMoneyString(icRow![7] ?? 0)).toBe('32000.00'); // difference formula result
    expect(icRow![8]).toBe('unmatched_difference');

    // Check IC slide table in PPTX
    const icPptxTable = pptx.slides[5].tables[0];
    const pptxRow = icPptxTable.find((r) => r[0] === 'US-HQ:1190 <-> EU-SUB:2190');
    expect(pptxRow).toBeDefined();
    expect(pptxRow![1]).toBe('120000.00');
    expect(pptxRow![2]).toBe('-88000.00');
    expect(pptxRow![3]).toBe('88000.00');
    expect(pptxRow![4]).toBe('32000.00');
    expect(pptxRow![5]).toBe('unmatched_difference');
  });

  it('fails tie-out assertion when an exported row is tampered or corrupted', async () => {
    const fixture = createSyntheticMultiEntityFixture();
    const result = ConsolidationEngine.consolidateExact(fixture);

    const xlsxBytes = await buildFormulaPreservingWorkbookBytes(result, testMetadata);
    const pptxBytes = await buildEditableBoardPackPptxBytes(result, testMetadata);

    const xlsx = await inspectFormulaWorkbookBytes(xlsxBytes);
    const pptx = await parseEditablePptxBytes(pptxBytes);

    // Clone xlsx and tamper with one row in Consolidated_TB
    const tamperedXlsx: typeof xlsx = {
      ...xlsx,
      sheetRows: {
        ...xlsx.sheetRows,
        Consolidated_TB: xlsx.sheetRows['Consolidated_TB'].map((row) =>
          row[0] === '1000'
            ? [row[0], row[1], row[2], row[3], row[4], '999999.99', row[6], row[7]]
            : [...row]
        ),
      },
    };

    const tieOutFailXlsx = verifyBoardPackRowTieOut(result, tamperedXlsx, pptx);
    expect(tieOutFailXlsx.matches).toBe(false);
    expect(tieOutFailXlsx.discrepancies.length).toBeGreaterThan(0);
    const failure = tieOutFailXlsx.discrepancies.find((d) => d.field === 'consolidatedSigned');
    expect(failure).toBeDefined();
    expect(failure?.target).toBe('XLSX');
    expect(failure?.sheetOrSlide).toBe('Consolidated_TB');
    expect(failure?.rowIdentifier).toBe('account:1000');
    expect(failure?.actual).toBe('999999.99');

    // Tamper with PPTX Slide 3
    const tamperedPptx: typeof pptx = {
      ...pptx,
      slides: pptx.slides.map((s, idx) =>
        idx === 2
          ? {
              ...s,
              tables: [
                s.tables[0].map((r) =>
                  r[0] === '4000' ? [r[0], r[1], r[2], '-111111.11'] : [...r]
                ),
              ],
            }
          : s
      ),
    };

    const tieOutFailPptx = verifyBoardPackRowTieOut(result, xlsx, tamperedPptx);
    expect(tieOutFailPptx.matches).toBe(false);
    expect(tieOutFailPptx.discrepancies.length).toBeGreaterThan(0);
    const pptxFailure = tieOutFailPptx.discrepancies.find((d) => d.target === 'PPTX');
    expect(pptxFailure).toBeDefined();
    expect(pptxFailure?.rowIdentifier).toBe('pptx-is:4000');
    expect(pptxFailure?.actual).toBe('-111111.11');
  });
});
