/* eslint-disable @typescript-eslint/no-explicit-any */
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
  RadarChart: (_props: any) => <div data-testid="radar-chart" />,
  ComposedChart: (_props: any) => <div data-testid="composed-chart" />,
  Treemap: (_props: any) => <div data-testid="treemap" />,
  ScatterChart: (_props: any) => <div data-testid="scatter-chart" />,
  Bar: () => null,
  Line: () => null,
  Pie: () => null,
  Area: () => null,
  Radar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Cell: () => null,
  SankeyNode: () => null,
  ReferenceLine: () => null,
  ReferenceArea: () => null,
  ReferenceDot: () => null,
}));

vi.mock(import('lucide-react'), async (importOriginal) => {
  const actual = await importOriginal();
  const Icon = (props: any) => <span data-testid="icon" {...props} />;
  Icon.displayName = 'Icon';
  const proxy = new Proxy(Icon, {
    get: (_target, prop) => {
      if (prop === '__esModule' || prop === 'default' || prop === 'displayName') {
        return prop === '__esModule' ? true : prop === 'default' ? Icon : 'Icon';
      }
      // For namespace imports, also return the proxy
      return (..._args: unknown[]) => Icon;
    },
  });
  return {
    ...actual,
    default: Icon,
    BarChart3: Icon,
    Download: Icon,
    FileImage: Icon,
    Image: Icon,
    ChevronUp: Icon,
    ChevronDown: Icon,
    X: Icon,
    FileText: Icon,
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
    expect(screen.getAllByText(/chart showcase/i).length).toBeGreaterThan(0);
  });
});
