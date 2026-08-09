import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConditionalFormatRules } from './ConditionalFormatRules';
import type { ConditionalFormatRule } from '@/engines/ConditionalFormattingEngine';

describe('ConditionalFormatRules (deep tests)', () => {
  const sampleRule: ConditionalFormatRule = {
    id: 'rule-edit-1',
    name: 'High Variance Alert',
    enabled: true,
    priority: 85,
    condition: {
      ruleType: 'cellValue',
      operator: 'greaterThan',
      value: 5000,
      columnKey: 'variance',
    },
    visualType: 'backgroundColor',
    style: {
      backgroundColor: '#fef08a',
      textColor: '#854d0e',
    },
  };

  it('renders in create mode with default values', () => {
    render(<ConditionalFormatRules onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText('New Formatting Rule')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Rule' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByLabelText('Rule Name')).toHaveValue('');
    expect(screen.getByLabelText('Priority')).toHaveValue(100);
  });

  it('renders in edit mode with populated rule data', () => {
    render(<ConditionalFormatRules rule={sampleRule} onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText('Edit Formatting Rule')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update Rule' })).toBeInTheDocument();
    expect(screen.getByLabelText('Rule Name')).toHaveValue('High Variance Alert');
    expect(screen.getByLabelText('Priority')).toHaveValue(85);
    expect(screen.getByLabelText('Value')).toHaveValue(5000);
    expect(screen.getByLabelText('Column Key (optional)')).toHaveValue('variance');
  });

  it('updates rule name and priority, then saves with correct values', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<ConditionalFormatRules onSave={onSave} onCancel={vi.fn()} />);

    const nameInput = screen.getByLabelText('Rule Name');
    const priorityInput = screen.getByLabelText('Priority');
    const valueInput = screen.getByLabelText('Value');

    act(() => {
      fireEvent.change(nameInput, { target: { value: 'Custom Q4 Rule' } });
      fireEvent.change(priorityInput, { target: { value: '42' } });
      fireEvent.change(valueInput, { target: { value: '1250' } });
    });

    const addBtn = screen.getByRole('button', { name: 'Add Rule' });
    await user.click(addBtn);

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0]![0] as ConditionalFormatRule;
    expect(saved.name).toBe('Custom Q4 Rule');
    expect(saved.priority).toBe(42);
    expect(saved.condition.value).toBe(1250);
    expect(saved.visualType).toBe('backgroundColor');
    expect(saved.enabled).toBe(true);
    expect(saved.id).toBeDefined();
  });

  it('handles fallback name when name input is empty', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<ConditionalFormatRules onSave={onSave} onCancel={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Add Rule' }));
    expect(onSave).toHaveBeenCalled();
    const saved = onSave.mock.calls[0]![0] as ConditionalFormatRule;
    expect(saved.name).toBe('cellValue Rule');
  });

  it('triggers onCancel when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<ConditionalFormatRules onSave={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('applies Favorable and Unfavorable variance color presets', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<ConditionalFormatRules onSave={onSave} onCancel={vi.fn()} />);

    const favBtn = screen.getByRole('button', { name: 'Favorable (green)' });
    const unfavBtn = screen.getByRole('button', { name: 'Unfavorable (red)' });

    await user.click(favBtn);
    await user.click(screen.getByRole('button', { name: 'Add Rule' }));

    let saved = onSave.mock.calls[0]![0] as ConditionalFormatRule;
    expect(saved.style?.backgroundColor).toBe('#dcfce7');
    expect(saved.style?.textColor).toBe('#16A34A');

    onSave.mockClear();
    await user.click(unfavBtn);
    await user.click(screen.getByRole('button', { name: 'Add Rule' }));

    saved = onSave.mock.calls[0]![0] as ConditionalFormatRule;
    expect(saved.style?.backgroundColor).toBe('#fee2e2');
    expect(saved.style?.textColor).toBe('#DC2626');
  });

  it('preserves existing rule ID when updating an existing rule', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<ConditionalFormatRules rule={sampleRule} onSave={onSave} onCancel={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Update Rule' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'rule-edit-1',
        name: 'High Variance Alert',
        priority: 85,
        condition: expect.objectContaining({
          value: 5000,
          columnKey: 'variance',
        }),
      })
    );
  });
});
