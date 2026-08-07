import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => children,
  BarChart: (_props: any) => <div data-testid="bar-chart" />,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
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
    FileText: makeIcon(),
    Table: makeIcon(),
    CheckCircle: makeIcon(),
    AlertCircle: makeIcon(),
    Clock: makeIcon(),
    ArrowLeftRight: makeIcon(),
    Download: makeIcon(),
    ChevronUp: makeIcon(),
    ChevronDown: makeIcon(),
    ChevronRight: makeIcon(),
    ChevronLeft: makeIcon(),
  };
});

import TransferPricingPage from '@/pages/tax/TransferPricingPage';

describe('TransferPricingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', () => {
    render(<TransferPricingPage />);
    expect(screen.getByText(/Transfer Pricing/i)).toBeTruthy();
  });
});
