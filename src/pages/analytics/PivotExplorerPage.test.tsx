import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import PivotExplorerPage from './PivotExplorerPage';
import { useGLStore } from '@/store/glStore';

// The page renders PivotBuilder which imports { X, GripVertical } from 'lucide-react'.
// Enumerate the icons explicitly (never Proxy) so vitest ESM keeps named exports.
vi.mock('lucide-react', () => {
  const IconStub = () => null;
  const icons: Record<string, unknown> = {
    __esModule: true,
    default: IconStub,
    X: IconStub,
    GripVertical: IconStub,
  };
  return icons;
});

const accounts = [
  {
    id: 'acc-1000',
    code: '1000',
    name: 'Sales Revenue',
    type: 'Revenue',
    category: 'Operating',
    subCategory: 'Revenue',
    parentId: null,
    level: 1,
    sortOrder: 0,
    isActive: true,
    entityId: 'E-1',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
  {
    id: 'acc-2000',
    code: '2000',
    name: 'Rent Expense',
    type: 'Expense',
    category: 'Operating',
    subCategory: 'Expense',
    parentId: null,
    level: 1,
    sortOrder: 1,
    isActive: true,
    entityId: 'E-1',
    departmentId: null,
    isCalculated: false,
    formula: null,
    children: [],
  },
];

const entry = (
  id: string,
  accountId: string,
  accountCode: string,
  period: string,
  debit: number,
  credit: number,
  entityId: string
) => ({
  id,
  accountId,
  accountCode,
  accountName: '',
  period,
  periodName: period,
  debit,
  credit,
  netChange: debit - credit,
  date: `${period}-15`,
  amount: debit - credit,
  description: `Entry ${id}`,
  reference: `REF-${id}`,
  entityId,
});

const mockEntries = [
  entry('1', 'acc-1000', '1000', '2023-01', 1000, 0, 'E-1'),
  entry('2', 'acc-2000', '2000', '2023-01', 0, 400, 'E-1'),
  entry('3', 'acc-1000', '1000', '2023-02', 500, 0, 'E-2'),
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <PivotExplorerPage />
    </MemoryRouter>
  );

describe('PivotExplorerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: [], accounts: [] });
  });

  it('renders the header and an empty pivot state when there is no GL data', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Pivot Explorer' })).toBeInTheDocument();
    expect(screen.getByText('Slice and dice your financial data')).toBeInTheDocument();
    expect(screen.getByText('No data to pivot.')).toBeInTheDocument();
  });

  it('builds a pivot from GL entries enriched with account metadata', () => {
    useGLStore.setState({ entries: mockEntries, accounts });
    renderPage();

    // Column headers: period values plus the total column
    expect(screen.getByText('2023-01')).toBeInTheDocument();
    expect(screen.getByText('2023-02')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();

    // Row labels: accountType / accountName joined
    expect(screen.getByText('Revenue / Sales Revenue')).toBeInTheDocument();
    expect(screen.getByText('Expense / Rent Expense')).toBeInTheDocument();
    // 'Grand Total' appears both as the totals row label and the footer section
    expect(screen.getAllByText('Grand Total').length).toBeGreaterThan(0);

    // Revenue row: Jan 1,000 + Feb 500 = 1,500 total
    const revenueRow = screen.getByText('Revenue / Sales Revenue').closest('tr');
    expect(revenueRow).not.toBeNull();
    const revenueCells = within(revenueRow!).getAllByRole('cell');
    expect(revenueCells[1]!.textContent).toBe('1,000');
    expect(revenueCells[2]!.textContent).toBe('500');
    expect(revenueCells[3]!.textContent).toBe('1,500');

    // Expense row: Jan -400
    const expenseRow = screen.getByText('Expense / Rent Expense').closest('tr');
    const expenseCells = within(expenseRow!).getAllByRole('cell');
    expect(expenseCells[1]!.textContent).toBe('-400');

    // Grand total: 1,500 - 400 = 1,100 (row cell + footer cell)
    expect(screen.getAllByText('1,100')).toHaveLength(2);
  });

  it('falls back to Unknown when an entry has no matching account', () => {
    const orphan = { ...mockEntries[0]!, accountId: 'acc-missing', accountCode: '9999' };
    useGLStore.setState({ entries: [orphan], accounts });
    renderPage();

    expect(screen.getByText('Unknown / Unknown')).toBeInTheDocument();
  });

  it('lets the user add dimensions and measures via the builder', async () => {
    const user = userEvent.setup();
    useGLStore.setState({ entries: mockEntries, accounts });
    renderPage();

    // Add entityId to the rows area (4th "Row" button — accountType, accountName, period, entityId)
    const rowButtons = screen.getAllByRole('button', { name: 'Row' });
    await user.click(rowButtons[3]!);

    // Entity appears as a row dimension chip (raw field name is unique to the chip)
    expect(screen.getByText('entityId')).toBeInTheDocument();

    // Row labels now include the entity segment
    expect(screen.getByText('Revenue / Sales Revenue / E-1')).toBeInTheDocument();
    expect(screen.getByText('Revenue / Sales Revenue / E-2')).toBeInTheDocument();

    // Add debit as a measure (3rd "Val" button — debit, credit, netAmount)
    const valButtons = screen.getAllByRole('button', { name: 'Val' });
    await user.click(valButtons[0]!);
    expect(screen.getByText('sum(debit)')).toBeInTheDocument();
  });

  it('lets the user remove values from the configuration', async () => {
    const user = userEvent.setup();
    useGLStore.setState({ entries: mockEntries, accounts });
    renderPage();

    // Scope to the Values container (the dashed-border area below Rows/Columns)
    const valuesHeading = screen.getByText('Values');
    const valuesContainer = valuesHeading.closest('div');
    expect(valuesContainer).not.toBeNull();

    // Initially netAmount is configured
    expect(within(valuesContainer!).getByText('sum(netAmount)')).toBeInTheDocument();

    // Remove it via its X button
    const removeButtons = within(valuesContainer!).getAllByRole('button');
    await user.click(removeButtons[0]!);
    expect(within(valuesContainer!).queryByText('sum(netAmount)')).not.toBeInTheDocument();
    expect(within(valuesContainer!).getByText('Add measures here')).toBeInTheDocument();
  });
});
