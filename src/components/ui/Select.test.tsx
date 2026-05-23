/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from './Select';

const options = [
  { value: 'opt1', label: 'Option 1' },
  { value: 'opt2', label: 'Option 2' },
  { value: 'opt3', label: 'Option 3' },
];

describe('Select', () => {
  it('renders select element', () => {
    render(<Select options={options} value="" onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows all options when opened', () => {
    render(<Select options={options} value="" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('combobox'));
    options.forEach((opt) => {
      expect(screen.getByText(opt.label)).toBeInTheDocument();
    });
  });

  it('handles onChange', () => {
    const onChange = vi.fn();
    render(<Select options={options} value="" onChange={onChange} />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Option 1'));
    expect(onChange).toHaveBeenCalledWith('opt1');
  });

  it('applies placeholder', () => {
    render(<Select options={options} value="" onChange={vi.fn()} placeholder="Pick one" />);
    expect(screen.getByText('Pick one')).toBeInTheDocument();
  });
});
