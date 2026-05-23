import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JobCostDashboard } from './JobCostDashboard';

describe('JobCostDashboard', () => {
  it('renders without crashing', () => {
    const { container } = render(<JobCostDashboard />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders all four KPI cards', () => {
    render(<JobCostDashboard />);
    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.getByText('Actual')).toBeInTheDocument();
    expect(screen.getByText('SPI')).toBeInTheDocument();
    expect(screen.getByText('CPI')).toBeInTheDocument();
  });

  it('renders placeholder dashes for each KPI', () => {
    render(<JobCostDashboard />);
    const dashes = screen.getAllByText('---');
    expect(dashes).toHaveLength(4);
  });

  it('renders the FinancialTable', () => {
    const { container } = render(<JobCostDashboard />);
    const table = container.querySelector('table');
    expect(table).toBeTruthy();
  });

  it('renders KPI labels in uppercase', () => {
    render(<JobCostDashboard />);
    const budgetLabel = screen.getByText('Budget');
    expect(budgetLabel.className).toContain('uppercase');
  });

  it('has a grid layout for KPI cards', () => {
    const { container } = render(<JobCostDashboard />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeTruthy();
  });
});
