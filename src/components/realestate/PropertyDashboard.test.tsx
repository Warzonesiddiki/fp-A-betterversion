import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PropertyDashboard } from './PropertyDashboard';

describe('PropertyDashboard', () => {
  it('renders without crashing', () => {
    const { container } = render(<PropertyDashboard />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders all four KPI cards', () => {
    render(<PropertyDashboard />);
    expect(screen.getByText('NOI')).toBeInTheDocument();
    expect(screen.getByText('Occupancy')).toBeInTheDocument();
    expect(screen.getByText('Cap Rate')).toBeInTheDocument();
    expect(screen.getByText('WALT')).toBeInTheDocument();
  });

  it('renders placeholder dashes for each KPI', () => {
    render(<PropertyDashboard />);
    const dashes = screen.getAllByText('---');
    expect(dashes).toHaveLength(4);
  });

  it('renders the FinancialTable', () => {
    const { container } = render(<PropertyDashboard />);
    const table = container.querySelector('table');
    expect(table).toBeTruthy();
  });

  it('renders KPI labels in uppercase', () => {
    render(<PropertyDashboard />);
    const noiLabel = screen.getByText('NOI');
    expect(noiLabel.className).toContain('uppercase');
  });

  it('has a grid layout for KPI cards', () => {
    const { container } = render(<PropertyDashboard />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeTruthy();
  });
});
