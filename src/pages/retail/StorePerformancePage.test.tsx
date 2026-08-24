import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// ---------------------------------------------------------------------------
// W-FAB remediation pins. This page previously hardcoded a 'North' region for
// every row, decorated all four KPI cards with invented trend deltas and
// sparkline histories, and rendered RetailEngine's placeholder fields
// (salesPerLaborHour = 254 "Needs operational data", avgCustSat = 92.8) as
// measured KPIs. Only GL-derived averages remain as numbers now.
// ---------------------------------------------------------------------------

// Selector-aware mock: the page subscribes via useGLStore((s) => s.entries),
// so the mock must apply a selector when one is passed.
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn((selector?: (s: { entries: unknown[] }) => unknown) => {
    const state = {
      entries: [] as unknown[],
      accounts: [],
      trialBalance: [],
      accountAnalysis: null,
      columnMappings: [],
      isLoading: false,
      importResult: null,
      setEntries: vi.fn(),
      setAccounts: vi.fn(),
      addEntries: vi.fn(),
      clearEntries: vi.fn(),
      setColumnMappings: vi.fn(),
      importData: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/engines/RetailEngine', () => ({
  RetailEngine: {
    // Derived-shape fixture: only fields the page may legitimately display.
    calculateDashboardStats: vi.fn(() => ({
      avgRevenuePerStore: 320000,
      avgNetMargin: 27.5,
      salesPerLaborHour: 254, // placeholder in the real engine; must NOT be displayed
      avgCustSat: 92.8, // placeholder in the real engine; must NOT be displayed
    })),
    getPnLTrend: vi.fn(() => []),
    getStoreBreakdown: vi.fn(() => [
      {
        id: 'S-01',
        name: 'Store S-01',
        revenue: 320000,
        labor: 40000,
        cogs: 180000,
        occupancy: 20000,
        grossProfit: 140000,
        netProfit: 80000,
        margin: 25,
        laborPercent: 12.5,
        rank: 1,
      },
    ]),
  },
}));

vi.mock('@/components/ui/KPIValue', () => ({
  KPIValue: ({ label }: { label: string }) => <div data-testid="kpi-value">{label}</div>,
}));

vi.mock('@/components/ui/PeriodPicker', () => ({
  PeriodPicker: () => <div data-testid="period-picker" />,
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="data-table">rows:{data.length}</div>
  ),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Cell: () => null,
  AreaChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
}));

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    Store: makeIcon(),
    TrendingUp: makeIcon(),
    DollarSign: makeIcon(),
    Users: makeIcon(),
    BarChart3: makeIcon(),
    Download: makeIcon(),
  };
});

import StorePerformancePage from '@/pages/retail/StorePerformancePage';

describe('StorePerformancePage', () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <StorePerformancePage />
      </MemoryRouter>
    );

  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('displays no-data state when entries are empty', () => {
    const { getByText } = renderPage();
    expect(getByText(/No Retail Data/i)).toBeInTheDocument();
  });

  it('never displays the removed fabricated Region column or its literal', async () => {
    const { useGLStore } = await import('@/store/glStore');
    (useGLStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector?: (s: { entries: unknown[] }) => unknown) => {
        const state = {
          entries: [
            {
              id: '1',
              accountId: 'a1',
              accountCode: '4000',
              accountName: 'Revenue',
              period: '2026-01',
              periodName: 'P01',
              debit: 0,
              credit: 100000,
              netChange: 100000,
              date: '2026-01-05',
              amount: 100000,
              description: '',
              reference: '',
              entityId: 'S-01',
            },
          ],
        };
        return selector ? selector(state) : state;
      }
    );
    const { queryByText, getByTestId } = renderPage();
    expect(queryByText('North')).toBeNull();
    expect(queryByText('Region')).toBeNull();
    // The two remaining KPI cards are exactly the GL-derived ones.
    const labels = Array.from(
      getByTestId('store-perf-kpis').querySelectorAll('[data-testid="kpi-value"]')
    ).map((el) => el.textContent);
    expect(labels).toEqual(['Avg Revenue Per Store', 'Avg Net Margin']);
  });

  it('discloses labor-hour and satisfaction metrics instead of rendering placeholder values', async () => {
    const { queryByText, getByText, getByTestId } = renderPage();
    // Neither metric appears as a numeric KPI card (labels pinned above);
    // only the disclosure card may mention them.
    const grid = getByTestId('store-perf-kpis');
    const kpiTexts = Array.from(grid.querySelectorAll('[data-testid="kpi-value"]')).map(
      (el) => el.textContent ?? ''
    );
    expect(kpiTexts.join('|')).not.toContain('254');
    expect(kpiTexts.join('|')).not.toContain('92.8');
    // The placeholder numbers are not rendered standalone anywhere either.
    expect(queryByText('254')).toBeNull();
    expect(queryByText('92.8%')).toBeNull();
    expect(getByText(/not derivable from the posted gl/i)).toBeInTheDocument();
    expect(getByText(/omitted rather than estimated/i)).toBeInTheDocument();
  });
});
