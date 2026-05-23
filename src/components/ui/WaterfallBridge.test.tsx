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
    expect(container).toBeTruthy();
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
