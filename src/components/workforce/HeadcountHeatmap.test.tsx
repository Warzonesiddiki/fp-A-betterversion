import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
vi.mock('@/components/ui/Heatmap', () => ({
  Heatmap: ({ data }: { data: unknown[] }) => <div data-testid="heatmap">{data.length} cells</div>,
}));

import { HeadcountHeatmap } from '@/components/workforce/HeadcountHeatmap';

describe('HeadcountHeatmap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<HeadcountHeatmap />);
    expect(container).toBeTruthy();
  });

  it('renders the Heatmap component', () => {
    const { getByTestId } = render(<HeadcountHeatmap />);
    expect(getByTestId('heatmap')).toBeInTheDocument();
  });

  it('has the correct container styling', () => {
    const { container } = render(<HeadcountHeatmap />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('h-80');
    expect(wrapper.className).toContain('bg-slate-950');
    expect(wrapper.className).toContain('rounded-xl');
  });
});
