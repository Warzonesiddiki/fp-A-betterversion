import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'jest-axe';
import type { Budget, BudgetLineItem, GLEntry } from '../../types';

/**
 * WCAG 2.1 AA — automated axe-core regression suite for the POPULATED state.
 *
 * Why this file exists, alongside `wcag-aa.test.tsx`:
 *
 * The sibling suite renders each page with the default (empty) stores. That was
 * measured, not assumed — instrumenting it showed the report routes were being
 * scanned at 5-6 DOM elements and ~70 characters of text, i.e. axe was only ever
 * auditing the "No data yet" empty state. Those pages are clean because there is
 * almost nothing there to audit: no tables, no headers, no data cells, no
 * interactive controls beyond a single "Import Data" button.
 *
 * The populated state is where the accessibility risk actually lives - column
 * headers, scoped data cells, heading order across sections, and the controls
 * that only mount once a report has something to show. This suite mocks the GL
 * and budget stores so each page renders its real content, then holds that
 * content to the same bar.
 *
 * Bar (per the UI-07 target): 0 critical, 0 serious. Moderate findings are
 * reported but tolerated, matching `expectNoCriticalOrSerious` in the sibling
 * suite. ChartOfAccountsPage's `heading-order` moderate is now fixed (its card
 * title was an `h3` directly under the PageHeader `h1`) and pinned below, so
 * these four routes currently scan completely clean.
 *
 * DashboardPage's populated state is already covered by
 * `src/pages/DashboardPage.populated.contract.test.tsx`, so it is not repeated here.
 */

const glEntry = (
  id: string,
  accountCode: string,
  accountName: string,
  debit: number,
  credit: number,
  period: string
): GLEntry => ({
  id,
  accountId: `acct-${accountCode}`,
  accountCode,
  accountName,
  period,
  periodName: period,
  debit,
  credit,
  netChange: debit - credit,
  date: `${period}-15`,
  amount: debit - credit,
  description: `${accountName} activity`,
  reference: `REF-${id}`,
});

const POPULATED_ENTRIES: readonly GLEntry[] = [
  glEntry('e1', '4000', 'Revenue', 0, 100000, '2026-01'),
  glEntry('e2', '4000', 'Revenue', 0, 120000, '2026-02'),
  glEntry('e3', '5000', 'COGS', 60000, 0, '2026-01'),
  glEntry('e4', '5000', 'COGS', 66000, 0, '2026-02'),
  glEntry('e5', '6000', 'Operating Expenses', 20000, 0, '2026-01'),
  glEntry('e6', '6000', 'Operating Expenses', 25000, 0, '2026-02'),
];

const ACCOUNTS = [
  { code: '4000', name: 'Revenue' },
  { code: '5000', name: 'COGS' },
  { code: '6000', name: 'Operating Expenses' },
];

const BUDGET: Budget = {
  id: 'budget-1',
  name: 'FY2026 Operating Plan',
  description: 'Approved operating plan',
  fiscalYear: 2026,
  status: 'Approved',
  template: 'standard',
  departments: [],
  entities: [],
  baseCurrency: 'USD',
  totalAmount: 200000,
  createdBy: 'u1',
  createdByName: 'Planner',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  submittedAt: null,
  approvedAt: '2026-01-02T00:00:00.000Z',
  approvedBy: 'u2',
  version: 1,
  progress: 100,
};

const budgetLine = (
  id: string,
  accountCode: string,
  accountName: string,
  month: number,
  amount: number
): BudgetLineItem => ({
  id,
  budgetId: BUDGET.id,
  accountId: `acct-${accountCode}`,
  accountName,
  accountCode,
  accountType: 'Expense',
  periodId: `2026-${String(month).padStart(2, '0')}`,
  month,
  amount,
  formula: null,
  isCalculated: false,
  isLocked: false,
  isReadOnly: false,
  notes: null,
  driverId: null,
  assumptions: null,
  version: 1,
  createdBy: 'u1',
  updatedBy: 'u1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const LINE_ITEMS: readonly BudgetLineItem[] = [
  budgetLine('li1', '5000', 'COGS', 1, 55000),
  budgetLine('li2', '5000', 'COGS', 2, 60000),
  budgetLine('li3', '6000', 'Operating Expenses', 1, 22000),
  budgetLine('li4', '6000', 'Operating Expenses', 2, 24000),
];

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: POPULATED_ENTRIES, accounts: ACCOUNTS })),
}));

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: vi.fn(() => ({ budgets: [BUDGET], lineItems: LINE_ITEMS })),
}));

import ProfitLossPage from '../../pages/reports/ProfitLossPage';
import CashFlowPage from '../../pages/reports/CashFlowPage';
import BudgetVsActualPage from '../../pages/reports/BudgetVsActualPage';
import { ChartOfAccountsPage } from '../../pages/charts/ChartOfAccountsPage';

const withRouter = (ui: React.ReactElement) => (
  <MemoryRouter initialEntries={['/']}>{ui}</MemoryRouter>
);

const expectNoCriticalOrSerious = (results: { violations: Array<{ impact?: string }> }) => {
  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
  expect(blocking).toEqual([]);
};

/**
 * Guards against the failure mode this suite was written to close: if a page
 * silently falls back to its empty state or a skeleton, axe would pass on a
 * near-empty container and the assertion above would be meaningless.
 */
const expectRenderedRealContent = (container: HTMLElement, minElements: number) => {
  const elementCount = container.querySelectorAll('*').length;
  expect(
    elementCount,
    `expected populated content (>= ${minElements} elements) but rendered ${elementCount}; ` +
      'the page probably fell back to its empty or loading state'
  ).toBeGreaterThanOrEqual(minElements);
};

describe('WCAG 2.1 AA — populated-state axe-core regression suite', () => {
  it('ProfitLossPage has no critical or serious a11y violations when populated', async () => {
    const { container } = render(withRouter(<ProfitLossPage />));

    expectRenderedRealContent(container, 30);
    expectNoCriticalOrSerious(await axe(container));
  });

  it('CashFlowPage has no critical or serious a11y violations when populated', async () => {
    const { container } = render(withRouter(<CashFlowPage />));

    expectRenderedRealContent(container, 30);
    expectNoCriticalOrSerious(await axe(container));
  });

  it('ChartOfAccountsPage has no critical or serious a11y violations when populated', async () => {
    const { container } = render(withRouter(<ChartOfAccountsPage />));

    expectRenderedRealContent(container, 30);
    expectNoCriticalOrSerious(await axe(container));
  });

  it('BudgetVsActualPage has no critical or serious a11y violations when populated', async () => {
    const { container } = render(withRouter(<BudgetVsActualPage />));

    expectRenderedRealContent(container, 30);
    expectNoCriticalOrSerious(await axe(container));
  });

  /**
   * ChartOfAccountsPage shipped an `h1` -> `h3` skip: `PageHeader` renders the
   * `h1` and `CardTitle` hardcoded an `h3`, so the "Account Details" card
   * jumped a level. Screen-reader users navigating by heading lose the
   * structural cue that the card is a direct child of the page.
   *
   * This asserts the document outline directly rather than the absence of an
   * axe id, because the levels are the thing that has to stay correct - an axe
   * rule can be renamed or retired while the outline silently rots.
   */
  it('ChartOfAccountsPage heading levels never skip a level', () => {
    const { container } = render(withRouter(<ChartOfAccountsPage />));

    const levels = [...container.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) =>
      Number(h.tagName[1])
    );

    expect(levels.length, 'expected the populated page to render headings').toBeGreaterThan(1);
    expect(levels[0], 'the page must open at h1').toBe(1);
    for (let i = 1; i < levels.length; i += 1) {
      expect(
        levels[i]! - levels[i - 1]!,
        `heading jumped from h${levels[i - 1]} to h${levels[i]}`
      ).toBeLessThanOrEqual(1);
    }
  });

  it('renders real tabular content, not an empty-state shell', () => {
    const { container } = render(withRouter(<ChartOfAccountsPage />));

    // The empty state has no table at all; the populated state lists every account.
    expect(container.querySelectorAll('table').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('tr').length).toBeGreaterThan(1);
  });
});
