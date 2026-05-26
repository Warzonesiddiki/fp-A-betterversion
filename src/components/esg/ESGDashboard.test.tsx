import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ESGDashboard } from './ESGDashboard';

describe('ESGDashboard', () => {
  it('renders without crashing', () => {
    const { container } = render(<ESGDashboard />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders the Carbon Footprint label', () => {
    render(<ESGDashboard />);
    const labels = screen.getAllByText('Carbon Footprint');
    expect(labels.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the gauge section', () => {
    const { container } = render(<ESGDashboard />);
    const gauges = container.querySelectorAll('[class*="rounded-xl"]');
    expect(gauges.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the Emissions Breakdown section', () => {
    render(<ESGDashboard />);
    expect(screen.getByText('Emissions Breakdown')).toBeInTheDocument();
  });

  it('renders all three emission scopes', () => {
    render(<ESGDashboard />);
    expect(screen.getByText('Scope 1')).toBeInTheDocument();
    expect(screen.getByText('Scope 2')).toBeInTheDocument();
    expect(screen.getByText('Scope 3')).toBeInTheDocument();
  });

  it('renders the Diversity Score', () => {
    render(<ESGDashboard />);
    expect(screen.getByText('Diversity Score')).toBeInTheDocument();
    expect(screen.getByText('82')).toBeInTheDocument();
  });

  it('renders emission progress bars', () => {
    const { container } = render(<ESGDashboard />);
    const bars = container.querySelectorAll('.bg-blue-500');
    expect(bars).toHaveLength(3);
  });

  it('has a grid layout', () => {
    const { container } = render(<ESGDashboard />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeTruthy();
  });
});
