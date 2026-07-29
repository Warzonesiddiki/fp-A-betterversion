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
  ExportEngine: { exportToExcel: vi.fn(async () => {}) },
  BankingEngine: {
    calculateNIMStats: vi.fn(() => ({
      nim: 3.2,
      netInterestInc: 1200000,
      yieldOnAssets: 5.1,
      costOfFunds: 1.9,
      trend: [3.0, 3.1, 3.2],
    })),
  },
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToExcel: vi.fn(async () => {}) },
}));

vi.mock('@/components/dashboard/KPICard', () => ({
  KPICard: ({ title }: { title: string }) => <div data-testid="kpi-card">{title}</div>,
}));

vi.mock('@/components/analytics/ChartWrapper', () => ({
  ChartWrapper: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart-wrapper">{children}</div>
  ),
}));

vi.mock('@/components/ui/DataGrid', () => ({
  DataGrid: () => <div data-testid="data-grid" />,
}));

vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
    Activity: makeIcon(),
    ArrowDownRight: makeIcon(),
    ArrowUpRight: makeIcon(),
    Download: makeIcon(),
  };
});

import NIMDashboardPage from '@/pages/banking/NIMDashboardPage';

describe('NIMDashboardPage smoke test', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <NIMDashboardPage />
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it('displays no-data state when entries are empty', () => {
    const { getByText } = render(
      <MemoryRouter>
        <NIMDashboardPage />
      </MemoryRouter>
    );
    expect(getByText(/No Banking Data/i)).toBeInTheDocument();
  });
});
