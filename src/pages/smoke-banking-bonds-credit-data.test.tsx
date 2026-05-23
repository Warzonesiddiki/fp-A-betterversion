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
    analyzeAccount: vi.fn(),
  })),
}));

// ---------------------------------------------------------------------------
// Mock engines
// ---------------------------------------------------------------------------

vi.mock('@/engines/BankingEngine', () => ({
  BankingEngine: {
    calculateLoanLossStats: vi.fn(() => ({
      grossLoans: 0,
      reserveBalance: 0,
      nplBalance: 0,
      nplRatio: 0,
      coverageRatio: 0,
      provisionExpense: 0,
    })),
    calculateCapitalStats: vi.fn(() => ({
      tier1Capital: 0,
      tier2Capital: 0,
      totalCapital: 0,
      rwa: 0,
      tier1Ratio: 0,
      totalRatio: 0,
      leverageRatio: 0,
      trendData: [],
    })),
    calculateNIMStats: vi.fn(() => ({
      interestIncome: 0,
      interestExpense: 0,
      netInterestIncome: 0,
      nim: 0,
      netInterestMargin: 0,
    })),
  },
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    exportToPDF: vi.fn(),
  },
}));

vi.mock('@/engines', () => ({
  BondPricingEngine: {
    price: vi.fn(() => 100),
    duration: vi.fn(() => ({ modified: 5, macaulay: 5.5, convexity: 30 })),
    accruedInterest: vi.fn(() => 0),
    dirtyPrice: vi.fn(() => 100),
  },
  YieldCurveEngine: {
    bootstrap: vi.fn(() => [
      { maturity: 1, rate: 0.04 },
      { maturity: 5, rate: 0.045 },
      { maturity: 10, rate: 0.047 },
      { maturity: 30, rate: 0.048 },
    ]),
    interpolate: vi.fn(() => 0.045),
    spotRate: vi.fn(() => 0.045),
    parRate: vi.fn(() => 0.045),
    forwardRate: vi.fn(() => 0.046),
  },
  CreditRiskEngine: {
    creditScore: vi.fn(() => ({ rating: 'A', score: 75, pd: 0.02 })),
    lossGivenDefault: vi.fn(() => 0.4),
    exposureAtDefault: vi.fn(() => 1000000),
    expectedLoss: vi.fn(() => 8000),
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
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => null,
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => null,
  ScatterChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scatter-chart">{children}</div>
  ),
  Scatter: () => null,
  ZAxis: () => null,
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
  KPIValue: ({ label, value }: { label: string; value: string }) => (
    <div data-testid="kpi-value">
      <span>{label}</span>: <span>{value}</span>
    </div>
  ),
}));

vi.mock('@/components/ui/Input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input data-testid="mock-input" {...props} />
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
    TrendingUp: makeIcon(),
    BarChart3: makeIcon(),
    Calculator: makeIcon(),
    Download: makeIcon(),
    ArrowRight: makeIcon(),
    GitBranch: makeIcon(),
    Landmark: makeIcon(),
    DollarSign: makeIcon(),
    Shield: makeIcon(),
    AlertTriangle: makeIcon(),
    ShieldAlert: makeIcon(),
    TrendingDown: makeIcon(),
    Activity: makeIcon(),
    Database: makeIcon(),
    Search: makeIcon(),
    Filter: makeIcon(),
    Clock: makeIcon(),
  };
});

// ---------------------------------------------------------------------------
// Import page components AFTER mocks
// ---------------------------------------------------------------------------

import BankingDashboard from '@/pages/banking/BankingDashboard';
import BondPortfolioPage from '@/pages/bonds/BondPortfolioPage';
import YieldCurvePage from '@/pages/bonds/YieldCurvePage';
import CreditRiskPage from '@/pages/credit/CreditRiskPage';
import GLExplorerPage from '@/pages/data/GLExplorerPage';

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
// Smoke Tests
// ---------------------------------------------------------------------------

describe('Page Smoke Tests — Banking, Bonds, Credit, Data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // BankingDashboard
  // -----------------------------------------------------------------------

  describe('BankingDashboard', () => {
    it('renders without crashing (empty state)', () => {
      const { container } = renderPage(BankingDashboard, '/banking', '/banking');
      expect(container).toBeTruthy();
    });

    it('displays empty state when no GL data', () => {
      const { getByText } = renderPage(BankingDashboard, '/banking', '/banking');
      expect(getByText(/No Banking Data/i)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // BondPortfolioPage
  // -----------------------------------------------------------------------

  describe('BondPortfolioPage', () => {
    it('renders without crashing (empty state)', () => {
      const { container } = renderPage(BondPortfolioPage, '/bonds/portfolio', '/bonds/portfolio');
      expect(container).toBeTruthy();
    });

    it('displays empty state when no GL data', () => {
      const { getByText } = renderPage(BondPortfolioPage, '/bonds/portfolio', '/bonds/portfolio');
      expect(getByText(/No Bond Data/i)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // YieldCurvePage
  // -----------------------------------------------------------------------

  describe('YieldCurvePage', () => {
    it('renders without crashing (empty state)', () => {
      const { container } = renderPage(YieldCurvePage, '/bonds/yield-curve', '/bonds/yield-curve');
      expect(container).toBeTruthy();
    });

    it('displays empty state when no GL data', () => {
      const { getByText } = renderPage(YieldCurvePage, '/bonds/yield-curve', '/bonds/yield-curve');
      expect(getByText(/No Yield Curve Data/i)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // CreditRiskPage
  // -----------------------------------------------------------------------

  describe('CreditRiskPage', () => {
    it('renders without crashing (empty state)', () => {
      const { container } = renderPage(CreditRiskPage, '/credit/risk', '/credit/risk');
      expect(container).toBeTruthy();
    });

    it('displays empty state when no GL data', () => {
      const { getByText } = renderPage(CreditRiskPage, '/credit/risk', '/credit/risk');
      expect(getByText(/No Credit Data/i)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // GLExplorerPage
  // -----------------------------------------------------------------------

  describe('GLExplorerPage', () => {
    it('renders without crashing (empty state)', () => {
      const { container } = renderPage(GLExplorerPage, '/data/gl-explorer', '/data/gl-explorer');
      expect(container).toBeTruthy();
    });

    it('displays empty state when no GL data', () => {
      const { getByText } = renderPage(GLExplorerPage, '/data/gl-explorer', '/data/gl-explorer');
      expect(getByText(/No GL Data/i)).toBeInTheDocument();
    });
  });
});
