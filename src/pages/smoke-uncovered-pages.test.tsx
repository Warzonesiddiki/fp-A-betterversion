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
  })),
}));

vi.mock('@/store/collaborationStore', () => ({
  useCollaborationStore: vi.fn(() => ({
    comments: [],
    approvals: [],
    activityLog: [],
    addComment: vi.fn(),
    setComments: vi.fn(),
    setApprovals: vi.fn(),
    setActivityLog: vi.fn(),
  })),
}));

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: vi.fn(() => ({
    budgets: [],
    setBudgets: vi.fn(),
    addBudget: vi.fn(),
    updateBudget: vi.fn(),
    deleteBudget: vi.fn(),
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

vi.mock('@/engines/ConsolidationEngine', () => ({
  ConsolidationEngine: {
    consolidate: vi.fn(() => ({
      entries: [],
      eliminations: [],
      adjustments: [],
      totals: { revenue: 0, expenses: 0, netIncome: 0 },
    })),
  },
}));

// ---------------------------------------------------------------------------
// Mock recharts
// ---------------------------------------------------------------------------

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

// ---------------------------------------------------------------------------
// Mock UI components that are not simple wrappers
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

vi.mock('@/components/ui/FinancialTable', () => ({
  FinancialTable: () => <div data-testid="financial-table" />,
}));

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

vi.mock('@/components/ui/Input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input data-testid="mock-input" {...props} />
  ),
}));

vi.mock('@/components/ui/Select', () => ({
  Select: ({ id }: { id?: string }) => <select data-testid="mock-select" id={id} />,
}));

// ---------------------------------------------------------------------------
// Mock lucide-react icons
// ---------------------------------------------------------------------------

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

// ---------------------------------------------------------------------------
// Import page components AFTER mocks
// ---------------------------------------------------------------------------

import WorkingCapitalPage from '@/pages/cash/WorkingCapitalPage';
import ApprovalQueuePage from '@/pages/collaboration/ApprovalQueuePage';
import CollaborationPage from '@/pages/collaboration/CollaborationPage';
import ConsolidationDashboard from '@/pages/consolidation/ConsolidationDashboard';
import OwnershipTreePage from '@/pages/consolidation/OwnershipTreePage';

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

describe('Page Smoke Tests — 5 Uncovered Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  // -----------------------------------------------------------------------
  // WorkingCapitalPage
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

    it('displays the empty state when no GL entries exist', () => {
      const { getByText } = renderPage(
        WorkingCapitalPage,
        '/cash/working-capital',
        '/cash/working-capital'
      );
      expect(getByText(/No Data/i)).toBeInTheDocument();
    });

    it('shows the import data button in empty state', () => {
      const { getByText } = renderPage(
        WorkingCapitalPage,
        '/cash/working-capital',
        '/cash/working-capital'
      );
      expect(getByText(/Import Data/i)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // ApprovalQueuePage
  // -----------------------------------------------------------------------

  describe('ApprovalQueuePage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(
        ApprovalQueuePage,
        '/collaboration/approvals',
        '/collaboration/approvals'
      );
      expect(container).toBeTruthy();
    });

    it('displays the page heading', () => {
      const { getByText } = renderPage(
        ApprovalQueuePage,
        '/collaboration/approvals',
        '/collaboration/approvals'
      );
      expect(getByText(/Approval Queue/i)).toBeInTheDocument();
    });

    it('shows filter buttons', () => {
      const { getByRole } = renderPage(
        ApprovalQueuePage,
        '/collaboration/approvals',
        '/collaboration/approvals'
      );
      expect(getByRole('button', { name: /^All$/ })).toBeInTheDocument();
      expect(getByRole('button', { name: /^Pending$/ })).toBeInTheDocument();
      expect(getByRole('button', { name: /^Approved$/ })).toBeInTheDocument();
      expect(getByRole('button', { name: /^Rejected$/ })).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // CollaborationPage
  // -----------------------------------------------------------------------

  describe('CollaborationPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(CollaborationPage, '/collaboration', '/collaboration');
      expect(container).toBeTruthy();
    });

    it('displays the page heading', () => {
      const { getByText } = renderPage(CollaborationPage, '/collaboration', '/collaboration');
      expect(getByText(/Collaboration/i)).toBeInTheDocument();
    });

    it('shows the discussion thread section', () => {
      const { getByText } = renderPage(CollaborationPage, '/collaboration', '/collaboration');
      expect(getByText(/No comments yet/i)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // ConsolidationDashboard
  // -----------------------------------------------------------------------

  describe('ConsolidationDashboard', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(ConsolidationDashboard, '/consolidation', '/consolidation');
      expect(container).toBeTruthy();
    });

    it('displays the page heading', () => {
      const { getByText } = renderPage(ConsolidationDashboard, '/consolidation', '/consolidation');
      expect(getByText(/Legal Entity Consolidation/i)).toBeInTheDocument();
    });

    it('shows the empty state for entities', () => {
      const { getByText } = renderPage(ConsolidationDashboard, '/consolidation', '/consolidation');
      expect(getByText(/No entities defined yet/i)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // OwnershipTreePage
  // -----------------------------------------------------------------------

  describe('OwnershipTreePage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(
        OwnershipTreePage,
        '/consolidation/ownership-tree',
        '/consolidation/ownership-tree'
      );
      expect(container).toBeTruthy();
    });

    it('displays the page heading', () => {
      const { getByText } = renderPage(
        OwnershipTreePage,
        '/consolidation/ownership-tree',
        '/consolidation/ownership-tree'
      );
      expect(getByText(/Ownership Structure/i)).toBeInTheDocument();
    });

    it('shows the entity hierarchy', () => {
      const { getByText } = renderPage(
        OwnershipTreePage,
        '/consolidation/ownership-tree',
        '/consolidation/ownership-tree'
      );
      expect(getByText(/Global Corp/i)).toBeInTheDocument();
    });
  });
});
