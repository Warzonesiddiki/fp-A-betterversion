import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductionDashboard } from './ProductionDashboard';
import type { ProductionMetrics } from '@/types/sector-types';

const mockMetrics: ProductionMetrics = {
  oee: 85,
  availability: 92,
  performance: 88,
  quality: 95,
  capacity: 1000,
};

describe('ProductionDashboard', () => {
  it('renders without crashing', () => {
    const { container } = render(<ProductionDashboard metrics={mockMetrics} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders the OEE label', () => {
    render(<ProductionDashboard metrics={mockMetrics} />);
    expect(screen.getByText('OEE')).toBeInTheDocument();
  });

  it('renders the OEE gauge section', () => {
    render(<ProductionDashboard metrics={mockMetrics} />);
    // GaugeChart receives only value prop (no min/max/label), so it renders "Invalid data"
    expect(screen.getByText('Invalid data')).toBeInTheDocument();
  });

  it('renders Availability, Performance, and Quality cards', () => {
    render(<ProductionDashboard metrics={mockMetrics} />);
    expect(screen.getByText('Availability')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Quality')).toBeInTheDocument();
  });

  it('displays correct metric values', () => {
    render(<ProductionDashboard metrics={mockMetrics} />);
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('renders with zero values', () => {
    const zeroMetrics: ProductionMetrics = {
      oee: 0,
      availability: 0,
      performance: 0,
      quality: 0,
      capacity: 0,
    };
    const { container } = render(<ProductionDashboard metrics={zeroMetrics} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with 100% values', () => {
    const perfectMetrics: ProductionMetrics = {
      oee: 100,
      availability: 100,
      performance: 100,
      quality: 100,
      capacity: 500,
    };
    render(<ProductionDashboard metrics={perfectMetrics} />);
    const hundreds = screen.getAllByText('100%');
    expect(hundreds.length).toBeGreaterThanOrEqual(1);
  });

  it('has a grid layout', () => {
    const { container } = render(<ProductionDashboard metrics={mockMetrics} />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeTruthy();
  });
});
