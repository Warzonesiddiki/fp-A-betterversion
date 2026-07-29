/* eslint-disable @typescript-eslint/no-unused-vars */
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

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: vi.fn(() => ({
    budgets: [],
    activeBudgetId: null,
    isLoading: false,
    addBudget: vi.fn(),
    updateBudget: vi.fn(),
    deleteBudget: vi.fn(),
    setActiveBudget: vi.fn(),
  })),
}));

vi.mock('@/store/uiStore', () => ({
  useUIStore: vi.fn(() => ({
    mobileSidebarOpen: false,
    closeMobileSidebar: vi.fn(),
  })),
}));

// ---------------------------------------------------------------------------
// Mock hooks
// ---------------------------------------------------------------------------

vi.mock('@/hooks/useTour', () => ({
  useTour: vi.fn(() => ({
    runTour: vi.fn(),
    stopTour: vi.fn(),
    isTourActive: false,
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

vi.mock('@/engines/BankingEngine', () => ({
  BankingEngine: {
    calculateLoanLossStats: vi.fn(() => ({
      reserveBalance: 0,
      nplRatio: 0,
      coverageRatio: 0,
      netChargeOffs: 0,
      trend: [],
    })),
  },
}));

vi.mock('@/engines', () => ({
  ExportEngine: {
    exportToPDF: vi.fn(),
    exportToExcel: vi.fn(),
    exportToCSV: vi.fn(),
  },
  BankingEngine: {
    calculateLoanLossStats: vi.fn(() => ({
      reserveBalance: 0,
      nplRatio: 0,
      coverageRatio: 0,
      netChargeOffs: 0,
      trend: [],
    })),
  },
}));

// ---------------------------------------------------------------------------
// Mock UI components
// ---------------------------------------------------------------------------

vi.mock('@/components/ui', () => {
  const stub = (props: Record<string, unknown>) => <div data-testid="ui-stub" {...props} />;
  return {
    Button: (props: Record<string, unknown>) => <button data-testid="button" {...props} />,
    Card: (props: Record<string, unknown>) => <div data-testid="card" {...props} />,
    CardContent: (props: Record<string, unknown>) => <div data-testid="card-content" {...props} />,
    CardHeader: (props: Record<string, unknown>) => <div data-testid="card-header" {...props} />,
    CardTitle: (props: Record<string, unknown>) => <div data-testid="card-title" {...props} />,
    Input: (props: Record<string, unknown>) => <input data-testid="input" {...props} />,
    Select: (props: Record<string, unknown>) => <select data-testid="select" {...props} />,
    Modal: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
      isOpen ? <div data-testid="modal">{children}</div> : null,
    Skeleton: ({ className }: { className?: string }) => (
      <div data-testid="skeleton" className={className} />
    ),
    KPIValue: ({ label, value }: { label: string; value: string }) => (
      <div data-testid="kpi-value">
        <span>{label}</span>
        <span>{value}</span>
      </div>
    ),
    DataTable: ({ emptyMessage }: { emptyMessage?: string }) => (
      <div data-testid="data-table">{emptyMessage || 'Table'}</div>
    ),
    DataGrid: ({ emptyMessage }: { emptyMessage?: string }) => (
      <div data-testid="data-grid">{emptyMessage || 'Grid'}</div>
    ),
    WaterfallChart: () => <div data-testid="waterfall-chart" />,
  };
});

vi.mock('@/components/ui/Button', () => ({
  Button: (props: Record<string, unknown>) => <button data-testid="button" {...props} />,
}));

vi.mock('@/components/ui/Card', () => ({
  Card: (props: Record<string, unknown>) => <div data-testid="card" {...props} />,
  CardContent: (props: Record<string, unknown>) => <div data-testid="card-content" {...props} />,
  CardHeader: (props: Record<string, unknown>) => <div data-testid="card-header" {...props} />,
  CardTitle: (props: Record<string, unknown>) => <div data-testid="card-title" {...props} />,
}));

vi.mock('@/components/ui/Select', () => ({
  Select: (props: Record<string, unknown>) => <select data-testid="select" {...props} />,
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ emptyMessage }: { emptyMessage?: string }) => (
    <div data-testid="data-table">{emptyMessage || 'Table'}</div>
  ),
  Column: {},
}));

vi.mock('@/components/ui/DataGrid', () => ({
  DataGrid: ({ emptyMessage }: { emptyMessage?: string }) => (
    <div data-testid="data-grid">{emptyMessage || 'Grid'}</div>
  ),
}));

vi.mock('@/components/ui/KPIValue', () => ({
  KPIValue: ({ label, value }: { label: string; value: string }) => (
    <div data-testid="kpi-value">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
}));

vi.mock('@/components/ui/WaterfallChart', () => ({
  WaterfallChart: () => <div data-testid="waterfall-chart" />,
}));

// ---------------------------------------------------------------------------
// Mock dashboard / analytics components
// ---------------------------------------------------------------------------

vi.mock('@/components/dashboard/KPICard', () => ({
  KPICard: ({ title, value }: { title: string; value: unknown }) => (
    <div data-testid="kpi-card">
      <span>{title}</span>
      <span>{String(value)}</span>
    </div>
  ),
}));

vi.mock('@/components/analytics/ChartWrapper', () => ({
  ChartWrapper: ({ title, children }: { title?: string; children?: React.ReactNode }) => (
    <div data-testid="chart-wrapper">
      {title && <span>{title}</span>}
      {children}
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Mock recharts
// ---------------------------------------------------------------------------

vi.mock('recharts', () => {
  const stub = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    AreaChart: stub,
    Area: () => null,
    BarChart: stub,
    Bar: () => null,
    LineChart: stub,
    Line: () => null,
    PieChart: stub,
    Pie: () => null,
    Cell: () => null,
    ComposedChart: stub,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
    ResponsiveContainer: stub,
  };
});

// ---------------------------------------------------------------------------
// Mock lucide-react icons
// ---------------------------------------------------------------------------

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

// ---------------------------------------------------------------------------
// Import page components AFTER mocks
// ---------------------------------------------------------------------------

import LoanLossPage from '@/pages/banking/LoanLossPage';
import BudgetVAReport from '@/pages/budgets/BudgetVAReport';
import DepreciationForecastPage from '@/pages/capex/DepreciationForecastPage';
import DebtSchedulePage from '@/pages/cash/DebtSchedulePage';
import WorkingCapitalPage from '@/pages/cash/WorkingCapitalPage';

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

describe('Page Smoke Tests (Batch 3 — 5 Untested Pages)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  // -----------------------------------------------------------------------
  describe('LoanLossPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(LoanLossPage, '/banking/loan-loss', '/banking/loan-loss');
      expect(container).toBeTruthy();
    });

    it('displays the empty state when no GL entries', () => {
      renderPage(LoanLossPage, '/banking/loan-loss', '/banking/loan-loss');
      expect(screen.getByText(/No Loan Data/i)).toBeInTheDocument();
    });

    it('shows import button in empty state', () => {
      renderPage(LoanLossPage, '/banking/loan-loss', '/banking/loan-loss');
      expect(screen.getByText(/Import Data/i)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  describe('BudgetVAReport', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(BudgetVAReport, '/budgets/va-report', '/budgets/va-report');
      expect(container).toBeTruthy();
    });

    it('displays the page heading', () => {
      renderPage(BudgetVAReport, '/budgets/va-report', '/budgets/va-report');
      expect(screen.getByText(/Budget vs\. Actuals/i)).toBeInTheDocument();
    });

    it('shows the empty state when no budget is selected', () => {
      renderPage(BudgetVAReport, '/budgets/va-report', '/budgets/va-report');
      expect(screen.getByText(/No Budget Selected/i)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  describe('DepreciationForecastPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(
        DepreciationForecastPage,
        '/capex/depreciation',
        '/capex/depreciation'
      );
      expect(container).toBeTruthy();
    });

    it('displays the empty state when no GL entries', () => {
      renderPage(DepreciationForecastPage, '/capex/depreciation', '/capex/depreciation');
      expect(screen.getByText(/No Data/i)).toBeInTheDocument();
    });

    it('shows import button in empty state', () => {
      renderPage(DepreciationForecastPage, '/capex/depreciation', '/capex/depreciation');
      expect(screen.getByText(/Import Data/i)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  describe('DebtSchedulePage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(DebtSchedulePage, '/cash/debt', '/cash/debt');
      expect(container).toBeTruthy();
    });

    it('displays the page heading', () => {
      renderPage(DebtSchedulePage, '/cash/debt', '/cash/debt');
      expect(screen.getByText(/Debt Schedule/i)).toBeInTheDocument();
    });

    it('displays the empty state when no GL entries', () => {
      renderPage(DebtSchedulePage, '/cash/debt', '/cash/debt');
      expect(screen.getByText(/No Data/i)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  describe('WorkingCapitalPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(
        WorkingCapitalPage,
        '/cash/working-capital',
        '/cash/working-capital'
      );
      expect(container).toBeTruthy();
    });

    it('displays the empty state when no GL entries', () => {
      renderPage(WorkingCapitalPage, '/cash/working-capital', '/cash/working-capital');
      expect(screen.getByText(/No Data/i)).toBeInTheDocument();
    });

    it('shows import button in empty state', () => {
      renderPage(WorkingCapitalPage, '/cash/working-capital', '/cash/working-capital');
      expect(screen.getByText(/Import Data/i)).toBeInTheDocument();
    });
  });
});
