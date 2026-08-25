import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';

vi.mock('@/store/glStore', () => ({
  useGLStore: Object.assign(
    vi.fn((sel?: (s: unknown) => unknown) => {
      const state = { entries: [] };
      return sel ? sel(state) : state;
    }),
    { getState: () => ({ entries: [] }) }
  ),
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

  it('computes net book value from the real DepreciationEngine (not mock data)', () => {
    render(<DepreciationPage />);
    // Manufacturing Equipment: $500K cost, $50K salvage, 10yr straight-line,
    // acquired 2020. By AS_OF 2026 (6 years elapsed): accumulated = 6 × $45K,
    // NBV = $500K − $270K = $230K — exact (money-migrated straight-line).
    expect(screen.getByTestId('nbv-1')).toHaveTextContent('$230K');
  });
});
