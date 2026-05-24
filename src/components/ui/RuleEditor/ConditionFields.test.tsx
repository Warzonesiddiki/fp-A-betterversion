import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/testUtils';
import { ConditionFields } from './ConditionFields';

const baseRule = {
  id: 'rule-1',
  name: 'Test Rule',
  enabled: true,
  priority: 100,
  condition: {
    ruleType: 'cellValue' as const,
    operator: 'greaterThan' as const,
    value: 100,
  },
  visualType: 'backgroundColor' as const,
  style: { backgroundColor: '#ff0000', textColor: '#000000' },
};

describe('ConditionFields', () => {
  it('renders condition fields', () => {
    render(<ConditionFields rule={baseRule} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Operator')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
  });

  it('calls onChange when operator changes', () => {
    const onChange = vi.fn();
    render(<ConditionFields rule={baseRule} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Operator'), { target: { value: 'lessThan' } });
    expect(onChange).toHaveBeenCalled();
  });
});
