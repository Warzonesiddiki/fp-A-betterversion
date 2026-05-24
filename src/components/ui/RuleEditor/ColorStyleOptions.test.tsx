import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/testUtils';
import { ColorStyleOptions } from './ColorStyleOptions';

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
  style: { backgroundColor: '#dcfce7', textColor: '#166534' },
};

describe('ColorStyleOptions', () => {
  it('renders background color label', () => {
    render(<ColorStyleOptions rule={baseRule} onChange={vi.fn()} />);
    expect(screen.getByText('Background Color')).toBeInTheDocument();
  });

  it('calls onChange when color changes', () => {
    const onChange = vi.fn();
    const { container } = render(<ColorStyleOptions rule={baseRule} onChange={onChange} />);
    const colorInput = container.querySelector('input[type="color"]');
    if (colorInput) {
      fireEvent.change(colorInput, { target: { value: '#00ff00' } });
      expect(onChange).toHaveBeenCalled();
    }
  });
});
