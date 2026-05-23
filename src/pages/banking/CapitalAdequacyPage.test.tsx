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
  ExportEngine: { exportToPDF: vi.fn() },
  BankingEngine: {
    calculateCapitalStats: vi.fn(() => ({
      tier1Ratio: 12.5,
      totalRatio: 14.2,
      tier1Capital: 5000000,
      leverageRatio: 7.1,
      trendData: [
        { name: 'Q1', tier1: 12.0, total: 13.8 },
        { name: 'Q2', tier1: 12.5, total: 14.2 },
      ],
    })),
  },
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn() },
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

vi.mock('@/components/ui/HelpPanel', () => ({
  HelpPanel: () => <div data-testid="help-panel" />,
}));

vi.mock('../_docs', () => ({
  PAGE_HELP: {},
}));

vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
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
    Landmark: makeIcon(),
    ShieldCheck: makeIcon(),
    Download: makeIcon(),
  };
});

import CapitalAdequacyPage from '@/pages/banking/CapitalAdequacyPage';

describe('CapitalAdequacyPage smoke test', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <CapitalAdequacyPage />
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it('displays no-data state when entries are empty', () => {
    const { getByText } = render(
      <MemoryRouter>
        <CapitalAdequacyPage />
      </MemoryRouter>
    );
    expect(getByText(/No Regulatory Data/i)).toBeInTheDocument();
  });
});
