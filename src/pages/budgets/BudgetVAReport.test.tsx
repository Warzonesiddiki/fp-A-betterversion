/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

// ---------------------------------------------------------------------------
// Mock stores (mutable so each state branch can be driven)
// ---------------------------------------------------------------------------

type BudgetMockState = {
  budgets: Array<Record<string, unknown>>;
  activeBudgetId: string | null;
  lineItems: Array<Record<string, unknown>>;
  isLoading: boolean;
};
let budgetState: BudgetMockState = {
  budgets: [],
  activeBudgetId: null,
  lineItems: [],
  isLoading: false,
};

type GLMockState = {
  entries: unknown[];
  accounts: unknown[];
  importError: string | null;
};
let glState: GLMockState = { entries: [], accounts: [], importError: null };

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: vi.fn(() => ({
    budgets: budgetState.budgets,
    activeBudgetId: budgetState.activeBudgetId,
    lineItems: budgetState.lineItems,
    isLoading: budgetState.isLoading,
    error: null,
    setActiveBudget: vi.fn(),
    updateBudget: vi.fn(),
  })),
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => glState),
}));

// ---------------------------------------------------------------------------
// Mock recharts (ReferenceLine added — VarianceChart imports it)
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
  ReferenceLine: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => null,
}));

// ---------------------------------------------------------------------------
// Mock lucide-react via the shared proxy double (covers EmptyState/ErrorState
// internals like Inbox/AlertTriangle/RefreshCw without enumerating icons)
// ---------------------------------------------------------------------------

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

// ---------------------------------------------------------------------------
// Mock UI components
// ---------------------------------------------------------------------------

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div {...props}>{children}</div>
  ),
  CardHeader: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div {...props}>{children}</div>
  ),
}));

interface MockSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
}

vi.mock('@/components/ui/Select', () => ({
  Select: ({ value, onChange, placeholder, options }: MockSelectProps) => (
    <select data-testid="mock-select" value={value} onChange={(e) => onChange?.(e.target.value)}>
      <option value="">{placeholder || 'Select...'}</option>
      {(options ?? []).map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: () => <div data-testid="data-table" />,
}));

vi.mock('@/components/ui/WaterfallChart', () => ({
  WaterfallChart: () => <div data-testid="waterfall-chart" />,
}));

// ---------------------------------------------------------------------------
// Import page AFTER mocks
// ---------------------------------------------------------------------------

import BudgetVAReport from '@/pages/budgets/BudgetVAReport';

const APPROVED_BUDGET = {
  id: 'b1',
  name: 'FY24 Budget',
  fiscalYear: 2024,
  status: 'Approved',
};

const B1_LINE_ITEM = {
  id: 'li1',
  budgetId: 'b1',
  accountId: 'a1',
  accountName: 'Salaries',
  accountCode: '6000',
  month: 0,
  amount: 1000,
  isLocked: false,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/budgets/bva']}>
      <Routes>
        <Route path="/budgets/bva" element={<BudgetVAReport />} />
        <Route path="/budgets" element={<div data-testid="budgets-page">Budgets</div>} />
        <Route
          path="/budgets/:id"
          element={<div data-testid="budget-editor-page">Budget Editor</div>}
        />
        <Route path="/data" element={<div data-testid="data-import-page">Data Import</div>} />
        <Route path="/data/gl-upload" element={<div data-testid="gl-upload-page">GL Upload</div>} />
        <Route path="*" element={<div data-testid="other-page">Other</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BudgetVAReport smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    budgetState = { budgets: [], activeBudgetId: null, lineItems: [], isLoading: false };
    glState = { entries: [], accounts: [], importError: null };
  });

  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('displays no-budget-selected state', () => {
    renderPage();
    expect(screen.getByText(/No Budget Selected/i)).toBeInTheDocument();
  });
});

describe('BudgetVAReport — K30 four-states (N8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    budgetState = { budgets: [], activeBudgetId: null, lineItems: [], isLoading: false };
    glState = { entries: [], accounts: [], importError: null };
  });

  it('renders a hydration skeleton under the mounted h1 instead of flashing guidance', () => {
    budgetState = { budgets: [], activeBudgetId: null, lineItems: [], isLoading: true };
    renderPage();
    expect(screen.getByTestId('bva-report-loading')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: /Budget vs\. Actuals/i })
    ).toBeInTheDocument();
    // Neither the guidance card nor the analysis chrome may appear while
    // the persisted store is still hydrating.
    expect(screen.queryByText(/No Budget Selected/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('waterfall-chart')).not.toBeInTheDocument();
  });

  it('guidance calls out the approval prerequisite when budgets exist but none are approved', () => {
    budgetState = {
      budgets: [{ id: 'b2', name: 'Draft Plan', fiscalYear: 2026, status: 'Draft' }],
      activeBudgetId: null,
      lineItems: [],
      isLoading: false,
    };
    renderPage();
    expect(
      screen.getByRole('heading', { level: 3, name: /No Budget Selected/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/No approved budgets are available yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go to Budgets/i })).toBeInTheDocument();
  });

  it('shows an EmptyState instead of zero-variance chrome when the selected budget has no line items', () => {
    budgetState = {
      budgets: [APPROVED_BUDGET],
      activeBudgetId: null,
      lineItems: [],
      isLoading: false,
    };
    glState = {
      entries: [{ id: 'e1', accountCode: '6000', debit: 500, credit: 0, date: '2026-01-15' }],
      accounts: [],
      importError: null,
    };
    renderPage();
    fireEvent.change(screen.getByTestId('mock-select'), { target: { value: 'b1' } });

    expect(screen.getByText(/No plan lines to compare/i)).toBeInTheDocument();
    // None of the fabricated zero-value analysis may leak into this branch.
    expect(screen.queryByTestId('data-table')).not.toBeInTheDocument();
    expect(screen.queryByTestId('waterfall-chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();

    // The CTA routes back into the real editor for that exact budget.
    fireEvent.click(screen.getByTestId('bva-open-budget'));
    expect(screen.getByTestId('budget-editor-page')).toBeInTheDocument();
  });
});

describe('BudgetVAReport — W-K30-001 state coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    budgetState = { budgets: [], activeBudgetId: null, lineItems: [], isLoading: false };
    glState = { entries: [], accounts: [], importError: null };
  });

  it('selection guidance renders EmptyState with a Go to Budgets CTA that navigates', () => {
    renderPage();
    const heading = screen.getByRole('heading', { level: 3, name: /No Budget Selected/i });
    expect(heading).toBeInTheDocument();
    const cta = screen.getByRole('button', { name: /Go to Budgets/i });
    // Heading discipline: the page h1 (PageHeader) precedes the h3 while the
    // guidance branch is on screen.
    expect(
      screen.getByRole('heading', { level: 1, name: /Budget vs\. Actuals/i })
    ).toBeInTheDocument();
    fireEvent.click(cta);
    expect(screen.getByTestId('budgets-page')).toBeInTheDocument();
  });

  it('renders a GL-empty EmptyState when a budget is selected but no actuals are posted', () => {
    budgetState = { budgets: [APPROVED_BUDGET], activeBudgetId: null, lineItems: [B1_LINE_ITEM] };
    renderPage();
    fireEvent.change(screen.getByTestId('mock-select'), { target: { value: 'b1' } });
    expect(screen.getByText(/No posted actuals/i)).toBeInTheDocument();
    const cta = screen.getByRole('button', { name: /Import Data/i });
    fireEvent.click(cta);
    expect(screen.getByTestId('gl-upload-page')).toBeInTheDocument();
    // None of the populated analysis chrome may leak into this branch.
    expect(screen.queryByTestId('waterfall-chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('data-table')).not.toBeInTheDocument();
  });

  it('renders ErrorState with retry when the GL store reports an import error', () => {
    glState = { entries: [], accounts: [], importError: 'Row 7: debit does not balance' };
    renderPage();
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByText(/Failed to load actuals/i)).toBeInTheDocument();
    expect(screen.getByText(/Row 7: debit does not balance/i)).toBeInTheDocument();
    expect(screen.getByTestId('error-code')).toHaveTextContent('GL-IMPORT-ERROR');
    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.getByText('Go to Data Import')).toBeInTheDocument();
    // Error takes precedence over selection guidance.
    expect(screen.queryByText(/No Budget Selected/i)).not.toBeInTheDocument();
  });

  it('reloads the page when the error-state retry button is clicked', () => {
    glState = { entries: [], accounts: [], importError: 'boom' };
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload },
      writable: true,
    });
    renderPage();
    fireEvent.click(screen.getByText('Retry'));
    expect(reload).toHaveBeenCalledOnce();
  });

  it('renders the populated analysis when a selected budget has posted actuals', () => {
    budgetState = { budgets: [APPROVED_BUDGET], activeBudgetId: null, lineItems: [B1_LINE_ITEM] };
    glState = {
      entries: [{ id: 'e1', accountCode: '6000', debit: 800, credit: 0, date: '2026-01-15' }],
      accounts: [],
      importError: null,
    };
    renderPage();
    fireEvent.change(screen.getByTestId('mock-select'), { target: { value: 'b1' } });
    expect(screen.getByTestId('waterfall-chart')).toBeInTheDocument();
    expect(screen.getByTestId('variance-chart')).toBeInTheDocument();
    expect(screen.getByTestId('data-table')).toBeInTheDocument();
    expect(screen.queryByText(/No Budget Selected/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No posted actuals/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
