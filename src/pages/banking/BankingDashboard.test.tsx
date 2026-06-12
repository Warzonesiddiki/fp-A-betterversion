/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('@/engines/BankingEngine', () => ({
  BankingEngine: {
    calculateLoanLossStats: vi.fn(() => ({})),
    calculateCapitalStats: vi.fn(() => ({})),
    calculateNIMStats: vi.fn(() => ({})),
  },
}));

vi.mock('@/engines/ExportEngine', () => ({
  ExportEngine: { exportToPDF: vi.fn() },
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
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null,
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
    Download: makeIcon(),
    Landmark: makeIcon(),
    ArrowRight: makeIcon(),
    DollarSign: makeIcon(),
    Shield: makeIcon(),
    AlertTriangle: makeIcon(),
    TrendingUp: makeIcon(),
  };
});

import BankingDashboard from '@/pages/banking/BankingDashboard';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/banking']}>
      <BankingDashboard />
    </MemoryRouter>
  );
}

describe('BankingDashboard smoke test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('renders without crashing', () => {
    const { container } = renderPage();
    expect(container).toBeTruthy();
  });
  it('displays empty state', () => {
    renderPage();
    expect(screen.getByText('No Banking Data')).toBeTruthy();
  });
});
