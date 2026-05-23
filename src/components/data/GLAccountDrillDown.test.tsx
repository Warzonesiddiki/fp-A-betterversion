import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GLAccountDrillDown } from './GLAccountDrillDown';

vi.mock('@/components/ui/Sparkline', () => ({
  Sparkline: ({ data, color }: { data: number[]; color?: string }) => (
    <div data-testid="sparkline" data-color={color} data-length={data.length} />
  ),
}));

vi.mock('@/components/ui/DataTable', () => ({
  DataTable: ({ data, columns }: { data: unknown[]; columns: unknown[] }) => (
    <div data-testid="data-table" data-rows={data.length} data-cols={columns.length} />
  ),
}));

describe('GLAccountDrillDown', () => {
  it('renders without crashing', () => {
    render(<GLAccountDrillDown />);
  });

  it('displays account code and name', () => {
    render(<GLAccountDrillDown />);
    expect(screen.getByText('61000 - Professional Services')).toBeInTheDocument();
  });

  it('displays account category', () => {
    render(<GLAccountDrillDown />);
    expect(screen.getByText('Operating Expenses / Outside Services')).toBeInTheDocument();
  });

  it('renders sparkline with data', () => {
    render(<GLAccountDrillDown />);
    const sparkline = screen.getByTestId('sparkline');
    expect(sparkline).toBeInTheDocument();
    expect(sparkline.getAttribute('data-length')).toBe('7');
  });

  it('renders data table', () => {
    render(<GLAccountDrillDown />);
    const table = screen.getByTestId('data-table');
    expect(table).toBeInTheDocument();
    expect(table.getAttribute('data-rows')).toBe('0');
  });
});
