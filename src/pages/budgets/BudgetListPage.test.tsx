/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

// Mutable store double so each four-state branch can be driven (N8).
type BudgetMockState = {
  budgets: Array<Record<string, unknown>>;
  isLoading: boolean;
};
let budgetState: BudgetMockState = { budgets: [], isLoading: false };

const storeActions = {
  submitBudget: vi.fn(),
  approveBudget: vi.fn(),
  rejectBudget: vi.fn(),
  deleteBudget: vi.fn(),
  duplicateBudget: vi.fn(),
};

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: vi.fn(() => ({
    budgets: budgetState.budgets,
    activeBudgetId: null,
    lineItems: [],
    isLoading: budgetState.isLoading,
    isSubmitting: false,
    lastChange: null,
    history: [[]],
    historyIndex: 0,
    selectedCellId: null,
    submitBudget: storeActions.submitBudget,
    approveBudget: storeActions.approveBudget,
    rejectBudget: storeActions.rejectBudget,
    deleteBudget: storeActions.deleteBudget,
    duplicateBudget: storeActions.duplicateBudget,
    setActiveBudget: vi.fn(),
    setBudgets: vi.fn(),
    addLineItem: vi.fn(),
    updateLineItem: vi.fn(),
    removeLineItem: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
  })),
}));

// N8: the page now pulls in EmptyState/ErrorState/Skeleton, whose internal
// icon imports resolve through the shared proxy double — a hand-rolled
// fixed-name mock breaks at render time for icons it forgot to enumerate.
vi.mock('lucide-react', async () => (await import('@/test/lucideMock')).createLucideMock());

import BudgetListPage from '@/pages/budgets/BudgetListPage';

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

const DRAFT_ROW = {
  id: 'b-9',
  name: 'Ops Budget',
  fiscalYear: 2026,
  status: 'Draft',
  totalAmount: 10,
  departments: ['Operations'],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
};

describe('BudgetListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    budgetState = { budgets: [], isLoading: false };
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('renders without crashing', () => {
    const { container } = renderPage(BudgetListPage, '/budgets', '/budgets');
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('displays the empty state when no budgets exist', () => {
    renderPage(BudgetListPage, '/budgets', '/budgets');
    expect(screen.getByText(/No Budgets Yet/i)).toBeInTheDocument();
  });
});

describe('BudgetListPage — K30 four-states (N8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    budgetState = { budgets: [], isLoading: false };
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('keeps the page h1 mounted over a hydration skeleton instead of flashing the empty state', () => {
    budgetState = { budgets: [], isLoading: true };
    renderPage(BudgetListPage, '/budgets', '/budgets');
    expect(screen.getByTestId('budget-list-loading')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /^Budgets$/ })).toBeInTheDocument();
    // No empty-state flash while hydrating, and no fabricated rows either.
    expect(screen.queryByText(/No Budgets Yet/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  it('renders the empty state as a shared EmptyState under the mounted h1 with a create CTA', () => {
    renderPage(BudgetListPage, '/budgets', '/budgets');
    expect(screen.getByRole('heading', { level: 1, name: /^Budgets$/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /No Budgets Yet/i })).toBeInTheDocument();
    expect(screen.getByTestId('budget-empty-create')).toHaveTextContent('Create Budget');
  });

  it('renders an ErrorState (role=alert) when a workflow action throws and Retry re-runs exactly that action', async () => {
    const user = userEvent.setup();
    budgetState = { budgets: [DRAFT_ROW], isLoading: false };
    storeActions.submitBudget.mockImplementationOnce(() => {
      throw new Error("[RBAC] Permission denied: 'budget:update' required");
    });

    renderPage(BudgetListPage, '/budgets', '/budgets');
    await user.click(screen.getByRole('button', { name: 'Submit budget for approval' }));

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText(/Could not submit for approval/i)).toBeInTheDocument();
    expect(screen.getByText(/Permission denied/i)).toBeInTheDocument();

    // Retry re-runs exactly the failed action (same call, same id); the
    // successful attempt clears the alert.
    expect(storeActions.submitBudget).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(storeActions.submitBudget).toHaveBeenCalledTimes(2);
    expect(storeActions.submitBudget).toHaveBeenCalledWith('b-9');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('dismisses the action-error banner without re-running the action', async () => {
    const user = userEvent.setup();
    budgetState = { budgets: [DRAFT_ROW], isLoading: false };
    storeActions.submitBudget.mockImplementationOnce(() => {
      throw new Error('boom');
    });

    renderPage(BudgetListPage, '/budgets', '/budgets');
    await user.click(screen.getByRole('button', { name: 'Submit budget for approval' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(storeActions.submitBudget).toHaveBeenCalledTimes(1);
  });
});
