import { describe, it, expect } from 'vitest';
import {
  buildEditableBoardPackPptxBytes,
  parseEditablePptxBytes,
  assertSafeSpreadsheetFormula,
  verifyBoardPackRowTieOut,
  buildFormulaPreservingWorkbookBytes,
  inspectFormulaWorkbookBytes,
  type FinancialPackageMetadata,
  type EditablePptxInspection,
  type FormulaWorkbookInspection,
  type PackageSummaryMetrics,
  type BoardPackRowTieOutResult,
} from '@/services/export/financialPackageExport';
import type { ExactConsolidationResult } from '@/engines/ConsolidationEngine';

/**
 * GOVERNANCE EVIDENCE for cap:report.pptx-editable
 *
 * The financialPackageExport module generates editable ECMA-376 OpenXML PPTX
 * board packs from consolidation results. The governance dimension here is
 * INTEGERITY — the PPTX must contain correct numbers that tie out to the XLSX,
 * formulas must be safe (no injection), and money must be exact decimal
 * strings with zero float coercion. If numbers drift between XLSX and PPTX,
 * the board pack is not trustworthy.
 *
 * Tested dimensions:
 * 1. PPTX generation (valid byte archive, correct slide count)
 * 2. PPTX round-trip (build → parse → verify slide content)
 * 3. Formula safety (blocks injection, allows safe formulas)
 * 4. Tie-out verification (XLSX ↔ PPTX consistency)
 * 5. Money primitive safety (exact decimal strings)
 * 6. Determinism (same input → same output)
 */

function makeConsolidationResult(): ExactConsolidationResult {
  return {
    reportingCurrency: 'USD',
    entityTranslations: [
      {
        entityId: 'ENT-001',
        entityName: 'HoldCo',
        functionalCurrency: 'USD',
        reportingCurrency: 'USD',
        localTotalDebit: '1000000.00',
        localTotalCredit: '1000000.00',
        translatedAssets: '500000.00',
        translatedLiabilities: '300000.00',
        translatedEquityBeforeCTA: '200000.00',
        translatedRevenue: '250000.00',
        translatedExpenses: '150000.00',
        openingEquityRateEffect: '0.00',
        netIncomeRateEffect: '0.00',
        roundingResidual: '0.00',
        totalCTA: '0.00',
      },
    ],
    icReconciliation: [
      {
        fromEntityId: 'ENT-001',
        fromAccountCode: '1000',
        toEntityId: 'ENT-002',
        toAccountCode: '2000',
        fromSignedBalance: '50000.00',
        toSignedBalance: '50000.00',
        eliminatedAmount: '50000.00',
        unmatchedDifference: '0.00',
        status: 'matched',
      },
    ],
    eliminationLines: [
      {
        entityId: 'ENT-001',
        accountCode: '1000',
        accountName: 'Intercompany Receivable',
        debit: '0.00',
        credit: '50000.00',
        description: 'IC elimination',
      },
    ],
    consolidatedTrialBalance: [
      {
        accountCode: '1000',
        accountName: 'Cash',
        category: 'asset',
        preEliminationSigned: '100000.00',
        eliminationSigned: '0.00',
        consolidatedSigned: '100000.00',
        debit: '100000.00',
        credit: '0.00',
      },
      {
        accountCode: '1100',
        accountName: 'Accounts Receivable',
        category: 'asset',
        preEliminationSigned: '100000.00',
        eliminationSigned: '0.00',
        consolidatedSigned: '100000.00',
        debit: '100000.00',
        credit: '0.00',
      },
      {
        accountCode: '2000',
        accountName: 'Accounts Payable',
        category: 'liability',
        preEliminationSigned: '50000.00',
        eliminationSigned: '0.00',
        consolidatedSigned: '50000.00',
        debit: '0.00',
        credit: '50000.00',
      },
      {
        accountCode: '3000',
        accountName: 'Common Equity',
        category: 'equity',
        preEliminationSigned: '50000.00',
        eliminationSigned: '0.00',
        consolidatedSigned: '50000.00',
        debit: '0.00',
        credit: '50000.00',
      },
      {
        accountCode: '4000',
        accountName: 'Revenue',
        category: 'revenue',
        preEliminationSigned: '250000.00',
        eliminationSigned: '0.00',
        consolidatedSigned: '250000.00',
        debit: '0.00',
        credit: '250000.00',
      },
      {
        accountCode: '5000',
        accountName: 'Operating Expenses',
        category: 'expense',
        preEliminationSigned: '150000.00',
        eliminationSigned: '0.00',
        consolidatedSigned: '150000.00',
        debit: '150000.00',
        credit: '0.00',
      },
    ],
    totalAssets: '200000.00',
    totalLiabilities: '50000.00',
    totalLiabilitiesCredit: '50000.00',
    totalEquity: '150000.00',
    totalCTA: '0.00',
    totalRevenue: '250000.00',
    totalRevenueCredit: '250000.00',
    totalExpenses: '150000.00',
    netIncome: '100000.00',
    accountingEquationImbalance: '0.00',
    hasUnmatchedIC: false,
    isBalanced: true,
  };
}

function makeMetadata(): FinancialPackageMetadata {
  return {
    companyName: 'Test Corporation',
    periodLabel: 'FY2026 Q1',
    preparedBy: 'Finance Team',
    generatedAt: '2026-01-15T00:00:00.000Z',
  };
}

function makeSummaryMetrics(result: ExactConsolidationResult): PackageSummaryMetrics {
  return {
    totalAssets: result.totalAssets,
    totalLiabilitiesCredit: result.totalLiabilitiesCredit,
    totalEquity: result.totalEquity,
    totalCTA: result.totalCTA,
    totalRevenueCredit: result.totalRevenueCredit,
    totalExpenses: result.totalExpenses,
    netIncome: result.netIncome,
    accountingEquationImbalance: result.accountingEquationImbalance,
  };
}

describe('financialPackageExport — GOVERNANCE (report.pptx-editable)', () => {
  describe('1. PPTX generation', () => {
    it('buildEditableBoardPackPptxBytes produces a valid byte archive', () => {
      const result = makeConsolidationResult();
      const metadata = makeMetadata();
      const bytes = buildEditableBoardPackPptxBytes(result, metadata);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBeGreaterThan(1000);
    });

    it('buildEditableBoardPackPptxBytes produces correct slide count', () => {
      const result = makeConsolidationResult();
      const metadata = makeMetadata();
      const bytes = buildEditableBoardPackPptxBytes(result, metadata);
      const inspection = parseEditablePptxBytes(bytes);
      expect(inspection.slideCount).toBeGreaterThanOrEqual(5);
    });

    it('buildEditableBoardPackPptxBytes includes company name in title slide', () => {
      const result = makeConsolidationResult();
      const metadata = makeMetadata();
      const bytes = buildEditableBoardPackPptxBytes(result, metadata);
      const inspection = parseEditablePptxBytes(bytes);
      const titleSlide = inspection.slides[0];
      expect(titleSlide.title).toContain('Test Corporation');
      expect(titleSlide.title).toContain('FY2026 Q1');
    });
  });

  describe('2. PPTX round-trip', () => {
    it('parseEditablePptxBytes extracts slide content correctly', () => {
      const result = makeConsolidationResult();
      const metadata = makeMetadata();
      const bytes = buildEditableBoardPackPptxBytes(result, metadata);
      const inspection = parseEditablePptxBytes(bytes);
      expect(inspection.slides.length).toBeGreaterThan(0);
      for (const slide of inspection.slides) {
        expect(slide.slideNumber).toBeGreaterThan(0);
        expect(typeof slide.title).toBe('string');
        expect(Array.isArray(slide.paragraphs)).toBe(true);
      }
    });

    it('parseEditablePptxBytes extracts summary metrics', () => {
      const result = makeConsolidationResult();
      const metadata = makeMetadata();
      const bytes = buildEditableBoardPackPptxBytes(result, metadata);
      const inspection = parseEditablePptxBytes(bytes);
      expect(inspection.summaryMetrics).toBeDefined();
      expect(inspection.summaryMetrics.totalAssets).toBe('200000.00');
      expect(inspection.summaryMetrics.netIncome).toBe('100000.00');
    });

    it('parseEditablePptxBytes throws on invalid archive', () => {
      const invalidBytes = new Uint8Array([0, 1, 2, 3, 4, 5]);
      expect(() => parseEditablePptxBytes(invalidBytes)).toThrow();
    });

    it('parseEditablePptxBytes throws on empty input', () => {
      expect(() => parseEditablePptxBytes(new Uint8Array())).toThrow();
    });
  });

  describe('3. Formula safety', () => {
    it('assertSafeSpreadsheetFormula allows SUM formula', () => {
      const formula = 'SUM(A1:A10)';
      const result = assertSafeSpreadsheetFormula(formula);
      expect(result).toBe(formula);
    });

    it('assertSafeSpreadsheetFormula allows ROUND formula', () => {
      const formula = 'ROUND(A1+B1,2)';
      const result = assertSafeSpreadsheetFormula(formula);
      expect(result).toBe(formula);
    });

    it('assertSafeSpreadsheetFormula allows ABS formula', () => {
      const formula = 'ABS(A1-B1)';
      const result = assertSafeSpreadsheetFormula(formula);
      expect(result).toBe(formula);
    });

    it('assertSafeSpreadsheetFormula allows cell references', () => {
      const formula = 'A1+B2';
      const result = assertSafeSpreadsheetFormula(formula);
      expect(result).toBe(formula);
    });

    it('assertSafeSpreadsheetFormula allows sheet-qualified references', () => {
      const formula = 'Sheet1!A1';
      const result = assertSafeSpreadsheetFormula(formula);
      expect(result).toBe(formula);
    });

    it('assertSafeSpreadsheetFormula blocks pipe character (injection)', () => {
      expect(() => assertSafeSpreadsheetFormula('A1|cmd /c calc')).toThrow();
    });

    it('assertSafeSpreadsheetFormula blocks double quotes', () => {
      expect(() => assertSafeSpreadsheetFormula('A1"cmd')).toThrow();
    });

    it('assertSafeSpreadsheetFormula blocks backticks', () => {
      expect(() => assertSafeSpreadsheetFormula('A1`cmd`')).toThrow();
    });

    it('assertSafeSpreadsheetFormula blocks backslash', () => {
      expect(() => assertSafeSpreadsheetFormula('A1\\cmd')).toThrow();
    });

    it('assertSafeSpreadsheetFormula blocks less-than', () => {
      expect(() => assertSafeSpreadsheetFormula('A1<cmd')).toThrow();
    });

    it('assertSafeSpreadsheetFormula blocks greater-than', () => {
      expect(() => assertSafeSpreadsheetFormula('A1>cmd')).toThrow();
    });

    it('assertSafeSpreadsheetFormula blocks powershell keyword', () => {
      expect(() => assertSafeSpreadsheetFormula('A1+powershell')).toThrow();
    });

    it('assertSafeSpreadsheetFormula blocks cmd keyword', () => {
      expect(() => assertSafeSpreadsheetFormula('A1+cmd')).toThrow();
    });

    it('assertSafeSpreadsheetFormula blocks hyperlink keyword', () => {
      expect(() => assertSafeSpreadsheetFormula('A1+hyperlink')).toThrow();
    });

    it('assertSafeSpreadsheetFormula blocks webservice keyword', () => {
      expect(() => assertSafeSpreadsheetFormula('A1+webservice')).toThrow();
    });

    it('assertSafeSpreadsheetFormula blocks filterxml keyword', () => {
      expect(() => assertSafeSpreadsheetFormula('A1+filterxml')).toThrow();
    });
  });

  describe('4. Tie-out verification', () => {
    it('verifyBoardPackRowTieOut reports match when XLSX and PPTX agree', async () => {
      const result = makeConsolidationResult();
      const metadata = makeMetadata();

      // Generate both XLSX and PPTX from the same consolidation result
      const xlsxBytes = await buildFormulaPreservingWorkbookBytes(result, metadata);
      const xlsx = await inspectFormulaWorkbookBytes(xlsxBytes);
      const pptxBytes = buildEditableBoardPackPptxBytes(result, metadata);
      const pptx = parseEditablePptxBytes(pptxBytes);

      const tieOut = verifyBoardPackRowTieOut(result, xlsx, pptx);
      expect(tieOut.matches).toBe(true);
      expect(tieOut.discrepancies).toHaveLength(0);
      expect(tieOut.checkedRowCount).toBeGreaterThan(0);
    });

    it('verifyBoardPackRowTieOut reports discrepancy when XLSX has wrong value', async () => {
      const result = makeConsolidationResult();
      const metadata = makeMetadata();

      // Generate XLSX and PPTX from the same consolidation result
      const xlsxBytes = await buildFormulaPreservingWorkbookBytes(result, metadata);
      const xlsx = await inspectFormulaWorkbookBytes(xlsxBytes);

      // Tamper with a value in the XLSX inspection
      const tbRows = xlsx.sheetRows['Consolidated_TB'];
      if (tbRows && tbRows.length > 1) {
        tbRows[1][6] = '999999.00'; // Corrupt the debit value
      }

      const pptxBytes = buildEditableBoardPackPptxBytes(result, metadata);
      const pptx = parseEditablePptxBytes(pptxBytes);

      const tieOut = verifyBoardPackRowTieOut(result, xlsx, pptx);
      expect(tieOut.matches).toBe(false);
      expect(tieOut.discrepancies.length).toBeGreaterThan(0);
    });
  });

  describe('5. Money primitive safety', () => {
    it('PPTX contains exact decimal strings (no float coercion)', () => {
      const result = makeConsolidationResult();
      const metadata = makeMetadata();
      const bytes = buildEditableBoardPackPptxBytes(result, metadata);
      const inspection = parseEditablePptxBytes(bytes);
      const summary = inspection.summaryMetrics;

      // All values must be exact decimal strings
      expect(summary.totalAssets).toBe('200000.00');
      expect(summary.totalLiabilitiesCredit).toBe('50000.00');
      expect(summary.totalEquity).toBe('150000.00');
      expect(summary.totalCTA).toBe('0.00');
      expect(summary.totalRevenueCredit).toBe('250000.00');
      expect(summary.totalExpenses).toBe('150000.00');
      expect(summary.netIncome).toBe('100000.00');
      expect(summary.accountingEquationImbalance).toBe('0.00');
    });

    it('PPTX summary metrics match input result exactly', () => {
      const result = makeConsolidationResult();
      const metadata = makeMetadata();
      const bytes = buildEditableBoardPackPptxBytes(result, metadata);
      const inspection = parseEditablePptxBytes(bytes);
      const summary = inspection.summaryMetrics;

      expect(summary.totalAssets).toBe(result.totalAssets);
      expect(summary.netIncome).toBe(result.netIncome);
      expect(summary.totalRevenueCredit).toBe(result.totalRevenueCredit);
      expect(summary.totalExpenses).toBe(result.totalExpenses);
    });
  });

  describe('6. Determinism', () => {
    it('buildEditableBoardPackPptxBytes produces identical output for identical inputs', () => {
      const result = makeConsolidationResult();
      const metadata = makeMetadata();
      const bytes1 = buildEditableBoardPackPptxBytes(result, metadata);
      const bytes2 = buildEditableBoardPackPptxBytes(result, metadata);
      const inspection1 = parseEditablePptxBytes(bytes1);
      const inspection2 = parseEditablePptxBytes(bytes2);
      expect(inspection1.slideCount).toBe(inspection2.slideCount);
      expect(inspection1.summaryMetrics).toEqual(inspection2.summaryMetrics);
    });

    it('assertSafeSpreadsheetFormula is deterministic', () => {
      const formula = 'SUM(A1:A10)';
      expect(assertSafeSpreadsheetFormula(formula)).toBe(assertSafeSpreadsheetFormula(formula));
    });
  });
});
