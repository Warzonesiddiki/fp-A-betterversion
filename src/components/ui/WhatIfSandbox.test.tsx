import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('@/engines/ScenarioEngine', () => ({
  ScenarioEngine: {
    applyDrivers: vi.fn((baseMetrics: Record<string, number>) => ({ ...baseMetrics })),
    probabilityWeighted: vi.fn(() => ({})),
  },
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
    Plus: makeIcon(),
    X: makeIcon(),
    GitMerge: makeIcon(),
    Lock: makeIcon(),
    Unlock: makeIcon(),
    TrendingUp: makeIcon(),
    TrendingDown: makeIcon(),
    Minus: makeIcon(),
  };
});

vi.mock('./Button', () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('./Card', () => ({
  Card: ({
    children,
    className,
    style,
  }: {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }) => (
    <div className={className} style={style}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardTitle: ({
    children,
    className,
    style,
  }: {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }) => (
    <h3 className={className} style={style}>
      {children}
    </h3>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

import { WhatIfSandbox } from '@/components/ui/WhatIfSandbox';

const baseMetrics = {
  revenue: 1000000,
  ebitda: 200000,
  netIncome: 150000,
  cashFlow: 180000,
  headcount: 50,
  burnRate: 80000,
  runway: 24,
  grossMargin: 60,
  ebitdaMargin: 20,
};

describe('WhatIfSandbox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<WhatIfSandbox baseMetrics={baseMetrics} />);
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });

  it('displays title', () => {
    render(<WhatIfSandbox baseMetrics={baseMetrics} />);
    expect(screen.getByText('What-If Sandbox')).toBeInTheDocument();
  });

  it('displays Base Case panel', () => {
    render(<WhatIfSandbox baseMetrics={baseMetrics} />);
    expect(screen.getByText('Base Case')).toBeInTheDocument();
  });

  it('displays default scenario names', () => {
    render(<WhatIfSandbox baseMetrics={baseMetrics} />);
    expect(screen.getByDisplayValue('Optimistic')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Pessimistic')).toBeInTheDocument();
  });

  it('displays Add Scenario button', () => {
    render(<WhatIfSandbox baseMetrics={baseMetrics} />);
    expect(screen.getByText('Add Scenario')).toBeInTheDocument();
  });

  it('displays metric labels', () => {
    render(<WhatIfSandbox baseMetrics={baseMetrics} />);
    const revenueLabels = screen.getAllByText('Revenue');
    expect(revenueLabels.length).toBeGreaterThanOrEqual(1);
  });
});
