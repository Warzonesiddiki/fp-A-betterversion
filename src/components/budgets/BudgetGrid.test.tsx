/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BudgetGrid, type BudgetGridProps } from './BudgetGrid';

vi.mock('@/components/ui/DataGrid', () => ({
  DataGrid: ({
    data,
    onCellChange,
  }: {
    data: unknown[];
    onCellChange: (id: string, value: unknown) => void;
  }) => (
    <div data-testid="data-grid">
      <span data-testid="grid-row-count">{data.length}</span>
      <button data-testid="trigger-cell-change" onClick={() => onCellChange('item-1', '500')}>
        Edit Cell
      </button>
    </div>
  ),
}));

vi.mock('@/components/ui/FormulaBar', () => ({
  FormulaBar: ({ className }: { className?: string }) => (
    <div data-testid="formula-bar" className={className}>
      FormulaBar
    </div>
  ),
}));

const defaultProps: BudgetGridProps = {
  lineItems: [
    {
      id: '1',
      budgetId: 'b1',
      accountId: 'a1',
      accountCode: '4000',
      accountName: 'Revenue',
      accountType: 'Revenue' as const,
      periodId: 'p1',
      month: 1,
      amount: 100,
      formula: null,
      isCalculated: false,
      isLocked: false,
      isReadOnly: false,
      notes: null,
      driverId: null,
      assumptions: null,
      version: 1,
      createdBy: 'user',
      updatedBy: 'user',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '2',
      budgetId: 'b1',
      accountId: 'a2',
      accountCode: '5000',
      accountName: 'COGS',
      accountType: 'Expense' as const,
      periodId: 'p1',
      month: 1,
      amount: 50,
      formula: null,
      isCalculated: false,
      isLocked: false,
      isReadOnly: false,
      notes: null,
      driverId: null,
      assumptions: null,
      version: 1,
      createdBy: 'user',
      updatedBy: 'user',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ] as BudgetGridProps['lineItems'],
  accounts: [],
  onCellEdit: vi.fn(),
  onUndo: vi.fn(),
  onRedo: vi.fn(),
  canUndo: true,
  canRedo: false,
};

function renderBudgetGrid(overrides: Partial<BudgetGridProps> = {}) {
  return render(<BudgetGrid {...defaultProps} {...overrides} />);
}

describe('BudgetGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderBudgetGrid();
  });

  it('renders the data grid', () => {
    renderBudgetGrid();
    expect(screen.getByTestId('data-grid')).toBeInTheDocument();
  });

  it('renders the formula bar', () => {
    renderBudgetGrid();
    expect(screen.getByTestId('formula-bar')).toBeInTheDocument();
  });

  it('renders undo button', () => {
    renderBudgetGrid();
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });

  it('renders redo button', () => {
    renderBudgetGrid();
    expect(screen.getByText('Redo')).toBeInTheDocument();
  });

  it('passes lineItems to DataGrid', () => {
    renderBudgetGrid();
    expect(screen.getByTestId('grid-row-count')).toHaveTextContent('2');
  });

  it('disables undo button when canUndo is false', () => {
    renderBudgetGrid({ canUndo: false });
    expect(screen.getByText('Undo')).toBeDisabled();
  });

  it('enables undo button when canUndo is true', () => {
    renderBudgetGrid({ canUndo: true });
    expect(screen.getByText('Undo')).not.toBeDisabled();
  });

  it('disables redo button when canRedo is false', () => {
    renderBudgetGrid({ canRedo: false });
    expect(screen.getByText('Redo')).toBeDisabled();
  });

  it('enables redo button when canRedo is true', () => {
    renderBudgetGrid({ canRedo: true });
    expect(screen.getByText('Redo')).not.toBeDisabled();
  });

  it('calls onUndo when undo button is clicked', () => {
    const onUndo = vi.fn();
    renderBudgetGrid({ onUndo });
    fireEvent.click(screen.getByText('Undo'));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('calls onRedo when redo button is clicked', () => {
    const onRedo = vi.fn();
    renderBudgetGrid({ canRedo: true, onRedo });
    fireEvent.click(screen.getByText('Redo'));
    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  it('calls onCellEdit when grid cell changes', () => {
    const onCellEdit = vi.fn();
    renderBudgetGrid({ onCellEdit });
    fireEvent.click(screen.getByTestId('trigger-cell-change'));
    expect(onCellEdit).toHaveBeenCalledWith('item-1', 500);
  });

  it('handles empty lineItems', () => {
    renderBudgetGrid({ lineItems: [] });
    expect(screen.getByTestId('grid-row-count')).toHaveTextContent('0');
  });
});
