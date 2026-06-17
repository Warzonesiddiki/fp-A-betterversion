/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  RadarChart: ({ children }: any) => <div data-testid="radar-chart">{children}</div>,
  Radar: () => <div data-testid="radar" />,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  ScatterChart: ({ children }: any) => <div data-testid="scatter-chart">{children}</div>,
  Scatter: () => <div data-testid="scatter" />,
  Treemap: () => <div data-testid="treemap" />,
  ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
  RadialBarChart: ({ children }: any) => <div data-testid="radial-bar-chart">{children}</div>,
  RadialBar: () => <div data-testid="radial-bar" />,
}));

vi.mock('@/store/glStore', () => ({
  useGLStore: () => ({
    entries: [
      {
        id: '1',
        accountCode: '5000',
        accountName: 'Salaries',
        debit: 100000,
        credit: 0,
        period: '2026-01',
        department: 'Engineering',
      },
    ],
  }),
}));

import { render, screen } from '@/test/testUtils';
import CompModelingPage from '../CompModelingPage';

describe('CompModelingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    render(<CompModelingPage />);
    expect(screen.getAllByText(/compensation modeling/i).length).toBeGreaterThan(0);
  });

  it('renders KPI cards', () => {
    render(<CompModelingPage />);
    expect(screen.getAllByText(/total headcount/i).length).toBeGreaterThan(0);
  });

  it('renders compensation level table', () => {
    render(<CompModelingPage />);
    expect(screen.getAllByText(/junior/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/senior/i).length).toBeGreaterThan(0);
  });

  it('renders merit increase slider', () => {
    const { container } = render(<CompModelingPage />);
    const slider = container.querySelector('input[type="range"]');
    expect(slider).toBeDefined();
  });

  it('renders charts', () => {
    render(<CompModelingPage />);
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
  });

  it('renders download button', () => {
    const { container } = render(<CompModelingPage />);
    const buttons = container.querySelectorAll('button');
    const hasDownloadIcon = Array.from(buttons).some((b) => b.querySelector('svg'));
    expect(hasDownloadIcon).toBe(true);
  });
});
