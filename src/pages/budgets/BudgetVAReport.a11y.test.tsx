// =============================================================================
// BudgetVAReport — axe-core a11y regression (populated analysis state)
// -----------------------------------------------------------------------------
// Real budgetStore (approved budget + plan lines) and real glStore (posted
// actuals) drive the CONTENT branch: KPI cards, chart slots and the REAL
// DataTable. Only heavy boundaries are mocked, exactly like the sibling
// suites: recharts/Waterfall/Variance (chart libs) and the Radix Select
// (native <select> double so selection is drivable in jsdom). Bar:
// 0 critical, 0 serious (UI-07); moderate findings tolerated.
// =============================================================================

// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { axe } from 'jest-axe';
import { useBudgetStore } from '@/store/budgetStore';
import { useGLStore } from '@/store/glStore';
import type { GLEntry } from '@/types';

// jsdom has no ResizeObserver; DataTable's virtualizer initializes one even
// below the virtualization threshold. Scoped to this spec file only.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  Object.defineProperty(window, 'ResizeObserver', {
    configurable: true,
    writable: true,
    value: ResizeObserverStub,
  });
}

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Cell: () => null,
  ReferenceLine: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => null,
}));

vi.mock('@/components/ui/WaterfallChart', () => ({
  WaterfallChart: () => <div data-testid="waterfall-chart" />,
}));

vi.mock('@/components/charts/VarianceChart', () => ({
  VarianceChart: () => <div data-testid="variance-chart" />,
}));

// Radix Select → native <select> double (repo-precedented in the unit suite)
// so the populated analysis branch is reachable from jsdom.
vi.mock('@/components/ui/Select', () => ({
  Select: ({
    value,
    onChange,
    placeholder,
    options,
  }: {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
  }) => (
    <select
      data-testid="budget-select"
      aria-label="Select Approved Budget"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    >
      <option value="">{placeholder || 'Select...'}</option>
      {(options ?? []).map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

import BudgetVAReport from './BudgetVAReport';

const expectNoCriticalOrSerious = (results: { violations: Array<{ impact?: string }> }) => {
  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
  expect(blocking).toEqual([]);
};

/** Guards against a silent fallback to the empty/skeleton state. */
const expectRenderedRealContent = (container: HTMLElement, minElements: number) => {
  const elementCount = container.querySelectorAll('*').length;
  expect(
    elementCount,
    `expected populated content (>= ${minElements} elements) but rendered ${elementCount}`
  ).toBeGreaterThanOrEqual(minElements);
};

const APPROVED_BUDGET = {
  id: 'b-1',
  name: 'FY2026 Operating Plan',
  fiscalYear: 2026,
  status: 'Approved',
};

function makeLineItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'li-1',
    budgetId: 'b-1',
    accountId: 'acct-salaries',
    accountName: 'Salaries',
    accountCode: '6000',
    month: 0,
    amount: 1000,
    isLocked: false,
    ...overrides,
  };
}

function makeEntry(overrides: Partial<GLEntry> & { id: string }): GLEntry {
  return {
    accountId: 'acct-1',
    accountCode: '1000',
    accountName: 'Cash',
    period: '2026-01',
    periodName: 'January 2026',
    debit: 0,
    credit: 0,
    netChange: 0,
    date: '2026-01-15',
    amount: 0,
    description: '',
    reference: '',
    ...overrides,
  };
}

/** Posted actuals matched to the seeded plan lines (revenue + expense). */
function postedActuals(): GLEntry[] {
  return [
    makeEntry({ id: 'e-r', accountId: 'acct-rev', accountCode: '4000', credit: 80000 }),
    makeEntry({ id: 'e-x', accountId: 'acct-salaries', accountCode: '6000', debit: 70000 }),
  ];
}

describe('BudgetVAReport a11y (axe-core)', () => {
  const renderReport = () =>
    render(
      <MemoryRouter initialEntries={['/budgets/bva']}>
        <BudgetVAReport />
      </MemoryRouter>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    useBudgetStore.setState({
      budgets: [],
      activeBudgetId: null,
      lineItems: [],
      isLoading: false,
      isSubmitting: false,
      lastChange: null,
      selectedCellId: null,
    });
    useGLStore.setState({ entries: [], accounts: [], trialBalance: [], importError: null });
  });

  it('renders no critical or serious violations in the populated analysis state', async () => {
    useBudgetStore.setState({
      budgets: [APPROVED_BUDGET],
      lineItems: [
        makeLineItem({
          id: 'li-rev',
          accountId: 'acct-rev',
          accountName: 'Revenue',
          accountCode: '4000',
          amount: 90000,
        }),
        makeLineItem({
          id: 'li-sal',
          accountId: 'acct-salaries',
          accountName: 'Salaries',
          accountCode: '6000',
          amount: 75000,
        }),
      ],
    });
    useGLStore.setState({ entries: postedActuals() });

    const { container } = renderReport();

    // Reach the populated branch through the real selection control.
    fireEvent.change(screen.getByTestId('budget-select'), { target: { value: 'b-1' } });

    // Content branch is really on: h1, KPI cards, chart slots and the real
    // breakdown table are all mounted before the scan.
    expect(
      screen.getByRole('heading', { name: /Budget vs\. Actuals/i, level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByText('Total Budget')).toBeInTheDocument();
    expect(screen.getByTestId('waterfall-chart')).toBeInTheDocument();
    expect(screen.getByTestId('variance-chart')).toBeInTheDocument();
    // DataTable renders its table with role="grid" + an accessible name.
    expect(
      screen.getByRole('grid', { name: /Department breakdown data table/i })
    ).toBeInTheDocument();
    expectRenderedRealContent(container, 50);

    expectNoCriticalOrSerious(await axe(container));
  });

  it('renders no critical or serious violations in the selection-guidance state', async () => {
    const { container } = renderReport();

    // Guidance branch is really on: EmptyState under the mounted page h1.
    expect(
      screen.getByRole('heading', { name: /Budget vs\. Actuals/i, level: 1 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: /No Budget Selected/i })
    ).toBeInTheDocument();

    expectNoCriticalOrSerious(await axe(container));
  });
});
