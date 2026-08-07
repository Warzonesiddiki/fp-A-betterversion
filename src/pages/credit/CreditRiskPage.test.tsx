import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/engines', () => ({
  CreditRiskEngine: {
    creditScore: vi.fn(() => ({ rating: 'BBB', score: 70, pd: 0.02 })),
    lossGivenDefault: vi.fn(() => 0.4),
    exposureAtDefault: vi.fn(() => 100000),
    expectedLoss: vi.fn(() => 5000),
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
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => null,
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
    ShieldAlert: makeIcon(),
    DollarSign: makeIcon(),
    TrendingDown: makeIcon(),
    BarChart3: makeIcon(),
    AlertTriangle: makeIcon(),
    Download: makeIcon(),
    Activity: makeIcon(),
    Shield: makeIcon(),
    ChevronUp: makeIcon(),
    ChevronDown: makeIcon(),
    Search: makeIcon(),
    Filter: makeIcon(),
    MoreHorizontal: makeIcon(),
    ChevronLeft: makeIcon(),
    ChevronRight: makeIcon(),
  };
});

import CreditRiskPage from '@/pages/credit/CreditRiskPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/credit']}>
      <CreditRiskPage />
    </MemoryRouter>
  );
}

describe('CreditRiskPage smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays empty state', () => {
    renderPage();
    expect(screen.getByText('No Credit Data')).toBeTruthy();
  });
});
