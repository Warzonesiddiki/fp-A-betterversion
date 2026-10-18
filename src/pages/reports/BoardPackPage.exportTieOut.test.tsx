/**
 * Board-pack Excel export ↔ screen tie-out (backlog P0-2).
 *
 * WHY THIS EXISTS
 * ---------------
 * Two separate pieces of board-pack evidence already exist, and neither covers
 * the button the user actually presses:
 *   - `BoardPackPage.probe.test.tsx` holds the SCREEN to an independent ledger
 *     oracle, but it mocks `ExportEngine`, so the export is never exercised.
 *   - `boardPackTieOut.integration.test.ts` holds the CONSOLIDATION package
 *     export to `ConsolidationEngine`, which is a different screen and a
 *     different export path.
 * `BoardPackPage` builds its own export rows from `computeBoardPackReport` and
 * hands them to the real `ExportEngine.exportToExcel`. Nothing proved those
 * bytes carry the same figures the pack shows — the exact "export ties out to
 * the in-app view" evidence the backlog asks for.
 *
 * This suite closes the link end to end for one concrete synthetic ledger:
 *   oracle  ==  on-screen figure  ==  exported .xlsx cell
 * The ledger arithmetic is re-derived in the test body (never read from an
 * engine), the REAL glStore/budgetStore are seeded, and the real ExportEngine
 * writes a real workbook whose bytes are parsed back. Only the browser ends of
 * the path are mocked (file-saver; the global lucide mock).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import ExcelJS from 'exceljs';

const mockSaveAs = vi.fn();
vi.mock('file-saver', () => ({ saveAs: mockSaveAs }));

import BoardPackPage from './BoardPackPage';
import { useGLStore } from '@/store/glStore';
import { useBudgetStore } from '@/store/budgetStore';
import { expectFigure, formatProbeUSD, renderMoneyProbe, seedGLLedger } from '@/test/renderProbe';
import { formatPercent } from '@/utils/financialFormatting';

function resetStores(): void {
  act(() => {
    useGLStore.setState({ entries: [], importError: null });
    useBudgetStore.setState({ budgets: [] });
  });
}

/*
 * One balanced double-entry ledger and its independent first-principles oracle
 * (identical to `BoardPackPage.probe.test.tsx`, so the screen link is the same
 * one that probe already pins):
 *
 *   revenue      = 50_000
 *   expenses     = COGS 12k + OpEx (18k + 8k) + interest 2k + tax 3k = 43_000
 *   net income   = 50k − 43k                                        =  7_000
 *   gross margin = (50k − 12k) / 50k                                =    76 %
 *   assets       = cash 85k + AR 30k                                = 115_000
 *   liabilities  = accrued salaries                                 =   8_000
 *   equity       = posted 100k + earnings 7k                        = 107_000
 *   identity     : 115_000 = 8_000 + 107_000 ✓
 */
const LEDGER = [
  { accountCode: '1010', accountName: 'Cash', debit: 100_000, credit: 0 },
  { accountCode: '3010', accountName: 'Common Stock', debit: 0, credit: 100_000 },

  { accountCode: '1210', accountName: 'Accounts Receivable', debit: 50_000, credit: 0 },
  { accountCode: '4010', accountName: 'Product Revenue', debit: 0, credit: 50_000 },

  { accountCode: '1010', accountName: 'Cash', debit: 20_000, credit: 0 },
  { accountCode: '1210', accountName: 'Accounts Receivable', debit: 0, credit: 20_000 },

  { accountCode: '5010', accountName: 'Cost of Goods Sold', debit: 12_000, credit: 0 },
  { accountCode: '1010', accountName: 'Cash', debit: 0, credit: 12_000 },

  { accountCode: '6010', accountName: 'Salaries Expense', debit: 18_000, credit: 0 },
  { accountCode: '1010', accountName: 'Cash', debit: 0, credit: 18_000 },

  { accountCode: '6020', accountName: 'Accrued Salaries Expense', debit: 8_000, credit: 0 },
  { accountCode: '2110', accountName: 'Accounts Payable', debit: 0, credit: 8_000 },

  { accountCode: '7010', accountName: 'Interest Expense', debit: 2_000, credit: 0 },
  { accountCode: '1010', accountName: 'Cash', debit: 0, credit: 2_000 },

  { accountCode: '8010', accountName: 'Income Tax Expense', debit: 3_000, credit: 0 },
  { accountCode: '1010', accountName: 'Cash', debit: 0, credit: 3_000 },
];

const REVENUE = 50_000;
const EXPENSES = 12_000 + (18_000 + 8_000) + 2_000 + 3_000;
const NET_INCOME = REVENUE - EXPENSES;
const GROSS_MARGIN_PCT = ((REVENUE - 12_000) / REVENUE) * 100;
const ASSETS = 85_000 + 30_000;
const LIABILITIES = 8_000;
const POSTED_EQUITY = 100_000;
const EQUITY = POSTED_EQUITY + NET_INCOME;
const TOTAL_BUDGET = 50_000;

/** Press Export Excel, await the download, parse the workbook, key cells by `section|label`. */
async function exportExcelAndReadCells(): Promise<Map<string, unknown>> {
  fireEvent.click(screen.getByTestId('export-excel'));
  await waitFor(() => expect(mockSaveAs).toHaveBeenCalledTimes(1), { timeout: 10_000 });

  const [blob] = mockSaveAs.mock.calls[0] as [Blob, string];
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await blob.arrayBuffer());
  const sheet = workbook.worksheets[0]!;

  const cells = new Map<string, unknown>();
  sheet.eachRow((row) => {
    const key = `${String(row.getCell(1).value)}|${String(row.getCell(2).value)}`;
    cells.set(key, row.getCell(3).value);
  });
  return cells;
}

describe('BoardPackPage — Excel export ties out to the screen (P0-2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
  });

  it('exports the same figures the screen shows, derived from the ledger', async () => {
    seedGLLedger(LEDGER);
    act(() => {
      useBudgetStore.setState({
        budgets: [
          { id: 'b1', name: 'FY Ops', totalAmount: 40_000 },
          { id: 'b2', name: 'FY CapEx', totalAmount: 10_000 },
        ] as never[],
      });
    });

    renderMoneyProbe(<BoardPackPage />);

    // Screen first: the pack shows the ledger oracle.
    expectFigure(formatProbeUSD(REVENUE));
    expectFigure(formatProbeUSD(EXPENSES)); // includes interest + tax
    expectFigure(formatProbeUSD(NET_INCOME));
    expectFigure(formatProbeUSD(ASSETS));
    expectFigure(formatProbeUSD(LIABILITIES));
    expectFigure(formatProbeUSD(EQUITY));
    expectFigure(formatProbeUSD(TOTAL_BUDGET));
    const grossMarginOnScreen = formatPercent(GROSS_MARGIN_PCT, 1); // "76.0%"
    expect(screen.getAllByText(grossMarginOnScreen).length).toBeGreaterThan(0);

    // Export second: every published cell equals the on-screen figure.
    const cells = await exportExcelAndReadCells();

    expect(cells.get('Exec Summary|Revenue')).toBe(REVENUE);
    expect(cells.get('Exec Summary|Expenses')).toBe(EXPENSES);
    expect(cells.get('Exec Summary|Net Income')).toBe(NET_INCOME);
    expect(cells.get('Exec Summary|Gross Margin %')).toBe(grossMarginOnScreen);
    expect(cells.get('P&L|Revenue')).toBe(REVENUE);
    expect(cells.get('P&L|Expenses')).toBe(EXPENSES);
    expect(cells.get('P&L|Net Income')).toBe(NET_INCOME);
    expect(cells.get('BS|Total Assets')).toBe(ASSETS);
    expect(cells.get('BS|Total Liabilities')).toBe(LIABILITIES);
    expect(cells.get('BS|Total Equity')).toBe(EQUITY); // includes current-period earnings
    expect(cells.get('CF & Budgets|Total Budget')).toBe(TOTAL_BUDGET);
    expect(cells.get('CF & Budgets|Actual Spending')).toBe(EXPENSES);
  });

  it('publishes no wrong variant the pack never claimed', async () => {
    seedGLLedger(LEDGER);
    renderMoneyProbe(<BoardPackPage />);

    const cells = await exportExcelAndReadCells();

    expect(cells.get('Exec Summary|Expenses')).not.toBe(38_000); // dropped interest/tax
    expect(cells.get('BS|Total Equity')).not.toBe(POSTED_EQUITY); // equity without earnings
    expect(cells.get('Exec Summary|Net Income')).not.toBe(-NET_INCOME); // flipped sign
    // A percentage is not money: the gross-margin cell must not be a bare
    // number the engine's currency format would label as dollars.
    expect(cells.get('Exec Summary|Gross Margin %')).not.toBe(GROSS_MARGIN_PCT);
    expect(cells.get('Exec Summary|Gross Margin %')).toBe(formatPercent(GROSS_MARGIN_PCT, 1));
  });

  it('follows the ledger, not a hardcoded figure', async () => {
    seedGLLedger([
      { accountCode: '1010', accountName: 'Cash', debit: 12_345, credit: 0 },
      { accountCode: '4010', accountName: 'Revenue', debit: 0, credit: 12_345 },
    ]);
    renderMoneyProbe(<BoardPackPage />);

    const cells = await exportExcelAndReadCells();

    expect(cells.get('Exec Summary|Revenue')).toBe(12_345);
    expect(cells.get('Exec Summary|Revenue')).not.toBe(REVENUE);
  });
});
