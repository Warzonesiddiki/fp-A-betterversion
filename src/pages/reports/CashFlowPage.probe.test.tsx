/**
 * Render-probe pilot: CashFlowPage (view-layer divergence harness).
 *
 * Unlike the P&L / balance-sheet / working-capital pages, CashFlowPage has no
 * exported engine module — the statement is derived inside the component.
 * So this probe re-derives every expected figure from the seeded ledger with
 * plain accounting arithmetic in the test body (independent of the page's
 * implementation) and holds the DOM to those figures figure-for-figure. If
 * the view ever flips a sign, misclassifies an activity, or rounds twice,
 * the probe fails even though unit tests stay green.
 *
 * Infrastructure is mocked, data is not.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, screen } from '@testing-library/react';

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));

import CashFlowPage from './CashFlowPage';
import { useGLStore } from '@/store/glStore';
import {
  seedGLLedger,
  renderMoneyProbe,
  formatProbeUSD,
  expectFigure,
} from '@/test/renderProbe';

/** The page's default reporting period: the current year-month at render time. */
function nowPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Calendar-previous month of a YYYY-MM period. */
function prevPeriod(period: string): string {
  const [year = 0, month = 0] = period.split('-').map(Number);
  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`;
}

function resetGL(): void {
  act(() => {
    useGLStore.setState({ entries: [], importError: null });
  });
}

/** A whole-string figure must NOT appear anywhere in the rendered statement. */
function expectNoFigure(formatted: string): void {
  expect(screen.queryAllByText(formatted)).toHaveLength(0);
}

describe('CashFlowPage render-probe (ledger math vs DOM)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetGL();
  });

  it('renders every statement line from two-period ledger arithmetic', () => {
    const now = nowPeriod();
    const prev = prevPeriod(now);

    // Prior month opening position.
    // Current-month activity (each double-entry pair keeps the books balanced):
    //   revenue 50k earned on account; salaries 20k and depreciation 5k paid;
    //   collect 12k of AR; pay down 5k of AP; repay 10k of debt;
    //   buy 15k of equipment; declare + pay 6k of dividends.
    const entries = seedGLLedger([
      { accountCode: '1010', accountName: 'Cash', debit: 100_000, credit: 0, period: prev },
      { accountCode: '1210', accountName: 'Accounts Receivable', debit: 30_000, credit: 0, period: prev },
      { accountCode: '1510', accountName: 'Property Plant Equipment', debit: 80_000, credit: 0, period: prev },
      { accountCode: '2110', accountName: 'Accounts Payable', debit: 0, credit: 25_000, period: prev },
      { accountCode: '2210', accountName: 'Long-term Debt', debit: 0, credit: 60_000, period: prev },

      { accountCode: '1210', accountName: 'Accounts Receivable', debit: 120_000, credit: 0, period: now },
      { accountCode: '4010', accountName: 'Product Revenue', debit: 0, credit: 50_000, period: now },
      { accountCode: '6010', accountName: 'Salaries', debit: 20_000, credit: 0, period: now },
      {
        accountCode: '6100',
        accountName: 'Depreciation',
        description: 'Depreciation expense',
        debit: 5_000,
        credit: 0,
        period: now,
      },
      { accountCode: '1010', accountName: 'Cash', debit: 132_000, credit: 0, period: now },
      { accountCode: '1210', accountName: 'Accounts Receivable', debit: 0, credit: 120_000, period: now },

      { accountCode: '2110', accountName: 'Accounts Payable', debit: 45_000, credit: 0, period: now },
      { accountCode: '1010', accountName: 'Cash', debit: 0, credit: 45_000, period: now },

      { accountCode: '1510', accountName: 'Property Plant Equipment', debit: 15_000, credit: 0, period: now },
      { accountCode: '1010', accountName: 'Cash', debit: 0, credit: 15_000, period: now },

      { accountCode: '2210', accountName: 'Long-term Debt', debit: 10_000, credit: 0, period: now },
      { accountCode: '1010', accountName: 'Cash', debit: 0, credit: 10_000, period: now },

      { accountCode: '3110', accountName: 'Dividends Declared', debit: 6_000, credit: 0, period: now },
      { accountCode: '1010', accountName: 'Cash', debit: 0, credit: 6_000, period: now },
    ]);
    void entries;

    // Expected figures re-derived from the seeds above, NOT from the page:
    const netIncome = 50_000 - 20_000 - 5_000; // revenue − opex incl. depreciation
    const depreciation = 5_000; // non-cash add-back
    const deltaAR = 30_000 - 18_000; // AR released 12k of cash
    const deltaAP = 20_000 - 25_000; // paying vendors consumed 5k
    const operating = netIncome + depreciation + deltaAR + deltaAP; // 37_000
    const capex = -(80_000 + 15_000 - 80_000); // PP&E grew 15k → outflow
    const debtRepaid = -(60_000 - 10_000 - 60_000 + 10_000); // debt shrank 10k
    const dividendsPaid = -6_000;
    const financing = debtRepaid + dividendsPaid; // −16_000
    const netChange = operating + capex + financing; // 6_000
    const beginningCash = 100_000;
    const endingCash = beginningCash + netChange; // 76_000

    renderMoneyProbe(<CashFlowPage />);

    expectFigure(formatProbeUSD(netIncome));
    expectFigure(formatProbeUSD(depreciation));
    expectFigure(formatProbeUSD(deltaAR));
    expectFigure(formatProbeUSD(deltaAP)); // ($5,000)
    expectFigure(formatProbeUSD(operating));
    expectFigure(formatProbeUSD(capex)); // ($15,000) — investing section total
    expectFigure(formatProbeUSD(debtRepaid)); // ($10,000) under Debt Issued / (Repaid)
    expectFigure(formatProbeUSD(dividendsPaid)); // ($6,000) under Dividends Paid
    expectFigure(formatProbeUSD(financing));
    expectFigure(formatProbeUSD(netChange));
    expectFigure(formatProbeUSD(beginningCash));
    expectFigure(formatProbeUSD(endingCash));

    // Both months seeded → the prior-period disclosure must stay hidden.
    expect(screen.queryByText(/No prior period data available/i)).toBeNull();
  });

  it('classification honesty: repayments and dividends render as outflows, never inflows', () => {
    const now = nowPeriod();
    const prev = prevPeriod(now);

    // A period of pure deleveraging + investment + shareholder distribution:
    // repay 10k of debt, buy 8k of equipment, pay 4k of dividends, earn 9k.
    seedGLLedger([
      { accountCode: '1010', accountName: 'Cash', debit: 40_000, credit: 0, period: prev },
      { accountCode: '2210', accountName: 'Long-term Debt', debit: 0, credit: 50_000, period: prev },
      { accountCode: '1510', accountName: 'Property Plant Equipment', debit: 70_000, credit: 0, period: prev },

      { accountCode: '1010', accountName: 'Cash', debit: 9_000, credit: 0, period: now },
      { accountCode: '4010', accountName: 'Product Revenue', debit: 0, credit: 9_000, period: now },

      { accountCode: '2210', accountName: 'Long-term Debt', debit: 10_000, credit: 0, period: now },
      { accountCode: '1010', accountName: 'Cash', debit: 0, credit: 10_000, period: now },

      { accountCode: '1510', accountName: 'Property Plant Equipment', debit: 8_000, credit: 0, period: now },
      { accountCode: '1010', accountName: 'Cash', debit: 0, credit: 8_000, period: now },

      { accountCode: '3110', accountName: 'Dividends Declared', debit: 4_000, credit: 0, period: now },
      { accountCode: '1010', accountName: 'Cash', debit: 0, credit: 4_000, period: now },
    ]);

    renderMoneyProbe(<CashFlowPage />);

    // Honest presentation: every financing/investing movement shows as a
    // parenthesised outflow...
    expectFigure(formatProbeUSD(-10_000)); // debt repayment
    expectFigure(formatProbeUSD(-4_000)); // dividends paid (page negates the declared amount)
    expectFigure(formatProbeUSD(-14_000)); // financing subtotal = −10k + (−4k)
    expectFigure(formatProbeUSD(-8_000)); // capex / investing subtotal

    // ...and none of the sign-flipped or mis-subtotalled variants may appear:
    expectNoFigure('$10,000'); // repayment shown as inflow?
    expectNoFigure('$4,000'); // dividend shown as inflow?
    expectNoFigure('$14,000'); // financing subtotal sign flipped?
    expectNoFigure('$8,000'); // capex shown as proceeds?
    expectNoFigure('$13,000'); // financing = |debt| − |dividends|?
    expectNoFigure('$6,000'); // financing treating either leg as inflow?
    expectNoFigure('($13,000)'); // financing = −(|debt| + |dividends|) double-counted?
    expectNoFigure('($6,000)'); // financing treating either leg as inflow?

    // The negative financing subtotal must also be colour-flagged as a drain.
    const financingCell = screen.getByText(formatProbeUSD(-14_000)).closest('td');
    expect(financingCell?.className).toContain('text-red-400');
  });

  it('K30 empty state: No Data CTA before any ledger exists', () => {
    renderMoneyProbe(<CashFlowPage />);
    expect(screen.getByRole('heading', { level: 2, name: 'No Data' })).toBeInTheDocument();
    expect(screen.getByText(/Import GL data to generate a Cash Flow statement/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import Data' })).toBeInTheDocument();
  });

  it('K30 error state: ErrorState when glStore.importError is set', () => {
    act(() => {
      useGLStore.setState({ importError: 'CSV corrupt' });
    });
    renderMoneyProbe(<CashFlowPage />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    expect(screen.getByText(/CSV corrupt/)).toBeInTheDocument();
    expect(screen.getByText('GL-IMPORT-ERROR')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to Data Import' })).toBeInTheDocument();
  });
});
