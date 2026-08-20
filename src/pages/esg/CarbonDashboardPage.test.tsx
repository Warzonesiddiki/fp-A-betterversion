import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn() },
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
    Download: makeIcon(),
    Leaf: makeIcon(),
    TrendingDown: makeIcon(),
    Target: makeIcon(),
    Factory: makeIcon(),
  };
});

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => <div />,
  AreaChart: () => <div data-testid="area-chart" />,
  Area: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

import CarbonDashboardPage from '@/pages/esg/CarbonDashboardPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/esg/carbon']}>
      <CarbonDashboardPage />
    </MemoryRouter>
  );
}

describe('CarbonDashboardPage smoke test', () => {
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
  it('displays expected empty state with the carbon-domain title (session 028)', () => {
    renderPage();
    // Pre-session-028: page rendered fabricated scope buckets
    // (Scope 1: 12500, Scope 2: 8200, Scope 3: 35800) even with no GL
    // entries. Post-session-028: page empty-states when entries.length === 0
    // and discloses the missing emissions feed. The new heading is
    // "No Carbon Data" — asserting the absence of fabricated scope
    // numbers is the regression lock.
    expect(screen.getByText(/No Carbon Data/i)).toBeTruthy();
    expect(screen.queryByText(/Scope 1 \(Direct\)/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Natural Gas Combustion/)).not.toBeInTheDocument();
  });
});
