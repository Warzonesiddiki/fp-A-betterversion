/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FXPositionGrid } from './FXPositionGrid';

vi.mock('@/components/ui/FinancialTable', () => ({
  FinancialTable: ({
    rows,
    columns,
  }: {
    rows: unknown[];
    columns: { key: string; header: string }[];
  }) => (
    <div data-testid="financial-table" data-rows={rows.length}>
      {columns.map((col) => (
        <span key={col.key}>{col.header}</span>
      ))}
    </div>
  ),
}));

describe('FXPositionGrid', () => {
  it('renders without crashing', () => {
    const { container } = render(<FXPositionGrid />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders FinancialTable child component', () => {
    render(<FXPositionGrid />);
    expect(screen.getByTestId('financial-table')).toBeInTheDocument();
  });

  it('passes empty rows to FinancialTable', () => {
    render(<FXPositionGrid />);
    const table = screen.getByTestId('financial-table');
    expect(table.getAttribute('data-rows')).toBe('0');
  });

  it('renders all column headers', () => {
    render(<FXPositionGrid />);
    expect(screen.getByText('Currency')).toBeInTheDocument();
    expect(screen.getByText('Long')).toBeInTheDocument();
    expect(screen.getByText('Short')).toBeInTheDocument();
    expect(screen.getByText('Net Position')).toBeInTheDocument();
    expect(screen.getByText('Current Rate')).toBeInTheDocument();
  });
});
