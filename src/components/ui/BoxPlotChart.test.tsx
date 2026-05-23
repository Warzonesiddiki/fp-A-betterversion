/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoxPlotChart } from './BoxPlotChart';
import type { BoxPlotData } from './BoxPlotChart';

const makeData = (overrides: Partial<BoxPlotData> = {}): BoxPlotData => ({
  label: 'Revenue',
  min: 10,
  q1: 30,
  median: 50,
  q3: 70,
  max: 90,
  ...overrides,
});

const sampleData: BoxPlotData[] = [
  makeData({ label: 'Revenue' }),
  makeData({ label: 'Expenses', min: 20, q1: 40, median: 55, q3: 65, max: 80 }),
];

describe('BoxPlotChart', () => {
  // Rendering
  it('renders without crashing', () => {
    render(<BoxPlotChart data={sampleData} />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('renders all data labels', () => {
    render(<BoxPlotChart data={sampleData} />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
  });

  it('renders min and max format values', () => {
    render(<BoxPlotChart data={sampleData} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();
  });

  // Loading state
  it('renders loading spinner when loading is true', () => {
    const { container } = render(<BoxPlotChart data={[]} loading={true} />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  // Error state
  it('renders error message when error is provided', () => {
    render(<BoxPlotChart data={[]} error="Failed to load" />);
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  // Empty data
  it('renders no data message when data is empty', () => {
    render(<BoxPlotChart data={[]} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  // Outliers
  it('renders outlier points when provided', () => {
    const dataWithOutliers = [makeData({ outliers: [5, 95] })];
    const { container } = render(<BoxPlotChart data={dataWithOutliers} />);
    // Outlier dots are rendered as absolute divs
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots.length).toBeGreaterThanOrEqual(2);
  });

  // Click handler
  it('calls onClick when a box plot item is clicked', () => {
    const onClick = vi.fn();
    render(<BoxPlotChart data={sampleData} onClick={onClick} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onClick).toHaveBeenCalledWith(sampleData[0]);
  });

  // Custom format
  it('uses custom format function', () => {
    const format = (v: number) => `$${v}K`;
    render(<BoxPlotChart data={sampleData} format={format} />);
    expect(screen.getByText('$10K')).toBeInTheDocument();
    expect(screen.getByText('$90K')).toBeInTheDocument();
  });

  // Keyboard accessibility
  it('supports keyboard interaction when onClick is provided', () => {
    const onClick = vi.fn();
    render(<BoxPlotChart data={sampleData} onClick={onClick} />);
    const button = screen.getAllByRole('button')[0];
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(onClick).toHaveBeenCalled();
  });

  it('supports space key interaction when onClick is provided', () => {
    const onClick = vi.fn();
    render(<BoxPlotChart data={sampleData} onClick={onClick} />);
    const button = screen.getAllByRole('button')[0];
    fireEvent.keyDown(button, { key: ' ' });
    expect(onClick).toHaveBeenCalled();
  });
});
