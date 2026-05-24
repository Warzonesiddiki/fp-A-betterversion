import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/testUtils';
import { NLQInput } from './NLQInput';

describe('NLQInput', () => {
  it('renders input field', () => {
    render(<NLQInput onSubmit={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls onSubmit when Enter is pressed with text', () => {
    const onSubmit = vi.fn();
    render(<NLQInput onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'show revenue' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith('show revenue');
  });

  it('does not call onSubmit with empty input', () => {
    const onSubmit = vi.fn();
    render(<NLQInput onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables input when isProcessing is true', () => {
    render(<NLQInput onSubmit={vi.fn()} isProcessing />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('shows suggestions on focus', () => {
    render(<NLQInput onSubmit={vi.fn()} />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    expect(screen.getByText('Show Q3 revenue by region')).toBeInTheDocument();
  });

  it('selects suggestion on click', () => {
    const onSubmit = vi.fn();
    render(<NLQInput onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.mouseDown(screen.getByText('Show Q3 revenue by region'));
    expect(onSubmit).toHaveBeenCalledWith('Show Q3 revenue by region');
  });
});
