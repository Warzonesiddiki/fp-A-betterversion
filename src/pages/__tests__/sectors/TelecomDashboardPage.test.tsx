import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Session 024: the page now derives every figure from telecomStore and
 * empty-states when nothing is recorded — the old fixtures and literal KPI
 * strip are gone. This test controls the mocked store to exercise both
 * branches.
 */

const mockState = {
  subscribers: [] as Array<{
    id: string;
    plan: string;
    monthlyRevenue: number;
    churnRisk: 'Low' | 'Medium' | 'High';
    status: 'Active' | 'Suspended' | 'Churned';
  }>,
  networkMetrics: [] as Array<{
    region: string;
    uptime: number;
    avgSpeed: number;
    subscribers: number;
  }>,
  arpuTrends: [] as Array<{ month: string; arpu: number; subscribers: number }>,
};

vi.mock('@/store/telecomStore', () => ({
  useTelecomStore: vi.fn(() => mockState),
}));
vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="chart">{children}</div>
  ),
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

import { render, screen } from '@/test/testUtils';
import { TelecomDashboardPage } from '@/pages/sectors/TelecomDashboardPage';

function resetState(): void {
  mockState.subscribers = [];
  mockState.networkMetrics = [];
  mockState.arpuTrends = [];
}

describe('sectors/TelecomDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
  });

  it('empty-states honestly when the workspace has no telecom data', () => {
    render(<TelecomDashboardPage />);
    expect(screen.getByRole('heading', { level: 1, name: /No Telecom Data/i })).toBeInTheDocument();
    // No fabricated KPI strip may render on an empty workspace.
    expect(screen.queryByText('ARPU')).not.toBeInTheDocument();
    expect(screen.queryByText('Active Subscribers')).not.toBeInTheDocument();
  });

  it('renders recorded KPIs when subscribers exist', () => {
    mockState.subscribers = [
      { id: 's1', plan: 'Core', monthlyRevenue: 42.5, churnRisk: 'Low', status: 'Active' },
      { id: 's2', plan: 'Core', monthlyRevenue: 51.5, churnRisk: 'High', status: 'Active' },
    ];
    render(<TelecomDashboardPage />);
    expect(screen.getByText('Active Subscribers')).toBeInTheDocument();
    expect(screen.getByText('ARPU')).toBeInTheDocument();
    // (42.5 + 51.5) / 2 = 47.00
    expect(screen.getByText('$47.00')).toBeInTheDocument();
  });

  it('renders chart containers when an ARPU trend is recorded', () => {
    mockState.arpuTrends = [{ month: '2025-01', arpu: 48.2, subscribers: 10 }];
    render(<TelecomDashboardPage />);
    expect(screen.getAllByTestId('chart').length).toBeGreaterThan(0);
  });
});
