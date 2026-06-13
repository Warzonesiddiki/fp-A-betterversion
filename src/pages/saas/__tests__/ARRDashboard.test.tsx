import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [
      {
        id: '1',
        account: '4000',
        accountName: 'Revenue',
        amount: 100000,
        period: '2026-01',
        department: 'Sales',
        type: 'revenue',
      },
      {
        id: '2',
        account: '5000',
        accountName: 'COGS',
        amount: 30000,
        period: '2026-01',
        department: 'COGS',
        type: 'expense',
      },
    ],
  })),
}));

vi.mock('@/engines/SaaSMetricsEngine', () => ({
  SaaSMetricsEngine: {
    calculateARR: vi.fn(() => 0),
    calculateNRR: vi.fn(() => 0),
    calculateQuickRatio: vi.fn(() => 0),
  },
}));

vi.mock('@/components/dashboard/KPICard', () => ({
  KPICard: ({ title }: { title: string }) => <div data-testid="kpi-card">{title}</div>,
}));

vi.mock('@/components/analytics/ChartWrapper', () => ({
  ChartWrapper: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid="chart-wrapper">
      {title}
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/WaterfallChart', () => ({
  WaterfallChart: () => <div data-testid="waterfall-chart" />,
}));

vi.mock('@/components/ui/HelpPanel', () => ({
  HelpPanel: () => <div data-testid="help-panel" />,
}));

vi.mock('lucide-react', () => ({
  BarChart4: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
  TrendingUp: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
  Users: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
  RefreshCcw: ({ className }: { className?: string }) => (
    <span data-testid="icon" className={className} />
  ),
}));

import { render, screen } from '@/test/testUtils';
import ARRDashboard from '../ARRDashboard';

describe('ARRDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no entries', () => {
    render(<ARRDashboard />);
    expect(screen.getByText(/no saas data found/i)).toBeDefined();
  });

  it('renders import button in empty state', () => {
    render(<ARRDashboard />);
    expect(screen.getByText(/import gl data/i)).toBeDefined();
  });

  it('renders message about subscription revenue', () => {
    render(<ARRDashboard />);
    expect(screen.getByText(/subscription revenue/i)).toBeDefined();
  });
});
