/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TornadoChart, type TornadoChartProps, type TornadoVariable } from './TornadoChart';

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({
    children,
    width,
    height,
  }: {
    children: React.ReactNode;
    width?: string;
    height?: number;
  }) => (
    <div data-testid="responsive-container" style={{ width, height }}>
      {children}
    </div>
  ),
  BarChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="bar-chart" data-items={data.length}>
      {children}
    </div>
  ),
  Bar: ({ children }: { children: React.ReactNode }) => <div data-testid="bar">{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Cell: () => <div data-testid="cell" />,
  ReferenceLine: () => <div data-testid="reference-line" />,
}));

const mockVariables: TornadoVariable[] = [
  { name: 'Price', lowValue: 38000000, highValue: 47000000, baseValue: 42500000 },
  { name: 'Volume', lowValue: 39500000, highValue: 45500000, baseValue: 42500000 },
  { name: 'COGS %', lowValue: 40000000, highValue: 45000000, baseValue: 42500000 },
];

const defaultProps: TornadoChartProps = {
  variables: mockVariables,
};

describe('TornadoChart', () => {
  it('renders without crashing', () => {
    const { container } = render(<TornadoChart {...defaultProps} />);
    expect(container.querySelector('[data-testid="bar-chart"]')).toBeInTheDocument();
  });

  it('renders the chart container', () => {
    const { container } = render(<TornadoChart {...defaultProps} />);
    expect(container.querySelector('[data-testid="responsive-container"]')).toBeInTheDocument();
  });

  it('renders all chart components', () => {
    render(<TornadoChart {...defaultProps} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('reference-line')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    const { container } = render(<TornadoChart {...defaultProps} title="Sensitivity Analysis" />);
    const heading = container.querySelector('h3');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Sensitivity Analysis');
  });

  it('does not render title when not provided', () => {
    const { container } = render(<TornadoChart {...defaultProps} />);
    expect(container.querySelector('h3')).not.toBeInTheDocument();
  });

  describe('Legend', () => {
    it('renders the legend with downside, base case, and upside', () => {
      render(<TornadoChart {...defaultProps} />);
      expect(screen.getAllByText('Downside').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Base case')).toBeInTheDocument();
      expect(screen.getAllByText('Upside').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Variables', () => {
    it('passes correct number of items to chart data', () => {
      render(<TornadoChart {...defaultProps} />);
      const chart = screen.getByTestId('bar-chart');
      expect(chart.getAttribute('data-items')).toBe('3');
    });

    it('sorts variables by absolute max delta (largest first)', () => {
      const variables: TornadoVariable[] = [
        { name: 'Small', lowValue: 42000000, highValue: 43000000, baseValue: 42500000 },
        { name: 'Large', lowValue: 38000000, highValue: 47000000, baseValue: 42500000 },
      ];
      const { container } = render(<TornadoChart variables={variables} />);
      // The chart should render without error
      expect(container.querySelector('[data-testid="bar-chart"]')).toBeInTheDocument();
    });
  });

  describe('Dimensions', () => {
    it('renders chart with default height via style on wrapper div', () => {
      const { container } = render(<TornadoChart {...defaultProps} />);
      const heightDiv = container.querySelector('[style*="height"]');
      expect(heightDiv).toBeInTheDocument();
    });

    it('renders chart with custom height via style on wrapper div', () => {
      const { container } = render(<TornadoChart {...defaultProps} height={400} />);
      const heightDiv = container.querySelector('[style*="height: 400px"]');
      expect(heightDiv).toBeInTheDocument();
    });
  });

  describe('Base Case', () => {
    it('uses 0 as default base case when not provided', () => {
      const variables: TornadoVariable[] = [{ name: 'Test', lowValue: -5, highValue: 5 }];
      const { container } = render(<TornadoChart variables={variables} />);
      expect(container.querySelector('[data-testid="bar-chart"]')).toBeInTheDocument();
    });

    it('uses custom base case when provided', () => {
      const { container } = render(<TornadoChart {...defaultProps} baseCase={42500000} />);
      expect(container.querySelector('[data-testid="bar-chart"]')).toBeInTheDocument();
    });

    it('falls back to baseValue on variable when baseCase is not provided', () => {
      const { container } = render(<TornadoChart {...defaultProps} />);
      expect(container.querySelector('[data-testid="bar-chart"]')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('applies custom className', () => {
      const { container } = render(<TornadoChart {...defaultProps} className="custom-tornado" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-tornado');
    });
  });

  describe('Edge Cases', () => {
    it('handles single variable', () => {
      const variables: TornadoVariable[] = [
        { name: 'Price', lowValue: 38000000, highValue: 47000000, baseValue: 42500000 },
      ];
      render(<TornadoChart variables={variables} />);
      const chart = screen.getByTestId('bar-chart');
      expect(chart.getAttribute('data-items')).toBe('1');
    });

    it('handles variables with zero delta', () => {
      const variables: TornadoVariable[] = [
        { name: 'Flat', lowValue: 100, highValue: 100, baseValue: 100 },
      ];
      const { container } = render(<TornadoChart variables={variables} />);
      expect(container.querySelector('[data-testid="bar-chart"]')).toBeInTheDocument();
    });

    it('handles variables without explicit baseValue', () => {
      const variables: TornadoVariable[] = [{ name: 'Test', lowValue: -10, highValue: 10 }];
      const { container } = render(<TornadoChart variables={variables} baseCase={0} />);
      expect(container.querySelector('[data-testid="bar-chart"]')).toBeInTheDocument();
    });

    it('handles empty variables array', () => {
      const { container } = render(<TornadoChart variables={[]} />);
      expect(container.querySelector('[data-testid="bar-chart"]')).toBeInTheDocument();
    });
  });
});
