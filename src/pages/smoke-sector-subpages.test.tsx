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

// ---------------------------------------------------------------------------
// Mock engines
// ---------------------------------------------------------------------------

vi.mock('@/engines/AIEngine', () => ({
  AIEngine: {
    init: vi.fn(async () => {}),
    detectAnomalies: vi.fn(async () => []),
    classify: vi.fn(async () => []),
    dispose: vi.fn(async () => {}),
    getStatus: vi.fn(() => ({
      initialized: false,
      device: null,
      classifierReady: false,
      extractorReady: false,
    })),
  },
}));

vi.mock('@/engines', () => ({
  AIEngine: {
    init: vi.fn(async () => {}),
    detectAnomalies: vi.fn(async () => []),
    classify: vi.fn(async () => []),
    dispose: vi.fn(async () => {}),
    getStatus: vi.fn(() => ({
      initialized: false,
      device: null,
      classifierReady: false,
      extractorReady: false,
    })),
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
      netRevenue: 0,
      daysInAR: 0,
      collectionRate: 0,
      inpatient: 0,
      outpatient: 0,
      emergency: 0,
      surgical: 0,
    })),
    getPayerMix: vi.fn(() => []),
    getCostPerPatient: vi.fn(() => []),
    getReadmissionTrend: vi.fn(() => []),
  },
  InsuranceEngine: {
    calculateStats: vi.fn(() => ({
      grossWrittenPremium: 0,
      netWrittenPremium: 0,
      earnedPremium: 0,
      lossExpense: 0,
      expenseTotal: 0,
      lossRatio: 0,
      expenseRatio: 0,
      combinedRatio: 0,
      policyCount: 0,
      underwritingIncome: 0,
    })),
    getPremiumByLine: vi.fn(() => []),
    getCombinedRatioTrend: vi.fn(() => []),
    getClaimsByStatus: vi.fn(() => []),
    getTopDiagnoses: vi.fn(() => []),
  },
  EnergyEngine: {
    calculateStats: vi.fn(() => ({
      totalRevenue: 0,
      operatingCost: 0,
      productionVolume: 0,
      avgMarketPrice: 0,
      carbonIntensity: 0,
      netIncome: 0,
    })),
    getProductionBySource: vi.fn(() => []),
    getRevenueTrend: vi.fn(() => []),
    getEmissionsTrend: vi.fn(() => []),
  },
  ConstructionEngine: {
    calculateStats: vi.fn(() => ({
      totalBacklog: 0,
      revenueYTD: 0,
      avgGrossMargin: 0,
      wipValue: 0,
      billings: 0,
      overUnderBilled: 0,
    })),
    getBacklogTrend: vi.fn(() => []),
    getProjectPortfolio: vi.fn(() => []),
    getEquipmentUtilization: vi.fn(() => []),
    getProjectTimeline: vi.fn(() => []),
    getCostBreakdown: vi.fn(() => []),
  },
  ExportEngine: {
    exportToCSV: vi.fn(),
    exportToExcel: vi.fn(async () => {}),
    exportToPDF: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Mock UI components
// ---------------------------------------------------------------------------

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

vi.mock('@/components/ui/Progress', () => ({
  Progress: ({ value }: { value?: number }) => (
    <div data-testid="progress" role="progressbar" aria-valuenow={value} />
  ),
}));

vi.mock('@/components/ui', () => ({
  Progress: ({ value }: { value?: number }) => (
    <div data-testid="progress" role="progressbar" aria-valuenow={value} />
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
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => null,
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

import AIIntelligencePage from '@/pages/ai/AIIntelligencePage';
import ClaimsAnalyticsPage from '@/pages/insurance/ClaimsAnalyticsPage';
import ClinicalTrialCostPage from '@/pages/healthcare/ClinicalTrialCostPage';
import EmissionsTradingPage from '@/pages/energy/EmissionsTradingPage';
import EquipmentManagementPage from '@/pages/construction/EquipmentManagementPage';
import { useHealthcareStore } from '@/store/healthcareStore';

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
// Smoke Tests -- each page renders without crashing
// ---------------------------------------------------------------------------

describe('Sector Sub-Page Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  describe('AIIntelligencePage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(AIIntelligencePage, '/ai', '/ai');
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });

    it('displays the page heading', () => {
      renderPage(AIIntelligencePage, '/ai', '/ai');
      expect(screen.getByText(/AI Intelligence Center/i)).toBeInTheDocument();
    });
  });

  describe('ClaimsAnalyticsPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(
        ClaimsAnalyticsPage,
        '/insurance/claims',
        '/insurance/claims'
      );
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });

    it('displays the page heading', () => {
      renderPage(ClaimsAnalyticsPage, '/insurance/claims', '/insurance/claims');
      expect(screen.getByText(/Claims Analytics/i)).toBeInTheDocument();
    });
  });

  describe('ClinicalTrialCostPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(
        ClinicalTrialCostPage,
        '/healthcare/trials',
        '/healthcare/trials'
      );
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });

    it('asks for a study when none is recorded', () => {
      // Trials come from healthcareStore.clinicalTrials; the page used to
      // hardcode five studies at named institutions.
      useHealthcareStore.setState({ clinicalTrials: [] });
      renderPage(ClinicalTrialCostPage, '/healthcare/trials', '/healthcare/trials');
      expect(screen.getByText('No Trials Recorded')).toBeInTheDocument();
    });

    it('displays the page heading once a study is recorded', () => {
      useHealthcareStore.setState({
        clinicalTrials: [
          {
            id: 'T-1',
            name: 'Alpha',
            site: 'Site One',
            phase: 'Phase I',
            budget: 1000,
            actualSpend: 500,
            targetEnrollment: 10,
            enrolled: 5,
            status: 'active',
          },
        ],
      });
      renderPage(ClinicalTrialCostPage, '/healthcare/trials', '/healthcare/trials');
      expect(screen.getByText(/Clinical Trial/i)).toBeInTheDocument();
    });
  });

  describe('EmissionsTradingPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(
        EmissionsTradingPage,
        '/energy/emissions',
        '/energy/emissions'
      );
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });

    it('displays the page heading', () => {
      renderPage(EmissionsTradingPage, '/energy/emissions', '/energy/emissions');
      expect(screen.getByText(/^Emissions Trading$/)).toBeInTheDocument();
    });
  });

  describe('EquipmentManagementPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(
        EquipmentManagementPage,
        '/construction/equipment',
        '/construction/equipment'
      );
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });

    it('displays the page heading', () => {
      renderPage(EquipmentManagementPage, '/construction/equipment', '/construction/equipment');
      expect(screen.getByText(/Equipment Management/i)).toBeInTheDocument();
    });
  });
});
