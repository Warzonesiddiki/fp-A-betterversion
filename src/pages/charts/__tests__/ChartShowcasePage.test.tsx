import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

vi.mock('@/test/testUtils', async () => {
  const { render } = await import('@/test/testUtils');
  return { render };
});

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => children,
  BarChart: (_props: any) => <div data-testid="bar-chart" />,
  LineChart: (_props: any) => <div data-testid="line-chart" />,
  PieChart: (_props: any) => <div data-testid="pie-chart" />,
  AreaChart: (_props: any) => <div data-testid="area-chart" />,
  Sankey: (_props: any) => <div data-testid="sankey" />,
  Bar: () => null,
  Line: () => null,
  Pie: () => null,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Cell: () => null,
  SankeyNode: () => null,
}));

vi.mock('lucide-react', () => {
  const makeIcon = (name: string) => {
    const Icon = (props: any) => <span data-testid={`icon-${name}`} {...props} />;
    Icon.displayName = name;
    return Icon;
  };
  return {
    BarChart3: makeIcon('BarChart3'),
    Download: makeIcon('Download'),
  };
});

const { render } = await import('@/test/testUtils');
const { ChartShowcasePage } = await import('@/pages/charts/ChartShowcasePage');

describe('ChartShowcasePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', () => {
    render(<ChartShowcasePage />);
    expect(screen.getByText(/Chart Showcase/i)).toBeTruthy();
  });
});
