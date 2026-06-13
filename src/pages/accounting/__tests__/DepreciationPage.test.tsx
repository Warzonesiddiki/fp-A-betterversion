/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => children,
  BarChart: (props: any) => <div data-testid="bar-chart">{props.children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  LineChart: (props: any) => <div data-testid="line-chart">{props.children}</div>,
  Line: () => null,
  AreaChart: (props: any) => <div data-testid="area-chart">{props.children}</div>,
  Area: () => null,
  PieChart: (props: any) => <div data-testid="pie-chart">{props.children}</div>,
  Pie: () => null,
  Cell: () => null,
}));

import DepreciationPage from '@/pages/accounting/DepreciationPage';

describe('DepreciationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', () => {
    render(<DepreciationPage />);
    expect(
      screen.getByRole('heading', { name: /Depreciation & Amortization/i, level: 1 })
    ).toBeTruthy();
  });
});
