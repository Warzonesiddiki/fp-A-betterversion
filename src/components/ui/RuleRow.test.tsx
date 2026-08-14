import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RuleRow } from './RuleRow';

describe('RuleRow', () => {
  it('renders without crashing', () => {
    const mockRule = {
      id: 'rule1',
      name: 'Test Rule',
      enabled: true,
      priority: 1,
      visualType: 'backgroundColor' as const,
      condition: {
        ruleType: 'cellValue' as const,
        operator: 'greaterThan' as const,
        value: 0,
      },
    };
    const { container } = render(
      <RuleRow
        rule={mockRule}
        index={0}
        onEdit={vi.fn()}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        isLast={false}
      />
    );
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
