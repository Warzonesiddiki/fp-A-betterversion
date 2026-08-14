import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConditionalRuleEditor } from './ConditionalRuleEditor';

describe('ConditionalRuleEditor', () => {
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
      <ConditionalRuleEditor
        rule={mockRule}
        onChange={vi.fn()}
        onCancel={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });
});
