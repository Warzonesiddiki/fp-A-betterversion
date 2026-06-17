import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UnderwritingDashboard } from './UnderwritingDashboard';

describe('UnderwritingDashboard', () => {
  it('renders without crashing', () => {
    const { container } = render(<UnderwritingDashboard />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders the Combined Ratio label', () => {
    render(<UnderwritingDashboard />);
    expect(screen.getAllByText('Combined Ratio').length).toBeGreaterThan(0);
  });

  it('renders the gauge section with fallback for incomplete props', () => {
    render(<UnderwritingDashboard />);
    // GaugeChart with only value={92} renders the gauge with 92% value
    const gauges = screen.getAllByTestId('gauge-chart');
    expect(gauges.length).toBeGreaterThan(0);
  });

  it('renders the Premium Trend section', () => {
    render(<UnderwritingDashboard />);
    expect(screen.getByText('Premium Trend')).toBeInTheDocument();
  });

  it('renders the placeholder chart area', () => {
    render(<UnderwritingDashboard />);
    expect(screen.getByText('Premium Bar Chart')).toBeInTheDocument();
  });

  it('has a grid layout', () => {
    const { container } = render(<UnderwritingDashboard />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeTruthy();
  });
});
