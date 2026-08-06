/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';

vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: vi.fn(() => ({
    budgets: [
      {
        id: 'b1',
        name: 'FY24 Budget',
        fiscalYear: 2024,
        status: 'Draft',
        totalAmount: 1000000,
        approvedAt: null,
      },
    ],
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
      {
        id: 'li2',
        budgetId: 'b1',
        accountId: 'a1',
        accountName: 'Revenue',
        accountCode: '4000',
        month: 1,
        amount: 2000,
        isLocked: false,
      },
    ],
    isLoading: false,
    isSubmitting: false,
    lastChange: null,
    history: [[], []],
    historyIndex: 1,
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
  useGLStore: vi.fn(() => ({
    entries: [],
    accounts: [{ id: 'a1', name: 'Revenue', code: '4000' }],
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

interface MockFinPlanGridProps {
  preset: string;
  columns: unknown[];
  rows: unknown[];
}

vi.mock('@/components/ui/FinPlanGrid', () => ({
  FinPlanGrid: ({ preset, columns, rows }: MockFinPlanGridProps) => (
    <div data-testid="finplan-grid" data-preset={preset}>
      Grid {columns.length} cols {rows.length} rows
    </div>
  ),
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
    Unlock: makeIcon(),
    Save: makeIcon(),
    Send: makeIcon(),
    CheckCircle: makeIcon(),
    XCircle: makeIcon(),
    History: makeIcon(),
    MessageSquare: makeIcon(),
    Table: makeIcon(),
    Grid3X3: makeIcon(),
    Camera: makeIcon(),
    RotateCcw: makeIcon(),
  };
});

import BudgetDetailPage from '@/pages/budgets/BudgetDetailPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/budgets/b1']}>
      <Routes>
        <Route path="/budgets/:id" element={<BudgetDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('BudgetDetailPage — grid editor (Wave 8 8/8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders view mode toggle defaulting to Grid Editor', () => {
    renderPage();
    expect(screen.getByTestId('view-mode-grid')).toBeInTheDocument();
    expect(screen.getByTestId('view-mode-table')).toBeInTheDocument();
    expect(screen.getByTestId('view-mode-grid')).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows FinPlanGrid with preset spreadsheet in grid mode', () => {
    renderPage();
    const grid = screen.getByTestId('finplan-grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveAttribute('data-preset', 'spreadsheet');
  });

  it('switches to table view when Table toggle clicked', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('view-mode-table'));
    expect(screen.getByTestId('view-mode-table')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByTestId('finplan-grid')).not.toBeInTheDocument();
  });

  it('opens snapshots modal and creates a snapshot', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('open-snapshots'));
    expect(screen.getByTestId('snapshots-modal')).toBeInTheDocument();
    const input = screen.getByTestId('snapshot-name-input');
    fireEvent.change(input, { target: { value: 'Q1 Snapshot' } });
    fireEvent.click(screen.getByTestId('create-snapshot'));
    expect(screen.getByText('Q1 Snapshot')).toBeInTheDocument();
  });

  it('toggles sidebar with comments and audit tabs', () => {
    renderPage();
    fireEvent.click(screen.getByTestId('toggle-sidebar'));
    expect(screen.getByTestId('budget-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('tab-comments')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('tab-audit'));
    expect(screen.getByTestId('audit-tab')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('tab-comments'));
    expect(screen.getByTestId('comments-tab')).toBeInTheDocument();
  });
});
