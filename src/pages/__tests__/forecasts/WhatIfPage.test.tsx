/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('lucide-react', () => ({
  Sliders: () => <span data-testid="mock-icon" />,
  Plus: () => <span data-testid="mock-icon" />,
  Trash2: () => <span data-testid="mock-icon" />,
  RotateCcw: () => <span data-testid="mock-icon" />,
  Zap: () => <span data-testid="mock-icon" />,
  TrendingUp: () => <span data-testid="mock-icon" />,
  TrendingDown: () => <span data-testid="mock-icon" />,
  Copy: () => <span data-testid="mock-icon" />,
  ArrowRight: () => <span data-testid="mock-icon" />,
  Layers: () => <span data-testid="mock-icon" />,
  BarChart3: () => <span data-testid="mock-icon" />,
}));

vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  Cell: () => <div />,
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

vi.mock('@/components/ui/KPIValue', () => ({
  KPIValue: ({ label }: any) => <div>{label}</div>,
}));

vi.mock('@/engines/WhatIfSandboxEngine', () => {
  class MockWhatIfSandboxEngine {
    createSandbox = vi.fn(() => ({
      id: 'sb1',
      name: 'Scenario 1',
      modifications: [],
      status: 'draft',
    }));
    listSandboxes = vi.fn(() => []);
    getSandbox = vi.fn(() => null);
    cloneSandbox = vi.fn(() => ({ id: 'sb2', name: 'Clone', modifications: [], status: 'draft' }));
    deleteSandbox = vi.fn();
    applyModification = vi.fn();
    getModifications = vi.fn(() => []);
    compare = vi.fn(() => ({
      differences: [],
      summary: { totalDifferences: 0, averageDelta: 0, averagePercentChange: 0 },
    }));
  }
  return {
    WhatIfSandboxEngine: MockWhatIfSandboxEngine,
  };
});

vi.mock('@/engines/BreakEvenEngine', () => ({
  BreakEvenEngine: vi.fn(),
}));

vi.mock('@/engines/SolverEngine', () => ({
  SolverEngine: vi.fn(),
}));

import { render, screen } from '@/test/testUtils';
import WhatIfPage from '@/pages/forecasts/WhatIfPage';

describe('WhatIfPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title', () => {
    render(<WhatIfPage />);
    expect(screen.getByText(/What-If Sandbox/i)).toBeInTheDocument();
  });

  it('renders empty state with no scenarios', () => {
    render(<WhatIfPage />);
    expect(screen.getByText(/No scenarios yet/i)).toBeInTheDocument();
  });

  it('renders assumption sliders placeholder', () => {
    render(<WhatIfPage />);
    expect(screen.getByText(/Select a scenario to modify assumptions/i)).toBeInTheDocument();
  });
});
