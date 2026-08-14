import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/engines', () => ({
  BondPricingEngine: {
    price: vi.fn(() => 0),
    duration: vi.fn(() => ({ modified: 0, macaulay: 0, convexity: 0 })),
    accruedInterest: vi.fn(() => 0),
    dirtyPrice: vi.fn(() => 0),
  },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="rc">{children}</div>,
  ScatterChart: ({ children }: any) => <div>{children}</div>,
  Scatter: () => null,
  XAxis: () => null,
  YAxis: () => null,
  ZAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
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
    Landmark: makeIcon(),
    DollarSign: makeIcon(),
    TrendingUp: makeIcon(),
    BarChart3: makeIcon(),
    Clock: makeIcon(),
    Download: makeIcon(),
    Shield: makeIcon(),
    AlertTriangle: makeIcon(),
  };
});

import BondPortfolioPage from '@/pages/bonds/BondPortfolioPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/bonds']}>
      <BondPortfolioPage />
    </MemoryRouter>
  );
}

describe('BondPortfolioPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the page mounted'
    ).toBeGreaterThanOrEqual(2);
  });
  it('displays empty state', () => {
    renderPage();
    expect(screen.getByText('No Bond Data')).toBeTruthy();
  });
});
