/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportGrid } from './ReportGrid';
import type { ReportLayout, CellStyle } from '@/engines/ReportBuilderEngine';
import type { ReportRow, ReportCell } from '@/engines/ReportBuilderEngine';

vi.mock('@/components/ui/Button', () => ({
  Button: ({
    children,
    className,
    disabled,
    size: _size,
    variant: _variant,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    className?: string;
    size?: string;
    variant?: string;
  }) => (
    <button className={className} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/engines/ReportBuilderEngine', () => ({
  ReportBuilderEngine: {
    getVisibleColumns: vi.fn().mockImplementation((layout) => layout.columns),
    buildMetricKey: vi.fn().mockReturnValue('test_key'),
    formatNumber: vi.fn().mockImplementation((num) => String(num)),
    evaluateConditionalFormats: vi.fn().mockReturnValue(null),
  },
}));

const createMockLayout = (overrides?: Partial<ReportLayout>): ReportLayout => ({
  rows: overrides?.rows ?? [],
  columns: overrides?.columns ?? [],
  columnWidths: overrides?.columnWidths ?? {},
  defaultRowHeight: overrides?.defaultRowHeight ?? 30,
  frozenColumns: overrides?.frozenColumns ?? 0,
  frozenRows: overrides?.frozenRows ?? 0,
});

describe('ReportGrid', () => {
  it('renders without crashing', () => {
    render(<ReportGrid layout={createMockLayout()} />);
  });

  it('renders the grid table with role', () => {
    render(<ReportGrid layout={createMockLayout()} />);
    expect(screen.getByRole('grid', { name: 'Report grid' })).toBeInTheDocument();
  });

  it('renders empty state when no rows exist', () => {
    render(<ReportGrid layout={createMockLayout()} />);
    expect(screen.getByText(/no data to display/i)).toBeInTheDocument();
  });

  it('renders column headers', () => {
    const layout = createMockLayout({
      columns: [
        {
          id: 'col-1',
          type: 'label',
          header: 'Line Item',
          width: 220,
          isVisible: true,
          isLocked: false,
        },
        {
          id: 'col-2',
          type: 'period',
          header: 'Actual',
          width: 130,
          period: 'actual',
          isVisible: true,
          isLocked: false,
        },
        {
          id: 'col-3',
          type: 'period',
          header: 'Budget',
          width: 130,
          period: 'budget',
          isVisible: true,
          isLocked: false,
        },
      ],
    });
    render(<ReportGrid layout={layout} />);
    expect(screen.getByText('Line Item')).toBeInTheDocument();
    expect(screen.getByText('Actual')).toBeInTheDocument();
    expect(screen.getByText('Budget')).toBeInTheDocument();
  });

  it('renders row data', () => {
    const layout = createMockLayout({
      columns: [
        {
          id: 'col-1',
          type: 'label',
          header: 'Label',
          width: 220,
          isVisible: true,
          isLocked: false,
        },
      ],
      rows: [
        {
          id: 'row-1',
          type: 'data' as const,
          cells: [
            {
              id: 'c1',
              type: 'text' as const,
              content: { type: 'text' as const, content: { text: 'Revenue' } },
              style: {} as CellStyle,
              colspan: 1,
              rowspan: 1,
              isVisible: true,
            },
          ],
          height: 30,
          isVisible: true,
          pageBreakBefore: false,
        },
      ],
    });
    render(<ReportGrid layout={layout} />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('renders total rows with distinct styling', () => {
    const layout = createMockLayout({
      columns: [
        {
          id: 'col-1',
          type: 'label',
          header: 'Label',
          width: 220,
          isVisible: true,
          isLocked: false,
        },
      ],
      rows: [
        {
          id: 'row-total',
          type: 'total' as const,
          cells: [
            {
              id: 'c1',
              type: 'text' as const,
              content: { type: 'text' as const, content: { text: 'Total Revenue' } },
              style: {} as CellStyle,
              colspan: 1,
              rowspan: 1,
              isVisible: true,
            },
          ],
          height: 30,
          isVisible: true,
          pageBreakBefore: false,
        },
      ],
    });
    render(<ReportGrid layout={layout} />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });

  it('renders the footer with row and column counts', () => {
    const layout = createMockLayout({
      columns: [
        {
          id: 'col-1',
          type: 'label',
          header: 'Label',
          width: 220,
          isVisible: true,
          isLocked: false,
        },
      ],
      rows: [
        {
          id: 'row-1',
          type: 'data' as const,
          cells: [
            {
              id: 'c1',
              type: 'text' as const,
              content: { type: 'text' as const, content: { text: 'Test' } },
              style: {} as CellStyle,
              colspan: 1,
              rowspan: 1,
              isVisible: true,
            },
          ],
          height: 30,
          isVisible: true,
          pageBreakBefore: false,
        },
      ],
    });
    render(<ReportGrid layout={layout} />);
    expect(screen.getByText(/1 rows.*1 columns/)).toBeInTheDocument();
    expect(screen.getByText('Generated by FinPlan Pro')).toBeInTheDocument();
  });

  it('renders export buttons when callbacks are provided', () => {
    const onExportPDF = vi.fn();
    const onExportExcel = vi.fn();
    const onExportCSV = vi.fn();
    render(
      <ReportGrid
        layout={createMockLayout()}
        onExportPDF={onExportPDF}
        onExportExcel={onExportExcel}
        onExportCSV={onExportCSV}
      />
    );
    expect(screen.getByRole('button', { name: /export pdf/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export excel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
  });

  it('does not render export buttons when callbacks are not provided', () => {
    render(<ReportGrid layout={createMockLayout()} />);
    expect(screen.queryByRole('button', { name: /export pdf/i })).not.toBeInTheDocument();
  });

  it('calls export callbacks when buttons are clicked', () => {
    const onExportPDF = vi.fn();
    render(<ReportGrid layout={createMockLayout()} onExportPDF={onExportPDF} />);
    fireEvent.click(screen.getByRole('button', { name: /export pdf/i }));
    expect(onExportPDF).toHaveBeenCalledTimes(1);
  });

  it('renders metric cells with dash for missing data', () => {
    const layout = createMockLayout({
      columns: [
        {
          id: 'col-1',
          type: 'label',
          header: 'Label',
          width: 220,
          isVisible: true,
          isLocked: false,
        },
        {
          id: 'col-2',
          type: 'period',
          header: 'Actual',
          width: 130,
          period: 'actual',
          isVisible: true,
          isLocked: false,
        },
      ],
      rows: [
        {
          id: 'row-1',
          type: 'data' as const,
          cells: [
            {
              id: 'c1',
              type: 'text' as const,
              content: { type: 'text' as const, content: { text: 'Revenue' } },
              style: {} as CellStyle,
              colspan: 1,
              rowspan: 1,
              isVisible: true,
            },
            {
              id: 'c2',
              type: 'metric' as const,
              content: {
                type: 'metric',
                content: {
                  coords: 'REV.actual',
                  measure: 'Revenue',
                  format: 'currency',
                  decimals: 0,
                  showSign: false,
                },
              },
              style: {} as CellStyle,
              colspan: 1,
              rowspan: 1,
              isVisible: true,
            },
          ],
          height: 30,
          isVisible: true,
          pageBreakBefore: false,
        },
      ],
    });
    render(<ReportGrid layout={layout} cubeData={{}} />);
    expect(screen.getByText('\u2014')).toBeInTheDocument();
  });
});
