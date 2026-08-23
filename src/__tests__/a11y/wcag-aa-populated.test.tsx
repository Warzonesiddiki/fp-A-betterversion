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

// E-02 fixtures — shapes follow src/types/index.ts (Forecast @100, Scenario @157).
const FORECASTS = [
  {
    id: 'fc-1',
    name: 'FY2026 Rolling Forecast',
    description: 'Rolling 12-month forecast off the operating plan',
    type: 'Rolling',
    baseBudgetId: BUDGET.id,
    baseBudgetName: BUDGET.name,
    status: 'InProgress' as const,
    rollingWindowMonths: 12,
    confidenceLevel: 'Medium' as const,
    createdBy: 'u1',
    createdByName: 'Planner',
    lastUpdated: '2026-03-01T00:00:00.000Z',
    createdAt: '2026-01-15T00:00:00.000Z',
  },
];

const SCENARIOS = [
  {
    id: 'scn-1',
    name: 'Base Case',
    description: 'Approved baseline assumptions',
    baseBudgetId: BUDGET.id,
    baseBudgetName: BUDGET.name,
    type: 'Base' as const,
    probability: 1,
    isActive: true,
    isLocked: true,
    assumptions: [],
    calculatedMetrics: {
      revenue: 1200000,
      ebitda: 240000,
      netIncome: 150000,
      cashFlow: 180000,
      headcount: 100,
      burnRate: 40000,
      runway: 18,
      grossMargin: 62,
      ebitdaMargin: 20,
    },
    createdBy: 'u1',
    createdByName: 'Planner',
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
  },
];

vi.mock('@/store/glStore', () => ({
  // E-02: extended with the fields GLTrialBalancePage destructures at render
  // (it calls generateTrialBalance() inside a mount effect, so it must be a
  // stub; the page renders `trialBalance` rows when the sort-store is empty).
  // Additive — existing consumers are unaffected.
  useGLStore: vi.fn(() => ({
    entries: POPULATED_ENTRIES,
    accounts: ACCOUNTS,
    trialBalance: TB_ROWS,
    isLoading: false,
    generateTrialBalance: vi.fn(),
  })),
}));

// Trial-balance row shape mirrors computeTrialBalanceTotals' input contract
// (GLTrialBalancePage.tsx:36-50): per-account beginning/net/ending + period debits/credits.
const TB_ROWS = [
  {
    accountId: '1000',
    accountCode: '1000',
    accountName: 'Cash — Operating',
    beginningBalance: 50000,
    netChange: 12500,
    endingBalance: 62500,
    debit: 32500,
    credit: 20000,
  },
  {
    accountId: '4000',
    accountCode: '4000',
    accountName: 'Revenue — Services',
    beginningBalance: 0,
    netChange: -80000,
    endingBalance: -80000,
    debit: 0,
    credit: 80000,
  },
];

vi.mock('@/store/budgetStore', () => ({
  // E-02: action stubs added for BudgetListPage's destructure (invoked only
  // from row menus; never during render).
  useBudgetStore: vi.fn(() => ({
    budgets: [BUDGET],
    lineItems: LINE_ITEMS,
    isLoading: false,
    submitBudget: vi.fn(),
    approveBudget: vi.fn(),
    rejectBudget: vi.fn(),
    deleteBudget: vi.fn(),
    duplicateBudget: vi.fn(),
  })),
}));

// E-02 populated sweeps: forecast + scenario stores (destructure-style
// consumption; selector calls receive the whole state object, which is safe —
// the selected actions are only invoked from event handlers).
vi.mock('@/store/forecastStore', () => ({
  // Selector-aware: some consumers destructure, others select
  // (e.g. CompetitiveGapsToolbar-style children call useScenarioStore((s)=>…)).
  useForecastStore: vi.fn((sel?: (s: { forecasts: typeof FORECASTS }) => unknown) => {
    const state = { forecasts: FORECASTS };
    return sel ? sel(state) : state;
  }),
}));

vi.mock('@/store/scenarioStore', () => ({
  useScenarioStore: vi.fn(
    (
      sel?: (s: {
        scenarios: typeof SCENARIOS;
        setSelectedScenario: ReturnType<typeof vi.fn>;
        lockScenario: ReturnType<typeof vi.fn>;
        unlockScenario: ReturnType<typeof vi.fn>;
      }) => unknown
    ) => {
      const state = {
        scenarios: SCENARIOS,
        setSelectedScenario: vi.fn(),
        lockScenario: vi.fn(),
        unlockScenario: vi.fn(),
      };
      return sel ? sel(state) : state;
    }
  ),
}));

vi.mock('@/store/glTrialBalanceStore', () => ({
  useGLTrialBalanceStore: vi.fn(
    (
      sel?: (s: {
        setRows: ReturnType<typeof vi.fn>;
        sortConfig: null;
        filteredRows: typeof TB_ROWS;
        setSort: ReturnType<typeof vi.fn>;
      }) => unknown
    ) => {
      const state = { setRows: vi.fn(), sortConfig: null, filteredRows: TB_ROWS, setSort: vi.fn() };
      return sel ? sel(state) : state;
    }
  ),
}));

import ProfitLossPage from '../../pages/reports/ProfitLossPage';
import CashFlowPage from '../../pages/reports/CashFlowPage';
import BudgetVsActualPage from '../../pages/reports/BudgetVsActualPage';
import { ChartOfAccountsPage } from '../../pages/charts/ChartOfAccountsPage';

// E-02 populated sweeps (top-20 route additions).
import BudgetListPage from '../../pages/budgets/BudgetListPage';
import GLTrialBalancePage from '../../pages/data/GLTrialBalancePage';
import ForecastListPage from '../../pages/forecasts/ForecastListPage';
import ScenarioListPage from '../../pages/scenarios/ScenarioListPage';

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

  // E-02 populated sweeps for the top-20 route additions. Same bar: rendered
  // real content + 0 critical / 0 serious axe violations.
  describe('E-02 route additions (populated)', () => {
    it('/budgets (BudgetListPage) renders populated budgets with no critical/serious violations', async () => {
      const { container } = render(withRouter(<BudgetListPage />));
      expectRenderedRealContent(container, 30);
      expectNoCriticalOrSerious(await axe(container));
    });

    it('/data/gl-trial-balance (GLTrialBalancePage) renders entries with no critical/serious violations', async () => {
      const { container } = render(withRouter(<GLTrialBalancePage />));
      expectRenderedRealContent(container, 30);
      expectNoCriticalOrSerious(await axe(container));
    });

    it('/forecasts (ForecastListPage) renders forecasts with no critical/serious violations', async () => {
      const { container } = render(withRouter(<ForecastListPage />));
      expectRenderedRealContent(container, 20);
      expectNoCriticalOrSerious(await axe(container));
    });

    it('/scenarios (ScenarioListPage) renders scenarios with no critical/serious violations', async () => {
      const { container } = render(withRouter(<ScenarioListPage />));
      expectRenderedRealContent(container, 20);
      expectNoCriticalOrSerious(await axe(container));
    });
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
