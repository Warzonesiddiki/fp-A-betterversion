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

vi.mock('@/store/reportStore', () => ({
  useReportStore: vi.fn(() => ({
    reports: [],
    scheduledReports: [],
    createReport: vi.fn(),
    deleteReport: vi.fn(),
    addScheduledReport: vi.fn(),
    deleteScheduledReport: vi.fn(),
    toggleScheduledReport: vi.fn(),
  })),
}));

// ---------------------------------------------------------------------------
// Mock engines
// ---------------------------------------------------------------------------

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn(async () => {}), exportToExcel: vi.fn(async () => {}) },
}));

// ---------------------------------------------------------------------------
// Mock components
// ---------------------------------------------------------------------------

vi.mock('@/components/reports/ReportBookBuilder', () => ({
  ReportBookBuilder: () => <div data-testid="report-book-builder" />,
}));

vi.mock('@/components/reports/ReportScheduler', () => ({
  ReportScheduler: () => <div data-testid="report-scheduler" />,
}));

vi.mock('@/components/reports/ReportTemplateLibrary', () => ({
  ReportTemplateLibrary: () => <div data-testid="report-template-library" />,
}));

vi.mock('@/components/reports/FinancialStatementTemplates', () => ({
  ProfitLossStatement: () => <div data-testid="pl-statement" />,
  BalanceSheet: () => <div data-testid="bs-statement" />,
  CashFlowStatement: () => <div data-testid="cf-statement" />,
  BudgetVsActual: () => <div data-testid="bva-statement" />,
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
// Mock lucide-react (explicit names needed for Vitest ESM resolution)
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
    FileText: makeIcon(),
    Calendar: makeIcon(),
    ChevronDown: makeIcon(),
    ChevronUp: makeIcon(),
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
    Plus: makeIcon(),
    Save: makeIcon(),
    Table: makeIcon(),
    Play: makeIcon(),
    Layers: makeIcon(),
    Wifi: makeIcon(),
    Users: makeIcon(),
    Activity: makeIcon(),
    Store: makeIcon(),
    ArrowRight: makeIcon(),
    ShoppingCart: makeIcon(),
    Tag: makeIcon(),
    Percent: makeIcon(),
    BarChart4: makeIcon(),
    Headphones: makeIcon(),
    Landmark: makeIcon(),
    Shield: makeIcon(),
    Lock: makeIcon(),
    Eye: makeIcon(),
    EyeOff: makeIcon(),
    Key: makeIcon(),
    Fingerprint: makeIcon(),
    Smartphone: makeIcon(),
    Plug: makeIcon(),
    Globe: makeIcon(),
    Database: makeIcon(),
    FileSpreadsheet: makeIcon(),
    Webhook: makeIcon(),
    CheckCircle: makeIcon(),
    XCircle: makeIcon(),
    ExternalLink: makeIcon(),
    Settings: makeIcon(),
    HardDrive: makeIcon(),
    ShieldCheck: makeIcon(),
    FileJson: makeIcon(),
    Trash2: makeIcon(),
    Upload: makeIcon(),
    UserPlus: makeIcon(),
    Mail: makeIcon(),
    Edit2: makeIcon(),
    X: makeIcon(),
    ArrowLeftRight: makeIcon(),
    CheckCircle2: makeIcon(),
    AlertCircle: makeIcon(),
    RefreshCcw: makeIcon(),
  };
});

// ---------------------------------------------------------------------------
// Import pages AFTER mocks
// ---------------------------------------------------------------------------

import { BudgetVsActualSummary } from '@/pages/reports/components/BudgetVsActualSummary';
import { BudgetVsActualTable } from '@/pages/reports/components/BudgetVsActualTable';
import FinancialStatementTemplatesPage from '@/pages/reports/FinancialStatementTemplates';
import ReportBookBuilderPage from '@/pages/reports/ReportBookBuilder';
import ReportSchedulerPage from '@/pages/reports/ReportScheduler';
import ReportTemplateLibraryPage from '@/pages/reports/ReportTemplateLibraryPage';

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
// Tests
// ---------------------------------------------------------------------------

describe('Reports pages smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  describe('BudgetVsActualSummary', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <BudgetVsActualSummary
          totalBudget="$100,000"
          totalActual="$95,000"
          netVariance="$5,000"
          utilizationPercentage={95}
          isVarianceFavorable
        />
      );
      expect(container).toBeTruthy();
    });
    it('displays summary labels', () => {
      render(
        <BudgetVsActualSummary
          totalBudget="$100,000"
          totalActual="$95,000"
          netVariance="$5,000"
          utilizationPercentage={95}
        />
      );
      expect(screen.getByText(/Total Budget/i)).toBeTruthy();
      expect(screen.getByText(/Total Actual/i)).toBeTruthy();
      expect(screen.getByText(/Net Variance/i)).toBeTruthy();
    });
  });

  describe('BudgetVsActualTable', () => {
    it('renders without crashing', () => {
      const { container } = render(
        <MemoryRouter>
          <BudgetVsActualTable data={[]} />
        </MemoryRouter>
      );
      expect(container).toBeTruthy();
    });
    it('renders table headers', () => {
      const sampleData = [
        {
          account: 'Revenue',
          budget: '$100',
          actual: '$110',
          variance: '$10',
          percentVar: '10%',
          isFavorable: true,
        },
      ];
      render(
        <MemoryRouter>
          <BudgetVsActualTable data={sampleData} />
        </MemoryRouter>
      );
      expect(screen.getAllByText(/Account/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Budget/i).length).toBeGreaterThan(0);
    });
  });

  describe('FinancialStatementTemplatesPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(
        FinancialStatementTemplatesPage,
        '/reports/financial-templates'
      );
      expect(container).toBeTruthy();
    });
    it('shows empty state with no GL data', () => {
      renderPage(FinancialStatementTemplatesPage, '/reports/financial-templates');
      expect(screen.getByText(/No GL Data/i)).toBeTruthy();
    });
  });

  describe('ReportBookBuilderPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(ReportBookBuilderPage, '/reports/book-builder');
      expect(container).toBeTruthy();
    });
    it('shows empty state with no GL data', () => {
      renderPage(ReportBookBuilderPage, '/reports/book-builder');
      expect(screen.getByText(/No GL Data/i)).toBeTruthy();
    });
  });

  describe('ReportSchedulerPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(ReportSchedulerPage, '/reports/scheduler');
      expect(container).toBeTruthy();
    });
    it('shows empty state with no GL data', () => {
      renderPage(ReportSchedulerPage, '/reports/scheduler');
      expect(screen.getByText(/No GL Data/i)).toBeTruthy();
    });
  });

  describe('ReportTemplateLibraryPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(ReportTemplateLibraryPage, '/reports/templates');
      expect(container).toBeTruthy();
    });
    it('renders template library component', () => {
      renderPage(ReportTemplateLibraryPage, '/reports/templates');
      expect(screen.getByTestId('report-template-library')).toBeTruthy();
    });
  });
});
