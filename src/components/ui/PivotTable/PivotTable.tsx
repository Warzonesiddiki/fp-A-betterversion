import React from 'react';
import { cn } from '@/utils/cn';
import type { PivotResult, PivotRow } from '@/engines/PivotTableEngine';

export interface PivotTableProps {
  data: PivotResult | null;
  className?: string;
}

export function PivotTable({ data, className }: PivotTableProps) {
  if (!data) return <div className="text-[var(--text-muted)] text-sm p-4">No data to pivot.</div>;

  const renderRow = (row: PivotRow, level: number) => {
    return (
      <React.Fragment key={row.key}>
        <tr
          className={cn(
            'border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-colors',
            row.isTotal ? 'bg-[var(--bg-surface)] font-semibold' : ''
          )}
        >
          <td
            className="px-4 py-2 text-sm whitespace-nowrap sticky left-0 z-10"
            style={{ paddingLeft: `${(level + 1) * 1}rem` }}
          >
            <div className="flex items-center gap-2">
              {row.children && row.children.length > 0 && (
                <span className="text-[var(--text-muted)] w-4 text-center select-none">
                  {/* Future: Add collapse/expand functionality */}▾
                </span>
              )}
              {row.label}
            </div>
          </td>
          {row.cells.map((cell, idx) => (
            <td
              key={`${row.key}-cell-${idx}`}
              className={cn(
                'px-4 py-2 text-sm text-right whitespace-nowrap tabular-nums',
                cell.isTotal && 'font-semibold bg-[var(--bg-surface-hover)]'
              )}
            >
              {cell.formattedValue}
            </td>
          ))}
        </tr>
        {row.children && row.children.map((child) => renderRow(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div
      className={cn(
        'overflow-auto border border-[var(--border-default)] rounded-md shadow-sm',
        className
      )}
    >
      <table className="w-full text-left border-collapse">
        <thead className="bg-[var(--bg-surface)] sticky top-0 z-20 shadow-sm">
          <tr>
            <th className="px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider sticky left-0 bg-[var(--bg-surface)] z-30 shadow-[1px_0_0_0_var(--border-default)]">
              Rows
            </th>
            {data.columnHeaders.map((col, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-xs font-semibold text-right text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-[var(--bg-root)] divide-y divide-[var(--border-subtle)]">
          {data.rows.map((row) => renderRow(row, 0))}

          {/* Grand Totals */}
          {data.grandTotals.length > 0 && (
            <tr className="bg-[var(--bg-surface-active)] font-bold border-t-2 border-[var(--border-default)] sticky bottom-0 z-20 shadow-[0_-1px_0_0_var(--border-default)]">
              <td className="px-4 py-3 text-sm sticky left-0 z-30 bg-[var(--bg-surface-active)]">
                Grand Total
              </td>
              {data.grandTotals.map((cell, idx) => (
                <td key={`grand-${idx}`} className="px-4 py-3 text-sm text-right tabular-nums">
                  {cell.formattedValue}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
