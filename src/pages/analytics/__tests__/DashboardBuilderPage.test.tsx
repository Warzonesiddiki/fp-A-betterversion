import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/testUtils';

vi.mock('@/store/glStore', () => ({
  useGLStore: vi.fn(() => ({ entries: [] })),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => children,
  BarChart: (props: any) => <div data-testid="bar-chart" />,
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
    LayoutDashboard: makeIcon(),
    Plus: makeIcon(),
    Save: makeIcon(),
    Trash2: makeIcon(),
    GripVertical: makeIcon(),
  };
});

import DashboardBuilderPage from '@/pages/analytics/DashboardBuilderPage';

describe('DashboardBuilderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', () => {
    render(<DashboardBuilderPage />);
    expect(screen.getByText(/Dashboard Builder/i)).toBeTruthy();
  });
});
