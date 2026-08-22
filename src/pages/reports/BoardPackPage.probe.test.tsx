/**
 * Render-probe: BoardPackPage (view-layer divergence harness).
 *
 * The pack delegates to computeBoardPackReport (boardPackData.ts), so this
 * probe re-derives every expected figure from the seeded ledger with plain
 * accounting arithmetic in the test body — independent of boardPackData,
 * computeBalanceSheet and the component — and holds the DOM to those figures
 * figure-for-figure. If the view ever drops interest/tax from expenses,
 * reports equity without current-period earnings, flips net income, or
 * computes margin against total costs, the probe fails even though unit
 * tests stay green.
 *
 * Infrastructure is mocked, data is not.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, screen } from '@testing-library/react';

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));

import BoardPackPage from './BoardPackPage';
import { useGLStore } from '@/store/glStore';
import { useBudgetStore } from '@/store/budgetStore';
import {
  seedGLLedger,
  renderMoneyProbe,
  formatProbeUSD,
  expectFigure,
} from '@/test/renderProbe';
import { formatPercent } from '@/utils/financialFormatting';

/** A whole-string figure must NOT appear anywhere in the rendered pack. */
function expectNoFigure(formatted: string): void {
  expect(screen.queryAllByText(formatted, { exact: false })).toHaveLength(0);
}

function resetStores(): void {
  act(() => {
    useGLStore.setState({ entries: [], importError: null });
    useBudgetStore.setState({ budgets: [] });
  });
}

/*
 * One balanced ledger, every row a double-entry pair:
 *   opening: cash 100k against common stock 100k
 *   revenue on account 50k; collect 20k of it
 *   COGS paid 12k; salaries paid 18k + accrued 8k (AP);
 *   interest paid 2k; tax paid 3k
 *
 * Independent derivation (NOT read from any engine module):
 *   revenue     = 50_000
 *   expenses    = 12k + (18k + 8k) + 2k + 3k        = 43_000
 *   net income  = 50k − 43k                        =  7_000
 *   gross margin= (50k − 12k) / 50k                =     76%
 *   cash        = 100k −12k −18k −2k −3k +20k      = 85_000
 *   AR          = 50k − 20k                        = 30_000
 *   assets      = 85k + 30k                        = 115_000
 *   liabilities = accrued salaries                 =  8_000
 *   equity      = posted 100k + earnings 7k        = 107_000
 *   identity    : 115_000 = 8_000 + 107_000 ✓
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

// The same numbers, re-derived here from first principles:
const REVENUE = 50_000;
const EXPENSES = 12_000 + (18_000 + 8_000) + 2_000 + 3_000; // COGS+OpEx+interest+tax
const NET_INCOME = REVENUE - EXPENSES;
const GROSS_MARGIN_PCT = ((REVENUE - 12_000) / REVENUE) * 100;
const ASSETS = 85_000 + 30_000;
const LIABILITIES = 8_000;
const POSTED_EQUITY = 100_000;
const EQUITY = POSTED_EQUITY + NET_INCOME;

describe('BoardPackPage render-probe (ledger math vs DOM)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
  });

  it('renders every section figure from independent ledger arithmetic', () => {
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

    // Exec Summary / P&L
    expectFigure(formatProbeUSD(REVENUE));
    expectFigure(formatProbeUSD(EXPENSES)); // includes interest + tax
    expectFigure(formatProbeUSD(NET_INCOME));
    expect(screen.getAllByText(formatPercent(GROSS_MARGIN_PCT, 1)).length).toBeGreaterThan(0);

    // Balance Sheet Summary — equity MUST include current-period earnings
    expectFigure(formatProbeUSD(ASSETS));
    expectFigure(formatProbeUSD(LIABILITIES));
    expectFigure(formatProbeUSD(EQUITY));

    // Budget overview: two seeded budgets, utilization = expenses / total
    expectFigure(formatProbeUSD(50_000));
    expect(screen.getByText('2')).toBeInTheDocument(); // Budgets count
    expect(screen.getByText(String(LEDGER.length))).toBeInTheDocument(); // GL Entries count
    const utilization = formatPercent((EXPENSES / 50_000) * 100, 1);
    // The page renders "<pct> budget utilization" as one text node.
    expect(screen.getByText(utilization, { exact: false })).toHaveTextContent(
      /budget utilization/i
    );

    // Divergence class negatives — none of these wrong variants may appear:
    expectNoFigure(formatProbeUSD(38_000)); // expenses dropping interest/tax
    expectNoFigure(formatProbeUSD(POSTED_EQUITY)); // equity without earnings
    expectNoFigure(formatProbeUSD(-NET_INCOME)); // flipped net income
    expectNoFigure(formatProbeUSD(REVENUE + 12_000)); // revenue + COGS conflation
    expectNoFigure(formatPercent(((REVENUE - EXPENSES) / REVENUE) * 100, 1)); // margin on total cost
  });

  it('K30 empty state: No Data CTA before any ledger exists', () => {
    renderMoneyProbe(<BoardPackPage />);
    expect(screen.getByRole('heading', { level: 1, name: /board pack/i })).toBeInTheDocument();
    expect(screen.getByText(/No Data — import GL entries/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import Data' })).toBeInTheDocument();
  });

  it('K30 error state: ErrorState when glStore.importError is set', () => {
    act(() => {
      useGLStore.setState({ importError: 'CSV corrupt' });
    });
    renderMoneyProbe(<BoardPackPage />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    expect(screen.getByText(/CSV corrupt/)).toBeInTheDocument();
    expect(screen.getByText('GL-IMPORT-ERROR')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to Data Import' })).toBeInTheDocument();
  });
});
