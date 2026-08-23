import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

const { useGLStore, calculateGLVariances } = vi.hoisted(() => ({
  useGLStore: vi.fn((): { entries: unknown[] } => ({ entries: [] })),
  calculateGLVariances: vi.fn(),
}));

vi.mock('@/store/glStore', () => ({
  useGLStore,
}));

vi.mock('@/engines/COGSVarianceEngine', () => ({
  COGSVarianceEngine: {
    calculateGLVariances,
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
    useGLStore.mockReturnValue({ entries: [] });
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

  it('renders em-dash placeholders and the standard-cost disclosure when no standards are posted', () => {
    // GL-only ledger: every standard-derived output is null by contract.
    useGLStore.mockReturnValue({ entries: [{ id: 'e1' }] });
    calculateGLVariances.mockReturnValue({
      actualCOGS: 1234.5,
      standardCOGS: null,
      variance: null,
      variancePercent: null,
      totalVariance: null,
      breakdown: null,
    });
    renderPage();
    // Actual COGS is still measured; the three standard-derived cards disclose.
    expect(screen.getByText('Actual COGS')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText('Standard-cost layer required')).toHaveLength(3);
    expect(
      screen.getByText(/Standard-cost layer required\. The general ledger records only actual/i)
    ).toBeInTheDocument();
    // No fabricated decomposition chart renders without posted components.
    expect(screen.queryByTestId('responsive-container')).not.toBeInTheDocument();
  });

  it('renders measured variances when a standard cost and components are posted', () => {
    useGLStore.mockReturnValue({ entries: [{ id: 'e1' }] });
    calculateGLVariances.mockReturnValue({
      actualCOGS: 1000,
      standardCOGS: 950,
      variance: -50,
      variancePercent: -5.26,
      totalVariance: -50,
      breakdown: [
        { name: 'Price', value: -20 },
        { name: 'Usage', value: -15 },
        { name: 'Efficiency', value: 5 },
        { name: 'Volume', value: -10 },
      ],
    });
    renderPage();
    expect(screen.getByText('Total Variance')).toBeInTheDocument();
    expect(screen.getByText('Purchase Price Variance')).toBeInTheDocument();
    expect(screen.getByText('Usage Variance')).toBeInTheDocument();
    // The ChartWrapper mock renders children only, so the decomposition branch
    // is pinned via its container testids.
    expect(screen.getByTestId('chart-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.queryByText(/Standard-cost layer required/i)).not.toBeInTheDocument();
  });
});
