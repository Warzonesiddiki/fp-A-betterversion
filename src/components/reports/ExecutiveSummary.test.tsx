/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExecutiveSummary } from './ExecutiveSummary';

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/Sparkline', () => ({
  Sparkline: ({ data, color }: { data: number[]; color?: string }) => (
    <div data-testid="sparkline" data-color={color} data-points={data.length} />
  ),
}));

describe('ExecutiveSummary', () => {
  it('renders without crashing', () => {
    render(<ExecutiveSummary />);
  });

  it('renders the Revenue KPI', () => {
    render(<ExecutiveSummary />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$4.2M')).toBeInTheDocument();
    expect(screen.getByText('+12% vs budget')).toBeInTheDocument();
  });

  it('renders the EBITDA KPI', () => {
    render(<ExecutiveSummary />);
    expect(screen.getByText('EBITDA')).toBeInTheDocument();
    expect(screen.getByText('$1.1M')).toBeInTheDocument();
    expect(screen.getByText('+4% vs budget')).toBeInTheDocument();
  });

  it('renders the Cash Flow KPI', () => {
    render(<ExecutiveSummary />);
    expect(screen.getByText('Cash Flow')).toBeInTheDocument();
    expect(screen.getByText('$850k')).toBeInTheDocument();
    expect(screen.getByText('-2% vs budget')).toBeInTheDocument();
  });

  it('renders sparkline charts for each KPI', () => {
    render(<ExecutiveSummary />);
    const sparklines = screen.getAllByTestId('sparkline');
    expect(sparklines).toHaveLength(3);
  });

  it('renders the Management Commentary section', () => {
    render(<ExecutiveSummary />);
    expect(screen.getByText('Management Commentary')).toBeInTheDocument();
    expect(screen.getByText(/Strong revenue performance/)).toBeInTheDocument();
  });

  it('renders commentary with expected content', () => {
    render(<ExecutiveSummary />);
    expect(screen.getByText(/Operating expenses remained within budget/)).toBeInTheDocument();
    expect(screen.getByText(/Cash position strengthened/)).toBeInTheDocument();
  });
});
