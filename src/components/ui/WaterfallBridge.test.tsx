import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WaterfallBridge } from '@/components/ui/WaterfallBridge';

const sampleItems = [
  { label: 'Start', value: 100, type: 'total' as const },
  { label: 'Revenue', value: 50, type: 'increase' as const },
  { label: 'Costs', value: -30, type: 'decrease' as const },
  { label: 'End', value: 120, type: 'total' as const },
];

describe('WaterfallBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing with data', () => {
    const { container } = render(<WaterfallBridge items={sampleItems} />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });

  it('displays item labels', () => {
    render(<WaterfallBridge items={sampleItems} />);
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Costs')).toBeInTheDocument();
    expect(screen.getByText('End')).toBeInTheDocument();
  });

  it('shows "No data" when items are empty', () => {
    render(<WaterfallBridge items={[]} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('shows "No data" when items is null', () => {
    // @ts-expect-error testing null input
    render(<WaterfallBridge items={null} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <WaterfallBridge items={sampleItems} className="custom-waterfall" />
    );
    expect((container.firstChild as HTMLElement).className).toContain('custom-waterfall');
  });

  it('uses custom format function', () => {
    const format = (v: number) => `$${v}`;
    render(<WaterfallBridge items={sampleItems} format={format} />);
    expect(screen.getByText('$100')).toBeInTheDocument();
    expect(screen.getByText('$50')).toBeInTheDocument();
  });
});

describe('WaterfallBridge hook stability (regression: hooks must run unconditionally)', () => {
  it('survives null → data transition without hook-count mismatch', () => {
    const { rerender } = render(
      // @ts-expect-error testing null input
      <WaterfallBridge items={null} />
    );
    expect(screen.queryByText('Revenue')).toBeNull();

    rerender(<WaterfallBridge items={sampleItems} />);

    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('survives empty → data transition without hook-count mismatch', () => {
    const { rerender } = render(<WaterfallBridge items={[]} />);
    expect(screen.getByText('No data')).toBeInTheDocument();

    rerender(<WaterfallBridge items={sampleItems} />);

    expect(screen.getByText('End')).toBeInTheDocument();
  });

  it('survives data → empty transition without hook-count mismatch', () => {
    const { rerender } = render(<WaterfallBridge items={sampleItems} />);
    rerender(<WaterfallBridge items={[]} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });
});

describe('WaterfallBridge semantic tone tokens (regression: no hardcoded hex variance colors)', () => {
  it('derives bar fills from semantic tokens, not hex literals', () => {
    const { container } = render(<WaterfallBridge items={sampleItems} />);
    const bars = container.querySelectorAll<HTMLDivElement>('.absolute.rounded');
    expect(bars).toHaveLength(sampleItems.length);

    // Order: total, increase, decrease, total
    expect(bars[0]!.getAttribute('style')).toContain('var(--info)');
    expect(bars[1]!.getAttribute('style')).toContain('var(--positive)');
    expect(bars[2]!.getAttribute('style')).toContain('var(--negative)');
    expect(bars[3]!.getAttribute('style')).toContain('var(--info)');
  });

  it('emits no legacy hex literals in rendered markup', () => {
    const { container } = render(<WaterfallBridge items={sampleItems} />);
    expect(container.innerHTML).not.toContain('#10b981');
    expect(container.innerHTML).not.toContain('#ef4444');
    expect(container.innerHTML).not.toContain('#3b82f6');
  });

  it('still honors explicit per-item color overrides', () => {
    const { container } = render(
      <WaterfallBridge
        items={[{ label: 'Custom', value: 10, type: 'increase', color: '#abc123' }]}
      />
    );
    const bar = container.querySelector<HTMLDivElement>('.absolute.rounded');
    expect(bar!.getAttribute('style')).toContain('rgb(171, 193, 35)');
  });
});
