import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { FormulaBar } from './FormulaBar';

vi.mock('lucide-react', () => {
  const IconStub = () => null;
  return {
    __esModule: true,
    default: IconStub,
    Check: IconStub,
    X: IconStub,
    AlertTriangle: IconStub,
  };
});

function renderBar(props: Partial<React.ComponentProps<typeof FormulaBar>> = {}) {
  const onChange = vi.fn();
  const onEvaluate = vi.fn();
  const onNavigate = vi.fn();
  const utils = render(
    <FormulaBar
      value=""
      onChange={onChange}
      onEvaluate={onEvaluate}
      onNavigate={onNavigate}
      {...props}
    />
  );
  return { ...utils, onChange, onEvaluate, onNavigate };
}

describe('FormulaBar', () => {
  it('renders the active cell and empty input', () => {
    renderBar({ activeCell: 'B7' });
    expect(screen.getByText('B7')).toBeInTheDocument();
    const input = screen.getByRole('combobox');
    expect(input).toHaveValue('');
  });

  it('shows suggestions for formula prefixes and inserts on Enter', async () => {
    const user = userEvent.setup();
    const { onChange, onEvaluate } = renderBar({ value: '=SU' });
    // =SU suggests SUM etc.
    const input = screen.getByRole('combobox');
    expect(input).toHaveValue('=SU');
    await user.click(input);
    await user.keyboard('{Enter}');
    // Enter on a suggestion inserts it AND evaluates
    expect(onChange).toHaveBeenCalled();
    expect(onEvaluate).toHaveBeenCalled();
  });

  it('navigates suggestions with arrow keys', async () => {
    const user = userEvent.setup();
    const { onChange } = renderBar({ value: '=S' });
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalled();
  });

  it('Escape clears suggestions then clears the value', async () => {
    const user = userEvent.setup();
    const { onChange } = renderBar({ value: '=SU' });
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{Escape}');
    // first Escape hides suggestions; second clears value
    await user.keyboard('{Escape}');
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('plain Enter evaluates and navigates down; Tab evaluates and navigates right', async () => {
    const user = userEvent.setup();
    const { onEvaluate, onNavigate } = renderBar({ value: '2+2' });
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{Enter}');
    expect(onEvaluate).toHaveBeenCalledWith('2+2');
    expect(onNavigate).toHaveBeenCalledWith('down');

    onEvaluate.mockClear();
    onNavigate.mockClear();
    await user.keyboard('{Tab}');
    expect(onEvaluate).toHaveBeenCalledWith('2+2');
    expect(onNavigate).toHaveBeenCalledWith('right');
  });

  it('shift+Tab navigates left', async () => {
    const user = userEvent.setup();
    const { onNavigate } = renderBar({ value: '1' });
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(onNavigate).toHaveBeenCalledWith('left');
  });

  it('supports disabled state', () => {
    renderBar({ disabled: true });
    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
