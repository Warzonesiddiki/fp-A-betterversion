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
  // K17: default mock is an EMPTY workspace — the real store no longer ships
  // demo assets/generation, so smokes must not resurrect them.
  useEnergyStore: vi.fn(() => ({
    assets: [],
    generationTrend: [],
    capacityMix: [],
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
    exportToExcel: vi.fn(async () => {}),
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

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

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
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
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
      // K30 rewrite: honest disclosure instead of invented generation data.
      expect(getByText(/No energy production data/i)).toBeInTheDocument();
      expect(getByText(/never estimated/i)).toBeInTheDocument();
    });

    it('keeps the honest no-CTA empty state (recording happens in the workspace)', () => {
      const { queryByRole } = renderPage(
        EnergyProductionDashboard,
        '/energy/production',
        '/energy/production'
      );
      // No invented CTA: generation is recorded in the energy workspace, so
      // there is intentionally nothing to import from GL upload here.
      expect(queryByRole('button', { name: /Import Data/i })).not.toBeInTheDocument();
    });

    it('renders without crashing', () => {
      const { container } = renderPage(
        EnergyProductionDashboard,
        '/energy/production',
        '/energy/production'
      );
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });
  });

  // -----------------------------------------------------------------------
  // EnergyRiskPage
  // -----------------------------------------------------------------------

  describe('EnergyRiskPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(EnergyRiskPage, '/energy/risk', '/energy/risk');
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });

    it('displays the page heading', () => {
      const { getByText } = renderPage(EnergyRiskPage, '/energy/risk', '/energy/risk');
      expect(getByText(/Energy Risk Management/i)).toBeInTheDocument();
    });

    it('empty-states honestly: no risk data is recorded in the workspace (session 024)', () => {
      const { getByText, queryAllByTestId } = renderPage(
        EnergyRiskPage,
        '/energy/risk',
        '/energy/risk'
      );
      expect(getByText(/No market-risk data is recorded/i)).toBeInTheDocument();
      // The old page shipped literal VaR/hedge-ratio KPIs from fixtures; the
      // honest page renders no KPI tiles until positions are recorded.
      expect(queryAllByTestId('kpi-value').length).toBe(0);
    });

    it('renders no positions table until hedges are recorded (session 024)', () => {
      const { queryAllByTestId } = renderPage(EnergyRiskPage, '/energy/risk', '/energy/risk');
      // The old table showed four fixture positions with named counterparties.
      expect(queryAllByTestId('data-table').length).toBe(0);
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
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
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

    it('renders the honest empty workspace when no assets are recorded', () => {
      const { queryByTestId, getByRole } = renderPage(
        RenewableEnergyPage,
        '/energy/renewable',
        '/energy/renewable'
      );
      // K17: no demo portfolio — an empty energy store renders the disclosure
      // surface, not a fabricated asset table.
      expect(queryByTestId('data-table')).not.toBeInTheDocument();
      expect(getByRole('heading', { level: 1, name: /Renewable Energy/i })).toBeInTheDocument();
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
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });
  });

  // -----------------------------------------------------------------------
  // CSRDReportPage
  // -----------------------------------------------------------------------

  describe('CSRDReportPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(CSRDReportPage, '/esg/csrd', '/esg/csrd');
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
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
