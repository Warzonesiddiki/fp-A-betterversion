import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  Plus: () => <span data-testid="mock-icon" />,
  Copy: () => <span data-testid="mock-icon" />,
  BookTemplate: () => <span data-testid="mock-icon" />,
  ArrowRight: () => <span data-testid="mock-icon" />,
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('@/components/charts/HeatmapChart', () => ({
  HeatmapChart: () => <div data-testid="heatmap-chart" />,
}));

import { render, screen } from '@/test/testUtils';
import { DriverSummaryPanel } from '@/pages/forecasts/DriverSummaryPanel';
import type { Driver, CascadeRule } from '@/engines/DriverCascadeEngine';

const defaultProps = {
  drivers: [] as Driver[],
  allRules: [] as CascadeRule[],
  lastCascadeResult: null,
  pendingValues: {} as Record<string, number>,
  getRulesForDriver: vi.fn(() => []),
  onCreateSnapshot: vi.fn(),
  onShowAddForm: vi.fn(),
  onToggleTemplates: vi.fn(),
  showTemplates: false,
};

describe('DriverSummaryPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders cascade summary title', () => {
    render(<DriverSummaryPanel {...defaultProps} />);
    expect(screen.getByText(/Cascade Summary/i)).toBeInTheDocument();
  });

  it('renders empty state when no rules', () => {
    render(<DriverSummaryPanel {...defaultProps} />);
    expect(screen.getByText(/No cascade rules defined yet/i)).toBeInTheDocument();
  });

  it('renders quick actions', () => {
    render(<DriverSummaryPanel {...defaultProps} />);
    expect(screen.getByText(/Add Driver/i)).toBeInTheDocument();
    expect(screen.getByText(/Load Template/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Snapshot/i)).toBeInTheDocument();
  });
});
