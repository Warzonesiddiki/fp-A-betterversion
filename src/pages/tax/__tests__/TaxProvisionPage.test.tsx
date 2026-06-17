/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({
    entries: [
      {
        id: '1',
        account: '4000',
        accountName: 'Revenue',
        amount: 100000,
        period: '2026-01',
        department: 'Sales',
        type: 'revenue',
      },
      {
        id: '2',
        account: '5000',
        accountName: 'COGS',
        amount: 30000,
        period: '2026-01',
        department: 'COGS',
        type: 'expense',
      },
    ],
  })),
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

vi.mock(import('lucide-react'), async (importOriginal) => {
  const actual = await importOriginal();
  const Icon = (props: any) => <span data-testid="mock-icon" {...props} />;
  Icon.displayName = 'MockIcon';
  return {
    ...actual,
    default: Icon,
    Landmark: Icon,
    Download: Icon,
    FileText: Icon,
    Table: Icon,
    Percent: Icon,
    DollarSign: Icon,
    TrendingUp: Icon,
    ChevronUp: Icon,
    ChevronDown: Icon,
    Receipt: Icon,
    Calculator: Icon,
    Info: Icon,
    TrendingDown: Icon,
    FileSpreadsheet: Icon,
  };
});

import TaxProvisionPage from '@/pages/tax/TaxProvisionPage';

describe('TaxProvisionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', () => {
    render(<TaxProvisionPage />);
    expect(screen.getAllByText(/tax provision/i).length).toBeGreaterThan(0);
  });
});
