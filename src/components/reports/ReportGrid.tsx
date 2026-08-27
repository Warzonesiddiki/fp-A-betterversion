import React, { useState, useCallback, useMemo } from 'react';
import { activateOnKey } from '@/utils/a11yActivate';
import { ChevronRight, ChevronDown, Download, FileText, Table as TableIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import {
  ReportBuilderEngine,
  type ReportLayout,
  type ReportRow,
  type ReportColumn,
  type CellContent,
  type MetricCellContent,
  type FormulaCellContent,
  type CubeData,
  type ConditionalFormat,
  type CellStyle,
} from '@/engines/ReportBuilderEngine';

/* ────────────────── props ────────────────── */

export interface ReportGridProps {
  layout: ReportLayout;
  cubeData?: CubeData;
  onCellClick?: (rowIndex: number, colIndex: number) => void;
  onDrillDown?: (row: ReportRow, column: ReportColumn) => void;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  onExportCSV?: () => void;
  className?: string;
}

/* ────────────────── helpers ────────────────── */

function mergeStyles(base: CellStyle, override?: Partial<CellStyle>): React.CSSProperties {
  const s = { ...base, ...override };
  return {
    fontWeight: s.bold ? 700 : 400,
    fontStyle: s.italic ? 'italic' : undefined,
    textDecoration: s.underline ? 'underline' : undefined,
    fontSize: s.fontSize,
    fontFamily: s.fontFamily,
    color: s.textColor,
    backgroundColor: s.backgroundColor === 'transparent' ? undefined : s.backgroundColor,
    textAlign: s.alignment,
    paddingLeft: `${8 + s.indent * 16}px`,
    whiteSpace: s.wrap ? 'pre-wrap' : undefined,
    borderTop:
      s.borderTop === 'none'
        ? undefined
        : `${s.borderTop === 'thin' ? 1 : s.borderTop === 'medium' ? 2 : 3}px solid #374151`,
    borderBottom:
      s.borderBottom === 'none'
        ? undefined
        : `${s.borderBottom === 'thin' ? 1 : s.borderBottom === 'medium' ? 2 : 3}px solid #374151`,
  };
}

interface ResolvedCellValue {
  display: string;
  /** Raw numeric value when one exists (metric cells); undefined for labels/missing data. */
  raw: number | undefined;
}

function resolveMetricValue(content: MetricCellContent, cubeData: CubeData): ResolvedCellValue {
  const key = ReportBuilderEngine.buildMetricKey(content);
  const cubeValue = cubeData[key];
  if (cubeValue === undefined || cubeValue === null) return { display: '—', raw: undefined };
  const num = typeof cubeValue === 'number' ? cubeValue : Number(cubeValue);
  if (!Number.isFinite(num)) return { display: String(cubeValue), raw: undefined };
  return {
    display: ReportBuilderEngine.formatNumber(num, content.format, content.decimals),
    raw: num,
  };
}

function resolveCellDisplay(cellContent: CellContent, cubeData: CubeData): ResolvedCellValue {
  if (cellContent.type === 'text') {
    return { display: cellContent.content.text, raw: undefined };
  }
  if (cellContent.type === 'metric') {
    return resolveMetricValue(cellContent.content, cubeData);
  }
  if (cellContent.type === 'formula') {
    const fc = cellContent.content as FormulaCellContent;
    return { display: fc.label ?? fc.expression, raw: undefined };
  }
  if (cellContent.type === 'chart') return { display: `[Chart]`, raw: undefined };
  if (cellContent.type === 'table') return { display: `[Table]`, raw: undefined };
  return { display: '', raw: undefined };
}

function getConditionalStyle(
  formats: ConditionalFormat[] | undefined,
  raw: number | undefined
): Partial<CellStyle> | null {
  if (!formats || formats.length === 0) return null;
  if (raw === undefined || !Number.isFinite(raw)) return null;
  return ReportBuilderEngine.evaluateConditionalFormats(formats, raw);
}

/* ────────────────── row component ────────────────── */

interface GridRowProps {
  row: ReportRow;
  rowIndex: number;
  visibleColumns: ReportColumn[];
  allColumns: ReportColumn[];
  cubeData: CubeData;
  expandedGroups: Set<string>;
  onToggleGroup: (rowId: string) => void;
  onCellClick?: (rowIndex: number, colIndex: number) => void;
}

function GridRow({
  row,
  rowIndex,
  visibleColumns,
  allColumns,
  cubeData,
  expandedGroups: _expandedGroups,
  onToggleGroup,
  onCellClick,
}: GridRowProps) {
  const isGrouped = !!row.grouping;
  const isExpanded = row.grouping?.state === 'expanded';
  const level = row.grouping?.level ?? 0;

  const rowBg =
    row.type === 'total'
      ? 'bg-[var(--bg-elevated)] font-semibold'
      : row.type === 'subtotal'
        ? 'bg-[var(--bg-hover)]/40 font-medium'
        : 'hover:bg-[var(--bg-hover)]/30';

  return (
    <tr className={cn('border-b border-slate-800 transition-colors', rowBg)} role="row">
      {visibleColumns.map((col) => {
        const colIdx = allColumns.indexOf(col);
        const cell = row.cells[colIdx];
        if (!cell) return <td key={col.id} className="px-4 py-2" />;

        const { display, raw } = resolveCellDisplay(cell.content, cubeData);
        const condStyle =
          cell.type === 'metric'
            ? getConditionalStyle(
                (cell.content as { content: MetricCellContent }).content.conditionalFormats,
                raw
              )
            : cell.type === 'formula'
              ? getConditionalStyle(
                  (cell.content as { content: FormulaCellContent }).content.conditionalFormats,
                  raw
                )
              : null;

        const cellStyle = condStyle ? mergeStyles(cell.style, condStyle) : mergeStyles(cell.style);
        const isLabel = col.type === 'label';
        const isNumber = cell.type === 'metric' || cell.type === 'formula';
        // Variance sign derives from the RAW value; formatted strings like "($1,234.56)"
        // or "-2.1%" are display-only and must never be re-parsed for coloring.
        const isNegative = cell.type === 'metric' && raw !== undefined && raw < 0;
        const isPositive = cell.type === 'metric' && raw !== undefined && raw > 0;

        return (
          <td
            key={col.id}
            className={cn(
              'px-4 py-2 text-sm tabular-nums',
              isNumber && 'text-right',
              isNegative && 'text-[#DC2626]',
              isPositive && 'text-[#16A34A]'
            )}
            style={cellStyle}
            role="gridcell"
            onClick={() => onCellClick?.(rowIndex, colIdx)}
            onKeyDown={
              onCellClick ? activateOnKey(() => onCellClick(rowIndex, colIdx)) : undefined
            }
            tabIndex={onCellClick ? 0 : undefined}
          >
            {isLabel && isGrouped && colIdx === allColumns.findIndex((c) => c.type === 'label') && (
              <button
                className="inline-flex items-center mr-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleGroup(row.id);
                }}
                aria-label={isExpanded ? 'Collapse group' : 'Expand group'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            )}
            {isLabel && level > 0 && <span style={{ paddingLeft: `${level * 16}px` }} />}
            {display}
          </td>
        );
      })}
    </tr>
  );
}

/* ────────────────── main grid ────────────────── */

export function ReportGrid({
  layout,
  cubeData = {},
  onCellClick,
  onDrillDown: _onDrillDown,
  onExportPDF,
  onExportExcel,
  onExportCSV,
  className,
}: ReportGridProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    layout.rows.forEach((r) => {
      if (r.grouping?.state === 'expanded') initial.add(r.id);
    });
    return initial;
  });

  const visibleColumns = useMemo(() => ReportBuilderEngine.getVisibleColumns(layout), [layout]);

  const visibleRows = useMemo(() => {
    const hiddenByGroup = new Set<string>();
    layout.rows.forEach((row) => {
      if (row.grouping?.parentId && !expandedGroups.has(row.grouping.parentId)) {
        hiddenByGroup.add(row.id);
      }
    });
    return layout.rows.filter((r) => r.isVisible && !hiddenByGroup.has(r.id));
  }, [layout, expandedGroups]);

  const handleToggleGroup = useCallback((rowId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }, []);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Export bar */}
      <div className="flex items-center justify-end gap-2">
        {onExportPDF && (
          <Button size="sm" variant="ghost" onClick={onExportPDF} aria-label="Export PDF">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            PDF
          </Button>
        )}
        {onExportExcel && (
          <Button size="sm" variant="ghost" onClick={onExportExcel} aria-label="Export Excel">
            <TableIcon className="h-3.5 w-3.5 mr-1.5" />
            Excel
          </Button>
        )}
        {onExportCSV && (
          <Button size="sm" variant="ghost" onClick={onExportCSV} aria-label="Export CSV">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            CSV
          </Button>
        )}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-sm" role="grid" aria-label="Report grid">
          {/* Header */}
          <thead>
            <tr className="text-left text-[var(--text-muted)] text-xs uppercase border-b border-[var(--border-default)] bg-[var(--bg-elevated)]">
              {visibleColumns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    'px-4 py-3 font-semibold whitespace-nowrap',
                    col.type !== 'label' && 'text-right'
                  )}
                  style={{ width: col.width, minWidth: col.width }}
                  role="columnheader"
                 scope="col">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-800/50">
            {visibleRows.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length}
                  className="px-4 py-12 text-center text-[var(--text-secondary)]"
                >
                  No data to display. Add dimensions and measures to build the report.
                </td>
              </tr>
            ) : (
              visibleRows.map((row, ri) => (
                <GridRow
                  key={row.id}
                  row={row}
                  rowIndex={ri}
                  visibleColumns={visibleColumns}
                  allColumns={layout.columns}
                  cubeData={cubeData}
                  expandedGroups={expandedGroups}
                  onToggleGroup={handleToggleGroup}
                  onCellClick={onCellClick}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <span>
          {visibleRows.length} rows × {visibleColumns.length} columns
        </span>
        <span>Generated by FinPlan Pro</span>
      </div>
    </div>
  );
}
