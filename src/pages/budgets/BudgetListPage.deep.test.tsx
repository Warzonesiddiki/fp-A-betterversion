import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import BudgetListPage from './BudgetListPage';
import { useBudgetStore, type Budget } from '@/store/budgetStore';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/budgets' }),
  };
});

vi.mock('@/components/ai/AICopilotPanel', () => ({
  AICopilotPanel: () => <div data-testid="ai-copilot-stub" />,
}));

describe('BudgetListPage (deep tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useBudgetStore.setState({ budgets: [] });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  const mockBudgets: Budget[] = [
    {
      id: 'b-1',
      name: '2026 Corporate Operating Budget',
      fiscalYear: 2026,
      status: 'Draft',
      totalAmount: 1200000,
      departments: ['Sales', 'Marketing'],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
      items: [],
    },
    {
      id: 'b-2',
      name: '2026 Engineering R&D Budget',
      fiscalYear: 2026,
      status: 'InReview',
      totalAmount: 3500000,
      departments: ['Engineering'],
      createdAt: '2026-01-03T00:00:00Z',
      updatedAt: '2026-01-04T00:00:00Z',
      items: [],
    },
    {
      id: 'b-3',
      name: '2025 Historical Budget',
      fiscalYear: 2025,
      status: 'Approved',
      totalAmount: 2800000,
      departments: ['Finance'],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-02T00:00:00Z',
      items: [],
    },
  ];

  it('renders empty state when no budgets exist and navigates to create', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <BudgetListPage />
      </BrowserRouter>
    );

    expect(screen.getByText('No Budgets Yet')).toBeInTheDocument();
    const createBtn = screen.getByRole('button', { name: 'Create new budget' });
    await user.click(createBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/budgets/create');
  });

  it('renders budget list and filters by status', async () => {
    const user = userEvent.setup();
    useBudgetStore.setState({ budgets: mockBudgets });

    render(
      <BrowserRouter>
        <BudgetListPage />
      </BrowserRouter>
    );

    expect(screen.getByText('2026 Corporate Operating Budget')).toBeInTheDocument();
    expect(screen.getByText('2026 Engineering R&D Budget')).toBeInTheDocument();
    expect(screen.getByText('2025 Historical Budget')).toBeInTheDocument();

    // Filter by Draft
    const draftFilter = screen.getByRole('button', { name: 'Draft' });
    await user.click(draftFilter);

    expect(screen.getByText('2026 Corporate Operating Budget')).toBeInTheDocument();
    expect(screen.queryByText('2026 Engineering R&D Budget')).not.toBeInTheDocument();
    expect(screen.queryByText('2025 Historical Budget')).not.toBeInTheDocument();
  });

  it('filters budgets by search query', () => {
    useBudgetStore.setState({ budgets: mockBudgets });

    render(
      <BrowserRouter>
        <BudgetListPage />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText('Search by name...');
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'Engineering' } });
    });

    expect(screen.getByText('2026 Engineering R&D Budget')).toBeInTheDocument();
    expect(screen.queryByText('2026 Corporate Operating Budget')).not.toBeInTheDocument();
  });

  it('handles submit, approve, reject, duplicate, and delete workflow actions', async () => {
    const user = userEvent.setup();
    const submitBudget = vi.fn();
    const approveBudget = vi.fn();
    const rejectBudget = vi.fn();
    const duplicateBudget = vi.fn();
    const deleteBudget = vi.fn();

    useBudgetStore.setState({
      budgets: mockBudgets,
      submitBudget,
      approveBudget,
      rejectBudget,
      duplicateBudget,
      deleteBudget,
    });

    render(
      <BrowserRouter>
        <BudgetListPage />
      </BrowserRouter>
    );

    // Submit Draft budget
    const submitBtn = screen.getByRole('button', { name: 'Submit budget for approval' });
    await user.click(submitBtn);
    expect(submitBudget).toHaveBeenCalledWith('b-1');

    // Approve InReview budget
    const approveBtn = screen.getByRole('button', { name: 'Approve budget' });
    await user.click(approveBtn);
    expect(approveBudget).toHaveBeenCalledWith('b-2');

    // Reject InReview budget
    const rejectBtn = screen.getByRole('button', { name: 'Reject budget' });
    await user.click(rejectBtn);
    expect(rejectBudget).toHaveBeenCalledWith('b-2');

    // Duplicate budget
    const duplicateBtns = screen.getAllByRole('button', { name: 'Duplicate budget' });
    await user.click(duplicateBtns[0]!);
    expect(duplicateBudget).toHaveBeenCalledWith('b-2');

    // Delete dialog workflow
    const deleteBtns = screen.getAllByRole('button', { name: 'Delete budget' });
    await user.click(deleteBtns[0]!);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete Budget')).toBeInTheDocument();

    const confirmDeleteBtn = screen.getByRole('button', { name: 'Delete' });
    await user.click(confirmDeleteBtn);
    expect(deleteBudget).toHaveBeenCalledWith('b-2');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
