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
    expect(screen.getByText(/Missing account code/)).toBeInTheDocument();
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
    expect(screen.getByText(/Missing date/)).toBeInTheDocument();
  });

  it('detects invalid date format', () => {
    const data = [{ acct: '1000', date: '01/01/2024', dr: '100', cr: '0' }];
    render(<GLDataPreview {...defaultProps} data={data} />);
    expect(screen.getByText(/Invalid date format/)).toBeInTheDocument();
  });

  it('detects invalid debit amount', () => {
    const data = [{ acct: '1000', date: '2024-01-01', dr: 'abc', cr: '0' }];
    render(<GLDataPreview {...defaultProps} data={data} />);
    expect(screen.getByText(/Invalid debit amount/)).toBeInTheDocument();
  });

  it('detects invalid credit amount', () => {
    const data = [{ acct: '1000', date: '2024-01-01', dr: '0', cr: 'xyz' }];
    render(<GLDataPreview {...defaultProps} data={data} />);
    expect(screen.getByText(/Invalid credit amount/)).toBeInTheDocument();
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
});
