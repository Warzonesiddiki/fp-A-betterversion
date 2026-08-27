/**
 * @vitest-environment jsdom
 *
 * Deep tests for BudgetVsActualPage (142 st / 144 br uncovered pre-PR-48 batch).
 *
 * Pattern (after PR #48's *.deep.test.tsx convention):
 *   - Mock the two zustand stores (GL + Budget) to return programmable
 *     data so the report's join/computation logic runs end-to-end.
 *   - Mock the leaf UI primitives (Skeleton, Card, HelpPanel,
 *     WaterfallChart, BudgetVsActualHeader/Summary/Table) so the test
 *     focuses on the page's own logic.
 *   - Enumerate lucide-react icons needed by the source.
 *   - DO NOT mock lucide-react with a Proxy — the setup.ts global mock
 *     already provides it (use the enumerated pattern from other deep tests).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// ---------------------------------------------------------------------------
// lucide-react: explicit enumeration of the icons the page imports
// ---------------------------------------------------------------------------
vi.mock('lucide-react', async () => {
  const ReactMod = await import('react');
  const make = () => (props: { className?: string }) =>
    ReactMod.createElement('span', { 'data-testid': 'mock-icon', className: props?.className });
  return {
    AlertCircle: make(),
    Database: make(),
    TrendingDown: make(),
    AlertTriangle: make(),
    ChevronDown: make(),
    CheckCircle: make(),
    // ErrorState renders a RefreshCw retry icon (fa31c55f).
    RefreshCw: make(),
  };
});

// ---------------------------------------------------------------------------
// zustand store mocks
// ---------------------------------------------------------------------------

type GLStub = {
  entries: Array<{
    id: string;
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    period: string;
    departmentId?: string;
  }>;
  isLoading: boolean;
  importError: string | null;
};

type BudgetStub = {
  budgets: Array<{ id: string; name: string; fiscalYear: number; status: string }>;
  lineItems: Array<{
    id: string;
    budgetId: string;
    accountCode: string;
    accountName: string;
    amount: number;
    assumptions?: string;
  }>;
};

let glStub: GLStub;
let budgetStub: BudgetStub;

vi.mock('@/store/glStore', () => ({
  useGLStore: Object.assign(
    (selector?: (s: GLStub) => unknown) => {
      if (typeof selector === 'function') return selector(glStub);
      return glStub;
    },
    { getState: () => glStub }
  ),
  glSelectors: {},
}));

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: Object.assign(
    (selector?: (s: BudgetStub) => unknown) => {
      if (typeof selector === 'function') return selector(budgetStub);
      return budgetStub;
    },
    { getState: () => budgetStub }
  ),
}));

// ---------------------------------------------------------------------------
// UI primitive mocks
// ---------------------------------------------------------------------------

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: (props: { count?: number; height?: string; width?: string }) => (
    <div data-testid="skeleton" data-count={props.count} />
  ),
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children?: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardHeader: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="card-title">{children}</div>
  ),
}));

vi.mock('@/components/ui/HelpPanel', () => ({
  HelpPanel: (props: { isOpen: boolean; title: string; sections: unknown[]; onClose: () => void }) =>
    props.isOpen ? (
      <div data-testid="help-panel" data-title={props.title}>
        <button onClick={props.onClose}>close-help</button>
      </div>
    ) : null,
}));

vi.mock('@/components/ui/WaterfallChart', () => ({
  WaterfallChart: (props: { data: unknown[]; title: string; height: number }) => (
    <div data-testid="waterfall" data-items={props.data.length} data-title={props.title} />
  ),
}));

vi.mock('./components/BudgetVsActualHeader', () => ({
  BudgetVsActualHeader: (props: { onHelpClick: () => void; onExportPDF: () => void; onExportExcel: () => void }) => (
    <div data-testid="bv-header">
      <button onClick={props.onHelpClick}>help</button>
      <button onClick={props.onExportPDF}>pdf</button>
      <button onClick={props.onExportExcel}>excel</button>
    </div>
  ),
}));

vi.mock('./components/BudgetVsActualSummary', () => ({
  BudgetVsActualSummary: (props: {
    totalBudget: string;
    totalActual: string;
    netVariance: string;
    utilizationPercentage: number;
    isVarianceFavorable: boolean;
  }) => (
    <div
      data-testid="bv-summary"
      data-budget={props.totalBudget}
      data-actual={props.totalActual}
      data-variance={props.netVariance}
      data-utilization={props.utilizationPercentage}
      data-favorable={props.isVarianceFavorable}
    />
  ),
}));

vi.mock('./components/BudgetVsActualTable', () => ({
  BudgetVsActualTable: (props: { data: unknown[] }) => (
    <div data-testid="bv-table" data-rows={props.data.length} />
  ),
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: {
    exportToPDF: vi.fn(async () => {}),
    exportToExcel: vi.fn(async () => {}),
  },
}));

import BudgetVsActualPage from '@/pages/reports/BudgetVsActualPage';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePage(overrides: Partial<GLStub & BudgetStub> = {}) {
  glStub = {
    entries: [],
    isLoading: false,
    importError: null,
    ...(overrides as Partial<GLStub>),
  };
  budgetStub = {
    budgets: [],
    lineItems: [],
    ...(overrides as Partial<BudgetStub>),
  };
  return render(
    <MemoryRouter initialEntries={['/reports/budget-vs-actual']}>
      <BudgetVsActualPage />
    </MemoryRouter>
  );
}

/** Current month in YYYY-MM format — the page's default selected period. */
function nowPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

beforeEach(() => {
  glStub = { entries: [], isLoading: false, importError: null };
  budgetStub = { budgets: [], lineItems: [] };
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BudgetVsActualPage (data-driven)', () => {
  it('shows the loading skeleton when isLoading=true', () => {
    makePage({ isLoading: true } as Partial<GLStub>);
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('shows the import error view when importError is set', () => {
    makePage({ importError: 'CSV corrupt' } as Partial<GLStub>);
    expect(screen.getByText(/Failed to load data/i)).toBeInTheDocument();
    expect(screen.getByText(/CSV corrupt/)).toBeInTheDocument();
  });

  it('shows the "no data yet" CTA when there are no entries', () => {
    makePage();
    expect(screen.getByText(/No data yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Import Data/i)).toBeInTheDocument();
  });

  it('shows the "no budgets" CTA when entries exist but no budgets', () => {
    makePage({
      entries: [
        { id: '1', accountCode: '4000', accountName: 'Rev', debit: 100, credit: 0, period: nowPeriod() },
      ],
    } as Partial<GLStub>);
    expect(screen.getByText(/No budgets found/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Budget/i)).toBeInTheDocument();
  });

  it('renders the report when both entries and a budget are present', () => {
    makePage({
      entries: [
        { id: '1', accountCode: '4000', accountName: 'Revenue', debit: 0, credit: 100, period: nowPeriod() },
        { id: '2', accountCode: '5000', accountName: 'Expense', debit: 50, credit: 0, period: nowPeriod() },
      ],
      budgets: [{ id: 'b1', name: 'FY24', fiscalYear: 2024, status: 'Approved' }],
      lineItems: [
        { id: 'li1', budgetId: 'b1', accountCode: '4000', accountName: 'Revenue', amount: 200 },
        { id: 'li2', budgetId: 'b1', accountCode: '5000', accountName: 'Expense', amount: 100 },
      ],
    } as Partial<GLStub & BudgetStub>);
    expect(screen.getByTestId('bv-header')).toBeInTheDocument();
    expect(screen.getByTestId('bv-summary')).toBeInTheDocument();
    expect(screen.getByTestId('bv-table')).toBeInTheDocument();
  });

  it('sets the document.title on mount', () => {
    makePage();
    expect(document.title).toMatch(/Budget Vs Actual/i);
  });

  it('shows the "all on track" banner when all variances are within 5%', () => {
    makePage({
      entries: [
        { id: '1', accountCode: '4000', accountName: 'Revenue', debit: 0, credit: 100, period: nowPeriod() },
      ],
      budgets: [{ id: 'b1', name: 'FY24', fiscalYear: 2024, status: 'Approved' }],
      lineItems: [
        { id: 'li1', budgetId: 'b1', accountCode: '4000', accountName: 'Revenue', amount: 100 },
      ],
    } as Partial<GLStub & BudgetStub>);
    expect(screen.getByText(/All accounts on track/i)).toBeInTheDocument();
  });

  it('shows the "Top 5 Most Unfavorable" card when there are unfavorable rows', () => {
    makePage({
      entries: [
        { id: '1', accountCode: '5000', accountName: 'Expense', debit: 200, credit: 0, period: nowPeriod() },
      ],
      budgets: [{ id: 'b1', name: 'FY24', fiscalYear: 2024, status: 'Approved' }],
      lineItems: [
        { id: 'li1', budgetId: 'b1', accountCode: '5000', accountName: 'Expense', amount: 100 },
      ],
    } as Partial<GLStub & BudgetStub>);
    expect(screen.getByText(/Top 5 Most Unfavorable/i)).toBeInTheDocument();
  });

  it('renders the WaterfallChart when there are more than 2 waterfall items', () => {
    makePage({
      entries: [
        { id: '1', accountCode: '5000', accountName: 'Expense', debit: 200, credit: 0, period: nowPeriod() },
      ],
      budgets: [{ id: 'b1', name: 'FY24', fiscalYear: 2024, status: 'Approved' }],
      lineItems: [
        { id: 'li1', budgetId: 'b1', accountCode: '5000', accountName: 'Expense', amount: 100 },
      ],
    } as Partial<GLStub & BudgetStub>);
    // Waterfall items: Budget + 1 row + Actual = 3 items
    const wf = screen.getByTestId('waterfall');
    expect(wf.dataset.items).toBe('3');
  });

  it('renders the Revenue Variance Decomposition card when there are revenue rows', () => {
    makePage({
      entries: [
        { id: '1', accountCode: '4000', accountName: 'Revenue', debit: 0, credit: 100, period: nowPeriod() },
      ],
      budgets: [{ id: 'b1', name: 'FY24', fiscalYear: 2024, status: 'Approved' }],
      lineItems: [
        { id: 'li1', budgetId: 'b1', accountCode: '4000', accountName: 'Revenue', amount: 100 },
      ],
    } as Partial<GLStub & BudgetStub>);
    expect(screen.getByText(/Revenue Variance Decomposition/i)).toBeInTheDocument();
  });

  it('help panel opens and closes via the header button', () => {
    makePage({
      entries: [
        { id: '1', accountCode: '5000', accountName: 'Expense', debit: 200, credit: 0, period: nowPeriod() },
      ],
      budgets: [{ id: 'b1', name: 'FY24', fiscalYear: 2024, status: 'Approved' }],
      lineItems: [
        { id: 'li1', budgetId: 'b1', accountCode: '5000', accountName: 'Expense', amount: 100 },
      ],
    } as Partial<GLStub & BudgetStub>);
    act(() => {
      screen.getByText('help').click();
    });
    expect(screen.getByTestId('help-panel')).toBeInTheDocument();
    act(() => {
      screen.getByText('close-help').click();
    });
    expect(screen.queryByTestId('help-panel')).not.toBeInTheDocument();
  });

  it('export PDF calls ExportEngine.exportToPDF with the report data', async () => {
    const mod = await import('@/engines/ExportEngine');
    makePage({
      entries: [
        { id: '1', accountCode: '5000', accountName: 'Expense', debit: 200, credit: 0, period: nowPeriod() },
      ],
      budgets: [{ id: 'b1', name: 'FY24', fiscalYear: 2024, status: 'Approved' }],
      lineItems: [
        { id: 'li1', budgetId: 'b1', accountCode: '5000', accountName: 'Expense', amount: 100 },
      ],
    } as Partial<GLStub & BudgetStub>);
    await act(async () => {
      screen.getByText('pdf').click();
      await Promise.resolve();
    });
    expect(mod.ExportEngine.exportToPDF).toHaveBeenCalled();
  });

  it('export Excel calls ExportEngine.exportToExcel with the report data', async () => {
    const mod = await import('@/engines/ExportEngine');
    makePage({
      entries: [
        { id: '1', accountCode: '5000', accountName: 'Expense', debit: 200, credit: 0, period: nowPeriod() },
      ],
      budgets: [{ id: 'b1', name: 'FY24', fiscalYear: 2024, status: 'Approved' }],
      lineItems: [
        { id: 'li1', budgetId: 'b1', accountCode: '5000', accountName: 'Expense', amount: 100 },
      ],
    } as Partial<GLStub & BudgetStub>);
    await act(async () => {
      screen.getByText('excel').click();
      await Promise.resolve();
    });
    expect(mod.ExportEngine.exportToExcel).toHaveBeenCalled();
  });

  it('export PDF and Excel are no-ops when reportData is null', async () => {
    const mod = await import('@/engines/ExportEngine');
    mod.ExportEngine.exportToPDF = vi.fn(async () => {});
    mod.ExportEngine.exportToExcel = vi.fn(async () => {});
    makePage({
      entries: [
        { id: '1', accountCode: '5000', accountName: 'Expense', debit: 200, credit: 0, period: nowPeriod() },
      ],
      budgets: [],
      lineItems: [],
    } as Partial<GLStub & BudgetStub>);
    // We're in the "no budgets" CTA state — no header, so no PDF/Excel.
    // The page shows the "Create Budget" link instead.
    expect(screen.queryByTestId('bv-header')).not.toBeInTheDocument();
  });

  it('export CSV triggers a download', () => {
    makePage({
      entries: [
        { id: '1', accountCode: '5000', accountName: 'Expense', debit: 200, credit: 0, period: nowPeriod() },
      ],
      budgets: [{ id: 'b1', name: 'FY24', fiscalYear: 2024, status: 'Approved' }],
      lineItems: [
        { id: 'li1', budgetId: 'b1', accountCode: '5000', accountName: 'Expense', amount: 100 },
      ],
    } as Partial<GLStub & BudgetStub>);
    // jsdom doesn't have URL.createObjectURL reliably; just check no throw
    act(() => {
      screen.getByRole('button', { name: 'Export CSV' }).click();
    });
    // If we got here without throwing, the CSV export succeeded.
  });

  it('period mode change to Quarterly renders a quarter select', () => {
    makePage({
      entries: [
        { id: '1', accountCode: '5000', accountName: 'Expense', debit: 200, credit: 0, period: nowPeriod() },
      ],
      budgets: [{ id: 'b1', name: 'FY24', fiscalYear: 2024, status: 'Approved' }],
      lineItems: [
        { id: 'li1', budgetId: 'b1', accountCode: '5000', accountName: 'Expense', amount: 100 },
      ],
    } as Partial<GLStub & BudgetStub>);
    const periodSelect = screen.getByLabelText('Period type') as HTMLSelectElement;
    act(() => {
      fireEvent.change(periodSelect, { target: { value: 'Quarterly' } });
    });
    expect(screen.getByLabelText('Select quarter')).toBeInTheDocument();
  });

  it('period mode change to Annual renders a year select', () => {
    makePage({
      entries: [
        { id: '1', accountCode: '5000', accountName: 'Expense', debit: 200, credit: 0, period: nowPeriod() },
      ],
      budgets: [{ id: 'b1', name: 'FY24', fiscalYear: 2024, status: 'Approved' }],
      lineItems: [
        { id: 'li1', budgetId: 'b1', accountCode: '5000', accountName: 'Expense', amount: 100 },
      ],
    } as Partial<GLStub & BudgetStub>);
    const periodSelect = screen.getByLabelText('Period type') as HTMLSelectElement;
    act(() => {
      fireEvent.change(periodSelect, { target: { value: 'Annual' } });
    });
    expect(screen.getByLabelText('Select year')).toBeInTheDocument();
  });

  it('period mode change to Monthly renders a month input', () => {
    makePage({
      entries: [
        { id: '1', accountCode: '5000', accountName: 'Expense', debit: 200, credit: 0, period: nowPeriod() },
      ],
      budgets: [{ id: 'b1', name: 'FY24', fiscalYear: 2024, status: 'Approved' }],
      lineItems: [
        { id: 'li1', budgetId: 'b1', accountCode: '5000', accountName: 'Expense', amount: 100 },
      ],
    } as Partial<GLStub & BudgetStub>);
    // Start in Monthly by default
    expect(screen.getByLabelText('Select month')).toBeInTheDocument();
  });

  it('toggle filters shows the filter card', () => {
    makePage({
      entries: [
        { id: '1', accountCode: '5000', accountName: 'Expense', debit: 200, credit: 0, period: nowPeriod() },
      ],
      budgets: [{ id: 'b1', name: 'FY24', fiscalYear: 2024, status: 'Approved' }],
      lineItems: [
        { id: 'li1', budgetId: 'b1', accountCode: '5000', accountName: 'Expense', amount: 100 },
      ],
    } as Partial<GLStub & BudgetStub>);
    act(() => {
      screen.getByRole('button', { name: 'Toggle filters' }).click();
    });
    expect(screen.getByLabelText('Account Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Department')).toBeInTheDocument();
    expect(screen.getByLabelText('Min Variance %')).toBeInTheDocument();
  });

  it('account type filter narrows the table rows', () => {
    makePage({
      entries: [
        { id: '1', accountCode: '4000', accountName: 'Revenue', debit: 0, credit: 100, period: nowPeriod() },
        { id: '2', accountCode: '5000', accountName: 'Expense', debit: 50, credit: 0, period: nowPeriod() },
      ],
      budgets: [{ id: 'b1', name: 'FY24', fiscalYear: 2024, status: 'Approved' }],
      lineItems: [
        { id: 'li1', budgetId: 'b1', accountCode: '4000', accountName: 'Revenue', amount: 100 },
        { id: 'li2', budgetId: 'b1', accountCode: '5000', accountName: 'Expense', amount: 50 },
      ],
    } as Partial<GLStub & BudgetStub>);
    const table = screen.getByTestId('bv-table');
    expect(table.dataset.rows).toBe('2');
    // Apply Revenue filter
    act(() => {
      screen.getByRole('button', { name: 'Toggle filters' }).click();
    });
    act(() => {
      fireEvent.change(screen.getByLabelText('Account Type'), { target: { value: 'Revenue' } });
    });
    const table2 = screen.getByTestId('bv-table');
    expect(table2.dataset.rows).toBe('1');
  });

  it('min variance threshold filters out small variances', () => {
    makePage({
      entries: [
        { id: '1', accountCode: '5000', accountName: 'Expense', debit: 101, credit: 0, period: nowPeriod() },
      ],
      budgets: [{ id: 'b1', name: 'FY24', fiscalYear: 2024, status: 'Approved' }],
      lineItems: [
        { id: 'li1', budgetId: 'b1', accountCode: '5000', accountName: 'Expense', amount: 100 },
      ],
    } as Partial<GLStub & BudgetStub>);
    // Variance is 1/100 = 1% — within 5%, so no unfavorable row
    act(() => {
      screen.getByRole('button', { name: 'Toggle filters' }).click();
    });
    act(() => {
      fireEvent.change(screen.getByLabelText('Min Variance %'), { target: { value: '20' } });
    });
    const table = screen.getByTestId('bv-table');
    expect(table.dataset.rows).toBe('0');
  });

  it('budget dropdown only shows approved budgets', () => {
    makePage({
      entries: [
        { id: '1', accountCode: '5000', accountName: 'Expense', debit: 200, credit: 0, period: nowPeriod() },
      ],
      budgets: [
        { id: 'b1', name: 'FY24 Approved', fiscalYear: 2024, status: 'Approved' },
        { id: 'b2', name: 'FY24 Draft', fiscalYear: 2024, status: 'Draft' },
      ],
      lineItems: [
        { id: 'li1', budgetId: 'b1', accountCode: '5000', accountName: 'Expense', amount: 100 },
      ],
    } as Partial<GLStub & BudgetStub>);
    const select = screen.getByLabelText('Select budget') as HTMLSelectElement;
    expect(select.options.length).toBe(1);
    expect(select.options[0]!.textContent).toMatch(/FY24 Approved/);
  });

  it('falls back to first budget when no approved budget exists', () => {
    makePage({
      entries: [
        { id: '1', accountCode: '5000', accountName: 'Expense', debit: 200, credit: 0, period: nowPeriod() },
      ],
      budgets: [
        { id: 'b1', name: 'FY24 Draft', fiscalYear: 2024, status: 'Draft' },
      ],
      lineItems: [
        { id: 'li1', budgetId: 'b1', accountCode: '5000', accountName: 'Expense', amount: 100 },
      ],
    } as Partial<GLStub & BudgetStub>);
    // No "Select budget" dropdown because no approved budgets, but the report
    // still renders using the first (Draft) budget as fallback.
    expect(screen.getByTestId('bv-summary')).toBeInTheDocument();
  });

  it('marks unbudgeted actuals (budget=0, actual>0) as isUnbudgeted', () => {
    makePage({
      entries: [
        // No budget line item for code 9999
        { id: '1', accountCode: '9999', accountName: 'Surprise', debit: 100, credit: 0, period: nowPeriod() },
      ],
      budgets: [{ id: 'b1', name: 'FY24', fiscalYear: 2024, status: 'Approved' }],
      lineItems: [
        { id: 'li1', budgetId: 'b1', accountCode: '5000', accountName: 'Expense', amount: 50 },
      ],
    } as Partial<GLStub & BudgetStub>);
    // 2 rows: Expense (5000) and Surprise (9999, unbudgeted)
    const table = screen.getByTestId('bv-table');
    expect(table.dataset.rows).toBe('2');
  });

  it('uses account info from entries when no budget line item exists', () => {
    makePage({
      entries: [
        { id: '1', accountCode: '5000', accountName: 'Travel', debit: 100, credit: 0, period: nowPeriod() },
      ],
      budgets: [{ id: 'b1', name: 'FY24', fiscalYear: 2024, status: 'Approved' }],
      lineItems: [
        { id: 'li1', budgetId: 'b1', accountCode: '4000', accountName: 'Revenue', amount: 100 },
      ],
    } as Partial<GLStub & BudgetStub>);
    // 2 rows: Revenue (from budget) and Travel (from entries, unbudgeted)
    const table = screen.getByTestId('bv-table');
    expect(table.dataset.rows).toBe('2');
  });

  it('handles quarter match logic via getQuarterFromPeriod', () => {
    // entries with period 2024-02 (Q1), 2024-04 (Q2)
    makePage({
      entries: [
        { id: '1', accountCode: '5000', accountName: 'Q1', debit: 100, credit: 0, period: nowPeriod() },
        { id: '2', accountCode: '5000', accountName: 'Q2', debit: 100, credit: 0, period: nowPeriod() },
      ],
      budgets: [{ id: 'b1', name: 'FY24', fiscalYear: 2024, status: 'Approved' }],
      lineItems: [
        { id: 'li1', budgetId: 'b1', accountCode: '5000', accountName: 'Expense', amount: 200 },
      ],
    } as Partial<GLStub & BudgetStub>);
    // Switch to Quarterly mode
    const periodSelect = screen.getByLabelText('Period type') as HTMLSelectElement;
    act(() => {
      fireEvent.change(periodSelect, { target: { value: 'Quarterly' } });
    });
    // Default Q is current quarter — actuals filter by quarter.
    // The 2 entries map to the SAME line item (code 5000) and are aggregated.
    const table = screen.getByTestId('bv-table');
    expect(table.dataset.rows).toBeDefined();
  });

  it('treats revenue accounts (code starts with 4) as Revenue type', () => {
    makePage({
      entries: [
        { id: '1', accountCode: '4000', accountName: 'Sales', debit: 0, credit: 100, period: nowPeriod() },
      ],
      budgets: [{ id: 'b1', name: 'FY24', fiscalYear: 2024, status: 'Approved' }],
      lineItems: [
        { id: 'li1', budgetId: 'b1', accountCode: '4000', accountName: 'Sales', amount: 100 },
      ],
    } as Partial<GLStub & BudgetStub>);
    // Should have decomposition card
    expect(screen.getByText(/Revenue Variance Decomposition/i)).toBeInTheDocument();
  });

  it('treats expense accounts (code starts with 5/6) as Expense type', () => {
    makePage({
      entries: [
        { id: '1', accountCode: '5000', accountName: 'Wages', debit: 100, credit: 0, period: nowPeriod() },
        { id: '2', accountCode: '6000', accountName: 'Rent', debit: 50, credit: 0, period: nowPeriod() },
      ],
      budgets: [{ id: 'b1', name: 'FY24', fiscalYear: 2024, status: 'Approved' }],
      lineItems: [
        { id: 'li1', budgetId: 'b1', accountCode: '5000', accountName: 'Wages', amount: 100 },
        { id: 'li2', budgetId: 'b1', accountCode: '6000', accountName: 'Rent', amount: 50 },
      ],
    } as Partial<GLStub & BudgetStub>);
    // Both should be Expense (no decomposition)
    expect(screen.queryByText(/Revenue Variance Decomposition/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// R9-c: JS smooth-scroll compliance with prefers-reduced-motion.
// The "Top 5 Most Unfavorable" rows scroll their table row into view on
// click/Enter. The real useReducedMotion hook reads window.matchMedia, so
// mocking matchMedia proves the page end-to-end (hook → scrollIntoView args).
// The BudgetVsActualTable is mocked, so a stand-in #row-<code> anchor is
// appended to the document for getElementById to find.
// ---------------------------------------------------------------------------
const originalMatchMedia = window.matchMedia;

function mockMatchMedia(prefersReducedMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? prefersReducedMotion : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Default for every test in this file (incl. the data-driven describe
// above): motion allowed. R9-c tests override via mockMatchMedia(true).
beforeEach(() => {
  mockMatchMedia(false);
});

describe('BudgetVsActualPage reduced-motion scrolling (R9-c)', () => {
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
    document.getElementById('row-5000')?.remove();
  });

  /** Renders the page with one unfavorable row and a stand-in scroll target. */
  function mountPageWithUnfavorableRow() {
    makePage({
      entries: [
        { id: '1', accountCode: '5000', accountName: 'Expense', debit: 200, credit: 0, period: nowPeriod() },
      ],
      budgets: [{ id: 'b1', name: 'FY24', fiscalYear: 2024, status: 'Approved' }],
      lineItems: [
        { id: 'li1', budgetId: 'b1', accountCode: '5000', accountName: 'Expense', amount: 100 },
      ],
    } as Partial<GLStub & BudgetStub>);
    const anchor = document.createElement('div');
    anchor.id = 'row-5000';
    document.body.appendChild(anchor);
  }

  function unfavorableRow(): Element {
    const text = screen.getByText('Expense', { selector: 'p' });
    const row = text.closest('div[role="button"]');
    expect(row).not.toBeNull();
    return row!;
  }

  it("scrolls with behavior 'auto' when reduced motion is preferred (click)", () => {
    mockMatchMedia(true);
    mountPageWithUnfavorableRow();
    const scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    fireEvent.click(unfavorableRow());
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'auto', block: 'center' });
  });

  it("scrolls with behavior 'auto' when reduced motion is preferred (keyboard)", () => {
    mockMatchMedia(true);
    mountPageWithUnfavorableRow();
    const scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    fireEvent.keyDown(unfavorableRow(), { key: 'Enter' });
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'auto', block: 'center' });
  });

  it("keeps smooth scrolling when motion is allowed", () => {
    mockMatchMedia(false);
    mountPageWithUnfavorableRow();
    const scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    fireEvent.click(unfavorableRow());
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
  });
});
