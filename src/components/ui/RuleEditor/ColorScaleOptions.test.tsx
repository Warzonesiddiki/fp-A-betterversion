import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { ColorScaleOptions } from './ColorScaleOptions';

const baseRule = {
  id: 'rule-1',
  name: 'Test Rule',
  enabled: true,
  priority: 100,
  condition: { ruleType: 'formula' as const, operator: 'equal' as const },
  visualType: 'colorScale' as const,
  colorScale: { type: '2-color' as const, minColor: '#ff0000', maxColor: '#00ff00' },
};

describe('ColorScaleOptions', () => {
  it('renders color scale options', () => {
    render(<ColorScaleOptions rule={baseRule} onChange={vi.fn()} />);
    expect(screen.getByText('Scale Type')).toBeInTheDocument();
    expect(screen.getByText('2-Color Scale')).toBeInTheDocument();
    expect(screen.getByDisplayValue('#ff0000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('#00ff00')).toBeInTheDocument();
  });
});
