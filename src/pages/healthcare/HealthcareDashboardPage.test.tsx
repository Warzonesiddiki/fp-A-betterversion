import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/hooks/usePeriods', () => ({
  usePeriods: vi.fn(() => []),
}));

vi.mock('@/engines', () => ({
  HealthcareEngine: {
    calculatePatientRevenue: vi.fn(() => ({
      netRevenue: 0,
      grossCharges: 0,
      contractuals: 0,
      cashCollected: 0,
      badDebt: 0,
      denialRate: 0,
      collectionRate: 0,
      daysInAR: 0,
    })),
  },
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
    Users: makeIcon(),
    Activity: makeIcon(),
    DollarSign: makeIcon(),
    HeartPulse: makeIcon(),
    TrendingUp: makeIcon(),
    Stethoscope: makeIcon(),
    Building2: makeIcon(),
    Calendar: makeIcon(),
    Download: makeIcon(),
    Share2: makeIcon(),
    MoreHorizontal: makeIcon(),
  };
});

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: () => <div data-testid="area-chart" />,
  Area: () => <div />,
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => <div />,
  Cell: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

import HealthcareDashboardPage from '@/pages/healthcare/HealthcareDashboardPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/healthcare']}>
      <HealthcareDashboardPage />
    </MemoryRouter>
  );
}

describe('HealthcareDashboardPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays expected empty state', () => {
    renderPage();
    expect(screen.getByText(/No Healthcare Data/i)).toBeTruthy();
  });
});
