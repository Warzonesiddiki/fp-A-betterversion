import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [],
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
  })),
}));

vi.mock('@/engines', () => ({
  RetailEngine: {
    calculateDashboardStats: vi.fn(() => ({
      avgRevenuePerStore: 3200000,
      avgNetMargin: 27.5,
      salesPerLaborHour: 255,
      avgCustSat: 92.4,
    })),
    getPnLTrend: vi.fn(() => []),
    getStoreBreakdown: vi.fn(() => []),
  },
}));

vi.mock('@/components/ui/KPIValue', () => ({
  KPIValue: ({ label }: { label: string }) => <div data-testid="kpi-value">{label}</div>,
}));

vi.mock('@/components/ui/PeriodPicker', () => ({
  PeriodPicker: () => <div data-testid="period-picker" />,
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: () => <div data-testid="data-table" />,
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Cell: () => null,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
    Target: makeIcon(),
    BarChart3: makeIcon(),
    Download: makeIcon(),
    Filter: makeIcon(),
    Clock: makeIcon(),
    Award: makeIcon(),
  };
});

import StorePerformancePage from '@/pages/retail/StorePerformancePage';

describe('StorePerformancePage smoke test', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <StorePerformancePage />
      </MemoryRouter>
    );
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('displays no-data state when entries are empty', () => {
    const { getByText } = render(
      <MemoryRouter>
        <StorePerformancePage />
      </MemoryRouter>
    );
    expect(getByText(/No Retail Data/i)).toBeInTheDocument();
  });
});
