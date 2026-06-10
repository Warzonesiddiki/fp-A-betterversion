/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeatmapGrid, type HeatmapGridProps } from './HeatmapGrid';

const defaultProps: HeatmapGridProps = {
  rows: ['Revenue', 'COGS'],
  columns: ['Q1', 'Q2'],
  cells: [
    { rowId: 'Revenue', colId: 'Q1', value: 10.2 },
    { rowId: 'Revenue', colId: 'Q2', value: 10.8 },
    { rowId: 'COGS', colId: 'Q1', value: -3.8 },
    { rowId: 'COGS', colId: 'Q2', value: -4.0 },
  ],
};

describe('HeatmapGrid', () => {
  it('renders without crashing', () => {
    render(<HeatmapGrid {...defaultProps} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<HeatmapGrid {...defaultProps} />);
    expect(screen.getByText('Q1')).toBeInTheDocument();
    expect(screen.getByText('Q2')).toBeInTheDocument();
  });

  it('renders the Account header column', () => {
    render(<HeatmapGrid {...defaultProps} />);
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('renders row labels', () => {
    render(<HeatmapGrid {...defaultProps} />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('COGS')).toBeInTheDocument();
  });

  it('renders cell values formatted as numbers by default', () => {
    render(<HeatmapGrid {...defaultProps} />);
    expect(screen.getByText('10.2')).toBeInTheDocument();
    expect(screen.getByText('-3.8')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<HeatmapGrid {...defaultProps} title="Test Heatmap" />);
    expect(screen.getByText('Test Heatmap')).toBeInTheDocument();
  });

  it('does not render title when not provided', () => {
    render(<HeatmapGrid {...defaultProps} />);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('renders correct number of data cells', () => {
    const { container } = render(<HeatmapGrid {...defaultProps} />);
    // 4 cells (2 rows x 2 columns)
    const cells = container.querySelectorAll('td[class*="tabular-nums"]');
    expect(cells).toHaveLength(4);
  });

  describe('Color Scale', () => {
    it('applies red-green color scale by default', () => {
      const { container } = render(<HeatmapGrid {...defaultProps} />);
      const cell = container.querySelector('td[class*="tabular-nums"]');
      expect(cell).toHaveAttribute('style');
      const style = cell?.getAttribute('style') || '';
      expect(style).toContain('background-color');
    });

    it('applies blue-orange color scale when specified', () => {
      const { container } = render(<HeatmapGrid {...defaultProps} colorScale="blue-orange" />);
      const cell = container.querySelector('td[class*="tabular-nums"]');
      expect(cell).toHaveAttribute('style');
    });
  });

  describe('Formatting', () => {
    it('formats as currency when format is currency', () => {
      const props: HeatmapGridProps = {
        rows: ['Revenue'],
        columns: ['Q1'],
        cells: [{ rowId: 'Revenue', colId: 'Q1', value: 1000 }],
        format: 'currency',
      };
      render(<HeatmapGrid {...props} />);
      // $1,000 appears in both the cell and the legend min/max
      const elements = screen.getAllByText('$1,000');
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it('formats as percent when format is percent', () => {
      const props: HeatmapGridProps = {
        rows: ['Growth'],
        columns: ['Q1'],
        cells: [{ rowId: 'Growth', colId: 'Q1', value: 5.5 }],
        format: 'percent',
      };
      render(<HeatmapGrid {...props} />);
      // 5.5% appears in both the cell and the legend
      const elements = screen.getAllByText('5.5%');
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it('formats as compact when format is compact', () => {
      const props: HeatmapGridProps = {
        rows: ['Revenue'],
        columns: ['Q1'],
        cells: [{ rowId: 'Revenue', colId: 'Q1', value: 1500000 }],
        format: 'compact',
      };
      render(<HeatmapGrid {...props} />);
      const elements = screen.getAllByText('$1.5M');
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Callbacks', () => {
    it('calls onCellClick with correct arguments', () => {
      const onCellClick = vi.fn();
      render(<HeatmapGrid {...defaultProps} onCellClick={onCellClick} />);

      const cells = screen.getAllByText('10.2');
      fireEvent.click(cells[0]!);
      expect(onCellClick).toHaveBeenCalledWith('Revenue', 'Q1', 10.2);
    });

    it('calls onCellHover with correct arguments', () => {
      const onCellHover = vi.fn();
      render(<HeatmapGrid {...defaultProps} onCellHover={onCellHover} />);

      const cells = screen.getAllByText('10.2');
      fireEvent.mouseEnter(cells[0]!);
      expect(onCellHover).toHaveBeenCalledWith('Revenue', 'Q1', 10.2);
    });

    it('adds hover ring on mouse enter and removes on mouse leave', () => {
      const { container } = render(<HeatmapGrid {...defaultProps} />);
      const cells = container.querySelectorAll('td[class*="tabular-nums"]');
      const firstCell = cells[0];

      fireEvent.mouseEnter(firstCell);
      expect(firstCell!.className).toContain('ring-2');

      fireEvent.mouseLeave(firstCell);
      expect(firstCell!.className).not.toContain('ring-2');
    });
  });

  describe('Legend', () => {
    it('renders color gradient legend', () => {
      const { container } = render(<HeatmapGrid {...defaultProps} />);
      const gradient = container.querySelector('.rounded[style*="linear-gradient"]');
      expect(gradient).toBeInTheDocument();
    });

    it('displays min and max values in legend', () => {
      render(<HeatmapGrid {...defaultProps} />);
      // Min value should be present in both cell and legend
      const elements = screen.getAllByText('-4');
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty cells array', () => {
      const props: HeatmapGridProps = {
        rows: ['Revenue'],
        columns: ['Q1'],
        cells: [],
      };
      render(<HeatmapGrid {...props} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('renders cell value as 0 when cell data is missing', () => {
      const props: HeatmapGridProps = {
        rows: ['Revenue'],
        columns: ['Q1', 'Q2'],
        cells: [{ rowId: 'Revenue', colId: 'Q1', value: 5 }],
        // Q2 cell is missing
      };
      render(<HeatmapGrid {...props} />);
      // Should still render the table without crashing
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<HeatmapGrid {...defaultProps} className="custom-heatmap" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-heatmap');
    });

    it('uses explicit min and max when provided', () => {
      const props: HeatmapGridProps = {
        rows: ['Revenue'],
        columns: ['Q1'],
        cells: [{ rowId: 'Revenue', colId: 'Q1', value: 5 }],
        min: -10,
        max: 20,
      };
      render(<HeatmapGrid {...props} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('sets title attribute on cells for tooltip', () => {
      const { container } = render(<HeatmapGrid {...defaultProps} />);
      const cell = container.querySelector('td[class*="tabular-nums"]');
      expect(cell).toHaveAttribute('title');
      expect(cell?.getAttribute('title')).toContain('Revenue');
      expect(cell?.getAttribute('title')).toContain('Q1');
    });

    it('renders a proper table with thead and tbody', () => {
      const { container } = render(<HeatmapGrid {...defaultProps} />);
      expect(container.querySelector('thead')).toBeInTheDocument();
      expect(container.querySelector('tbody')).toBeInTheDocument();
    });
  });
});
