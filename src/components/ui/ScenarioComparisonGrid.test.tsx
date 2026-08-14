import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('lucide-react', () => {
  const makeIcon = () => {
    const Icon = ({ className }: { className?: string }) => (
      <span data-testid="mock-icon" className={className} />
    );
    Icon.displayName = 'MockIcon';
    return Icon;
  };
  return {
    TrendingUp: makeIcon(),
    TrendingDown: makeIcon(),
  };
});

vi.mock('./Card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h3 className={className}>{children}</h3>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('./ExportMenu', () => ({
  ExportMenu: () => <div data-testid="export-menu">Export</div>,
}));

import { ScenarioComparisonGrid } from '@/components/ui/ScenarioComparisonGrid';

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

const scenarios = [
  {
    id: 's1',
    name: 'Optimistic',
    color: '#10b981',
    metrics: {
      revenue: 1200000,
      ebitda: 300000,
      netIncome: 220000,
      cashFlow: 250000,
      headcount: 60,
      burnRate: 70000,
      runway: 30,
      grossMargin: 65,
      ebitdaMargin: 25,
    },
  },
];

describe('ScenarioComparisonGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(
      <ScenarioComparisonGrid baseMetrics={baseMetrics} scenarios={scenarios} />
    );
    expect(
      container.querySelectorAll('*').length,
      'rendered nothing: a truthy container does not prove the component mounted'
    ).toBeGreaterThanOrEqual(1);
  });

  it('displays title', () => {
    render(<ScenarioComparisonGrid baseMetrics={baseMetrics} scenarios={scenarios} />);
    expect(screen.getByText('Scenario Comparison Grid')).toBeInTheDocument();
  });

  it('displays metric labels', () => {
    render(<ScenarioComparisonGrid baseMetrics={baseMetrics} scenarios={scenarios} />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('EBITDA')).toBeInTheDocument();
    expect(screen.getByText('Net Income')).toBeInTheDocument();
  });

  it('displays scenario name', () => {
    render(<ScenarioComparisonGrid baseMetrics={baseMetrics} scenarios={scenarios} />);
    expect(screen.getAllByText('Optimistic').length).toBeGreaterThanOrEqual(1);
  });

  it('displays Base header', () => {
    render(<ScenarioComparisonGrid baseMetrics={baseMetrics} scenarios={scenarios} />);
    expect(screen.getByText('Base')).toBeInTheDocument();
  });
});
