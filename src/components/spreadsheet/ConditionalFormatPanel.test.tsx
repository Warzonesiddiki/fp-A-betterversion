import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ConditionalFormatPanel } from './ConditionalFormatPanel';
import type { ConditionalFormatRule } from '@/engines/ConditionalFormattingEngine';

vi.mock('@/components/ui/Button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  ),
}));

// ConditionalFormatRules is a nested editor; render it as a stub that fires
// onSave with a canned rule so the panel's save/cancel paths are exercised.
vi.mock('./ConditionalFormatRules', () => ({
  ConditionalFormatRules: ({ onSave }: { onSave: (r: ConditionalFormatRule) => void }) => (
    <div data-testid="rule-editor">
      <button
        onClick={() =>
          onSave({
            id: 'custom-1',
            name: 'Custom Rule',
            enabled: true,
            priority: 50,
            condition: {
              ruleType: 'cellValue',
              operator: 'greaterThan',
              value: 10,
              columnKey: 'revenue',
            },
            visualType: 'textColor',
            style: { textColor: '#ff0000' },
          })
        }
      >
        Save Custom
      </button>
    </div>
  ),
}));

const rule = (over: Partial<ConditionalFormatRule>): ConditionalFormatRule => ({
  id: 'r1',
  name: 'Positive',
  enabled: true,
  priority: 100,
  condition: { ruleType: 'cellValue', operator: 'greaterThan', value: 0, columnKey: 'amount' },
  visualType: 'backgroundColor',
  style: { backgroundColor: '#dcfce7', textColor: '#166534' },
  ...over,
});

describe('ConditionalFormatPanel', () => {
  it('renders default rules when no initial rules are provided', () => {
    render(<ConditionalFormatPanel />);
    expect(screen.getByText('Conditional Formatting')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add rule/i })).toBeInTheDocument();
    // DEFAULT_RULES is non-empty
    expect(screen.getAllByRole('button').length).toBeGreaterThan(1);
  });

  it('renders custom initial rules and toggles them', async () => {
    const user = userEvent.setup();
    const onRulesChange = vi.fn();
    render(<ConditionalFormatPanel initialRules={[rule({})]} onRulesChange={onRulesChange} />);

    const toggle = screen.getByRole('button', { name: 'Disable rule' });
    await user.click(toggle);
    expect(onRulesChange).toHaveBeenCalled();
    const updated = onRulesChange.mock.calls[0]![0] as ConditionalFormatRule[];
    expect(updated[0]!.enabled).toBe(false);
  });

  it('deletes rules', async () => {
    const user = userEvent.setup();
    const onRulesChange = vi.fn();
    render(<ConditionalFormatPanel initialRules={[rule({})]} onRulesChange={onRulesChange} />);

    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteBtn);
    const updated = onRulesChange.mock.calls[0]![0] as ConditionalFormatRule[];
    expect(updated).toHaveLength(0);
    expect(screen.getByText(/no formatting rules/i)).toBeInTheDocument();
  });

  it('moves rules up/down via priority swaps', async () => {
    const user = userEvent.setup();
    const onRulesChange = vi.fn();
    render(
      <ConditionalFormatPanel
        initialRules={[rule({ id: 'a', priority: 100 }), rule({ id: 'b', priority: 99 })]}
        onRulesChange={onRulesChange}
      />
    );

    // First rule has no move-up; second rule can move up
    const moveUpButtons = screen.getAllByRole('button', { name: /move up/i });
    await user.click(moveUpButtons[moveUpButtons.length - 1]!);
    expect(onRulesChange).toHaveBeenCalled();
    const updated = onRulesChange.mock.calls[0]![0] as ConditionalFormatRule[];
    expect(updated.find((r) => r.id === 'a')!.priority).toBe(99);
    expect(updated.find((r) => r.id === 'b')!.priority).toBe(100);
  });

  it('creates a rule via the Add Rule flow and saves it', async () => {
    const user = userEvent.setup();
    const onRulesChange = vi.fn();
    render(<ConditionalFormatPanel initialRules={[]} onRulesChange={onRulesChange} />);

    await user.click(screen.getByRole('button', { name: /add rule/i }));
    expect(screen.getByTestId('rule-editor')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save Custom' }));
    const updated = onRulesChange.mock.calls[0]![0] as ConditionalFormatRule[];
    expect(updated).toHaveLength(1);
    expect(updated[0]!.name).toBe('Custom Rule');
    // editor closed after save
    expect(screen.queryByTestId('rule-editor')).not.toBeInTheDocument();
  });

  it('applies the Favorable/Unfavorable variance presets', async () => {
    const user = userEvent.setup();
    const onRulesChange = vi.fn();
    render(<ConditionalFormatPanel initialRules={[]} onRulesChange={onRulesChange} />);

    await user.click(screen.getByRole('button', { name: 'Favorable' }));
    const fav = onRulesChange.mock.calls[0]![0] as ConditionalFormatRule[];
    expect(fav.some((r) => r.condition.operator === 'greaterThan')).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Unfavorable' }));
    const unfav = onRulesChange.mock.calls[1]![0] as ConditionalFormatRule[];
    expect(unfav.some((r) => r.condition.operator === 'lessThan')).toBe(true);
  });

  it('editing an existing rule opens the editor and saves updates', async () => {
    const user = userEvent.setup();
    const onRulesChange = vi.fn();
    render(<ConditionalFormatPanel initialRules={[rule({})]} onRulesChange={onRulesChange} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByTestId('rule-editor')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save Custom' }));
    const updated = onRulesChange.mock.calls[0]![0] as ConditionalFormatRule[];
    // the stub editor always saves a new id, so the rule is appended
    expect(updated).toHaveLength(2);
    expect(updated.some((r) => r.id === 'custom-1')).toBe(true);
  });
});
