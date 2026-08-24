import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
// Selector-aware mocks: the page subscribes via useBudgetStore((s) => s.createBudget)
// and useGLStore((s) => s.accounts), so each mock must apply a selector when one
// is passed.
vi.mock('@/store/budgetStore', () => ({
  useBudgetStore: vi.fn((selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
      budgets: [],
      activeBudgetId: null,
      lineItems: [],
      isLoading: false,
      isSubmitting: false,
      lastChange: null,
      history: [[]],
      historyIndex: 0,
      selectedCellId: null,
      createBudget: vi.fn(),
      submitBudget: vi.fn(),
      approveBudget: vi.fn(),
      rejectBudget: vi.fn(),
      deleteBudget: vi.fn(),
      duplicateBudget: vi.fn(),
      setActiveBudget: vi.fn(),
      setBudgets: vi.fn(),
      setLineItems: vi.fn(),
      updateLineItem: vi.fn(),
      addLineItem: vi.fn(),
      removeLineItem: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      selectCell: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn((selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
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
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/components/ui/ProgressStepper', () => ({
  ProgressStepper: ({ steps }: { steps: Array<{ label: string }> }) => (
    <div data-testid="progress-stepper">
      {steps.map((s) => (
        <span key={s.label}>{s.label}</span>
      ))}
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
    ArrowRight: makeIcon(),
    Check: makeIcon(),
    DollarSign: makeIcon(),
  };
});

import BudgetCreatePage from '@/pages/budgets/BudgetCreatePage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/budgets/create']}>
      <Routes>
        <Route path="/budgets/create" element={<BudgetCreatePage />} />
        <Route path="*" element={<div>Redirected</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('BudgetCreatePage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });

  it('displays the no accounts empty state', () => {
    renderPage();
    expect(screen.getByText(/No Accounts Defined/i)).toBeInTheDocument();
  });

  it('displays the set up accounts button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /Set Up Accounts/i })).toBeInTheDocument();
  });
});
