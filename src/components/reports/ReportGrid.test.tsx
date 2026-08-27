/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportGrid } from './ReportGrid';
import { ReportBuilderEngine } from '@/engines/ReportBuilderEngine';
import type {
  ReportLayout,
  CellStyle,
  CubeData,
  MetricCellContent,
  ConditionalFormat,
} from '@/engines/ReportBuilderEngine';

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
    // Mirrors the real engine's accounting formats closely enough for display assertions.
    formatNumber: vi.fn().mockImplementation((num: number, format?: string, decimals = 2) => {
      if (!Number.isFinite(num)) return '#N/A';
      if (format === 'currency') {
        const abs = Math.abs(num).toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
        return num < 0 ? `($${abs})` : `$${abs}`;
      }
      if (format === 'percentage') return `${(num * 100).toFixed(decimals)}%`;
      return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }),
    // First-match-wins, same semantics as ReportBuilderEngine.matchesCondition.
    evaluateConditionalFormats: vi.fn().mockImplementation(
      (
        formats:
          | Array<{ condition: string; value: number; style: Partial<CellStyle> }>
          | null
          | undefined,
        value: number
      ) => {
        for (const f of formats ?? []) {
          const hit =
            f.condition === 'gt'
              ? value > f.value
              : f.condition === 'lt'
                ? value < f.value
                : f.condition === 'gte'
                  ? value >= f.value
                  : f.condition === 'lte'
                    ? value <= f.value
                    : f.condition === 'eq'
                      ? value === f.value
                      : f.condition === 'neq'
                        ? value !== f.value
                        : false;
          if (hit) return f.style;
        }
        return null;
      }
    ),
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

describe('ReportGrid sign-color rules (W6-P0-12)', () => {
  const FAVORABLE = 'text-[#16A34A]';
  const UNFAVORABLE = 'text-[#DC2626]';

  const makeMetricLayout = (
    metric: Pick<MetricCellContent, 'format' | 'decimals'> & {
      conditionalFormats?: ConditionalFormat[];
    }
  ): ReportLayout =>
    createMockLayout({
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
              content: { type: 'text' as const, content: { text: 'Net Income' } },
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
                  coords: 'NI.actual',
                  measure: 'NetIncome',
                  format: metric.format,
                  decimals: metric.decimals,
                  showSign: false,
                  conditionalFormats: metric.conditionalFormats,
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

  function cellFor(text: string | RegExp): HTMLTableCellElement {
    const el = screen.getByText(text);
    const td = el.closest('td');
    if (!td) throw new Error(`No <td> found for ${String(text)}`);
    return td;
  }

  it('renders -2.1% percentage negatives red (not green)', () => {
    render(
      <ReportGrid
        layout={makeMetricLayout({ format: 'percentage', decimals: 1 })}
        cubeData={{ test_key: -0.021 } as CubeData}
      />
    );
    const cell = cellFor('-2.1%');
    expect(cell).toHaveClass(UNFAVORABLE);
    expect(cell).not.toHaveClass(FAVORABLE);
  });

  it('renders accounting-negative ($1,234.56) red', () => {
    render(
      <ReportGrid
        layout={makeMetricLayout({ format: 'currency', decimals: 2 })}
        cubeData={{ test_key: -1234.56 } as CubeData}
      />
    );
    const cell = cellFor('($1,234.56)');
    expect(cell).toHaveClass(UNFAVORABLE);
    expect(cell).not.toHaveClass(FAVORABLE);
  });

  it('renders minus-sign decimal -1234.56 red too', () => {
    render(
      <ReportGrid
        layout={makeMetricLayout({ format: 'decimal', decimals: 2 })}
        cubeData={{ test_key: -1234.56 } as CubeData}
      />
    );
    const cell = cellFor(/-1,?234\.56/);
    expect(cell).toHaveClass(UNFAVORABLE);
    expect(cell).not.toHaveClass(FAVORABLE);
  });

  it('renders positives green', () => {
    render(
      <ReportGrid
        layout={makeMetricLayout({ format: 'currency', decimals: 2 })}
        cubeData={{ test_key: 2500 } as CubeData}
      />
    );
    const cell = cellFor('$2,500.00');
    expect(cell).toHaveClass(FAVORABLE);
    expect(cell).not.toHaveClass(UNFAVORABLE);
  });

  it('renders zero without either variance color', () => {
    render(
      <ReportGrid
        layout={makeMetricLayout({ format: 'currency', decimals: 2 })}
        cubeData={{ test_key: 0 } as CubeData}
      />
    );
    const cell = cellFor('$0.00');
    expect(cell).not.toHaveClass(FAVORABLE);
    expect(cell).not.toHaveClass(UNFAVORABLE);
  });

  it('keeps missing data (—) uncolored', () => {
    render(<ReportGrid layout={makeMetricLayout({ format: 'currency', decimals: 2 })} cubeData={{}} />);
    const cell = cellFor('\u2014');
    expect(cell).not.toHaveClass(FAVORABLE);
    expect(cell).not.toHaveClass(UNFAVORABLE);
  });

  it('fires lt conditional on the RAW value for accounting negatives', () => {
    const formats: ConditionalFormat[] = [
      { id: 'f1', condition: 'lt', value: 0, style: { textColor: '#DC2626' } },
    ];
    render(
      <ReportGrid
        layout={makeMetricLayout({ format: 'currency', decimals: 2, conditionalFormats: formats })}
        cubeData={{ test_key: -1234.56 } as CubeData}
      />
    );
    // Threshold must see -1234.56 (raw), not +1234.56 recovered from "($1,234.56)".
    expect(vi.mocked(ReportBuilderEngine.evaluateConditionalFormats)).toHaveBeenCalledWith(
      formats,
      -1234.56
    );
    expect(cellFor('($1,234.56)').style.color).toBe('rgb(220, 38, 38)');
  });

  it('does not fire gt>0 conditional on accounting negatives (sign not lost)', () => {
    const formats: ConditionalFormat[] = [
      { id: 'f1', condition: 'gt', value: 0, style: { textColor: '#16A34A' } },
    ];
    render(
      <ReportGrid
        layout={makeMetricLayout({ format: 'currency', decimals: 2, conditionalFormats: formats })}
        cubeData={{ test_key: -1234.56 } as CubeData}
      />
    );
    expect(cellFor('($1,234.56)').style.color).toBe('');
  });
});
