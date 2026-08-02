/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

// ---------------------------------------------------------------------------
// Mock stores used by these 10 page components
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

vi.mock('@/store/uiStore', () => ({
  useUIStore: vi.fn(() => ({
    mobileSidebarOpen: false,
    closeMobileSidebar: vi.fn(),
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

vi.mock('@/engines/CellAuditTrailEngine', () => ({
  CellAuditTrailEngine: vi.fn(function () {
    return { getAllEntries: vi.fn(() => []) };
  }),
}));

vi.mock('@/engines/AIEngine', () => ({
  // AIEngine exposes only static methods (init, getStatus, detectAnomalies,
  // classify, dispose) — it is never instantiated with `new`. The previous
  // mock modeled it as a constructor function, so any page calling a static
  // method (e.g. AIIntelligencePage's `AIEngine.getStatus()`) crashed with
  // "AIEngine.getStatus is not a function".
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

vi.mock('@/engines/ConsolidationEngine', () => ({
  ConsolidationEngine: vi.fn(function () {
    return {
      consolidate: vi.fn(() => ({
        entries: [],
        eliminations: [],
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
      })),
    };
  }),
}));

// ---------------------------------------------------------------------------
// Mock the entire UI barrel to avoid transitive import issues
// ---------------------------------------------------------------------------
vi.mock('@/components/ui', () => {
  const stub = (props: Record<string, unknown>) => <div data-testid="ui-stub" {...props} />;
  const forwardRefStub = React.forwardRef<HTMLDivElement, Record<string, unknown>>((props, ref) => (
    <div ref={ref} data-testid="ui-stub" {...props} />
  ));
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
    Progress: ({ value }: { value: number }) => <div data-testid="progress" data-value={value} />,
    KPIValue: ({ label, value }: { label: string; value: string }) => (
      <div data-testid="kpi-value">
        <span>{label}</span>
        <span>{value}</span>
      </div>
    ),
    DataTable: ({ emptyMessage }: { emptyMessage?: string }) => (
      <div data-testid="data-table">{emptyMessage || 'Table'}</div>
    ),
    FinancialTable: () => <div data-testid="financial-table" />,
    HelpPanel: ({ open }: { open: boolean }) => (open ? <div data-testid="help-panel" /> : null),
    Alert: ({ children }: { children: React.ReactNode }) => <div role="alert">{children}</div>,
    Badge: stub,
    Breadcrumb: stub,
    Tooltip: stub,
    Tabs: stub,
    Pagination: stub,
    ProgressStepper: stub,
    SplitPane: stub,
    SpreadsheetGrid: stub,
    GaugeChart: stub,
    SankeyChart: stub,
    ScatterPlot: stub,
    TornadoChart: stub,
    TreeMap: stub,
    WaterfallChart: stub,
    ComboChart: stub,
    Heatmap: stub,
    CalendarHeatmap: stub,
    Sparkline: stub,
    ErrorState: stub,
    ExportMenu: stub,
    FormulaBar: stub,
    GuidedTour: stub,
    TourOverlay: stub,
    CommandPalette: stub,
    ContextMenu: stub,
    FileDropZone: stub,
    DrillDownModal: stub,
    CurrencyInput: stub,
    Avatar: stub,
    LoadingScreen: stub,
    PeriodPicker: stub,
    EntityTree: stub,
    Toast: stub,
    DriverSlider: stub,
    DataGrid: stub,
  };
});

// Also mock individual component files that pages import directly
vi.mock('@/components/ui/Button', () => ({
  Button: (props: Record<string, unknown>) => <button data-testid="button" {...props} />,
}));

vi.mock('@/components/ui/Card', () => ({
  Card: (props: Record<string, unknown>) => <div data-testid="card" {...props} />,
  CardContent: (props: Record<string, unknown>) => <div data-testid="card-content" {...props} />,
  CardHeader: (props: Record<string, unknown>) => <div data-testid="card-header" {...props} />,
  CardTitle: (props: Record<string, unknown>) => <div data-testid="card-title" {...props} />,
  CardDescription: (props: Record<string, unknown>) => (
    <div data-testid="card-description" {...props} />
  ),
  CardFooter: (props: Record<string, unknown>) => <div data-testid="card-footer" {...props} />,
}));

vi.mock('@/components/ui/Input', () => ({
  Input: (props: Record<string, unknown>) => <input data-testid="input" {...props} />,
}));

vi.mock('@/components/ui/Select', () => ({
  Select: (props: Record<string, unknown>) => <select data-testid="select" {...props} />,
}));

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div data-testid="modal">{children}</div> : null,
}));

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
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

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ emptyMessage }: { emptyMessage?: string }) => (
    <div data-testid="data-table">{emptyMessage || 'Table'}</div>
  ),
}));

vi.mock('@/components/ui/FinancialTable', () => ({
  FinancialTable: () => <div data-testid="financial-table" />,
}));

vi.mock('@/components/ui/Progress', () => ({
  Progress: ({ value }: { value: number }) => <div data-testid="progress" data-value={value} />,
}));

vi.mock('@/components/ui/HelpPanel', () => ({
  HelpPanel: ({ open }: { open: boolean }) => (open ? <div data-testid="help-panel" /> : null),
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
// Mock lucide-react icons — keep all original exports but override as icon stubs
// ---------------------------------------------------------------------------

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

// ---------------------------------------------------------------------------
// Import page components AFTER mocks
// ---------------------------------------------------------------------------

import CashForecastPage from '@/pages/cash/CashForecastPage';
import InvestmentPage from '@/pages/treasury/InvestmentPage';
import ConsolidationDashboard from '@/pages/consolidation/ConsolidationDashboard';
import FXRatesPage from '@/pages/currency/FXRatesPage';
import AuditTrailPage from '@/pages/audit/AuditTrailPage';
import { useAuditTrailStore } from '@/store/auditTrailStore';
import CapExDashboard from '@/pages/capex/CapExDashboard';
import AIIntelligencePage from '@/pages/ai/AIIntelligencePage';
import LeaseDashboard from '@/pages/lease/LeaseDashboard';
import RevRecDashboard from '@/pages/revenue/RevRecDashboard';
import HelpPage from '@/pages/HelpPage';

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

describe('Page Smoke Tests (Batch 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  describe('CashForecastPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(CashForecastPage, '/cash/forecast', '/cash/forecast');
      expect(container).toBeTruthy();
    });

    it('does not crash with empty entries', () => {
      // CashForecastPage returns null when entries is empty
      const { container } = renderPage(CashForecastPage, '/cash/forecast', '/cash/forecast');
      expect(container.innerHTML).not.toContain('Error');
    });
  });

  describe('InvestmentPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(
        InvestmentPage,
        '/treasury/investments',
        '/treasury/investments'
      );
      expect(container).toBeTruthy();
    });

    it('displays the empty state', () => {
      renderPage(InvestmentPage, '/treasury/investments', '/treasury/investments');
      expect(screen.getByText(/No Data/i)).toBeInTheDocument();
    });
  });

  describe('ConsolidationDashboard', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(ConsolidationDashboard, '/consolidation', '/consolidation');
      expect(container).toBeTruthy();
    });

    it('displays the empty state', () => {
      renderPage(ConsolidationDashboard, '/consolidation', '/consolidation');
      expect(screen.getByText(/No entities defined/i)).toBeInTheDocument();
    });
  });

  describe('FXRatesPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(FXRatesPage, '/currency/rates', '/currency/rates');
      expect(container).toBeTruthy();
    });

    it('displays the page heading', () => {
      renderPage(FXRatesPage, '/currency/rates', '/currency/rates');
      expect(screen.getByText(/No Data/i)).toBeInTheDocument();
    });
  });

  describe('AuditTrailPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(AuditTrailPage, '/audit', '/audit');
      expect(container).toBeTruthy();
    });

    it('denies access to roles without GDPR audit permission (RBAC gate)', () => {
      useAuditTrailStore.setState({ currentUserRole: 'viewer' });
      renderPage(AuditTrailPage, '/audit', '/audit');
      expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
    });

    it('displays the empty state (authorized role)', () => {
      useAuditTrailStore.setState({ currentUserRole: 'admin' });
      renderPage(AuditTrailPage, '/audit', '/audit');
      expect(screen.getByText(/No Audit Entries/i)).toBeInTheDocument();
    });
  });

  describe('CapExDashboard', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(CapExDashboard, '/capex', '/capex');
      expect(container).toBeTruthy();
    });

    it('displays the page heading', () => {
      renderPage(CapExDashboard, '/capex', '/capex');
      expect(screen.getByText(/Capital Expenditure/i)).toBeInTheDocument();
    });
  });

  describe('AIIntelligencePage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(AIIntelligencePage, '/ai', '/ai');
      expect(container).toBeTruthy();
    });

    it('displays the page heading', () => {
      renderPage(AIIntelligencePage, '/ai', '/ai');
      expect(screen.getByText(/AI Intelligence Center/i)).toBeInTheDocument();
    });
  });

  describe('LeaseDashboard', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(LeaseDashboard, '/lease', '/lease');
      expect(container).toBeTruthy();
    });

    // NOTE: LeaseDashboard renders a demo lease portfolio (hardcoded sample
    // inputs whose outputs are computed live by LeaseEngine — see its own
    // dedicated LeaseDashboard.test.tsx). It is NOT yet backed by a lease
    // data store, so no empty state is reachable today. Tracked as GAP (lease
    // store wiring) in GAP_LEDGER.md; assert the real rendered behavior.
    it('renders the computed lease portfolio dashboard', () => {
      renderPage(LeaseDashboard, '/lease', '/lease');
      expect(screen.getByText(/Lease Portfolio Dashboard/i)).toBeInTheDocument();
    });
  });

  describe('RevRecDashboard', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(RevRecDashboard, '/revenue', '/revenue');
      expect(container).toBeTruthy();
    });

    it('displays the empty state', () => {
      renderPage(RevRecDashboard, '/revenue', '/revenue');
      expect(screen.getByText(/No Revenue Data/i)).toBeInTheDocument();
    });
  });

  describe('HelpPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(HelpPage, '/help', '/help');
      expect(container).toBeTruthy();
    });

    it('displays the help center heading', () => {
      renderPage(HelpPage, '/help', '/help');
      expect(screen.getByText(/Help Center/i)).toBeInTheDocument();
    });
  });
});
