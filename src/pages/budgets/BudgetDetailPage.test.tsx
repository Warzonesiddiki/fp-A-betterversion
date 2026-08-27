/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

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
    isSubmitting: false,
    lastChange: null,
    history: [[]],
    historyIndex: 0,
    selectedCellId: null,
    setActiveBudget: vi.fn(),
    updateCell: vi.fn(),
    updateLineItem: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: vi.fn(() => false),
    canRedo: vi.fn(() => false),
    submitBudget: vi.fn(),
    approveBudget: vi.fn(),
    rejectBudget: vi.fn(),
    updateBudget: vi.fn(),
    setBudgets: vi.fn(),
  })),
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => glState),
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: {
      id: 'u1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'Admin',
    },
    isAuthenticated: true,
  })),
}));

interface MockFinPlanGridProps {
  preset?: string;
}

vi.mock('@/components/ui/FinPlanGrid', () => ({
  FinPlanGrid: ({ preset }: MockFinPlanGridProps) => (
    <div data-testid="finplan-grid" data-preset={preset}>
      mock grid
    </div>
  ),
}));

vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

import BudgetDetailPage from '@/pages/budgets/BudgetDetailPage';

const DRAFT_BUDGET = {
  id: 'b1',
  name: 'FY24 Budget',
  fiscalYear: 2024,
  status: 'Draft',
  totalAmount: 1000000,
  approvedAt: null,
};

function renderPage(initialPath = '/', routePath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path={routePath} element={<BudgetDetailPage />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('BudgetDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    budgetState = { budgets: [], activeBudgetId: null, lineItems: [], isLoading: false };
    glState = { entries: [], accounts: [], importError: null };
  });

  it('renders without crashing when budget is not found', () => {
    const { container } = renderPage('/budgets/nonexistent', '/budgets/:id');
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('displays not found message for missing budget', () => {
    renderPage('/budgets/nonexistent', '/budgets/:id');
    expect(screen.getByText(/Budget not found/i)).toBeInTheDocument();
  });
});

describe('BudgetDetailPage — W-K30-001 state coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    budgetState = { budgets: [], activeBudgetId: null, lineItems: [], isLoading: false };
    glState = { entries: [], accounts: [], importError: null };
  });

  it('renders a skeleton while the budget store hydrates instead of flashing not-found', () => {
    budgetState = { budgets: [], activeBudgetId: null, lineItems: [], isLoading: true };
    const { container } = renderPage('/budgets/b1', '/budgets/:id');
    expect(screen.getByTestId('budget-detail-loading')).toBeInTheDocument();
    // W-A11Y-002 M5 announce-once: bars stay decorative (aria-hidden) and the
    // whole hydrate branch owns exactly ONE polite status announcement.
    expect(
      screen.getByTestId('budget-detail-loading').querySelector('[aria-hidden="true"]')
    ).toBeTruthy();
    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(1);
    expect(statuses[0]).toHaveAttribute('aria-live', 'polite');
    expect(statuses[0]).toHaveTextContent(/loading/i);
    // The pre-existing "Budget Not Found" flash must NOT appear during load…
    expect(screen.queryByText(/Budget not found/i)).not.toBeInTheDocument();
    // …and no editor chrome renders yet.
    expect(container.querySelector('[data-testid="view-mode-grid"]')).not.toBeInTheDocument();
    // Heading discipline: the branch still exposes an h1.
    expect(screen.getByRole('heading', { level: 1, name: /Budget Detail/i })).toBeInTheDocument();
  });

  it('renders ErrorState with retry when the underlying store reports an error', () => {
    budgetState = {
      budgets: [DRAFT_BUDGET],
      activeBudgetId: 'b1',
      lineItems: [],
      isLoading: false,
    };
    glState = { entries: [], accounts: [], importError: 'Row 3: unbalanced journal' };
    renderPage('/budgets/b1', '/budgets/:id');
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByText(/Failed to load budget workspace/i)).toBeInTheDocument();
    expect(screen.getByText(/Row 3: unbalanced journal/i)).toBeInTheDocument();
    expect(screen.getByTestId('error-code')).toHaveTextContent('GL-IMPORT-ERROR');
    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.getByText('Back to Budgets')).toBeInTheDocument();
    expect(screen.queryByTestId('view-mode-grid')).not.toBeInTheDocument();
  });

  it('reloads the page when the store-error retry button is clicked', () => {
    budgetState = {
      budgets: [DRAFT_BUDGET],
      activeBudgetId: 'b1',
      lineItems: [],
      isLoading: false,
    };
    glState = { entries: [], accounts: [], importError: 'boom' };
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload },
      writable: true,
    });
    renderPage('/budgets/b1', '/budgets/:id');
    fireEvent.click(screen.getByText('Retry'));
    expect(reload).toHaveBeenCalledOnce();
  });

  it('renders not found as a shared EmptyState under the mounted h1 and navigates back', () => {
    renderPage('/budgets/nonexistent', '/budgets/:id');
    // K30 (N8): heading discipline — PageHeader owns the h1, EmptyState's h3
    // sits beneath it; the old bare-h2 branch had neither.
    expect(screen.getByRole('heading', { level: 1, name: /Budget Detail/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: /Budget Not Found/i })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Back to Budgets/i }));
    expect(screen.getByText('Redirected')).toBeInTheDocument();
  });

  it('does not fabricate audit entries and shows an honest empty hint instead', () => {
    budgetState = {
      budgets: [DRAFT_BUDGET],
      activeBudgetId: 'b1',
      lineItems: [],
      isLoading: false,
    };
    renderPage('/budgets/b1', '/budgets/:id');
    fireEvent.click(screen.getByTestId('toggle-sidebar'));
    fireEvent.click(screen.getByTestId('tab-audit'));
    expect(screen.getByText(/No audit entries yet/i)).toBeInTheDocument();
    // The old seeded "Budget created"/Admin entry was fabricated — it must
    // not come back.
    expect(screen.queryByText(/Budget created/i)).not.toBeInTheDocument();
  });

  it('upgrades the no-line-items cell to an EmptyState with a working CTA', () => {
    budgetState = {
      budgets: [DRAFT_BUDGET],
      activeBudgetId: 'b1',
      lineItems: [],
      isLoading: false,
    };
    renderPage('/budgets/b1', '/budgets/:id');
    // Switch to table view where the upgraded empty branch lives.
    fireEvent.click(screen.getByTestId('view-mode-table'));
    expect(
      screen.getByRole('heading', { level: 3, name: /No line items yet/i })
    ).toBeInTheDocument();
    const cta = screen.getByTestId('add-first-line-item');
    expect(cta).toHaveTextContent('Add first line item');
    // The CTA hands the user to the existing add surface on this page:
    // the Professional Grid Editor.
    fireEvent.click(cta);
    expect(screen.getByTestId('view-mode-grid')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('finplan-grid')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 3, name: /No line items yet/i })
    ).not.toBeInTheDocument();
  });

  it('keeps rendering line-item rows (no empty state) when the budget has items', () => {
    budgetState = {
      budgets: [DRAFT_BUDGET],
      activeBudgetId: 'b1',
      lineItems: [
        {
          id: 'li1',
          budgetId: 'b1',
          accountId: 'a1',
          accountName: 'Revenue',
          accountCode: '4000',
          month: 0,
          amount: 1000,
          isLocked: false,
        },
      ],
      isLoading: false,
    };
    renderPage('/budgets/b1', '/budgets/:id');
    fireEvent.click(screen.getByTestId('view-mode-table'));
    expect(
      screen.queryByRole('heading', { level: 3, name: /No line items yet/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('table', { name: /Budget detail line items/i })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByTestId('budget-detail-loading')).not.toBeInTheDocument();
  });
});
