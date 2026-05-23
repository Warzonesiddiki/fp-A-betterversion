/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: vi.fn(() => ({
    budgets: [],
    activeBudgetId: null,
    lineItems: [],
    isLoading: false,
    isSubmitting: false,
    lastChange: null,
    history: [[]],
    historyIndex: 0,
    selectedCellId: null,
    submitBudget: vi.fn(),
    approveBudget: vi.fn(),
    rejectBudget: vi.fn(),
    deleteBudget: vi.fn(),
    duplicateBudget: vi.fn(),
    setActiveBudget: vi.fn(),
    setBudgets: vi.fn(),
    addLineItem: vi.fn(),
    updateLineItem: vi.fn(),
    removeLineItem: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
  })),
}));

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    Plus: makeIcon(),
    Search: makeIcon(),
    Copy: makeIcon(),
    Trash2: makeIcon(),
    Eye: makeIcon(),
    Send: makeIcon(),
    CheckCircle: makeIcon(),
    XCircle: makeIcon(),
  };
});

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

describe('BudgetListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = renderPage(BudgetListPage, '/budgets', '/budgets');
    expect(container).toBeTruthy();
  });

  it('displays the empty state when no budgets exist', () => {
    renderPage(BudgetListPage, '/budgets', '/budgets');
    expect(screen.getByText(/No Budgets Yet/i)).toBeInTheDocument();
  });
});
