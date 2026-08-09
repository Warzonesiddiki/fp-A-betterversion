import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormulaBar } from './FormulaBar';

describe('FormulaBar (deep tests)', () => {
  it('renders active cell indicator, fx label, input, and confirm/cancel buttons', () => {
    render(
      <FormulaBar value="=SUM(A1:A5)" activeCell="C12" onChange={vi.fn()} onEvaluate={vi.fn()} />
    );

    expect(screen.getByLabelText('Active cell: C12')).toBeInTheDocument();
    expect(screen.getByText('C12')).toBeInTheDocument();
    expect(screen.getByText('fx')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Formula input' })).toHaveValue('=SUM(A1:A5)');
    expect(screen.getByRole('button', { name: 'Cancel formula' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm formula' })).toBeInTheDocument();
  });

  it('triggers onEvaluate on Confirm button click and onChange on Cancel button click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onEvaluate = vi.fn();

    render(
      <FormulaBar value="12500" activeCell="B4" onChange={onChange} onEvaluate={onEvaluate} />
    );

    // Confirm button
    await user.click(screen.getByRole('button', { name: 'Confirm formula' }));
    expect(onEvaluate).toHaveBeenCalledWith('12500');

    // Cancel button
    await user.click(screen.getByRole('button', { name: 'Cancel formula' }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('displays suggestions for formula prefixes and supports keyboard ArrowDown / ArrowUp / Tab', () => {
    const onChange = vi.fn();
    const onEvaluate = vi.fn();

    render(<FormulaBar value="=SU" activeCell="A1" onChange={onChange} onEvaluate={onEvaluate} />);

    const input = screen.getByRole('combobox', { name: 'Formula input' });
    expect(input).toHaveAttribute('aria-expanded', 'true');

    const listbox = screen.getByRole('listbox', { name: 'Formula suggestions' });
    expect(listbox).toBeInTheDocument();

    // Arrow down to move to next item
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // Arrow up to move back to first item
    fireEvent.keyDown(input, { key: 'ArrowUp' });

    // Tab to select and insert first suggestion (SUM)
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(onChange).toHaveBeenCalled();
  });

  it('inserts suggestion when clicking on an item with mouse', () => {
    const onChange = vi.fn();

    render(<FormulaBar value="=SU" activeCell="A1" onChange={onChange} onEvaluate={vi.fn()} />);

    const listbox = screen.getByRole('listbox', { name: 'Formula suggestions' });
    expect(listbox).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);

    // MouseDown inserts suggestion
    fireEvent.mouseDown(options[0]!);
    expect(onChange).toHaveBeenCalled();
  });

  it('evaluates and navigates on Enter, Tab, and Shift+Tab when not suggesting', () => {
    const onEvaluate = vi.fn();
    const onNavigate = vi.fn();
    const onChange = vi.fn();

    render(
      <FormulaBar
        value="450"
        activeCell="A1"
        onChange={onChange}
        onEvaluate={onEvaluate}
        onNavigate={onNavigate}
      />
    );

    const input = screen.getByRole('combobox', { name: 'Formula input' });

    // Enter -> evaluate + navigate down
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onEvaluate).toHaveBeenCalledWith('450');
    expect(onNavigate).toHaveBeenCalledWith('down');

    // Tab -> evaluate + navigate right
    onEvaluate.mockClear();
    onNavigate.mockClear();
    fireEvent.keyDown(input, { key: 'Tab', shiftKey: false });
    expect(onEvaluate).toHaveBeenCalledWith('450');
    expect(onNavigate).toHaveBeenCalledWith('right');

    // Shift+Tab -> evaluate + navigate left
    onEvaluate.mockClear();
    onNavigate.mockClear();
    fireEvent.keyDown(input, { key: 'Tab', shiftKey: true });
    expect(onEvaluate).toHaveBeenCalledWith('450');
    expect(onNavigate).toHaveBeenCalledWith('left');

    // Escape -> clears value
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('renders syntax error alert when formula is invalid', () => {
    render(<FormulaBar value="=SUM(((" activeCell="A1" onChange={vi.fn()} onEvaluate={vi.fn()} />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });

  it('supports disabled state and named ranges prop', () => {
    render(
      <FormulaBar
        value="=Rev"
        activeCell="A1"
        disabled={true}
        namedRanges={['RevenueTotal', 'RevenueGrowth']}
        onChange={vi.fn()}
        onEvaluate={vi.fn()}
      />
    );

    const input = screen.getByRole('combobox', { name: 'Formula input' });
    expect(input).toBeDisabled();
  });
});
