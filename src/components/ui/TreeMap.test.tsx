import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TreeMap } from './TreeMap';

vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  };
});

const sampleData = [
  { name: 'Revenue', value: 500, color: '#2563eb' },
  { name: 'Expenses', value: 300, color: '#dc2626' },
];

describe('TreeMap', () => {
  it('renders without crashing with data', () => {
    const { container } = render(<TreeMap data={sampleData} />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('shows title when provided', () => {
    render(<TreeMap data={sampleData} title="Portfolio Breakdown" />);
    expect(screen.getByText('Portfolio Breakdown')).toBeInTheDocument();
  });

  it('handles empty data without crashing', () => {
    const { container } = render(<TreeMap data={[]} />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('handles empty data with title', () => {
    render(<TreeMap data={[]} title="Empty Treemap" />);
    expect(screen.getByText('Empty Treemap')).toBeInTheDocument();
  });
});
