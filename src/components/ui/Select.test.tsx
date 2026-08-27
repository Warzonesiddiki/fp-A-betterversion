/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';

const options = [
  { value: 'opt1', label: 'Option 1' },
  { value: 'opt2', label: 'Option 2' },
  { value: 'opt3', label: 'Option 3' },
];

describe('Select', () => {
  // jsdom lacks the pointer APIs Radix Select's event handlers call.
  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    window.HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
    window.HTMLElement.prototype.releasePointerCapture = vi.fn();
  });

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

  // Regression lock (lane R22): Radix throws on empty-string item values.
  // A { value: '' } option (e.g. GLColumnMapper's '-- Skip Column --') must
  // render, select back as '', and not crash the route.
  it('supports an explicit empty-value option without crashing', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Select
        options={[{ value: '', label: '-- Skip Column --' }, ...options]}
        value=""
        onChange={onChange}
      />
    );
    await user.click(screen.getByRole('combobox'));
    // Radix mounts the options in a portal asynchronously after opening.
    const skipItem = await screen.findByText('-- Skip Column --');
    await user.click(skipItem);
    expect(onChange).toHaveBeenCalledWith('');
  });
});
