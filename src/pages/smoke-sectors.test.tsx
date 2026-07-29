/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

// ---------------------------------------------------------------------------
// Mock stores
// ---------------------------------------------------------------------------

vi.mock('@/store/glStore', () => {
  const glState = {
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
  };
  return {
    useGLStore: vi.fn((selector?: (s: typeof glState) => unknown) =>
      selector ? selector(glState) : glState
    ),
  };
});

// ---------------------------------------------------------------------------
// Mock engines
// ---------------------------------------------------------------------------

vi.mock('@/engines', () => ({
  BankingEngine: {
    calculateCapitalStats: vi.fn(() => ({
      totalCapital: 0,
      tier1Capital: 0,
      tier2Capital: 0,
      totalRWA: 0,
      car: 0,
      tier1Ratio: 0,
      tier2Ratio: 0,
    })),
    calculateNIMStats: vi.fn(() => ({
      nim: 0,
      totalInterestIncome: 0,
      totalInterestExpense: 0,
      averageEarningAssets: 0,
      spread: 0,
    })),
  },
  ExportEngine: {
    exportToCSV: vi.fn(),
    exportToExcel: vi.fn(async () => {}),
    exportToPDF: vi.fn(),
  },
  HealthcareEngine: {
    calculateMetrics: vi.fn(() => ({
      totalRevenue: 0,
      totalCosts: 0,
      patientDays: 0,
      avgLengthOfStay: 0,
      occupancyRate: 0,
      readmissionRate: 0,
    })),
    calculatePatientRevenue: vi.fn(() => ({
      totalRevenue: 0,
      inpatient: 0,
      outpatient: 0,
      emergency: 0,
      surgical: 0,
      revenueByDept: [],
      revenueByPayer: [],
      trend: [],
    })),
  },
  InsuranceEngine: {
    calculateStats: vi.fn(() => ({
      totalPremiums: 0,
      totalLosses: 0,
      lossRatio: 0,
      combinedRatio: 0,
      expenseRatio: 0,
      policies: 0,
      claims: 0,
    })),
    getPremiumByLine: vi.fn(() => []),
    getCombinedRatioTrend: vi.fn(() => []),
  },
  EnergyEngine: {
    calculateStats: vi.fn(() => ({
      totalRevenue: 0,
      totalProduction: 0,
      efficiency: 0,
      renewableShare: 0,
      carbonIntensity: 0,
      assets: 0,
    })),
    getProductionBySource: vi.fn(() => []),
    getRevenueTrend: vi.fn(() => []),
  },
  ConstructionEngine: {
    calculateStats: vi.fn(() => ({
      totalRevenue: 0,
      backlog: 0,
      projects: 0,
      winRate: 0,
      avgMargin: 0,
      wip: 0,
    })),
    getBacklogTrend: vi.fn(() => []),
    getProjectPortfolio: vi.fn(() => []),
  },
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    exportToCSV: vi.fn(),
    exportToExcel: vi.fn(async () => {}),
    exportToPDF: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Mock UI components
// ---------------------------------------------------------------------------

vi.mock('@/components/dashboard/KPICard', () => ({
  KPICard: ({ title }: { title: string }) => <div data-testid="kpi-card">{title}</div>,
}));

vi.mock('@/components/analytics/ChartWrapper', () => ({
  ChartWrapper: () => <div data-testid="chart-wrapper" />,
}));

vi.mock('@/components/ui/DataGrid', () => ({
  DataGrid: () => <div data-testid="data-grid" />,
}));

vi.mock('@/components/ui/HelpPanel', () => ({
  HelpPanel: ({ open }: { open: boolean }) => (open ? <div data-testid="help-panel" /> : null),
}));

vi.mock('@/components/ui/KPIValue', () => ({
  KPIValue: ({ label }: { label: string }) => <div data-testid="kpi-value">{label}</div>,
}));

vi.mock('@/components/ui/PeriodPicker', () => ({
  PeriodPicker: () => <div data-testid="period-picker" />,
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: () => <div data-testid="data-table" />,
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode } & Record<string, unknown>) => (
    <button {...props}>{children}</button>
  ),
}));

// ---------------------------------------------------------------------------
// Mock recharts
// ---------------------------------------------------------------------------

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  Cell: () => null,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => null,
  ComposedChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="composed-chart">{children}</div>
  ),
}));

// ---------------------------------------------------------------------------
// Mock lucide-react icons
// ---------------------------------------------------------------------------

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

// ---------------------------------------------------------------------------
// Mock docs
// ---------------------------------------------------------------------------

vi.mock('@/pages/_docs', () => ({
  PAGE_HELP: {},
}));

// ---------------------------------------------------------------------------
// Import page components AFTER mocks
// ---------------------------------------------------------------------------

import CapitalAdequacyPage from '@/pages/banking/CapitalAdequacyPage';
import NIMDashboardPage from '@/pages/banking/NIMDashboardPage';
import InsuranceDashboardPage from '@/pages/insurance/InsuranceDashboardPage';
import HealthcareDashboardPage from '@/pages/healthcare/HealthcareDashboardPage';
import EnergyDashboardPage from '@/pages/energy/EnergyDashboardPage';
import ConstructionDashboardPage from '@/pages/construction/ConstructionDashboardPage';
import RetailDashboardPage from '@/pages/retail/RetailDashboardPage';
import ProductionDashboardPage from '@/pages/manufacturing/ProductionDashboardPage';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPage(PageComponent: React.ComponentType, initialPath = '/', routePath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path={routePath} element={<PageComponent />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Smoke Tests — each page renders without crashing
// ---------------------------------------------------------------------------

describe('Sector Page Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  describe('CapitalAdequacyPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(CapitalAdequacyPage, '/banking/capital', '/banking/capital');
      expect(container).toBeTruthy();
    });

    it('displays the page heading', () => {
      renderPage(CapitalAdequacyPage, '/banking/capital', '/banking/capital');
      expect(screen.getByText(/Capital Adequacy/i)).toBeInTheDocument();
    });
  });

  describe('NIMDashboardPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(NIMDashboardPage, '/banking/nim', '/banking/nim');
      expect(container).toBeTruthy();
    });

    it('displays the page heading', () => {
      renderPage(NIMDashboardPage, '/banking/nim', '/banking/nim');
      expect(screen.getByText(/Net Interest Margin/i)).toBeInTheDocument();
    });
  });

  describe('InsuranceDashboardPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(InsuranceDashboardPage, '/insurance', '/insurance');
      expect(container).toBeTruthy();
    });

    it('displays the page heading', () => {
      renderPage(InsuranceDashboardPage, '/insurance', '/insurance');
      expect(screen.getByText(/Insurance/i)).toBeInTheDocument();
    });
  });

  describe('HealthcareDashboardPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(HealthcareDashboardPage, '/healthcare', '/healthcare');
      expect(container).toBeTruthy();
    });

    it('displays the page heading', () => {
      renderPage(HealthcareDashboardPage, '/healthcare', '/healthcare');
      expect(screen.getByText(/Healthcare/i)).toBeInTheDocument();
    });
  });

  describe('EnergyDashboardPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(EnergyDashboardPage, '/energy', '/energy');
      expect(container).toBeTruthy();
    });

    it('displays the page heading', () => {
      renderPage(EnergyDashboardPage, '/energy', '/energy');
      expect(screen.getByText(/Energy Dashboard/i)).toBeInTheDocument();
    });
  });

  describe('ConstructionDashboardPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(ConstructionDashboardPage, '/construction', '/construction');
      expect(container).toBeTruthy();
    });

    it('displays the page heading', () => {
      renderPage(ConstructionDashboardPage, '/construction', '/construction');
      expect(screen.getByText(/Construction/i)).toBeInTheDocument();
    });
  });

  describe('RetailDashboardPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(RetailDashboardPage, '/retail', '/retail');
      expect(container).toBeTruthy();
    });

    it('displays the page heading', () => {
      renderPage(RetailDashboardPage, '/retail', '/retail');
      expect(screen.getByText(/Retail/i)).toBeInTheDocument();
    });
  });

  describe('ProductionDashboardPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(ProductionDashboardPage, '/manufacturing', '/manufacturing');
      expect(container).toBeTruthy();
    });

    it('displays the page heading', () => {
      renderPage(ProductionDashboardPage, '/manufacturing', '/manufacturing');
      expect(screen.getByText(/Production/i)).toBeInTheDocument();
    });
  });
});
