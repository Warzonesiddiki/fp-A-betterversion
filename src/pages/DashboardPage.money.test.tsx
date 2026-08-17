import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';

/**
 * Money / anti-fabrication probe for the Executive Dashboard.
 *
 * The engine under test is REAL: `dashboardModel`, `@/utils/money`, `KPICard`,
 * `useCurrencyFormatter` and `formatPercent` all execute. Only the chart
 * library, the AI panels and the icon set are stubbed, and the recharts stub
 * captures the exact series handed to the chart so the trend data itself is
 * asserted rather than assumed.
 *
 * Seeded ledger (hand-computed, see dashboardModel.test.ts for the derivation):
 *   revenue 95,000 · COGS 50,000 · OpEx 20,000 · interest 2,000 · tax 3,000
 *   gross profit 45,000 · total expenses 75,000 · net income 20,000
 */

const SEEDED_ENTRIES = [
  { id: 'e1', accountCode: '4000', debit: 0, credit: 100000, period: '2026-01' },
  { id: 'e2', accountCode: '4000', debit: 5000, credit: 0, period: '2026-01' },
  { id: 'e3', accountCode: '5000', debit: 60000, credit: 0, period: '2026-01' },
  { id: 'e4', accountCode: '5000', debit: 0, credit: 10000, period: '2026-02' },
  { id: 'e5', accountCode: '6000', debit: 20000, credit: 0, period: '2026-02' },
  { id: 'e6', accountCode: '7000', debit: 2000, credit: 0, period: '2026-02' },
  { id: 'e7', accountCode: '8000', debit: 3000, credit: 0, period: '2026-02' },
];

const glState = { entries: SEEDED_ENTRIES as unknown[], accounts: [{ code: '4000' }] };
const budgetState = { budgets: [] as unknown[] };

vi.mock('@/store/glStore', () => ({ useGLStore: vi.fn(() => glState) }));
vi.mock('@/store/budgetStore', () => ({ useBudgetStore: vi.fn(() => budgetState) }));
vi.mock('@/hooks/useSector', () => ({ useSector: vi.fn(() => ({ sectorConfig: null })) }));
vi.mock('@/hooks/useTour', () => ({ useTour: vi.fn(() => ({ runTour: vi.fn() })) }));
vi.mock('@/components/dashboard/ActivityFeed', () => ({
  ActivityFeed: () => <div data-testid="activity-feed" />,
}));
vi.mock('@/components/ai/AICopilotPanel', () => ({ AICopilotPanel: () => <div /> }));
vi.mock('@/components/ai/NLQChat', () => ({ NLQChat: () => <div /> }));
vi.mock('@/components/ai/AnomalyHighlight', () => ({
  AnomalyHighlight: ({ values }: { values: number[] }) => (
    <div data-testid="anomaly-values">{JSON.stringify(values)}</div>
  ),
}));
vi.mock('@/components/charts/GaugeChart', () => ({
  GaugeChart: ({ value }: { value: number }) => <div data-testid="gauge">{value}</div>,
}));
vi.mock('@/components/analytics/ChartWrapper', () => ({
  ChartWrapper: ({ children, title }: { children?: React.ReactNode; title?: string }) => (
    <div data-testid="chart-wrapper">
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));
vi.mock('@/components/ui/HelpPanel', () => ({ HelpPanel: () => <div /> }));
vi.mock('@/components/ui/DrillDownModal', () => ({ DrillDownModal: () => <div /> }));
vi.mock('./_docs', () => ({ PAGE_HELP: {} }));

vi.mock('recharts', () => ({
  // Capture the exact series the chart receives.
  AreaChart: ({ data, children }: { data: unknown[]; children?: React.ReactNode }) => (
    <div data-testid="trend-series" data-series={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

import DashboardPage from '@/pages/DashboardPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <DashboardPage />
    </MemoryRouter>
  );
}

describe('DashboardPage — figures come from the posted ledger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    glState.entries = SEEDED_ENTRIES;
    budgetState.budgets = [];
  });

  it('renders revenue net of the contra entry, not the Math.abs sum', () => {
    const { container } = renderPage();
    const text = container.textContent ?? '';
    expect(text).toContain('$95,000');
    // 100,000 + |−5,000| = 105,000 is what per-entry Math.abs produced.
    expect(text).not.toContain('$105,000');
  });

  it('renders gross profit, total expenses and net income consistently', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).toContain('$45,000'); // gross profit
    expect(text).toContain('$75,000'); // COGS + OpEx + interest + tax
    expect(text).toContain('$20,000'); // net income
  });

  it('renders margins derived from the ledger', () => {
    const text = renderPage().container.textContent ?? '';
    expect(text).toContain('47.4%'); // gross margin  45,000 / 95,000
    expect(text).toContain('21.1%'); // net margin    20,000 / 95,000
    expect(text).toContain('79.0%'); // expense ratio 75,000 / 95,000
  });

  it('hands the trend chart POSITIVE revenue for credit-balance revenue accounts', () => {
    renderPage();
    const series = JSON.parse(
      screen.getByTestId('trend-series').getAttribute('data-series') ?? '[]'
    ) as Array<{ month: string; revenue: number; expenses: number; netIncome: number }>;

    expect(series.length).toBeGreaterThan(0);
    const jan = series.find((p) => p.month === '2026-01')!;
    expect(jan.revenue).toBe(95000);
    // Regression lock: the pre-fix page plotted −95,000 here.
    for (const point of series) expect(point.revenue).toBeGreaterThanOrEqual(0);
    expect(jan.netIncome).toBe(35000);
  });

  it('feeds the anomaly scan the same signed revenue series', () => {
    renderPage();
    const values = JSON.parse(screen.getByTestId('anomaly-values').textContent ?? '[]') as number[];
    expect(values).toEqual([95000, 0]);
  });

  it('discloses budget utilization as unavailable instead of showing 0%', () => {
    const { container } = renderPage();
    const text = container.textContent ?? '';
    expect(text).toContain('Utilization');
    expect(text).toMatch(/Utilization needs a posted budget amount/);
    expect(screen.queryByTestId('gauge')).toBeNull();
  });

  it('shows a real utilization once a budget exists', () => {
    budgetState.budgets = [{ status: 'Approved', totalAmount: 150000 }];
    const { container } = renderPage();
    expect(container.textContent).toContain('50.0%'); // 75,000 / 150,000
    expect(screen.getByTestId('gauge').textContent).toBe('50');
  });

  it('renders no financial figure at all when the ledger is empty', () => {
    glState.entries = [];
    const { container } = renderPage();
    expect(screen.getByRole('heading', { name: 'Set up your finance workspace' })).toBeTruthy();
    expect(container.textContent).not.toMatch(/\$\d/);
  });
});

describe('DashboardPage — source guard', () => {
  const source = fs
    .readFileSync(path.resolve(__dirname, 'DashboardPage.tsx'), 'utf8')
    // Strip comments so the guard cannot trip on prose that names the defect.
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('does not accumulate debit − credit into a revenue bucket', () => {
    expect(source).not.toMatch(/revenue\s*\+=/);
    expect(source).not.toMatch(/debit\s*-\s*e?\.?credit/);
  });

  it('does not Math.abs a ledger amount', () => {
    expect(source).not.toMatch(/Math\.abs\s*\(\s*(e\.|amt|value|totalExpenses)/);
  });

  it('does no raw float money arithmetic in the view', () => {
    expect(source).not.toMatch(/kpis\.\w+\s*[+\-*/]\s*kpis\.\w+/);
    expect(source).not.toMatch(/\/\s*kpis\.totalRevenue/);
  });

  it('derives every figure through the shared model', () => {
    expect(source).toMatch(/from '@\/pages\/dashboard\/dashboardModel'/);
    expect(source).toMatch(/deriveDashboardKpis\(entries, budgets\)/);
    expect(source).toMatch(/deriveMonthlyTrend\(entries\)/);
  });

  it('imports no money primitive other than the canonical one', () => {
    expect(source).not.toMatch(/from '@\/utils\/decimalUtils'/);
  });
});
