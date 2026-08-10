import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [],
    accounts: [],
    trialBalance: [],
    accountAnalysis: null,
    columnMappings: [],
    isLoading: false,
    importResult: null,
    setEntries: vi.fn(),
    setAccounts: vi.fn(),
    addEntries: vi.fn(),
    clearEntries: vi.fn(),
    setColumnMappings: vi.fn(),
    importData: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
  })),
}));

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: vi.fn(() => ({
    budgets: [],
    activeBudgetId: null,
    lineItems: [],
    isLoading: false,
    isSubmitting: false,
    lastChange: null,
    history: [[]],
    historyIndex: 0,
    selectedCellId: null,
    submitBudget: vi.fn(),
    approveBudget: vi.fn(),
    rejectBudget: vi.fn(),
    deleteBudget: vi.fn(),
    duplicateBudget: vi.fn(),
    setActiveBudget: vi.fn(),
    setBudgets: vi.fn(),
    addLineItem: vi.fn(),
    updateLineItem: vi.fn(),
    removeLineItem: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
  })),
}));

vi.mock('@/hooks/useSector', () => ({
  useSector: vi.fn(() => ({
    activeSector: 'technology',
    sectorConfig: {
      id: 'technology',
      name: 'Technology',
      revenueDrivers: [],
      costDrivers: [],
      kpis: [],
    },
    setSector: vi.fn(),
    availableSectors: [],
  })),
}));

vi.mock('@/hooks/useTour', () => ({
  useTour: vi.fn(() => ({
    runTour: vi.fn(),
    isActive: false,
    currentStepIndex: 0,
    steps: [],
    stopTour: vi.fn(),
  })),
}));

vi.mock('@/components/dashboard/KPICard', () => ({
  KPICard: ({ title }: { title: string }) => <div data-testid="kpi-card">{title}</div>,
}));

vi.mock('@/components/dashboard/ActivityFeed', () => ({
  ActivityFeed: () => <div data-testid="activity-feed" />,
}));

vi.mock('@/components/analytics/ChartWrapper', () => ({
  ChartWrapper: () => <div data-testid="chart-wrapper" />,
}));

vi.mock('@/components/ui/HelpPanel', () => ({
  HelpPanel: ({ open }: { open: boolean }) => (open ? <div data-testid="help-panel" /> : null),
}));

vi.mock('@/components/ui/DrillDownModal', () => ({
  DrillDownModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="drill-modal" /> : null,
}));

vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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

vi.mock('@/pages/_docs', () => ({
  PAGE_HELP: {},
}));

import DashboardPage from '@/pages/DashboardPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
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

  it('displays the finance-workspace setup state when no data exists', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { name: 'Set up your finance workspace' })
    ).toBeInTheDocument();
  });
});
