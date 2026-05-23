import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CalendarHeatmap } from './CalendarHeatmap';

const sampleData = [
  { date: '2026-01-01', value: 5 },
  { date: '2026-01-02', value: 10 },
  { date: '2026-01-05', value: 15 },
  { date: '2026-01-10', value: 20 },
  { date: '2026-01-15', value: 8 },
];

describe('CalendarHeatmap', () => {
  // --- RENDERING ---

  it('should render without crashing with valid data', () => {
    const { container } = render(
      <CalendarHeatmap data={sampleData} startDate="2026-01-01" endDate="2026-01-31" />
    );
    expect(container.querySelector('.overflow-x-auto')).toBeInTheDocument();
  });

  it('should render day labels (Mon, Wed, Fri)', () => {
    render(<CalendarHeatmap data={sampleData} startDate="2026-01-01" endDate="2026-01-31" />);
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
  });

  it('should render Less/More legend', () => {
    render(<CalendarHeatmap data={sampleData} startDate="2026-01-01" endDate="2026-01-31" />);
    expect(screen.getByText('Less')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<CalendarHeatmap data={sampleData} className="custom-cal" />);
    expect((container.firstChild as HTMLElement).className).toContain('custom-cal');
  });

  // --- EMPTY DATA ---

  it('should show "No data" when data is empty array', () => {
    render(<CalendarHeatmap data={[]} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('should show "No data" when data is null/undefined', () => {
    // @ts-expect-error testing null input
    render(<CalendarHeatmap data={null} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  // --- SINGLE DATA POINT ---

  it('should render with a single data point', () => {
    const single = [{ date: '2026-03-15', value: 42 }];
    render(<CalendarHeatmap data={single} startDate="2026-03-01" endDate="2026-03-31" />);
    // Should render without crashing and show legend
    expect(screen.getByText('Less')).toBeInTheDocument();
  });

  // --- LARGE DATASETS ---

  it('should handle 1000+ data points without crashing', () => {
    const largeData = Array.from({ length: 1000 }, (_, i) => {
      const date = new Date(2026, 0, 1);
      date.setDate(date.getDate() + (i % 365));
      return { date: date.toISOString().split('T')[0], value: Math.random() * 100 };
    });
    const { container } = render(
      <CalendarHeatmap data={largeData} startDate="2026-01-01" endDate="2026-12-31" />
    );
    expect(container).toBeInTheDocument();
  });

  // --- NEGATIVE VALUES ---

  it('should handle negative values', () => {
    const negative = [
      { date: '2026-01-01', value: -10 },
      { date: '2026-01-02', value: -5 },
      { date: '2026-01-03', value: 5 },
    ];
    render(<CalendarHeatmap data={negative} startDate="2026-01-01" endDate="2026-01-07" />);
    expect(screen.getByText('Less')).toBeInTheDocument();
  });

  // --- NaN / Infinity ---

  it('should handle NaN values without crashing', () => {
    const nanData = [
      { date: '2026-01-01', value: NaN },
      { date: '2026-01-02', value: 10 },
    ];
    const { container } = render(
      <CalendarHeatmap data={nanData} startDate="2026-01-01" endDate="2026-01-07" />
    );
    expect(container).toBeInTheDocument();
  });

  it('should handle Infinity values without crashing', () => {
    const infData = [
      { date: '2026-01-01', value: Infinity },
      { date: '2026-01-02', value: -Infinity },
    ];
    const { container } = render(
      <CalendarHeatmap data={infData} startDate="2026-01-01" endDate="2026-01-07" />
    );
    expect(container).toBeInTheDocument();
  });

  // --- ZERO RANGE (all same values) ---

  it('should handle zero range (all values identical)', () => {
    const flat = [
      { date: '2026-01-01', value: 5 },
      { date: '2026-01-02', value: 5 },
      { date: '2026-01-03', value: 5 },
    ];
    render(<CalendarHeatmap data={flat} startDate="2026-01-01" endDate="2026-01-07" />);
    expect(screen.getByText('Less')).toBeInTheDocument();
  });

  // --- CUSTOM COLOR SCALE ---

  it('should render with custom color scale', () => {
    const customColors = ['#fff', '#000'];
    const { container } = render(<CalendarHeatmap data={sampleData} colorScale={customColors} />);
    // Legend should show the custom colors
    const legendDots = container.querySelectorAll('.w-3.h-3.rounded-sm');
    expect(legendDots.length).toBe(2);
  });

  // --- CUSTOM FORMAT ---

  it('should use custom format function in tooltips', () => {
    const customFormat = (v: number) => `$${v}`;
    const { container } = render(
      <CalendarHeatmap
        data={[{ date: '2026-01-01', value: 42 }]}
        startDate="2026-01-01"
        endDate="2026-01-07"
        format={customFormat}
      />
    );
    // Title attribute contains formatted value
    const cells = container.querySelectorAll('[title]');
    const found = Array.from(cells).some((el) => el.getAttribute('title')?.includes('$42'));
    expect(found).toBe(true);
  });

  // --- TOOLTIP TITLES ---

  it('should render title attributes with date and value', () => {
    const { container } = render(
      <CalendarHeatmap
        data={[{ date: '2026-01-01', value: 42 }]}
        startDate="2026-01-01"
        endDate="2026-01-07"
      />
    );
    const titles = Array.from(container.querySelectorAll('[title]')).map((el) =>
      el.getAttribute('title')
    );
    expect(titles.some((t) => t?.includes('2026-01-01') && t?.includes('42'))).toBe(true);
  });

  it('should show "No data" in tooltip for dates without data', () => {
    const { container } = render(
      <CalendarHeatmap
        data={[{ date: '2026-01-01', value: 42 }]}
        startDate="2026-01-01"
        endDate="2026-01-07"
      />
    );
    const titles = Array.from(container.querySelectorAll('[title]')).map((el) =>
      el.getAttribute('title')
    );
    expect(titles.some((t) => t?.includes('No data'))).toBe(true);
  });
});
