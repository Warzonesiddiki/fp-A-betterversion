import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Area: () => <div data-testid="area" />,
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
}));

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

import { ScenarioTimeline } from '@/components/ui/ScenarioTimeline';

const defaultProps = {
  periods: ['Q1', 'Q2', 'Q3', 'Q4'],
  baseValues: [100, 110, 120, 130],
  scenarios: [{ id: 's1', name: 'Optimistic', color: '#10b981', values: [100, 130, 160, 200] }],
};

describe('ScenarioTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<ScenarioTimeline {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('displays metric label in title', () => {
    render(<ScenarioTimeline {...defaultProps} metricLabel="Revenue" />);
    expect(screen.getByText('Revenue — Timeline')).toBeInTheDocument();
  });

  it('displays default metric label', () => {
    render(<ScenarioTimeline {...defaultProps} />);
    expect(screen.getByText('Value — Timeline')).toBeInTheDocument();
  });

  it('renders chart container', () => {
    render(<ScenarioTimeline {...defaultProps} />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('renders line chart without confidence bands', () => {
    render(<ScenarioTimeline {...defaultProps} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders area chart with confidence bands', () => {
    render(
      <ScenarioTimeline
        {...defaultProps}
        confidenceBands={{ low: [90, 100, 110, 120], high: [110, 120, 130, 140] }}
      />
    );
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });
});
