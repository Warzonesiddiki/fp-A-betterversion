import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { DataBarOptions } from './DataBarOptions';

const baseRule = {
  id: 'rule-1',
  name: 'Test Rule',
  enabled: true,
  priority: 100,
  condition: { ruleType: 'formula' as const, operator: 'equal' as const },
  visualType: 'dataBar' as const,
  dataBar: { style: 'solid' as const, barColor: '#3b82f6', showAxis: false, showValue: true },
};

describe('DataBarOptions', () => {
  it('renders bar style and color', () => {
    render(<DataBarOptions rule={baseRule} onChange={vi.fn()} />);
    expect(screen.getByText('Bar Style')).toBeInTheDocument();
    expect(screen.getByText('Bar Color')).toBeInTheDocument();
  });
});
