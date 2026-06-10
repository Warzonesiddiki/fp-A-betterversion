import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Heatmap, HeatmapCell } from './Heatmap';

const sampleData: HeatmapCell[] = [
  { row: 'Revenue', col: 'Q1', value: 100 },
  { row: 'Revenue', col: 'Q2', value: 150 },
  { row: 'Expenses', col: 'Q1', value: 80 },
  { row: 'Expenses', col: 'Q2', value: 120 },
];

describe('Heatmap', () => {
  // --- RENDERING ---

  it('should render without crashing with valid data', () => {
    const { container } = render(<Heatmap data={sampleData} />);
    expect(container.querySelector('.w-full')).toBeInTheDocument();
  });

  it('should render row labels', () => {
    render(<Heatmap data={sampleData} />);
    // Row labels appear in both the sr-only table and the visual grid
    const revenueEls = screen.getAllByText('Revenue');
    expect(revenueEls.length).toBeGreaterThanOrEqual(1);
    const expenseEls = screen.getAllByText('Expenses');
    expect(expenseEls.length).toBeGreaterThanOrEqual(1);
  });

  it('should render column headers', () => {
    render(<Heatmap data={sampleData} />);
    // Column headers appear in both the sr-only table and the visual grid
    const q1Els = screen.getAllByText('Q1');
    expect(q1Els.length).toBeGreaterThanOrEqual(1);
    const q2Els = screen.getAllByText('Q2');
    expect(q2Els.length).toBeGreaterThanOrEqual(1);
  });

  it('should render title when provided', () => {
    render(<Heatmap data={sampleData} title="Financial Overview" />);
    // Title appears in both the visual h3 and the sr-only table caption
    expect(screen.getByRole('heading', { name: /Financial Overview/ })).toBeInTheDocument();
  });

  it('should not render title when not provided', () => {
    const { container } = render(<Heatmap data={sampleData} />);
    const headings = container.querySelectorAll('h3');
    expect(headings).toHaveLength(0);
  });

  it('should render intensity scale with min and max values', () => {
    render(<Heatmap data={sampleData} />);
    // "80" and "150" may appear in cell tooltips too, so use getAllByText
    const all80 = screen.getAllByText('80');
    expect(all80.length).toBeGreaterThanOrEqual(1);
    const all150 = screen.getAllByText('150');
    expect(all150.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Intensity Scale')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<Heatmap data={sampleData} className="custom-heatmap" />);
    expect((container.firstChild as HTMLElement).className).toContain('custom-heatmap');
  });

  it('should apply custom width and height', () => {
    const { container } = render(<Heatmap data={sampleData} width={500} height={300} />);
    const scrollArea = container.querySelector('[style*="width"]');
    expect(scrollArea).toBeInTheDocument();
  });

  // --- EMPTY DATA ---

  it('should show "No data" when data is empty array', () => {
    render(<Heatmap data={[]} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('should show "No data" when data is null/undefined', () => {
    // @ts-expect-error testing null input
    render(<Heatmap data={null} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  // --- SINGLE CELL ---

  it('should render a single cell without crashing', () => {
    const single: HeatmapCell[] = [{ row: 'A', col: 'B', value: 42 }];
    render(<Heatmap data={single} />);
    // Row/col labels appear in both sr-only table and visual grid
    expect(screen.getAllByText('A').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('B').length).toBeGreaterThanOrEqual(1);
  });

  // --- LARGE DATASETS ---

  it('should handle 1000+ data points without crashing', () => {
    const largeData: HeatmapCell[] = Array.from({ length: 1000 }, (_, i) => ({
      row: `Row ${i % 50}`,
      col: `Col ${Math.floor(i / 50)}`,
      value: i,
    }));
    const { container } = render(<Heatmap data={largeData} />);
    expect(container).toBeInTheDocument();
  });

  // --- NEGATIVE VALUES ---

  it('should handle negative values', () => {
    const negative: HeatmapCell[] = [
      { row: 'A', col: 'B', value: -50 },
      { row: 'A', col: 'C', value: 50 },
    ];
    render(<Heatmap data={negative} />);
    expect(screen.getAllByText('A').length).toBeGreaterThanOrEqual(1);
  });

  // --- NaN / Infinity ---

  it('should handle NaN values without crashing', () => {
    const nanData: HeatmapCell[] = [
      { row: 'A', col: 'B', value: NaN },
      { row: 'A', col: 'C', value: 10 },
    ];
    const { container } = render(<Heatmap data={nanData} />);
    expect(container).toBeInTheDocument();
  });

  it('should handle Infinity values without crashing', () => {
    const infData: HeatmapCell[] = [
      { row: 'A', col: 'B', value: Infinity },
      { row: 'A', col: 'C', value: -Infinity },
    ];
    const { container } = render(<Heatmap data={infData} />);
    expect(container).toBeInTheDocument();
  });

  // --- ZERO RANGE ---

  it('should handle zero range (all values identical)', () => {
    const flat: HeatmapCell[] = [
      { row: 'A', col: 'X', value: 10 },
      { row: 'A', col: 'Y', value: 10 },
      { row: 'B', col: 'X', value: 10 },
    ];
    render(<Heatmap data={flat} />);
    expect(screen.getAllByText('A').length).toBeGreaterThanOrEqual(1);
  });

  // --- COLOR SCHEMES ---

  it('should render with green color scheme', () => {
    const { container } = render(<Heatmap data={sampleData} colorScheme="green" />);
    expect(container.querySelector('[style*="background-color"]')).toBeInTheDocument();
  });

  it('should render with red color scheme', () => {
    const { container } = render(<Heatmap data={sampleData} colorScheme="red" />);
    expect(container.querySelector('[style*="background-color"]')).toBeInTheDocument();
  });

  it('should render with blue color scheme (default)', () => {
    const { container } = render(<Heatmap data={sampleData} colorScheme="blue" />);
    expect(container.querySelector('[style*="background-color"]')).toBeInTheDocument();
  });

  // --- ACCESSIBILITY ---

  it('should have aria-label on cells when onClick is provided', () => {
    const onClick = vi.fn();
    const { container } = render(<Heatmap data={sampleData} onClick={onClick} />);
    // Buttons are inside aria-hidden container, query via DOM
    const buttons = container.querySelectorAll('[role="button"]');
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons[0]!).toHaveAttribute('aria-label');
  });

  it('should not have role="button" when onClick is not provided', () => {
    render(<Heatmap data={sampleData} />);
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  it('should include row, col, and value in aria-label', () => {
    const onClick = vi.fn();
    const { container } = render(
      <Heatmap data={[{ row: 'Revenue', col: 'Q1', value: 100 }]} onClick={onClick} />
    );
    // Button is inside aria-hidden container, query via DOM
    const button = container.querySelector('[role="button"]');
    expect(button).not.toBeNull();
    expect(button!.getAttribute('aria-label')).toContain('Revenue');
    expect(button!.getAttribute('aria-label')).toContain('Q1');
    expect(button!.getAttribute('aria-label')).toContain('100');
  });

  // --- CLICK HANDLER ---

  it('should call onClick with cell data when a cell is clicked', () => {
    const onClick = vi.fn();
    const { container } = render(<Heatmap data={sampleData} onClick={onClick} />);
    // Buttons are inside aria-hidden container, query via DOM
    const buttons = container.querySelectorAll('[role="button"]');
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]!);
    expect(onClick).toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledWith(
      expect.objectContaining({
        row: expect.any(String),
        col: expect.any(String),
        value: expect.any(Number),
      })
    );
  });

  it('should not throw when onClick is not provided', () => {
    render(<Heatmap data={sampleData} />);
    const cells = document.querySelectorAll('.aspect-square');
    expect(() => fireEvent.click(cells[0]!)).not.toThrow();
  });
});
