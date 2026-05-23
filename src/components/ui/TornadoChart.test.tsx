import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TornadoChart } from './TornadoChart';

vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  };
});

const sampleData = [
  { label: 'Interest Rate', lowValue: 800, highValue: 1200, baseValue: 1000 },
  { label: 'Exchange Rate', lowValue: 900, highValue: 1100, baseValue: 1000 },
];

describe('TornadoChart', () => {
  it('renders without crashing with data', () => {
    const { container } = render(<TornadoChart data={sampleData} />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('shows title when provided', () => {
    render(<TornadoChart data={sampleData} title="Sensitivity Analysis" />);
    expect(screen.getByText('Sensitivity Analysis')).toBeInTheDocument();
  });

  it('renders legend labels', () => {
    render(<TornadoChart data={sampleData} />);
    expect(screen.getByText('Sensitivity Range')).toBeInTheDocument();
    expect(screen.getByText(/Base Case/)).toBeInTheDocument();
  });

  it('handles empty data without crashing', () => {
    const { container } = render(<TornadoChart data={[]} />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('handles empty data with title', () => {
    render(<TornadoChart data={[]} title="Empty Test" />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });
});
