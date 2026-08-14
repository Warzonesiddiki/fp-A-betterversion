import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/engines/COGSVarianceEngine', () => ({
  COGSVarianceEngine: {
    calculateGLVariances: vi.fn(() => ({
      actualCOGS: 0,
      standardCOGS: 0,
      totalVariance: 0,
      breakdown: [{ name: 'test', value: 0 }],
    })),
  },
}));

vi.mock('@/components/analytics/ChartWrapper', () => ({
  ChartWrapper: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="chart-wrapper">{children}</div>
  ),
}));

vi.mock('@/components/dashboard/KPICard', () => ({
  KPICard: ({ title }: { title: string }) => <div data-testid="kpi-card">{title}</div>,
}));

vi.mock('@/components/ui/HelpPanel', () => ({
  HelpPanel: () => <div data-testid="help-panel" />,
}));

vi.mock('../_docs', () => ({
  PAGE_HELP: {},
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
    Factory: makeIcon(),
    Package: makeIcon(),
    BarChart3: makeIcon(),
    AlertCircle: makeIcon(),
    ArrowUpRight: makeIcon(),
    ArrowDownRight: makeIcon(),
    Minus: makeIcon(),
  };
});

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => <div />,
  Cell: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
}));

import COGSVariancePage from '@/pages/manufacturing/COGSVariancePage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/manufacturing/cogs-variance']}>
      <COGSVariancePage />
    </MemoryRouter>
  );
}

describe('COGSVariancePage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });
  it('displays expected empty state', () => {
    renderPage();
    expect(screen.getByText(/No Manufacturing Data/i)).toBeTruthy();
  });
});
