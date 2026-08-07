import { describe, it, expect } from 'vitest';
import {
  buildPnlRows,
  buildBalanceSheetRows,
  buildCashFlowRows,
  buildBudgetVsActualRows,
  buildReportData,
  type GlLikeEntry,
  type BudgetLikeItem,
} from './reportDataBuilder';

// Known-answer fixture: a clean 4xxx/5xxx/6xxx ledger with a budget.
// Revenue 4-0000: credit 1,250,000 (net +1,250,000)
// COGS   5-0000: debit 750,000 (net −750,000, abs 750,000)
// OpEx   6-0000: debit 300,000 (net −300,000, abs 300,000)
const entries: GlLikeEntry[] = [
  {
    accountCode: '4000',
    accountName: 'Revenue',
    debit: 0,
    credit: 1250000,
    date: '2026-01-31',
    period: '2026-01',
  },
  {
    accountCode: '5000',
    accountName: 'COGS',
    debit: 750000,
    credit: 0,
    date: '2026-01-31',
    period: '2026-01',
  },
  {
    accountCode: '6000',
    accountName: 'OpEx',
    debit: 300000,
    credit: 0,
    date: '2026-01-31',
    period: '2026-01',
  },
];

const budgetItems: BudgetLikeItem[] = [
  { accountCode: '4000', accountName: 'Revenue', amount: 1200000 },
  { accountCode: '5000', accountName: 'COGS', amount: 720000 },
  { accountCode: '6000', accountName: 'OpEx', amount: 310000 },
];

const input = {
  entries,
  budgetItems,
  entityName: 'Acme Corp (US)',
  currency: 'USD',
  periodLabel: 'FY 2026',
};

describe('reportDataBuilder — P&L', () => {
  const data = buildPnlRows(input);

  it('computes real Actual/Budget/Variance rows from GL + budget', () => {
    expect(data.headers).toEqual(['Line Item', 'Actual', 'Budget', 'Variance', 'Var %']);
    const revenueRow = data.rows.find((r) => r[0] === 'Revenue');
    expect(revenueRow).toEqual(['Revenue', 1250000, 1200000, 50000, '4.17%']);
    const cogsRow = data.rows.find((r) => r[0] === 'Cost of Goods Sold');
    expect(cogsRow).toEqual(['Cost of Goods Sold', 750000, 720000, 30000, '4.17%']);
    const gpRow = data.rows.find((r) => r[0] === 'Gross Profit');
    expect(gpRow).toEqual(['Gross Profit', 500000, 480000, 20000, '4.17%']);
    const ebitdaRow = data.rows.find((r) => r[0] === 'EBITDA');
    expect(ebitdaRow).toEqual(['EBITDA', 200000, 170000, 30000, '17.65%']);
  });

  it('never emits the old fabricated constants', () => {
    const json = JSON.stringify(data);
    expect(json).not.toContain("'Revenue', 1250000, 1200000, 50000, '4.2%'");
    expect(json).toContain('Derived from GL trial balance');
  });
});

describe('reportDataBuilder — Balance Sheet', () => {
  it('computes A = L + E with money exactness', () => {
    const bsEntries: GlLikeEntry[] = [
      {
        accountCode: '1100',
        accountName: 'Cash',
        debit: 100000,
        credit: 0,
        date: '2026-01-31',
        period: '2026-01',
      },
      {
        accountCode: '2100',
        accountName: 'AP',
        debit: 0,
        credit: 30000,
        date: '2026-01-31',
        period: '2026-01',
      },
      {
        accountCode: '3100',
        accountName: 'Equity',
        debit: 0,
        credit: 70000,
        date: '2026-01-31',
        period: '2026-01',
      },
    ];
    const data = buildBalanceSheetRows({
      entries: bsEntries,
      entityName: 'Acme Corp (US)',
      currency: 'USD',
      periodLabel: 'FY 2026',
    });
    const assetsRow = data.rows.find((r) => r[0] === 'Total Assets');
    expect(assetsRow).toEqual(['Total Assets', 100000, 0, 100000, '—']);
    const balancedRow = data.rows.find((r) => String(r[0]).includes('A = L + E'));
    expect(balancedRow).toEqual(['A = L + E ✓', 0, '', '', '']);
  });
});

describe('reportDataBuilder — Cash Flow', () => {
  it('computes indirect-method cash flow from GL', () => {
    const data = buildCashFlowRows(input);
    const ni = data.rows.find((r) => r[0] === 'Net Income');
    // Revenue 1,250,000 − (COGS 750,000 + OpEx 300,000) = 200,000
    expect(ni).toEqual(['Net Income', 200000, '', '']);
  });
});

describe('reportDataBuilder — Budget vs Actual', () => {
  it('produces account-level variance rows with status', () => {
    const data = buildBudgetVsActualRows(input);
    expect(data.headers).toEqual([
      'Account',
      'Actual',
      'Budget',
      'Variance $',
      'Variance %',
      'Status',
    ]);
    const revRow = data.rows.find((r) => r[0] === 'Revenue');
    expect(revRow).toEqual(['Revenue', 1250000, 1200000, 50000, '4.17%', 'Favorable']);
  });
});

describe('reportDataBuilder — empty state & dispatch', () => {
  it('returns honest zero rows when no data exists', () => {
    const data = buildPnlRows({
      entries: [],
      budgetItems: [],
      entityName: 'X',
      currency: 'USD',
      periodLabel: 'FY',
    });
    const revenueRow = data.rows.find((r) => r[0] === 'Revenue');
    expect(revenueRow).toEqual(['Revenue', 0, 0, 0, '—']);
    expect(data.footers?.join(' ')).toContain('No GL or budget data imported');
  });

  it('dispatch maps presets and returns explicit no-source layout for unknown ones', () => {
    expect(buildReportData(input, 'preset-pl').headers[0]).toBe('Line Item');
    expect(buildReportData(input, 'preset-bs').headers[0]).toBe('Line Item');
    expect(buildReportData(input, 'preset-kpi').rows[0]).toContain('No data source defined');
  });
});
