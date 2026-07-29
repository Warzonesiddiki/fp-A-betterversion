/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// ---------------------------------------------------------------------------
// Mock stores
// ---------------------------------------------------------------------------

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [],
    accounts: [],
    isLoading: false,
    setEntries: vi.fn(),
    addEntries: vi.fn(),
    clearEntries: vi.fn(),
  })),
}));

// ---------------------------------------------------------------------------
// Mock engines
// ---------------------------------------------------------------------------

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));

vi.mock('@/engines/InventoryEngine', () => ({
  InventoryEngine: {
    calculateGLInventoryStats: vi.fn(() => ({
      totalValue: 0,
      turnover: 0,
      daysOnHand: 0,
      stockouts: 0,
    })),
    calculateGMROI: vi.fn(() => 0),
  },
}));

vi.mock('@/engines/RetailEngine', () => ({
  RetailEngine: {
    getStoreBreakdown: vi.fn(() => []),
    calculateDashboardStats: vi.fn(() => ({
      avgRevenuePerStore: 0,
      avgNetMargin: 0,
      salesPerLaborHour: 0,
    })),
    getPnLTrend: vi.fn(() => []),
  },
}));

vi.mock('@/engines/SaaSMetricsEngine', () => ({
  SaaSMetricsEngine: {
    calculateARR: vi.fn(() => 0),
    calculateNRR: vi.fn(() => 0),
    calculateQuickRatio: vi.fn(() => 0),
    calculateChurnRate: vi.fn(() => 0),
    calculateLTVtoCAC: vi.fn(() => 0),
    buildCohortTable: vi.fn(() => []),
  },
}));

vi.mock('@/engines/MultiCurrencyEngine', () => ({
  MultiCurrencyEngine: {
    calculateCrossRate: vi.fn(() => 1.0),
  },
}));

// ---------------------------------------------------------------------------
// Mock components
// ---------------------------------------------------------------------------

vi.mock('@/components/dashboard/KPICard', () => ({
  KPICard: ({ title }: { title: string }) => <div data-testid="kpi-card">{title}</div>,
}));

vi.mock('@/components/analytics/ChartWrapper', () => ({
  ChartWrapper: ({ children, title }: { children?: React.ReactNode; title?: string }) => (
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

vi.mock('@/pages/_docs', () => ({
  PAGE_HELP: {},
}));

// ---------------------------------------------------------------------------
// Mock recharts
// ---------------------------------------------------------------------------

vi.mock('recharts', () => {
  const stub = ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="recharts-stub">{children}</div>
  );
  return {
    ResponsiveContainer: stub,
    ComposedChart: stub,
    BarChart: stub,
    Bar: () => null,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
    PieChart: stub,
    Pie: () => null,
    Cell: () => null,
    AreaChart: stub,
    Area: () => null,
    ScatterChart: stub,
    Scatter: () => null,
    LineChart: stub,
  };
});

// ---------------------------------------------------------------------------
// Mock lucide-react
// ---------------------------------------------------------------------------

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    ChevronUp: makeIcon(),
    ChevronDown: makeIcon(),
    Download: makeIcon(),
    TrendingUp: makeIcon(),
    TrendingDown: makeIcon(),
    DollarSign: makeIcon(),
    Package: makeIcon(),
    BarChart3: makeIcon(),
    Truck: makeIcon(),
    RefreshCw: makeIcon(),
    Clock: makeIcon(),
    AlertTriangle: makeIcon(),
    Store: makeIcon(),
    ArrowRight: makeIcon(),
    ShoppingCart: makeIcon(),
    Tag: makeIcon(),
    Percent: makeIcon(),
    BarChart4: makeIcon(),
    FileText: makeIcon(),
    Table: makeIcon(),
    Users: makeIcon(),
    RefreshCcw: makeIcon(),
  };
});

// ---------------------------------------------------------------------------
// Import pages AFTER mocks
// ---------------------------------------------------------------------------

import InventoryDashboard from '@/pages/retail/InventoryDashboard';
import InventoryPlanningPage from '@/pages/retail/InventoryPlanningPage';
import PromoAnalysisPage from '@/pages/retail/PromoAnalysisPage';
import RetailDashboard from '@/pages/retail/RetailDashboard';
import StoreDashboardPage from '@/pages/retail/StoreDashboardPage';
import ARRDashboard from '@/pages/saas/ARRDashboard';
import ChurnAnalysisPage from '@/pages/saas/ChurnAnalysisPage';
import ChurnDashboard from '@/pages/saas/ChurnDashboard';
import CohortAnalysisPage from '@/pages/saas/CohortAnalysisPage';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderPage(Page: React.ComponentType, path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Page />
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Tests — Retail
// ---------------------------------------------------------------------------

describe('Retail pages smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  describe('InventoryDashboard', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(InventoryDashboard, '/retail/inventory');
      expect(container).toBeTruthy();
    });
    it('shows empty state with no data', () => {
      renderPage(InventoryDashboard, '/retail/inventory');
      expect(screen.getByText(/No Inventory Data/i)).toBeTruthy();
    });
  });

  describe('InventoryPlanningPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(InventoryPlanningPage, '/retail/inventory-planning');
      expect(container).toBeTruthy();
    });
    it('shows empty state with no data', () => {
      renderPage(InventoryPlanningPage, '/retail/inventory-planning');
      expect(screen.getByText(/No Inventory Data/i)).toBeTruthy();
    });
  });

  describe('PromoAnalysisPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(PromoAnalysisPage, '/retail/promo-analysis');
      expect(container).toBeTruthy();
    });
    it('displays page heading', () => {
      renderPage(PromoAnalysisPage, '/retail/promo-analysis');
      expect(screen.getByText('Promotion Analysis')).toBeTruthy();
    });
  });

  describe('RetailDashboard', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(RetailDashboard, '/retail/dashboard');
      expect(container).toBeTruthy();
    });
    it('shows empty state with no data', () => {
      renderPage(RetailDashboard, '/retail/dashboard');
      expect(screen.getByText(/No Retail Data/i)).toBeTruthy();
    });
  });

  describe('StoreDashboardPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(StoreDashboardPage, '/retail/stores');
      expect(container).toBeTruthy();
    });
    it('shows empty state with no data', () => {
      renderPage(StoreDashboardPage, '/retail/stores');
      expect(screen.getByText(/No Retail Data/i)).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Tests — SaaS
// ---------------------------------------------------------------------------

describe('SaaS pages smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  describe('ARRDashboard', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(ARRDashboard, '/saas/arr');
      expect(container).toBeTruthy();
    });
    it('shows empty state with no SaaS data', () => {
      renderPage(ARRDashboard, '/saas/arr');
      expect(screen.getByText(/No SaaS Data Found/i)).toBeTruthy();
    });
  });

  describe('ChurnAnalysisPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(ChurnAnalysisPage, '/saas/churn-analysis');
      expect(container).toBeTruthy();
    });
    it('shows empty state with no data', () => {
      renderPage(ChurnAnalysisPage, '/saas/churn-analysis');
      expect(screen.getByText(/No SaaS Data/i)).toBeTruthy();
    });
  });

  describe('ChurnDashboard', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(ChurnDashboard, '/saas/churn');
      expect(container).toBeTruthy();
    });
    it('shows empty state with no data', () => {
      renderPage(ChurnDashboard, '/saas/churn');
      expect(screen.getByText(/No SaaS Data/i)).toBeTruthy();
    });
  });

  describe('CohortAnalysisPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(CohortAnalysisPage, '/saas/cohort');
      expect(container).toBeTruthy();
    });
    it('shows empty state with no data', () => {
      renderPage(CohortAnalysisPage, '/saas/cohort');
      expect(screen.getByText(/No SaaS Data/i)).toBeTruthy();
    });
  });
});
