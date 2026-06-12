/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/hooks/usePeriods', () => ({
  usePeriods: vi.fn(() => []),
}));

vi.mock('@/components/ui/PeriodPicker', () => ({
  PeriodPicker: () => <div data-testid="period-picker" />,
}));

vi.mock('@/engines', () => ({
  ConstructionEngine: {
    calculateStats: vi.fn(() => ({
      totalBacklog: 0,
      revenueYTD: 0,
      avgGrossMargin: 0,
      overUnderBilled: 0,
      wipValue: 0,
      billings: 0,
    })),
    getBacklogTrend: vi.fn(() => []),
    getProjectPortfolio: vi.fn(() => []),
  },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="rc">{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Cell: () => null,
  ComposedChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null,
  Area: () => null,
  AreaChart: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('lucide-react', async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal();
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return new Proxy(actual, {
    get: (target, prop) => {
      if (typeof prop === 'string' && !(prop in target)) {
        return makeIcon();
      }
      if (typeof prop === 'symbol') return makeIcon();
      return (target as Record<string, unknown>)[prop as string];
    },
  });
});

import ConstructionDashboardPage from '@/pages/construction/ConstructionDashboardPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/construction']}>
      <ConstructionDashboardPage />
    </MemoryRouter>
  );
}

describe('ConstructionDashboardPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays dashboard heading', () => {
    renderPage();
    expect(screen.getByText('Construction Dashboard')).toBeTruthy();
  });
});
