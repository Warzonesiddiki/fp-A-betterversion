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

vi.mock('@/store/entityStore', () => {
  const state = { entities: [] };
  return {
    useEntityStore: (selector?: (s: typeof state) => unknown) =>
      selector ? selector(state) : state,
  };
});

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

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    exportToPDF: vi.fn(),
    exportToExcel: vi.fn(async () => {}),
  },
}));

vi.mock('@/engines/CellAuditTrailEngine', () => ({
  CellAuditTrailEngine: vi.fn(function () {
    return { getAllEntries: vi.fn(() => []) };
  }),
}));

// ---------------------------------------------------------------------------
// Mock recharts (used by InvestmentPage)
// ---------------------------------------------------------------------------

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => null,
  Cell: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

// ---------------------------------------------------------------------------
// Mock lucide-react icons
// ---------------------------------------------------------------------------

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

// ---------------------------------------------------------------------------
// Import page components AFTER mocks
// ---------------------------------------------------------------------------

import CashFlowPage from '@/pages/reports/CashFlowPage';
import InvestmentPage from '@/pages/treasury/InvestmentPage';
import ICEliminationPage from '@/pages/consolidation/ICEliminationPage';
import FXRatesPage from '@/pages/currency/FXRatesPage';
import AuditTrailPage from '@/pages/audit/AuditTrailPage';
import { useAuditTrailStore } from '@/store/auditTrailStore';

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

describe('Page Smoke Tests — 5 Additional Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  describe('CashFlowPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(CashFlowPage, '/reports/cash-flow', '/reports/cash-flow');
      expect(container).toBeTruthy();
    });

    it('displays the empty state when no GL entries exist', () => {
      const { getByText } = renderPage(CashFlowPage, '/reports/cash-flow', '/reports/cash-flow');
      expect(getByText(/No Data/i)).toBeInTheDocument();
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

    it('displays the empty state when no GL entries exist', () => {
      const { getByText } = renderPage(
        InvestmentPage,
        '/treasury/investments',
        '/treasury/investments'
      );
      expect(getByText(/No Data/i)).toBeInTheDocument();
    });
  });

  describe('ICEliminationPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(
        ICEliminationPage,
        '/consolidation/elimination',
        '/consolidation/elimination'
      );
      expect(container).toBeTruthy();
    });

    it('displays the page heading', () => {
      const { getByText } = renderPage(
        ICEliminationPage,
        '/consolidation/elimination',
        '/consolidation/elimination'
      );
      expect(getByText(/Intercompany Elimination/i)).toBeInTheDocument();
    });
  });

  describe('FXRatesPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(FXRatesPage, '/currency/fx-rates', '/currency/fx-rates');
      expect(container).toBeTruthy();
    });

    it('displays the empty state when no GL entries exist', () => {
      const { getByText } = renderPage(FXRatesPage, '/currency/fx-rates', '/currency/fx-rates');
      expect(getByText(/No Data/i)).toBeInTheDocument();
    });
  });

  describe('AuditTrailPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(AuditTrailPage, '/audit/trail', '/audit/trail');
      expect(container).toBeTruthy();
    });

    it('denies access to roles without GDPR audit permission (RBAC gate)', () => {
      // Default role is 'viewer'. The page must fail CLOSED, not render data.
      useAuditTrailStore.setState({ currentUserRole: 'viewer' });
      const { getByText } = renderPage(AuditTrailPage, '/audit/trail', '/audit/trail');
      expect(getByText(/Access Denied/i)).toBeInTheDocument();
    });

    it('displays the empty state when no audit entries exist (authorized role)', () => {
      useAuditTrailStore.setState({ currentUserRole: 'admin' });
      const { getByText } = renderPage(AuditTrailPage, '/audit/trail', '/audit/trail');
      expect(getByText(/No Audit Entries/i)).toBeInTheDocument();
    });
  });
});
