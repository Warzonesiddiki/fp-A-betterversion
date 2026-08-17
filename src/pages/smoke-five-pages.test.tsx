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
    isLoading: false,
    analyzeAccount: vi.fn(),
  })),
}));

vi.mock('@/store/dataStore', () => ({
  useDataStore: vi.fn(() => ({
    accounts: [],
    addAccount: vi.fn(),
    updateAccount: vi.fn(),
    deleteAccount: vi.fn(),
    toggleAccountActive: vi.fn(),
  })),
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

vi.mock('@/components/ui/PeriodPicker', () => ({
  PeriodPicker: () => <div data-testid="period-picker" />,
}));

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: ({ variant, height }: { variant?: string; height?: number }) => (
    <div data-testid="skeleton" data-variant={variant} style={{ height }} />
  ),
}));

vi.mock('@/components/ui/Input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input data-testid="mock-input" {...props} />
  ),
}));

vi.mock('@/components/ui/Select', () => ({
  Select: ({
    options,
    value,
    onChange,
    placeholder,
  }: {
    options?: { value: string; label: string }[];
    value?: string;
    onChange?: (v: string) => void;
    placeholder?: string;
  }) => (
    <select data-testid="mock-select" value={value} onChange={(e) => onChange?.(e.target.value)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options?.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div data-testid="modal">{children}</div> : null,
}));

vi.mock('@/components/ui/Badge', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/Alert', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => <div data-testid="alert">{children}</div>,
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
    Calculator: makeIcon(),
    DollarSign: makeIcon(),
    TrendingDown: makeIcon(),
    AlertTriangle: makeIcon(),
    FileText: makeIcon(),
    ArrowRightLeft: makeIcon(),
    Download: makeIcon(),
    Filter: makeIcon(),
    BarChart3: makeIcon(),
    Scale: makeIcon(),
    PieChart: makeIcon(),
    Shield: makeIcon(),
    Plus: makeIcon(),
    Pencil: makeIcon(),
    Trash2: makeIcon(),
    AlertCircle: makeIcon(),
    Repeat: makeIcon(),
    ArrowRight: makeIcon(),
    TrendingUp: makeIcon(),
    Search: makeIcon(),
    FolderTree: makeIcon(),
    List: makeIcon(),
    ToggleLeft: makeIcon(),
    ToggleRight: makeIcon(),
    Minus: makeIcon(),
  };
});

// ---------------------------------------------------------------------------
// Import page components AFTER mocks
// ---------------------------------------------------------------------------

import ProjectCostingPage from '@/pages/construction/ProjectCostingPage';
import HedgeManagementPage from '@/pages/currency/HedgeManagementPage';
import TranslationResultPage from '@/pages/currency/TranslationResultPage';
import ChartOfAccountsPage from '@/pages/data/ChartOfAccountsPage';
import GLAccountAnalysisPage from '@/pages/data/GLAccountAnalysisPage';

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

describe('Page Smoke Tests — 5 New Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  // -----------------------------------------------------------------------
  // ProjectCostingPage
  // -----------------------------------------------------------------------

  describe('ProjectCostingPage', () => {
    it('renders without crashing', () => {
      const { container } = renderPage(
        ProjectCostingPage,
        '/construction/project-costing',
        '/construction/project-costing'
      );
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });

    it('displays the page heading', () => {
      const { getByText } = renderPage(
        ProjectCostingPage,
        '/construction/project-costing',
        '/construction/project-costing'
      );
      expect(getByText(/Project Costing/i)).toBeInTheDocument();
    });

    it('shows the empty state when no GL entries exist', () => {
      const { getByText } = renderPage(
        ProjectCostingPage,
        '/construction/project-costing',
        '/construction/project-costing'
      );
      expect(getByText(/No Project Costing Data/i)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // HedgeManagementPage
  // -----------------------------------------------------------------------

  describe('HedgeManagementPage', () => {
    it('renders the empty state when no GL entries exist', () => {
      const { getByText } = renderPage(
        HedgeManagementPage,
        '/currency/hedge-management',
        '/currency/hedge-management'
      );
      expect(getByText(/No Data/i)).toBeInTheDocument();
    });

    it('shows the import data button in empty state', () => {
      const { getByRole } = renderPage(
        HedgeManagementPage,
        '/currency/hedge-management',
        '/currency/hedge-management'
      );
      expect(getByRole('button', { name: /Import Data/i })).toBeInTheDocument();
    });

    it('renders without crashing', () => {
      const { container } = renderPage(
        HedgeManagementPage,
        '/currency/hedge-management',
        '/currency/hedge-management'
      );
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });
  });

  // -----------------------------------------------------------------------
  // TranslationResultPage
  // -----------------------------------------------------------------------

  describe('TranslationResultPage', () => {
    it('renders the empty state when no GL entries exist', () => {
      const { getByText } = renderPage(
        TranslationResultPage,
        '/currency/translation-results',
        '/currency/translation-results'
      );
      expect(getByText(/No Data to Translate/i)).toBeInTheDocument();
    });

    it('shows the import data button in empty state', () => {
      const { getByText } = renderPage(
        TranslationResultPage,
        '/currency/translation-results',
        '/currency/translation-results'
      );
      expect(getByText(/Import Data/i)).toBeInTheDocument();
    });

    it('renders without crashing', () => {
      const { container } = renderPage(
        TranslationResultPage,
        '/currency/translation-results',
        '/currency/translation-results'
      );
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });
  });

  // -----------------------------------------------------------------------
  // ChartOfAccountsPage
  // -----------------------------------------------------------------------

  describe('ChartOfAccountsPage', () => {
    it('renders the empty state when no accounts exist', () => {
      const { getByText } = renderPage(
        ChartOfAccountsPage,
        '/data/chart-of-accounts',
        '/data/chart-of-accounts'
      );
      expect(getByText(/No Accounts Defined/i)).toBeInTheDocument();
    });

    it('shows the add first account button', () => {
      const { getByText } = renderPage(
        ChartOfAccountsPage,
        '/data/chart-of-accounts',
        '/data/chart-of-accounts'
      );
      expect(getByText(/Add First Account/i)).toBeInTheDocument();
    });

    it('shows the import from CSV button', () => {
      const { getByText } = renderPage(
        ChartOfAccountsPage,
        '/data/chart-of-accounts',
        '/data/chart-of-accounts'
      );
      expect(getByText(/Import from CSV/i)).toBeInTheDocument();
    });

    it('renders without crashing', () => {
      const { container } = renderPage(
        ChartOfAccountsPage,
        '/data/chart-of-accounts',
        '/data/chart-of-accounts'
      );
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });
  });

  // -----------------------------------------------------------------------
  // GLAccountAnalysisPage
  // -----------------------------------------------------------------------

  describe('GLAccountAnalysisPage', () => {
    it('renders the empty state when no GL entries exist', () => {
      const { getByText } = renderPage(
        GLAccountAnalysisPage,
        '/data/gl-account-analysis',
        '/data/gl-account-analysis'
      );
      expect(getByText(/No GL Data/i)).toBeInTheDocument();
    });

    it('shows the import data button in empty state', () => {
      const { getByText } = renderPage(
        GLAccountAnalysisPage,
        '/data/gl-account-analysis',
        '/data/gl-account-analysis'
      );
      expect(getByText(/Import Data/i)).toBeInTheDocument();
    });

    it('renders without crashing', () => {
      const { container } = renderPage(
        GLAccountAnalysisPage,
        '/data/gl-account-analysis',
        '/data/gl-account-analysis'
      );
      expect(
        container.querySelectorAll('*').length,
        'rendered nothing: a truthy container does not prove the page mounted'
      ).toBeGreaterThanOrEqual(2);
    });
  });
});
