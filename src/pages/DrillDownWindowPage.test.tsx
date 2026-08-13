import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { format } from 'date-fns';
import DrillDownWindowPage from './DrillDownWindowPage';
import { useGLStore } from '@/store/glStore';

// Mock lucide icons used by DataTable (ChevronUp, ChevronDown, AlertCircle, Search).
// The global setup already stubs lucide-react; we keep a local explicit stub only
// for icons this page path actually renders.
vi.mock('lucide-react', () => {
  const IconStub = () => null;
  const icons: Record<string, unknown> = {
    __esModule: true,
    default: IconStub,
    ChevronUp: IconStub,
    ChevronDown: IconStub,
    AlertCircle: IconStub,
    Search: IconStub,
  };
  return icons;
});

const entry = (
  id: string,
  date: string,
  accountCode: string,
  debit: number,
  credit: number,
  description: string
) => ({
  id,
  date,
  accountCode,
  debit,
  credit,
  description,
  accountId: `acc-${accountCode}`,
  amount: debit - credit,
});

const mockEntries = [
  entry('1', '2023-01-15', '4000', 100000, 0, 'Jan revenue'),
  entry('2', '2023-01-20', '4000', 50000, 0, 'Jan revenue 2'),
  entry('3', '2023-01-25', '5000', 0, 40000, 'Jan cogs'),
  entry('4', '2023-02-10', '4000', 200000, 0, 'Feb revenue'),
  entry('5', '2023-02-28', '5100', 0, 30000, 'Feb labor'),
];

const renderPage = (query = '') =>
  render(
    <MemoryRouter initialEntries={[`/${query}`]}>
      <DrillDownWindowPage />
    </MemoryRouter>
  );

describe('DrillDownWindowPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGLStore.setState({ entries: mockEntries });
    document.title = '';
  });

  it('renders all entries with the default title when no params are provided', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Transactions' })).toBeInTheDocument();
    expect(screen.getByText(`${mockEntries.length} transactions found`)).toBeInTheDocument();
    expect(screen.queryByText(/Filtering by Account/)).not.toBeInTheDocument();

    // All account codes appear in the table (4000 appears on two rows)
    expect(screen.getAllByText('4000').length).toBeGreaterThan(0);
    expect(screen.getByText('5000')).toBeInTheDocument();
    expect(screen.getByText('5100')).toBeInTheDocument();
  });

  it('sets document.title from the title param', () => {
    renderPage('?title=GL%20Drill%20Down');
    expect(document.title).toBe('GL Drill Down');
  });

  it('filters entries by account prefix, start date and end date', () => {
    renderPage('?title=Revenue&accountPrefix=4000&startDate=2023-01-01&endDate=2023-01-31');

    expect(screen.getByRole('heading', { name: 'Revenue' })).toBeInTheDocument();
    expect(screen.getByText('2 transactions found')).toBeInTheDocument();
    expect(screen.getByText(/Filtering by Account: 4000\*/)).toBeInTheDocument();

    // Only the two January 4000 entries survive the filter
    expect(screen.getByText('Jan revenue')).toBeInTheDocument();
    expect(screen.getByText('Jan revenue 2')).toBeInTheDocument();
    expect(screen.queryByText('Jan cogs')).not.toBeInTheDocument();
    expect(screen.queryByText('Feb revenue')).not.toBeInTheDocument();
  });

  it('renders formatted dates and currency values in the table', () => {
    renderPage();

    const row = screen.getByText('Jan revenue').closest('tr');
    expect(row).not.toBeNull();
    const cells = within(row!).getAllByRole('cell');

    expect(cells[0]!.textContent).toBe(format(new Date('2023-01-15'), 'MMM d, yyyy'));
    expect(cells[1]!.textContent).toBe('4000');
    expect(cells[2]!.textContent).toBe('Jan revenue');
    // $100,000.00 (Intl formatting, no toFixed in source).
    // Zero renders as the em-dash placeholder: UI-06 routes all money display
    // through the shared reporting-currency formatter, whose canonical
    // zeroDisplay is '—' so empty debit/credit cells stay visually quiet.
    expect(cells[3]!.textContent).toBe('$100,000.00');
    expect(cells[4]!.textContent).toBe('—');

    const creditRow = screen.getByText('Jan cogs').closest('tr');
    expect(creditRow).not.toBeNull();
    const creditCells = within(creditRow!).getAllByRole('cell');
    expect(creditCells[3]!.textContent).toBe('—');
    expect(creditCells[4]!.textContent).toBe('$40,000.00');
  });

  it('shows an empty table when the filters exclude everything', () => {
    renderPage('?title=Empty&accountPrefix=9999');
    expect(screen.getByText('0 transactions found')).toBeInTheDocument();
  });
});
