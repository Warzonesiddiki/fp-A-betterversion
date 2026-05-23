import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

const mockREState = {
  maintenanceTrend: [],
  facilities: [],
};
vi.mock('@/store/realEstateStore', () => ({
  useRealEstateStore: (selector?: (s: typeof mockREState) => unknown) =>
    selector ? selector(mockREState) : mockREState,
}));

vi.mock('@/components/ui/PeriodPicker', () => ({
  PeriodPicker: () => <div data-testid="period-picker" />,
}));

vi.mock('@/components/ui/Sparkline', () => ({
  Sparkline: () => <div data-testid="sparkline" />,
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="data-table">{data?.length ?? 0} rows</div>
  ),
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
    Wrench: makeIcon(),
    Zap: makeIcon(),
    Droplets: makeIcon(),
    ShieldCheck: makeIcon(),
    AlertTriangle: makeIcon(),
    BarChart3: makeIcon(),
    TrendingDown: makeIcon(),
    Download: makeIcon(),
    Tool: makeIcon(),
    Clock: makeIcon(),
    Settings: makeIcon(),
    ArrowUpRight: makeIcon(),
    ArrowDownRight: makeIcon(),
    Minus: makeIcon(),
    ChevronUp: makeIcon(),
    ChevronDown: makeIcon(),
    ChevronsUpDown: makeIcon(),
  };
});

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => <div />,
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  Cell: () => <div />,
}));

import FacilityManagementPage from '@/pages/realestate/FacilityManagementPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/realestate/facilities']}>
      <FacilityManagementPage />
    </MemoryRouter>
  );
}

describe('FacilityManagementPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /Facility Operations/i })).toBeTruthy();
  });
});
