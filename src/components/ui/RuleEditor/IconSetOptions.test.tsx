import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { IconSetOptions } from './IconSetOptions';

const baseRule = {
  id: 'rule-1',
  name: 'Test Rule',
  enabled: true,
  priority: 100,
  condition: { ruleType: 'formula' as const, operator: 'equal' as const },
  visualType: 'iconSet' as const,
  iconSet: { type: '3-arrows' as const, reverse: false, showIconOnly: false },
};

describe('IconSetOptions', () => {
  it('renders icon set label', () => {
    render(<IconSetOptions rule={baseRule} onChange={vi.fn()} />);
    expect(screen.getByText('Icon Set')).toBeInTheDocument();
  });

  it('renders reverse checkbox', () => {
    render(<IconSetOptions rule={baseRule} onChange={vi.fn()} />);
    expect(screen.getByText('Reverse icon order')).toBeInTheDocument();
  });
});
