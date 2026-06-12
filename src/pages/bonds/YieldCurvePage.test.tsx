/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/engines', () => ({
  YieldCurveEngine: {
    bootstrap: vi.fn(() => []),
    interpolate: vi.fn(() => 0.04),
    spotRate: vi.fn(() => 0.04),
    parRate: vi.fn(() => 0.04),
    forwardRate: vi.fn(() => 0.04),
  },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="rc">{children}</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => null,
}));

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    TrendingUp: makeIcon(),
    BarChart3: makeIcon(),
    Calculator: makeIcon(),
    Download: makeIcon(),
    ArrowRight: makeIcon(),
    GitBranch: makeIcon(),
  };
});

import YieldCurvePage from '@/pages/bonds/YieldCurvePage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/bonds/yield-curve']}>
      <YieldCurvePage />
    </MemoryRouter>
  );
}

describe('YieldCurvePage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays empty state', () => {
    renderPage();
    expect(screen.getByText('No Yield Curve Data')).toBeTruthy();
  });
});
