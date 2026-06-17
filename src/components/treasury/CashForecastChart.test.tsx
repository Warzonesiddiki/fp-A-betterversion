/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CashForecastChart } from './CashForecastChart';

vi.mock('@/components/ui/WaterfallChart', () => ({
  WaterfallChart: ({
    data,
  }: {
    data: Array<{ label: string; value: number; isTotal?: boolean }>;
  }) => (
    <div data-testid="waterfall-chart">
      {data.map((item, i) => (
        <div key={i} data-testid={`waterfall-item-${i}`}>
          {item.label}: {item.value}
          {item.isTotal ? ' (total)' : ''}
        </div>
      ))}
    </div>
  ),
}));

describe('CashForecastChart', () => {
  it('renders without crashing', () => {
    render(<CashForecastChart />);
  });

  it('renders the waterfall chart', () => {
    render(<CashForecastChart />);
    expect(screen.getByTestId('waterfall-chart')).toBeInTheDocument();
  });

  it('renders the correct number of data items', () => {
    render(<CashForecastChart />);
    expect(screen.getByTestId('waterfall-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('waterfall-item-5')).toBeInTheDocument();
  });

  it('renders Start data point', () => {
    render(<CashForecastChart />);
    expect(screen.getByText(/Start.*500000/)).toBeInTheDocument();
  });

  it('renders Collections data point', () => {
    render(<CashForecastChart />);
    expect(screen.getByText(/Collections.*250000/)).toBeInTheDocument();
  });

  it('renders Payroll data point with negative value', () => {
    render(<CashForecastChart />);
    expect(screen.getByText(/Payroll.*-120000/)).toBeInTheDocument();
  });

  it('renders Vendors data point with negative value', () => {
    render(<CashForecastChart />);
    expect(screen.getByText(/Vendors.*-80000/)).toBeInTheDocument();
  });

  it('renders Debt Svc data point with negative value', () => {
    render(<CashForecastChart />);
    expect(screen.getByText(/Debt Svc.*-30000/)).toBeInTheDocument();
  });

  it('renders End data point as total', () => {
    render(<CashForecastChart />);
    expect(screen.getByText(/End.*520000.*total/)).toBeInTheDocument();
  });

  it('has correct container height class', () => {
    const { container } = render(<CashForecastChart />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('h-80');
  });
});
