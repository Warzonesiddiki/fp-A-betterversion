import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';
import { ChartShowcasePage } from '../ChartShowcasePage';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Bar: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ReferenceLine: () => null,
  Cell: () => null,
  Treemap: () => <div data-testid="treemap" />,
}));

vi.mock('lucide-react', () => {
  const makeIcon = (name: string) => {
    const Icon = (props: any) => <span data-testid={`icon-${name}`} {...props} />;
    Icon.displayName = name;
    return Icon;
  };
  return {
    Image: makeIcon('Image'),
    FileImage: makeIcon('FileImage'),
    TrendingUp: makeIcon('TrendingUp'),
    ArrowUpRight: makeIcon('ArrowUpRight'),
    ArrowDownRight: makeIcon('ArrowDownRight'),
  };
});

describe('ChartShowcasePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all chart cards', () => {
    render(<ChartShowcasePage />);

    expect(screen.getByText('Chart Components')).toBeInTheDocument();
    expect(screen.getByText('Waterfall Chart')).toBeInTheDocument();
    expect(screen.getByText('Variance Chart')).toBeInTheDocument();
    expect(screen.getByText('Sparkline Chart')).toBeInTheDocument();
    expect(screen.getByText('Treemap Chart')).toBeInTheDocument();
    expect(screen.getByText('Heatmap Chart')).toBeInTheDocument();
    expect(screen.getByText('Gauge Chart')).toBeInTheDocument();
  });

  it('renders export buttons for each chart', () => {
    render(<ChartShowcasePage />);
    const svgButtons = screen.getAllByLabelText('Export as SVG');
    const pngButtons = screen.getAllByLabelText('Export as PNG');

    expect(svgButtons).toHaveLength(6);
    expect(pngButtons).toHaveLength(6);
  });
});
