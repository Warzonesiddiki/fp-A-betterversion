import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GLDataPreview } from './GLDataPreview';

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, disabled, variant, ...props }: Record<string, unknown>) => (
    <button
      onClick={onClick as () => void}
      disabled={disabled as boolean}
      data-variant={variant}
      {...props}
    >
      {children as React.ReactNode}
    </button>
  ),
}));

vi.mock('lucide-react', () => ({
  AlertCircle: () => <span data-testid="alert-circle" />,
  CheckCircle2: () => <span data-testid="check-circle" />,
}));

describe('GLDataPreview', () => {
  const validData = [
    { acct: '1000', date: '2024-01-01', dr: '100', cr: '0' },
    { acct: '2000', date: '2024-01-02', dr: '0', cr: '200' },
  ];

  const validMappings = {
    accountCode: 'acct',
    postDate: 'date',
    debit: 'dr',
    credit: 'cr',
  };

  const accounts = [{ code: '1000' }, { code: '2000' }];

  const defaultProps = {
    data: validData,
    mappings: validMappings,
    accounts,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders without crashing', () => {
    render(<GLDataPreview {...defaultProps} />);
  });

  it('displays row count in summary', () => {
    render(<GLDataPreview {...defaultProps} />);
    expect(screen.getByText(/2 rows/)).toBeInTheDocument();
  });

  it('shows green check icon for valid data', () => {
    render(<GLDataPreview {...defaultProps} />);
    expect(screen.getByTestId('check-circle')).toBeInTheDocument();
  });

  it('shows 0 errors for valid data', () => {
    render(<GLDataPreview {...defaultProps} />);
    expect(screen.getByText(/0 errors/)).toBeInTheDocument();
  });

  it('renders table headers from mappings', () => {
    render(<GLDataPreview {...defaultProps} />);
    expect(screen.getByText('accountCode')).toBeInTheDocument();
    expect(screen.getByText('postDate')).toBeInTheDocument();
    expect(screen.getByText('debit')).toBeInTheDocument();
    expect(screen.getByText('credit')).toBeInTheDocument();
  });

  it('renders row number column header', () => {
    render(<GLDataPreview {...defaultProps} />);
    expect(screen.getByText('Row')).toBeInTheDocument();
  });

  it('renders status column header', () => {
    render(<GLDataPreview {...defaultProps} />);
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('shows Valid status for valid rows', () => {
    render(<GLDataPreview {...defaultProps} />);
    const validCells = screen.getAllByText('Valid');
    expect(validCells.length).toBe(2);
  });

  it('enables confirm button for valid data', () => {
    render(<GLDataPreview {...defaultProps} />);
    const confirmBtn = screen.getByText('Confirm & Import Data');
    expect(confirmBtn).not.toBeDisabled();
  });

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn();
    render(<GLDataPreview {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('Confirm & Import Data'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(<GLDataPreview {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('detects missing account code', () => {
    const data = [{ acct: '', date: '2024-01-01', dr: '100', cr: '0' }];
    render(<GLDataPreview {...defaultProps} data={data} />);
    // The reason is the import parser's, verbatim: the preview and the import
    // must never tell two different stories about the same row.
    expect(screen.getByText(/missing accountCode/)).toBeInTheDocument();
    expect(screen.getByTestId('alert-circle')).toBeInTheDocument();
  });

  it('detects invalid account code not in list', () => {
    const data = [{ acct: '9999', date: '2024-01-01', dr: '100', cr: '0' }];
    render(<GLDataPreview {...defaultProps} data={data} />);
    expect(screen.getByText(/Account code not in list/)).toBeInTheDocument();
  });

  it('detects missing date', () => {
    const data = [{ acct: '1000', date: '', dr: '100', cr: '0' }];
    render(<GLDataPreview {...defaultProps} data={data} />);
    expect(screen.getByText(/missing posting date/)).toBeInTheDocument();
  });

  it('detects an unparseable date with the import parser reason', () => {
    const data = [{ acct: '1000', date: '2024-02-30', dr: '100', cr: '0' }];
    render(<GLDataPreview {...defaultProps} data={data} />);
    expect(screen.getByText(/unparseable posting date "2024-02-30"/)).toBeInTheDocument();
  });

  // The importer accepts unambiguous US M/D/YYYY export dates. The old
  // preview rejected them, blocking files that would have imported cleanly.
  it('accepts US M/D/YYYY dates, as the import parser does', () => {
    const data = [{ acct: '1000', date: '01/31/2024', dr: '100', cr: '0' }];
    render(<GLDataPreview {...defaultProps} data={data} />);
    expect(screen.getByText(/0 errors detected in 1 rows/)).toBeInTheDocument();
    expect(screen.getByText('Confirm & Import Data')).not.toBeDisabled();
  });

  it('detects invalid debit amount', () => {
    const data = [{ acct: '1000', date: '2024-01-01', dr: 'abc', cr: '0' }];
    render(<GLDataPreview {...defaultProps} data={data} />);
    expect(screen.getByText(/unparseable debit amount "abc"/)).toBeInTheDocument();
  });

  it('detects invalid credit amount', () => {
    const data = [{ acct: '1000', date: '2024-01-01', dr: '0', cr: 'xyz' }];
    render(<GLDataPreview {...defaultProps} data={data} />);
    expect(screen.getByText(/unparseable credit amount "xyz"/)).toBeInTheDocument();
  });

  it('disables confirm button when errors exist', () => {
    const data = [{ acct: '', date: '', dr: '', cr: '' }];
    render(<GLDataPreview {...defaultProps} data={data} />);
    const confirmBtn = screen.getByText('Fix Errors to Continue');
    expect(confirmBtn).toBeDisabled();
  });

  it('shows error count in summary when errors exist', () => {
    const data = [{ acct: '', date: '2024-01-01', dr: '100', cr: '0' }];
    render(<GLDataPreview {...defaultProps} data={data} />);
    expect(screen.getByText(/1 errors/)).toBeInTheDocument();
  });

  it('renders without accounts prop', () => {
    render(<GLDataPreview {...defaultProps} accounts={undefined} />);
    expect(screen.getByText('Confirm & Import Data')).toBeInTheDocument();
  });

  // --- Preview must enforce the SAME contract the import enforces ---------
  // parseGLRows treats a blank amount cell as 0 (an empty debit column is not
  // a broken row). The old preview ran its own parseFloat rules and blocked
  // files the importer would have accepted.
  it('accepts a blank amount cell, as the import parser does', () => {
    const data = [{ acct: '1000', date: '2024-01-01', dr: '', cr: '200' }];
    render(<GLDataPreview {...defaultProps} data={data} />);
    expect(screen.getByText(/0 errors detected in 1 rows/)).toBeInTheDocument();
    expect(screen.getByText('Confirm & Import Data')).not.toBeDisabled();
  });

  it('accepts a file with only one amount column mapped, as the import parser does', () => {
    const data = [{ acct: '1000', date: '2024-01-01', dr: '200' }];
    render(
      <GLDataPreview
        {...defaultProps}
        data={data}
        mappings={{ accountCode: 'acct', postDate: 'date', debit: 'dr' }}
      />
    );
    expect(screen.getByText(/0 errors detected in 1 rows/)).toBeInTheDocument();
    expect(screen.getByText('Confirm & Import Data')).not.toBeDisabled();
  });

  // The defect this replaces: only the first 20 rows were validated, while
  // the banner claimed "N errors detected in 25 rows". A broken row past the
  // window left Confirm enabled and the user imported a file the preview had
  // never checked.
  it('validates every row, not just the displayed window', () => {
    const data = Array.from({ length: 25 }, (_, i) =>
      i === 24
        ? { acct: '', date: '2024-01-01', dr: '100', cr: '0' }
        : { acct: '1000', date: '2024-01-01', dr: '100', cr: '0' }
    );
    render(<GLDataPreview {...defaultProps} data={data} />);

    expect(screen.getByText(/1 errors detected in 25 rows/)).toBeInTheDocument();
    expect(screen.getByText('Fix Errors to Continue')).toBeDisabled();
    // The failing row is source-file row 26 (header = row 1) — the same
    // number the importer reports, and it is visible even though the table
    // only renders the first 20 data rows.
    expect(screen.getByText(/Row 26: missing accountCode/)).toBeInTheDocument();
  });

  it('numbers rows by source-file position, matching import rejections', () => {
    render(<GLDataPreview {...defaultProps} />);
    // First data row of a CSV with a header is source row 2.
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByText('1')).toBeNull();
  });

  it('states the display window and the validation scope exactly', () => {
    const data = Array.from({ length: 25 }, () => ({
      acct: '1000',
      date: '2024-01-01',
      dr: '100',
      cr: '0',
    }));
    render(<GLDataPreview {...defaultProps} data={data} />);
    expect(
      screen.getByText(/All 25 data rows checked against the import rules/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Showing the first 20 of 25 data rows/)).toBeInTheDocument();
  });
});
