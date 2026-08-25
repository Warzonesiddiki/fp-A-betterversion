import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FinancialTable } from './FinancialTable';
import type { FinancialTableColumn } from './FinancialTable';
import { useFinancialContextStore } from '@/store/financialContextStore';

const columns: FinancialTableColumn[] = [
  { key: 'name', header: 'Account', type: 'string' },
  { key: 'revenue', header: 'Revenue', type: 'currency', align: 'right' },
  { key: 'margin', header: 'Margin', type: 'percent' },
  { key: 'count', header: 'Count', type: 'number' },
];

const rows = [
  { id: '1', name: 'Product Sales', revenue: 500000, margin: 12.5, count: 1200 },
  { id: '2', name: 'Services', revenue: -50000, margin: -5, count: 300 },
];

describe('FinancialTable', () => {
  afterEach(() => {
    useFinancialContextStore.getState().resetContext();
  });

  it('renders column headers', () => {
    render(<FinancialTable columns={columns} rows={[]} />);
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Margin')).toBeInTheDocument();
    expect(screen.getByText('Count')).toBeInTheDocument();
  });

  it('renders data rows with correct values', () => {
    render(<FinancialTable columns={columns} rows={rows} />);
    expect(screen.getByText('Product Sales')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
  });

  it('formats numbers as currency when type is currency', () => {
    render(<FinancialTable columns={columns} rows={[rows[0]]} />);
    expect(screen.getByText('$500,000')).toBeInTheDocument();
  });

  it('formats percent cells as percent-points', () => {
    render(<FinancialTable columns={columns} rows={[rows[0]]} />);
    expect(screen.getByText('12.5%')).toBeInTheDocument();
  });

  it('currency cells follow the reporting-currency selector', () => {
    useFinancialContextStore.getState().setContext({ currency: { code: 'EUR' } });
    render(<FinancialTable columns={columns} rows={[rows[0]]} />);
    expect(screen.getByText('€500,000')).toBeInTheDocument();
    expect(screen.queryByText('$500,000')).not.toBeInTheDocument();
  });

  it('shows empty state when no rows', () => {
    render(<FinancialTable columns={columns} rows={[]} />);
    expect(screen.getByText('No data available.')).toBeInTheDocument();
  });

  it('renders empty placeholder for null values', () => {
    const cols: FinancialTableColumn[] = [{ key: 'val', header: 'Value', type: 'currency' }];
    const rowsWithNull = [{ id: '1', val: null }];
    render(<FinancialTable columns={cols} rows={rowsWithNull} />);
    expect(screen.getByText('---')).toBeInTheDocument();
  });
});
