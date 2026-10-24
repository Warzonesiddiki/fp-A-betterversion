import React from 'react';
import { cn } from '@/utils/cn';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/formatters';
import { Badge } from './Badge';

export interface FinancialTableRow {
  id?: string;
  isSubtotal?: boolean;
  type?: string;
  accountType?: string;
  badgeVariant?: string;
  [key: string]: unknown;
}

export interface FinancialTableColumn {
  key: string;
  header: string;
  type: 'string' | 'currency' | 'percent' | 'number' | 'badge';
  align?: 'left' | 'right';
  width?: string;
  color?: (value: unknown) => string;
  render?: (value: unknown, row: FinancialTableRow) => React.ReactNode;
}

export interface FinancialTableProps {
  columns: FinancialTableColumn[];
  rows: FinancialTableRow[];
  showSubtotals?: boolean;
  showVariance?: boolean;
  className?: string;
  /** Maximum rows before switching to virtualized rendering (default: 500) */
  virtualizeThreshold?: number;
}

function getCellValue(value: unknown, type: FinancialTableColumn['type']): string | number {
  if (value === null || value === undefined) return '---';
  if (typeof value !== 'number' && ['currency', 'percent', 'number'].includes(type))
    return value as string | number;

  switch (type) {
    case 'currency':
      return formatCurrency(value as number);
    case 'percent':
      return formatPercent(value as number);
    case 'number':
      return formatNumber(value as number);
    default:
      return String(value);
  }
}

function getVarianceClass(
  value: unknown,
  type: string,
  row: Record<string, unknown>,
  showVariance: boolean
): string {
  if (!showVariance || typeof value !== 'number') return '';

  const isPositive = value >= 0;
  const isRevenue = row.accountType === 'Revenue';

  if (type === 'percent' || type === 'currency') {
    if (isRevenue) {
      return isPositive ? 'fin-positive' : 'fin-negative';
    } else {
      return isPositive ? 'fin-negative' : 'fin-positive';
    }
  }

  return 'fin-neutral';
}

const FinancialTableRowComponent = React.memo(function FinancialTableRowComponent({
  row,
  columns,
  showSubtotals,
  showVariance,
}: {
  row: FinancialTableRow;
  columns: FinancialTableColumn[];
  showSubtotals: boolean;
  showVariance: boolean;
}) {
  const isSubtotal = showSubtotals && (row.isSubtotal || row.type === 'subtotal');

  return (
    <tr
      className={cn(
        'transition-colors hover:bg-[var(--bg-muted)]/50',
        isSubtotal && 'bg-[var(--bg-muted)]/30 font-bold border-t-2'
      )}
    >
      {columns.map((col) => {
        const value = row[col.key];
        const alignment =
          col.align || (['currency', 'percent', 'number'].includes(col.type) ? 'right' : 'left');

        return (
          <td
            key={col.key}
            className={cn(
              'px-4 py-3 whitespace-nowrap',
              alignment === 'right' && 'text-right',
              getVarianceClass(value, col.type, row, showVariance),
              col.color?.(value)
            )}
          >
            {col.render ? (
              col.render(value, row)
            ) : col.type === 'badge' ? (
              <Badge
                variant={
                  (row.badgeVariant as 'default' | 'secondary' | 'destructive' | 'outline') ||
                  'default'
                }
              >
                {String(value ?? '')}
              </Badge>
            ) : (
              getCellValue(value, col.type)
            )}
          </td>
        );
      })}
    </tr>
  );
});

export const FinancialTable = React.memo(function FinancialTable({
  columns,
  rows,
  showSubtotals = true,
  showVariance = true,
  className,
  virtualizeThreshold = 500,
}: FinancialTableProps) {
  const needsVirtualization = rows.length > virtualizeThreshold;

  // For very large datasets, render only visible rows using a simple windowed approach
  const [scrollTop, setScrollTop] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const ROW_HEIGHT = 40; // px per row
  const BUFFER = 10; // extra rows above/below viewport

  const visibleRange = React.useMemo(() => {
    if (!needsVirtualization) return { start: 0, end: rows.length };
    const containerHeight = containerRef.current?.clientHeight ?? 600;
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
    const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + BUFFER * 2;
    return { start, end: Math.min(rows.length, start + visibleCount) };
  }, [needsVirtualization, scrollTop, rows.length]);

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const visibleRows = rows.slice(visibleRange.start, visibleRange.end);
  const totalHeight = rows.length * ROW_HEIGHT;
  const offsetY = visibleRange.start * ROW_HEIGHT;

  return (
    <div
      ref={containerRef}
      className={cn(
        'w-full overflow-x-auto rounded-lg border border-[var(--border-subtle)] shadow-sm bg-[var(--bg-surface)]',
        needsVirtualization && 'overflow-y-auto',
        className
      )}
      style={needsVirtualization ? { maxHeight: '70vh' } : undefined}
      onScroll={needsVirtualization ? handleScroll : undefined}
    >
      <table className="w-full border-collapse text-sm text-left table tabular-nums">
        <thead className="sticky top-0 z-10 bg-[var(--bg-muted)] backdrop-blur-sm border-b border-[var(--border-subtle)]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={cn(
                  'px-4 py-3 font-bold uppercase tracking-wider text-xs text-[var(--text-secondary)]',
                  (col.align === 'right' || ['currency', 'percent', 'number'].includes(col.type)) &&
                    'text-right'
                )}
                scope="col"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {needsVirtualization && (
            <tr style={{ height: offsetY }} aria-hidden="true">
              <td colSpan={columns.length} />
            </tr>
          )}
          {(needsVirtualization ? visibleRows : rows).map((row, idx) => {
            const rowIdx = needsVirtualization ? visibleRange.start + idx : idx;
            return (
              <FinancialTableRowComponent
                key={row.id || rowIdx}
                row={row}
                columns={columns}
                showSubtotals={showSubtotals}
                showVariance={showVariance}
              />
            );
          })}
          {needsVirtualization && (
            <tr
              style={{
                height: Math.max(0, totalHeight - offsetY - visibleRows.length * ROW_HEIGHT),
              }}
              aria-hidden="true"
            >
              <td colSpan={columns.length} />
            </tr>
          )}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="py-12 text-center text-[var(--text-secondary)]">
          <p>No data available.</p>
        </div>
      )}
      {needsVirtualization && (
        <div
          className="px-3 py-1 text-xs text-[var(--text-secondary)] bg-[var(--bg-muted)] border-t border-[var(--border-subtle)]"
          role="status"
        >
          Showing {visibleRange.start + 1}-{visibleRange.end} of {rows.length.toLocaleString()} rows
        </div>
      )}
    </div>
  );
});
