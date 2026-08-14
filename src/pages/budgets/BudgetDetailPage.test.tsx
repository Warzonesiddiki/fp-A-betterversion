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
    setActiveBudget: vi.fn(),
    updateCell: vi.fn(),
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
  useGLStore: vi.fn(() => ({
    entries: [],
    accounts: [],
  })),
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

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    ArrowLeft: makeIcon(),
    Undo2: makeIcon(),
    Redo2: makeIcon(),
    Lock: makeIcon(),
    Send: makeIcon(),
    CheckCircle: makeIcon(),
    XCircle: makeIcon(),
    History: makeIcon(),
  };
});

import BudgetDetailPage from '@/pages/budgets/BudgetDetailPage';

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

describe('BudgetDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing when budget is not found', () => {
    const { container } = renderPage(BudgetDetailPage, '/budgets/nonexistent', '/budgets/:id');
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('displays not found message for missing budget', () => {
    renderPage(BudgetDetailPage, '/budgets/nonexistent', '/budgets/:id');
    expect(screen.getByText(/Budget not found/i)).toBeInTheDocument();
  });
});
