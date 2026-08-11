import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

/**
 * Compact-viewport structural contract (T-11, handover addon).
 *
 * Covers the two runbook viewport cases that the 11 Atlas structural tests do
 * not: **390px empty** and **1024px populated**
 * (docs/design/VISUAL_REGRESSION_RUNBOOK.md: "Dashboard empty 1440+390,
 * populated 1440+1024"). jsdom cannot evaluate CSS/layout, so these tests
 * assert the DOM contract at each viewport size; PIXEL verification remains a
 * browser-environment gate (T-10) and is intentionally NOT claimed here.
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
  { id: 'e3', accountCode: '5000', debit: 60000, credit: 0, period: '2026-01', date: '2026-01-15' },
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
  KPICard: (props: { title?: string }) => <div data-testid="kpi-card">{props.title}</div>,
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

vi.mock('./_docs', () => ({ PAGE_HELP: {} }));

vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
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
import { useGLStore } from '@/store/glStore';

const WINDOW = window as unknown as { innerWidth: number };

function setViewportWidth(width: number): void {
  Object.defineProperty(WINDOW, 'innerWidth', { value: width, configurable: true });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <DashboardPage />
    </MemoryRouter>
  );
}

afterEach(() => {
  setViewportWidth(1024);
});

describe('DashboardPage compact-viewport structural contract (T-11, runbook 390px)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGLStore).mockReturnValue({
      entries: [],
      accounts: [],
    } as unknown as ReturnType<typeof useGLStore>);
    setViewportWidth(390);
  });

  it('renders the finance-workspace setup (empty) state at 390px', () => {
    // Empty stores → setup state, exactly what the runbook screenshots at 390px.
    renderPage();

    expect(screen.getByRole('heading', { name: 'Set up your finance workspace' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Import actuals' })).toBeTruthy();
    expect(document.querySelector('.fp-workspace-empty-state')).not.toBeNull();
    expect(document.querySelector('ol[aria-label="Setup steps"]')).not.toBeNull();
    // Populated widgets must NOT leak into the empty state.
    expect(screen.queryByText('Total Revenue')).toBeNull();
    expect(screen.queryByTestId('kpi-card')).toBeNull();
  });

  it('has no automated accessibility violations in the 390px empty state', async () => {
    const { container } = renderPage();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('DashboardPage compact-viewport structural contract (T-11, runbook 1024px)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGLStore).mockReturnValue({
      entries: POPULATED_ENTRIES,
      accounts: ACCOUNTS,
    } as unknown as ReturnType<typeof useGLStore>);
    setViewportWidth(1024);
  });

  it('renders the populated header, KPI grid and truth-state label at 1024px', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Executive Dashboard' })).toBeTruthy();
    expect(screen.getByText(/Draft/i)).toBeTruthy();
    expect(screen.getByText('Total Revenue')).toBeTruthy();
    expect(screen.getAllByTestId('kpi-card').length).toBeGreaterThan(0);
  });

  it('keeps the populated heading hierarchy valid at 1024px: h1 then h2 sections', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Executive Dashboard' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Budget Status' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Key Ratios' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Recent Activity' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Monthly Financial Trend' })).toBeTruthy();
  });

  it('has no automated accessibility violations in the 1024px populated state', async () => {
    const { container } = renderPage();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
