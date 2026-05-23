/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrencyInput } from './CurrencyInput';

describe('CurrencyInput', () => {
  const defaultProps = {
    value: 12345,
    onChange: vi.fn(),
  };

  it('renders without crashing', () => {
    render(<CurrencyInput {...defaultProps} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('displays formatted value on mount', () => {
    render(<CurrencyInput {...defaultProps} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('12,345');
  });

  it('displays zero correctly', () => {
    render(<CurrencyInput {...defaultProps} value={0} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('0');
  });

  it('displays negative values correctly', () => {
    render(<CurrencyInput {...defaultProps} value={-5000} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('-5,000');
  });

  it('displays very large numbers correctly', () => {
    render(<CurrencyInput {...defaultProps} value={1_000_000_000} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('1,000,000,000');
  });

  it('displays decimal-free formatting (no cents)', () => {
    render(<CurrencyInput {...defaultProps} value={9999.99} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    // maximumFractionDigits: 0 so it rounds
    expect(input.value).toBe('10,000');
  });

  it('calls onChange with numeric value when user types', () => {
    const onChange = vi.fn();
    render(<CurrencyInput {...defaultProps} onChange={onChange} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '50000' } });
    expect(onChange).toHaveBeenCalledWith(50000);
  });

  it('strips non-numeric characters from input', () => {
    const onChange = vi.fn();
    render(<CurrencyInput {...defaultProps} onChange={onChange} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '$abc123' } });
    expect(onChange).toHaveBeenCalledWith(123);
  });

  it('does not call onChange for empty input', () => {
    const onChange = vi.fn();
    render(<CurrencyInput {...defaultProps} onChange={onChange} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not call onChange for just a minus sign', () => {
    const onChange = vi.fn();
    render(<CurrencyInput {...defaultProps} onChange={onChange} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '-' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows raw number on focus for editing', () => {
    render(<CurrencyInput {...defaultProps} value={12345} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.focus(input);
    expect(input.value).toBe('12345');
  });

  it('reformats value on blur', () => {
    render(<CurrencyInput {...defaultProps} value={12345} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    fireEvent.focus(input);
    expect(input.value).toBe('12345');

    fireEvent.blur(input);
    expect(input.value).toBe('12,345');
  });

  it('renders currency symbol for USD', () => {
    render(<CurrencyInput {...defaultProps} currency="USD" />);
    // The currency symbol is extracted from Intl.NumberFormat
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with EUR locale formatting', () => {
    render(<CurrencyInput {...defaultProps} value={123456} locale="de-DE" currency="EUR" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    // de-DE uses period as thousands separator
    expect(input.value).toContain('123');
    expect(input.value).toContain('456');
  });

  it('shows error message when error prop is set', () => {
    render(<CurrencyInput {...defaultProps} error="Amount is required" />);
    expect(screen.getByText('Amount is required')).toBeInTheDocument();
  });

  it('applies error styling when error prop is set', () => {
    render(<CurrencyInput {...defaultProps} error="Invalid" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('border-red-500');
  });

  it('disables input when disabled prop is true', () => {
    render(<CurrencyInput {...defaultProps} disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('applies custom className', () => {
    const { container } = render(<CurrencyInput {...defaultProps} className="my-custom-class" />);
    expect(container.firstChild).toHaveClass('my-custom-class');
  });

  it('syncs display value when value prop changes', () => {
    const { rerender } = render(<CurrencyInput {...defaultProps} value={100} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('100');

    rerender(<CurrencyInput {...defaultProps} value={99999} />);
    expect(input.value).toBe('99,999');
  });

  it('handles value of exactly 1', () => {
    render(<CurrencyInput {...defaultProps} value={1} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('1');
  });

  it('handles negative very large numbers', () => {
    render(<CurrencyInput {...defaultProps} value={-999_999_999} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('-999,999,999');
  });

  it('handles typing negative numbers', () => {
    const onChange = vi.fn();
    render(<CurrencyInput {...defaultProps} onChange={onChange} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '-500' } });
    expect(onChange).toHaveBeenCalledWith(-500);
  });

  it('does not display error when error prop is not set', () => {
    render(<CurrencyInput {...defaultProps} />);
    expect(screen.queryByText(/invalid|required/i)).not.toBeInTheDocument();
  });
});
