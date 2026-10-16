import { describe, expect, it } from 'vitest';
import { ConsolidationEngine, type ExactConsolidationResult } from '@/engines/ConsolidationEngine';
import {
  assertSafeSpreadsheetFormula,
  buildEditableBoardPackPptxBytes,
  buildFormulaPreservingWorkbookBytes,
  inspectFormulaWorkbookBytes,
  parseEditablePptxBytes,
  verifyFinancialPackageTieOut,
  type FinancialPackageMetadata,
} from './financialPackageExport';

function buildSampleConsolidatedResult(): ExactConsolidationResult {
  return ConsolidationEngine.consolidateExact({
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
        entries: [
          {
            accountCode: '1000',
            accountName: 'Cash & Equivalents',
            postDate: '2026-03-31',
            debit: '100000.00',
            credit: '0.00',
            entityId: 'US01',
            currency: 'USD',
          },
          {
            accountCode: '1290',
            accountName: 'IC Receivable - DE01',
            postDate: '2026-03-31',
            debit: '11000.00',
            credit: '0.00',
            entityId: 'US01',
            currency: 'USD',
          },
          {
            accountCode: '3000',
            accountName: 'Common Stock',
            postDate: '2026-03-31',
            debit: '0.00',
            credit: '80000.00',
            entityId: 'US01',
            currency: 'USD',
          },
          {
            accountCode: '4000',
            accountName: 'Product Revenue',
            postDate: '2026-03-31',
            debit: '0.00',
            credit: '50000.00',
            entityId: 'US01',
            currency: 'USD',
          },
          {
            accountCode: '4900',
            accountName: 'IC Management Fee Revenue',
            postDate: '2026-03-31',
            debit: '0.00',
            credit: '5250.00',
            entityId: 'US01',
            currency: 'USD',
          },
          {
            accountCode: '5000',
            accountName: 'Operating Expense',
            postDate: '2026-03-31',
            debit: '24250.00',
            credit: '0.00',
            entityId: 'US01',
            currency: 'USD',
          },
        ],
      },
      {
        entityId: 'DE01',
        entityName: 'Germany GmbH',
        functionalCurrency: 'EUR',
        entries: [
          {
            accountCode: '1000',
            accountName: 'Cash & Equivalents',
            postDate: '2026-03-31',
            debit: '60000.00',
            credit: '0.00',
            entityId: 'DE01',
            currency: 'EUR',
          },
          {
            accountCode: '2190',
            accountName: 'IC Payable - US01',
            postDate: '2026-03-31',
            debit: '0.00',
            credit: '10000.00',
            entityId: 'DE01',
            currency: 'EUR',
          },
          {
            accountCode: '3000',
            accountName: 'Subscribed Capital',
            postDate: '2026-03-31',
            debit: '0.00',
            credit: '40000.00',
            entityId: 'DE01',
            currency: 'EUR',
          },
          {
            accountCode: '4000',
            accountName: 'Product Revenue',
            postDate: '2026-03-31',
            debit: '0.00',
            credit: '25000.00',
            entityId: 'DE01',
            currency: 'EUR',
          },
          {
            accountCode: '5000',
            accountName: 'Operating Expense',
            postDate: '2026-03-31',
            debit: '10000.00',
            credit: '0.00',
            entityId: 'DE01',
            currency: 'EUR',
          },
          {
            accountCode: '5900',
            accountName: 'IC Management Fee Expense',
            postDate: '2026-03-31',
            debit: '5000.00',
            credit: '0.00',
            entityId: 'DE01',
            currency: 'EUR',
          },
        ],
      },
    ],
    icRules: [
      {
        fromEntityId: 'US01',
        fromAccountCode: '1290',
        toEntityId: 'DE01',
        toAccountCode: '2190',
        description: 'IC Receivable/Payable US01 <-> DE01',
      },
      {
        fromEntityId: 'US01',
        fromAccountCode: '4900',
        toEntityId: 'DE01',
        toAccountCode: '5900',
        description: 'IC Management Fee US01 <-> DE01',
      },
    ],
  });
}

const sampleMetadata: FinancialPackageMetadata = {
  companyName: 'FinPlan Enterprise Holdings',
  periodLabel: '2026-03',
  preparedBy: 'Controller Close Desk',
  generatedAt: '2026-10-16T12:00:00.000Z',
};

describe('financialPackageExport (DEC-010 Step 3)', () => {
  it('enforces a strict allowlist on Excel formulas and rejects DDE/injection payloads', () => {
    expect(assertSafeSpreadsheetFormula('SUM(D2:D8)')).toBe('SUM(D2:D8)');
    expect(assertSafeSpreadsheetFormula('D2+E2')).toBe('D2+E2');
    expect(assertSafeSpreadsheetFormula('Income_Statement!B5')).toBe('Income_Statement!B5');
    expect(() => assertSafeSpreadsheetFormula("cmd|'/c calc'!A1")).toThrow(/Unsafe Excel formula/i);
    expect(() => assertSafeSpreadsheetFormula('HYPERLINK("http://evil.example")')).toThrow(
      /Unsafe Excel formula/i
    );
  });

  it('generates a multi-sheet formula-preserving XLSX workbook with live <f> formulas and cached <v> results', async () => {
    const consolidated = buildSampleConsolidatedResult();
    const xlsxBytes = await buildFormulaPreservingWorkbookBytes(consolidated, sampleMetadata);

    expect(xlsxBytes.byteLength).toBeGreaterThan(2000);
    // ZIP magic header PK\x03\x04
    expect(xlsxBytes[0]).toBe(0x50);
    expect(xlsxBytes[1]).toBe(0x4b);

    const inspection = await inspectFormulaWorkbookBytes(xlsxBytes);
    expect(inspection.sheetNames).toEqual([
      'Consolidated_TB',
      'Income_Statement',
      'Balance_Sheet',
      'FX_CTA_Schedule',
      'IC_Eliminations',
    ]);

    // Every formula cell must carry both a non-empty formula string and a finite cached numeric result
    expect(inspection.formulaCells.length).toBeGreaterThanOrEqual(12);
    for (const cell of inspection.formulaCells) {
      expect(cell.formula.length).toBeGreaterThan(0);
      expect(typeof cell.result).toBe('string');
    }

    expect(inspection.summaryMetrics.totalAssets).toBe('166000.00');
    expect(inspection.summaryMetrics.totalLiabilitiesCredit).toBe('0.00');
    expect(inspection.summaryMetrics.totalEquity).toBe('-124500.00');
    expect(inspection.summaryMetrics.totalCTA).toBe('-4500.00');
    expect(inspection.summaryMetrics.totalRevenueCredit).toBe('76250.00');
    expect(inspection.summaryMetrics.totalExpenses).toBe('34750.00');
    expect(inspection.summaryMetrics.netIncome).toBe('41500.00');
    expect(inspection.summaryMetrics.accountingEquationImbalance).toBe('0.00');
  });

  it('generates an editable 8-slide OpenXML PPTX presentation with native DrawingML text and tables', () => {
    const consolidated = buildSampleConsolidatedResult();
    const pptxBytes = buildEditableBoardPackPptxBytes(consolidated, sampleMetadata);

    expect(pptxBytes.byteLength).toBeGreaterThan(4000);
    // ZIP magic header PK\x03\x04
    expect(pptxBytes[0]).toBe(0x50);
    expect(pptxBytes[1]).toBe(0x4b);

    const parsedDeck = parseEditablePptxBytes(pptxBytes);
    expect(parsedDeck.slideCount).toBe(8);
    expect(parsedDeck.slides.map((s) => s.title)).toEqual([
      'FinPlan Enterprise Holdings — Board Pack (2026-03)',
      'Executive Financial Summary',
      'Consolidated Income Statement',
      'Consolidated Balance Sheet',
      'ASC 830 FX Translation & CTA Bridge',
      'ASC 810 Intercompany Eliminations',
      'Consolidated Trial Balance Control',
      'Close Governance & Sign-Off',
    ]);

    // Verify native editable tables (<a:tbl>) exist and carry exact figures
    const tablesCount = parsedDeck.slides.reduce((acc, s) => acc + s.tables.length, 0);
    expect(tablesCount).toBeGreaterThanOrEqual(6);
    expect(parsedDeck.summaryMetrics.totalAssets).toBe('166000.00');
    expect(parsedDeck.summaryMetrics.netIncome).toBe('41500.00');
    expect(parsedDeck.summaryMetrics.totalCTA).toBe('-4500.00');
  });

  it('verifies cent-exact tie-out across ExactConsolidationResult, XLSX formulas, and 8-slide PPTX tables', async () => {
    const consolidated = buildSampleConsolidatedResult();
    const xlsxBytes = await buildFormulaPreservingWorkbookBytes(consolidated, sampleMetadata);
    const pptxBytes = buildEditableBoardPackPptxBytes(consolidated, sampleMetadata);

    const xlsxInspection = await inspectFormulaWorkbookBytes(xlsxBytes);
    const pptxInspection = parseEditablePptxBytes(pptxBytes);

    const tieOut = verifyFinancialPackageTieOut(consolidated, xlsxInspection, pptxInspection);
    expect(tieOut.matches).toBe(true);
    expect(tieOut.discrepancies).toEqual([]);
  });
});
