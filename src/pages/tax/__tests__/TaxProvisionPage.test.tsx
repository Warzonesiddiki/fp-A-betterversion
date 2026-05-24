import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => children,
  BarChart: (props: any) => <div data-testid="bar-chart" />,
  LineChart: (props: any) => <div data-testid="line-chart" />,
  Bar: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  WaterfallChart: (props: any) => <div data-testid="waterfall-chart" />,
}));

vi.mock('@/components/charts/WaterfallChart', () => ({
  WaterfallChart: (props: any) => <div data-testid="waterfall-chart" />,
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
    Download: makeIcon(),
    FileText: makeIcon(),
    Table: makeIcon(),
    Percent: makeIcon(),
    DollarSign: makeIcon(),
    TrendingUp: makeIcon(),
  };
});

import TaxProvisionPage from '@/pages/tax/TaxProvisionPage';

describe('TaxProvisionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', () => {
    render(<TaxProvisionPage />);
    expect(screen.getByText(/Tax Provision/i)).toBeTruthy();
  });
});
