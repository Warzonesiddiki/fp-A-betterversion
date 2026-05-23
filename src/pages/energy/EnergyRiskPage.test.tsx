import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

const mockGLState = { trialBalance: [], entries: [] };
vi.mock('@/store/glStore', () => ({
  useGLStore: (selector?: (s: typeof mockGLState) => unknown) =>
    selector ? selector(mockGLState) : mockGLState,
}));

vi.mock('@/components/ui/PeriodPicker', () => ({
  PeriodPicker: () => <div data-testid="period-picker" />,
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
    ShieldAlert: makeIcon(),
    TrendingDown: makeIcon(),
    AlertTriangle: makeIcon(),
    Activity: makeIcon(),
    Lock: makeIcon(),
    Unlock: makeIcon(),
    Download: makeIcon(),
    BarChart3: makeIcon(),
    Flame: makeIcon(),
    ArrowRightLeft: makeIcon(),
    ArrowUpRight: makeIcon(),
    ArrowDownRight: makeIcon(),
    Minus: makeIcon(),
    ChevronUp: makeIcon(),
    ChevronDown: makeIcon(),
    ChevronsUpDown: makeIcon(),
  };
});

vi.mock('@/components/ui/Sparkline', () => ({
  Sparkline: () => <div data-testid="sparkline" />,
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="data-table">{data?.length ?? 0} rows</div>
  ),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ComposedChart: () => <div data-testid="composed-chart" />,
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => <div />,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  Cell: () => <div />,
}));

import EnergyRiskPage from '@/pages/energy/EnergyRiskPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/energy/risk']}>
      <EnergyRiskPage />
    </MemoryRouter>
  );
}

describe('EnergyRiskPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays heading', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /Energy Risk Management/i })).toBeTruthy();
  });
});
