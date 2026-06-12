/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { ConditionalFormattingPanel } from './ConditionalFormattingPanel';

vi.mock('@/engines/ConditionalFormattingEngine', () => ({
  generateRuleId: () => 'rule-1',
  DEFAULT_RULES: [],
  reorderRules: (rules: any[]) => rules,
  evaluateRule: (_rule: any, _data: any) => false,
}));

describe('ConditionalFormattingPanel', () => {
  it('renders panel with title', () => {
    render(<ConditionalFormattingPanel rules={[]} onRulesChange={vi.fn()} />);
    expect(screen.getByText(/conditional/i)).toBeInTheDocument();
  });
});
