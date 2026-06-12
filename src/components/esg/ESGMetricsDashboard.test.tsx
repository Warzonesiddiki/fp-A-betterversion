import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ESGMetricsDashboard } from './ESGMetricsDashboard';
import { useESGStore } from '@/store/esgStore';

describe('ESGMetricsDashboard', () => {
  beforeEach(() => {
    useESGStore.setState({
      metrics: [],
      initiatives: [],
      isLoading: false,
      error: null,
    });
  });

  it('renders without crashing', () => {
    const { container } = render(<ESGMetricsDashboard />);
    expect(container).toBeDefined();
  });

  it('renders empty state when no metrics', () => {
    render(<ESGMetricsDashboard />);
    expect(screen.getByText('No ESG Metrics')).toBeInTheDocument();
    expect(
      screen.getByText('Add ESG metrics to the store to view the dashboard.')
    ).toBeInTheDocument();
  });

  it('renders metrics when store has data', () => {
    useESGStore.getState().setMetrics([
      {
        id: 'e1',
        name: 'Carbon',
        category: 'environmental',
        value: 80,
        unit: '%',
        target: 100,
        trend: 'up',
      },
      {
        id: 's1',
        name: 'Diversity',
        category: 'social',
        value: 70,
        unit: '%',
        target: 100,
        trend: 'up',
      },
      {
        id: 'g1',
        name: 'Board Independence',
        category: 'governance',
        value: 90,
        unit: '%',
        target: 100,
        trend: 'up',
      },
    ]);
    render(<ESGMetricsDashboard />);
    expect(screen.getByText('Overall ESG Score')).toBeInTheDocument();
    expect(screen.getByText('Environmental')).toBeInTheDocument();
    expect(screen.getByText('Social')).toBeInTheDocument();
    expect(screen.getByText('Governance')).toBeInTheDocument();
  });
});
