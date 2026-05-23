import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScatterPlot } from './ScatterPlot';

vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  };
});

const sampleData = [
  { x: 10, y: 20, label: 'Point A' },
  { x: 30, y: 40, label: 'Point B' },
];

describe('ScatterPlot', () => {
  it('renders with data', () => {
    const { container } = render(<ScatterPlot data={sampleData} />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('shows No data message when empty', () => {
    render(<ScatterPlot data={[]} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('shows No data when data is null', () => {
    render(<ScatterPlot data={null as any} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('shows title when provided', () => {
    render(<ScatterPlot data={sampleData} title="Scatter Analysis" />);
    expect(screen.getByText('Scatter Analysis')).toBeInTheDocument();
  });

  it('renders without crashing with axis labels', () => {
    const { container } = render(<ScatterPlot data={sampleData} xLabel="Revenue" yLabel="Cost" />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    const { container } = render(<ScatterPlot data={sampleData} loading={true} />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error message when error provided', () => {
    render(<ScatterPlot data={sampleData} error="Failed to load" />);
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });
});
