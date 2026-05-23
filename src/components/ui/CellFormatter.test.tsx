/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CellFormatter } from './CellFormatter';

// Mock Modal to render children directly when isOpen
vi.mock('./Modal', () => ({
  Modal: ({
    isOpen,
    children,
    title,
  }: {
    isOpen: boolean;
    children: React.ReactNode;
    title: string;
  }) =>
    isOpen ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

// Mock Select to render a native select
vi.mock('./Select', () => ({
  Select: ({
    options,
    value,
    onValueChange,
    ...props
  }: {
    options: { value: string; label: string }[];
    value: string;
    onValueChange: (v: string) => void;
  }) => (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      data-testid="select"
      {...props}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

describe('CellFormatter', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onApply: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Rendering
  it('renders when isOpen is true', () => {
    render(<CellFormatter {...defaultProps} />);
    expect(screen.getByText('Format Cells')).toBeInTheDocument();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<CellFormatter {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders Category label', () => {
    render(<CellFormatter {...defaultProps} />);
    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  it('renders format preview', () => {
    render(<CellFormatter {...defaultProps} />);
    expect(screen.getByText('Sample')).toBeInTheDocument();
  });

  it('renders Cancel button', () => {
    render(<CellFormatter {...defaultProps} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders Apply button', () => {
    render(<CellFormatter {...defaultProps} />);
    expect(screen.getByText('Apply')).toBeInTheDocument();
  });

  it('renders preview aria attributes', () => {
    render(<CellFormatter {...defaultProps} />);
    expect(screen.getByLabelText('Format preview')).toBeInTheDocument();
  });

  // Interactions
  it('calls onClose when Cancel clicked', () => {
    const onClose = vi.fn();
    render(<CellFormatter {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onApply and onClose when Apply clicked', () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(<CellFormatter {...defaultProps} onApply={onApply} onClose={onClose} />);
    fireEvent.click(screen.getByText('Apply'));
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        format: 'general',
        decimals: 2,
        useThousandsSeparator: true,
      })
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('uses currentFormat when provided', () => {
    const currentFormat = {
      format: 'currency' as const,
      decimals: 3,
      useThousandsSeparator: false,
      currencySymbol: '€',
      dateFormat: 'DD/MM/YYYY',
      prefix: '',
      suffix: '',
      negativeStyle: 'parentheses' as const,
    };
    render(<CellFormatter {...defaultProps} currentFormat={currentFormat} />);
    expect(screen.getByText('Decimal Places')).toBeInTheDocument();
    expect(screen.getByText('Symbol')).toBeInTheDocument();
  });

  // Format-dependent fields
  it('shows decimal places for number format', () => {
    render(<CellFormatter {...defaultProps} />);
    // Default is "general" - no decimal field
    expect(screen.queryByText('Decimal Places')).not.toBeInTheDocument();
  });

  it('shows prefix and suffix inputs for general format', () => {
    render(<CellFormatter {...defaultProps} />);
    // General format (not date/text) does show prefix/suffix
    expect(screen.getByText('Prefix')).toBeInTheDocument();
    expect(screen.getByText('Suffix')).toBeInTheDocument();
  });
});
