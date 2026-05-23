/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

// ---------------------------------------------------------------------------
// Mock stores
// ---------------------------------------------------------------------------

vi.mock('@/store/glStore', () => {
  const state = {
    entries: [],
    accounts: [],
    trialBalance: [],
    accountAnalysis: null,
    isLoading: false,
    analyzeAccount: vi.fn(),
  };
  return {
    useGLStore: vi.fn((selector?: (s: typeof state) => unknown) =>
      selector ? selector(state) : state
    ),
  };
});

vi.mock('@/store/energyStore', () => ({
  useEnergyStore: vi.fn(() => ({
    assets: [
      {
        id: 'S-01',
        name: 'Mojave Solar I',
        type: 'Solar',
        capacity: '250 MW',
        outputYTD: '42.5 GWh',
        availability: '98.5%',
        roi: '12.4%',
      },
    ],
    generationTrend: [{ date: '2026-01-01', solar: 450, wind: 320, hydro: 180, total: 950 }],
    capacityMix: [{ name: 'Solar', value: 1200, color: '#f59e0b' }],
    setAssets: vi.fn(),
    addAsset: vi.fn(),
    removeAsset: vi.fn(),
    setGenerationTrend: vi.fn(),
    setCapacityMix: vi.fn(),
  })),
}));

// ---------------------------------------------------------------------------
// Mock engines
// ---------------------------------------------------------------------------

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    exportToPDF: vi.fn(),
    exportToExcel: vi.fn(),
    exportToCSV: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Mock recharts
// ---------------------------------------------------------------------------

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Cell: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => null,
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => null,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => null,
  ComposedChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="composed-chart">{children}</div>
  ),
}));

// ---------------------------------------------------------------------------
// Mock UI components
// ---------------------------------------------------------------------------

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="data-table" data-rows={data.length} />
  ),
}));

vi.mock('@/components/ui/KPIValue', () => ({
  KPIValue: ({ label, value }: { label: string; value?: string }) => (
    <div data-testid="kpi-value">
      <span>{label}</span>
      {value && <span>: {value}</span>}
    </div>
  ),
}));

vi.mock('@/components/ui/PeriodPicker', () => ({
  PeriodPicker: () => <div data-testid="period-picker" />,
}));

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: ({ variant, height }: { variant?: string; height?: number }) => (
    <div data-testid="skeleton" data-variant={variant} style={{ height }} />
  ),
}));

// ---------------------------------------------------------------------------
// Mock lucide-react icons
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
    ShieldAlert: makeIcon(),
    TrendingDown: makeIcon(),
    AlertTriangle: makeIcon(),
    Activity: makeIcon(),
    Lock: makeIcon(),
    Unlock: makeIcon(),
    Download: makeIcon(),
    BarChart3: makeIcon(),
    Flame: makeIcon(),
    ArrowRightLeft: makeIcon(),
    Zap: makeIcon(),
    TrendingUp: makeIcon(),
    Gauge: makeIcon(),
    DollarSign: makeIcon(),
    Sun: makeIcon(),
    Wind: makeIcon(),
    Droplets: makeIcon(),
    Leaf: makeIcon(),
    Battery: makeIcon(),
    RefreshCw: makeIcon(),
    LayoutGrid: makeIcon(),
    FileText: makeIcon(),
    Users: makeIcon(),
    Shield: makeIcon(),
    Target: makeIcon(),
    Factory: makeIcon(),
    Table: makeIcon(),
  };
});

// ---------------------------------------------------------------------------
// Mock react-router-dom navigate
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ---------------------------------------------------------------------------
// Import page components AFTER mocks
// ---------------------------------------------------------------------------

import EnergyProductionDashboard from '@/pages/energy/EnergyProductionDashboard';
import EnergyRiskPage from '@/pages/energy/EnergyRiskPage';
import RenewableEnergyPage from '@/pages/energy/RenewableEnergyPage';
import CarbonDashboardPage from '@/pages/esg/CarbonDashboardPage';
import CSRDReportPage from '@/pages/esg/CSRDReportPage';

// ---------------------------------------------------------------------------
// Helper
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
// Smoke Tests — Energy & ESG Pages
// ---------------------------------------------------------------------------

describe('Page Smoke Tests — Energy & ESG Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // EnergyProductionDashboard
  // -----------------------------------------------------------------------

  describe('EnergyProductionDashboard', () => {
    it('renders the empty state when no GL entries exist', () => {
      const { getByText } = renderPage(
        EnergyProductionDashboard,
        '/energy/production',
        '/energy/production'
      );
      expect(getByText(/No Energy Data/i)).toBeInTheDocument();
    });

    it('shows the import data button in empty state', () => {
      const { getByRole } = renderPage(
        EnergyProductionDashboard,
        '/energy/production',
        '/energy/production'
      );
      expect(getByRole('button', { name: /Import Data/i })).toBeInTheDocument();
    });

    it('renders without crashing', () => {
      const { container } = renderPage(
        EnergyProductionDashboard,
        '/energy/production',
        '/energy/production'
      );
      expect(container).toBeTruthy();
    });
  });

  // -----------------------------------------------------------------------
  // EnergyRiskPage
  // -----------------------------------------------------------------------

  describe('EnergyRiskPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(EnergyRiskPage, '/energy/risk', '/energy/risk');
      expect(container).toBeTruthy();
    });

    it('displays the page heading', () => {
      const { getByText } = renderPage(EnergyRiskPage, '/energy/risk', '/energy/risk');
      expect(getByText(/Energy Risk Management/i)).toBeInTheDocument();
    });

    it('renders KPI cards', () => {
      const { getAllByTestId } = renderPage(EnergyRiskPage, '/energy/risk', '/energy/risk');
      expect(getAllByTestId('kpi-value').length).toBeGreaterThanOrEqual(1);
    });

    it('renders the hedge positions table', () => {
      const { getByTestId } = renderPage(EnergyRiskPage, '/energy/risk', '/energy/risk');
      expect(getByTestId('data-table')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // RenewableEnergyPage
  // -----------------------------------------------------------------------

  describe('RenewableEnergyPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(
        RenewableEnergyPage,
        '/energy/renewable',
        '/energy/renewable'
      );
      expect(container).toBeTruthy();
    });

    it('displays the page heading', () => {
      const { getByRole } = renderPage(
        RenewableEnergyPage,
        '/energy/renewable',
        '/energy/renewable'
      );
      expect(getByRole('heading', { name: /Renewable Energy/i })).toBeInTheDocument();
    });

    it('renders KPI cards', () => {
      const { getAllByTestId } = renderPage(
        RenewableEnergyPage,
        '/energy/renewable',
        '/energy/renewable'
      );
      expect(getAllByTestId('kpi-value').length).toBeGreaterThanOrEqual(1);
    });

    it('renders the asset portfolio table', () => {
      const { getByTestId } = renderPage(
        RenewableEnergyPage,
        '/energy/renewable',
        '/energy/renewable'
      );
      expect(getByTestId('data-table')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // CarbonDashboardPage
  // -----------------------------------------------------------------------

  describe('CarbonDashboardPage', () => {
    it('renders the empty state when no GL entries exist', () => {
      const { getByText } = renderPage(CarbonDashboardPage, '/esg/carbon', '/esg/carbon');
      expect(getByText(/No Data/i)).toBeInTheDocument();
    });

    it('shows the import data button in empty state', () => {
      const { getByRole } = renderPage(CarbonDashboardPage, '/esg/carbon', '/esg/carbon');
      expect(getByRole('button', { name: /Import Data/i })).toBeInTheDocument();
    });

    it('renders without crashing', () => {
      const { container } = renderPage(CarbonDashboardPage, '/esg/carbon', '/esg/carbon');
      expect(container).toBeTruthy();
    });
  });

  // -----------------------------------------------------------------------
  // CSRDReportPage
  // -----------------------------------------------------------------------

  describe('CSRDReportPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(CSRDReportPage, '/esg/csrd', '/esg/csrd');
      expect(container).toBeTruthy();
    });

    it('displays the page heading', () => {
      const { getByText } = renderPage(CSRDReportPage, '/esg/csrd', '/esg/csrd');
      expect(getByText(/CSRD Sustainability Report/i)).toBeInTheDocument();
    });

    it('renders KPI cards', () => {
      const { getAllByTestId } = renderPage(CSRDReportPage, '/esg/csrd', '/esg/csrd');
      expect(getAllByTestId('kpi-value').length).toBeGreaterThanOrEqual(1);
    });

    it('renders the metrics table', () => {
      const { getByTestId } = renderPage(CSRDReportPage, '/esg/csrd', '/esg/csrd');
      expect(getByTestId('data-table')).toBeInTheDocument();
    });
  });
});
