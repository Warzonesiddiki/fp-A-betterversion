import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GLColumnMapper } from './GLColumnMapper';

vi.mock('@/components/ui/Select', () => ({
  Select: ({ value, onChange, options }: Record<string, unknown>) => (
    <select
      data-testid="select"
      value={value as string}
      onChange={(e) => (onChange as (v: string) => void)(e.target.value)}
    >
      {(options as { value: string; label: string }[]).map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('lucide-react', () => ({
  CheckCircle2: () => <span data-testid="check-circle" />,
  AlertCircle: () => <span data-testid="alert-circle" />,
}));

describe('GLColumnMapper', () => {
  const defaultProps = {
    csvColumns: ['Account', 'Date', 'Debit', 'Credit'],
    mappings: {},
    onMap: vi.fn(),
  };

  it('renders without crashing', () => {
    render(<GLColumnMapper {...defaultProps} />);
  });

  it('renders unique target field labels', () => {
    render(<GLColumnMapper {...defaultProps} />);
    expect(screen.getByText('Account Code')).toBeInTheDocument();
    expect(screen.getByText('Posting Date')).toBeInTheDocument();
    expect(screen.getByText('Entity ID')).toBeInTheDocument();
    expect(screen.getByText('Department ID')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders Debit and Credit as field labels', () => {
    render(<GLColumnMapper {...defaultProps} />);
    const debitLabels = screen.getAllByText('Debit');
    const creditLabels = screen.getAllByText('Credit');
    expect(debitLabels.length).toBeGreaterThanOrEqual(1);
    expect(creditLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('shows required markers for required fields', () => {
    render(<GLColumnMapper {...defaultProps} />);
    const requiredMarkers = screen.getAllByText('*Required');
    expect(requiredMarkers.length).toBe(2); // Account Code, Posting Date
  });

  it('renders select dropdowns for each field', () => {
    render(<GLColumnMapper {...defaultProps} />);
    const selects = screen.getAllByTestId('select');
    expect(selects.length).toBe(7); // 7 target fields
  });

  it('shows skip column option in each select', () => {
    render(<GLColumnMapper {...defaultProps} />);
    const skipOptions = screen.getAllByText('-- Skip Column --');
    expect(skipOptions.length).toBe(7);
  });

  it('shows csv columns as options', () => {
    render(<GLColumnMapper {...defaultProps} />);
    expect(screen.getAllByText('Account').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Date').length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when no csv columns', () => {
    render(<GLColumnMapper csvColumns={[]} mappings={{}} onMap={vi.fn()} />);
    expect(
      screen.getByText('No columns detected. Please upload a valid CSV file.')
    ).toBeInTheDocument();
  });

  it('shows check icon for mapped fields', () => {
    render(<GLColumnMapper {...defaultProps} mappings={{ accountCode: 'Account' }} />);
    expect(screen.getByTestId('check-circle')).toBeInTheDocument();
  });

  it('calls onAutoMap on mount when no mappings exist', () => {
    const onAutoMap = vi.fn();
    render(<GLColumnMapper {...defaultProps} onAutoMap={onAutoMap} />);
    expect(onAutoMap).toHaveBeenCalled();
  });

  it('does not call onAutoMap when mappings already exist', () => {
    const onAutoMap = vi.fn();
    render(
      <GLColumnMapper
        {...defaultProps}
        mappings={{ accountCode: 'Account' }}
        onAutoMap={onAutoMap}
      />
    );
    expect(onAutoMap).not.toHaveBeenCalled();
  });
});
