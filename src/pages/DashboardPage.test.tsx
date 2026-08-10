import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [], accounts: [] })),
}));

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: vi.fn(() => ({ budgets: [] })),
}));

vi.mock('@/hooks/useSector', () => ({
  useSector: vi.fn(() => ({ sectorConfig: null })),
}));

vi.mock('@/hooks/useTour', () => ({
  useTour: vi.fn(() => ({ runTour: vi.fn() })),
}));

vi.mock('@/components/dashboard/KPICard', () => ({
  KPICard: (props: any) => <div data-testid="kpi-card">{props.title}</div>,
}));

vi.mock('@/components/dashboard/ActivityFeed', () => ({
  ActivityFeed: () => <div data-testid="activity-feed" />,
}));

vi.mock('@/components/analytics/ChartWrapper', () => ({
  ChartWrapper: ({ children }: any) => <div data-testid="chart-wrapper">{children}</div>,
}));

vi.mock('@/components/ui/HelpPanel', () => ({
  HelpPanel: () => <div data-testid="help-panel" />,
}));

vi.mock('@/components/ui/DrillDownModal', () => ({
  DrillDownModal: () => <div data-testid="drill-down-modal" />,
}));

vi.mock('./_docs', () => ({ PAGE_HELP: {} }));

vi.mock('recharts', () => ({
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
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
    LayoutDashboard: makeIcon(),
    TrendingUp: makeIcon(),
    BarChart3: makeIcon(),
    Upload: makeIcon(),
    Target: makeIcon(),
    HelpCircle: makeIcon(),
    ShieldAlert: makeIcon(),
    AlertTriangle: makeIcon(),
    Info: makeIcon(),
    TrendingDown: makeIcon(),
  };
});

import DashboardPage from '@/pages/DashboardPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <DashboardPage />
    </MemoryRouter>
  );
}

describe('DashboardPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });

  it('displays an actionable finance-workspace setup state when no data exists', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Set up your finance workspace' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Import actuals' })).toBeTruthy();
  });

  it('has no automated accessibility violations in the finance-workspace setup state', async () => {
    const { container } = renderPage();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
