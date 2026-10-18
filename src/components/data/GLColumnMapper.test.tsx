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

/** GLImportField keys the wizard exposes: 2 required + 8 optional. */
const MAPPABLE_FIELD_COUNT = 10;

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
    expect(screen.getByText('Account Name')).toBeInTheDocument();
    expect(screen.getByText('Currency')).toBeInTheDocument();
    expect(screen.getByText('Entity ID')).toBeInTheDocument();
    expect(screen.getByText('Department ID')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Reference')).toBeInTheDocument();
  });

  // The mapper must offer a control for every field `parseGLRows` understands:
  // a fact the source file carries but the wizard cannot map is a fact the
  // ledger silently loses (the account name collapses to the code, and the
  // import scope reports a currency that was in the file as unavailable).
  it('offers one control per mappable field', () => {
    render(<GLColumnMapper {...defaultProps} />);
    expect(screen.getAllByTestId('select')).toHaveLength(MAPPABLE_FIELD_COUNT);
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

  it('shows skip column option in each select', () => {
    render(<GLColumnMapper {...defaultProps} />);
    const skipOptions = screen.getAllByText('-- Skip Column --');
    expect(skipOptions.length).toBe(MAPPABLE_FIELD_COUNT);
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
