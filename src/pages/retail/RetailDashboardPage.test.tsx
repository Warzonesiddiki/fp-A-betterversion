import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

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
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  Cell: () => null,
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
    Store: makeIcon(),
    TrendingUp: makeIcon(),
    DollarSign: makeIcon(),
    Users: makeIcon(),
    ShoppingCart: makeIcon(),
    BarChart3: makeIcon(),
    Download: makeIcon(),
    RefreshCw: makeIcon(),
    Eye: makeIcon(),
    ArrowUpRight: makeIcon(),
    ArrowDownRight: makeIcon(),
    Minus: makeIcon(),
  };
});

import RetailDashboardPage from '@/pages/retail/RetailDashboardPage';

describe('RetailDashboardPage smoke test', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <RetailDashboardPage />
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it('displays the retail dashboard heading', () => {
    const { getByText } = render(
      <MemoryRouter>
        <RetailDashboardPage />
      </MemoryRouter>
    );
    expect(getByText(/Retail Dashboard/i)).toBeInTheDocument();
  });
});
