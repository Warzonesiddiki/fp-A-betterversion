import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

/**
 * Populated-state structural contract for the canonical Dashboard.
 *
 * Browser screenshot baselines (pixels, fonts, responsive layout, theme) remain
 * the final visual gate per docs/design/VISUAL_REGRESSION_RUNBOOK.md and are
 * intentionally NOT claimed here. This deterministic DOM/class snapshot is the
 * interim regression signal for the populated workspace state: it protects the
 * truth-state label ("Draft — Local workspace data"), the header hierarchy, and
 * the KPI layout without asserting rendered pixels.
 */

const POPULATED_ENTRIES = [
  {
    id: 'e1',
    accountCode: '4000',
    debit: 0,
    credit: 100000,
    period: '2026-01',
    date: '2026-01-15',
  },
  {
    id: 'e2',
    accountCode: '4000',
    debit: 0,
    credit: 120000,
    period: '2026-02',
    date: '2026-02-15',
  },
  {
    id: 'e3',
    accountCode: '5000',
    debit: 60000,
    credit: 0,
    period: '2026-01',
    date: '2026-01-15',
  },
  {
    id: 'e4',
    accountCode: '6000',
    debit: 20000,
    credit: 0,
    period: '2026-01',
    date: '2026-01-15',
  },
];

const ACCOUNTS = [{ code: '4000', name: 'Revenue' }];

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: POPULATED_ENTRIES, accounts: ACCOUNTS })),
}));

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: vi.fn(() => ({ budgets: [], lineItems: [] })),
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
  ChartWrapper: ({ children, title, headingLevel }: any) => (
    <div data-testid="chart-wrapper">
      {headingLevel === 'h2' ? <h2>{title}</h2> : <h3>{title}</h3>}
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/HelpPanel', () => ({
  HelpPanel: () => <div data-testid="help-panel" />,
}));

vi.mock('@/components/ui/DrillDownModal', () => ({
  DrillDownModal: () => <div data-testid="drill-down-modal" />,
}));

vi.mock('@/components/ai/AICopilotPanel', () => ({
  AICopilotPanel: () => <div data-testid="ai-copilot-panel" />,
}));

vi.mock('@/components/ai/NLQChat', () => ({
  NLQChat: () => <div data-testid="nlq-chat" />,
}));

vi.mock('@/components/ai/AnomalyHighlight', () => ({
  AnomalyHighlight: () => <div data-testid="anomaly-highlight" />,
}));

vi.mock('@/components/charts/GaugeChart', () => ({
  GaugeChart: () => <div data-testid="gauge-chart" />,
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

describe('DashboardPage populated-state contract (interim structural baseline)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the populated header with the draft/local-data truth state', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Executive Dashboard' })).toBeTruthy();
    expect(screen.getByText('Draft')).toBeTruthy();
    expect(screen.getByText('Local workspace data')).toBeTruthy();
  });

  it('renders the KPI grid with computed values from local entries', () => {
    renderPage();

    expect(screen.getByText('Total Revenue')).toBeTruthy();
    expect(screen.getByText('Gross Profit')).toBeTruthy();
    expect(screen.getByText('Net Income')).toBeTruthy();
    expect(screen.getByText('Total Expenses')).toBeTruthy();
  });

  it('does not present the setup empty state when workspace data exists', () => {
    renderPage();

    expect(screen.queryByRole('heading', { name: 'Set up your finance workspace' })).toBeNull();
  });

  it('keeps heading order valid: page h1 followed by h2 sections', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Executive Dashboard' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Budget Status' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Key Ratios' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Recent Activity' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Monthly Financial Trend' })).toBeTruthy();
  });

  it('preserves the populated hierarchy in the deterministic DOM baseline', () => {
    const { container } = renderPage();

    expect(container).toMatchSnapshot();
  });

  it('has no automated accessibility violations in the populated state', async () => {
    const { container } = renderPage();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
