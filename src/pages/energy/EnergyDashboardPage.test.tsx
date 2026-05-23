import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [], trialBalance: [] })),
}));

vi.mock('@/hooks/usePeriods', () => ({
  usePeriods: vi.fn(() => []),
}));

vi.mock('@/engines', () => ({
  EnergyEngine: {
    calculateStats: vi.fn(() => ({
      totalRevenue: 0,
      productionVolume: 0,
      avgMarketPrice: 0,
      carbonIntensity: 0,
    })),
    getProductionBySource: vi.fn(() => []),
    getRevenueTrend: vi.fn(() => []),
  },
}));

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  const mocked: Record<string, unknown> = {};
  for (const key of Object.keys(actual)) {
    mocked[key] = makeIcon();
  }
  return mocked;
});

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: () => <div data-testid="area-chart" />,
  Area: () => <div />,
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  Cell: () => <div />,
}));

vi.mock('@/components/ui/PeriodPicker', () => ({
  PeriodPicker: () => <div data-testid="period-picker" />,
}));

import EnergyDashboardPage from '@/pages/energy/EnergyDashboardPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/energy']}>
      <EnergyDashboardPage />
    </MemoryRouter>
  );
}

describe('EnergyDashboardPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays dashboard heading', () => {
    renderPage();
    expect(screen.getByText('Energy Dashboard')).toBeTruthy();
  });
});
