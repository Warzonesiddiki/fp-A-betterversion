/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen } from '@testing-library/react';
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
    expect(container).toBeDefined();
  });
});
