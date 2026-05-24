import React, { useState, useMemo, useRef } from 'react';
import { ChevronUp, ChevronDown, AlertCircle, Search } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/utils/cn';

import { Skeleton } from './Skeleton';

export interface Column<T extends Record<string, any> = Record<string, unknown>> {
  key: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'right' | 'center';
  frozen?: boolean;
}

export interface DataTableProps {
  columns: Column<any>[];
  data: unknown[];
  sortable?: boolean;
  filterable?: boolean;
  onRowClick?: (row: Record<string, unknown>) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  pageSize?: number;
  emptyMessage?: string;
  loading?: boolean;
  error?: string;
  className?: string;
}

const VIRTUAL_THRESHOLD = 100;
const ROW_HEIGHT = 40;

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data: rawData,
  sortable: globalSortable = true,
  filterable: globalFilterable = false,
  onRowClick,
  pageSize = 50,
  emptyMessage = 'No data available',
  loading = false,
  error,
  className,
}) => {
  const data = rawData as Record<string, unknown>[];
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null
  );
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Handle sorting
  const sortedData = useMemo(() => {
    const items = [...data];
    if (sortConfig !== null) {
      items.sort((a, b) => {
        const aValue = String(a[sortConfig.key] ?? '');
        const bValue = String(b[sortConfig.key] ?? '');

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return items;
  }, [data, sortConfig]);

  // Handle filtering
  const filteredData = useMemo(() => {
    return sortedData.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const itemValue = item[key];
        return String(itemValue).toLowerCase().includes(value.toLowerCase());
      });
    });
  }, [sortedData, filters]);

  // Virtual scrolling for large datasets
  const useVirtual = filteredData.length > VIRTUAL_THRESHOLD;

  const virtualizer = useVirtual
    ? useVirtualizer({
        count: filteredData.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 10,
      })
    : null;

  // Handle pagination (simple internal) — disabled when virtual scrolling
  const paginatedData = useMemo(() => {
    if (useVirtual) return filteredData;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize, useVirtual]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  if (error) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center p-8 rounded-lg border border-red-100 bg-red-50 fin-negative dark:border-red-900 dark:bg-red-950',
          className
        )}
      >
        <AlertCircle className="h-10 w-10 mb-2" />
        <h3 className="font-semibold text-lg">Error loading data</h3>
        <p className="text-sm opacity-90">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  // Render a single row (shared between virtual and paginated modes)
  const renderRow = (row: Record<string, unknown>, rowIdx: number) => (
    <tr
      key={(row.id as React.Key) ?? rowIdx}
      className={cn(
        'transition-colors hover:bg-gray-50 dark:bg-gray-900/50 dark:hover:bg-gray-700/50 group',
        onRowClick && 'cursor-pointer'
      )}
      onClick={() => onRowClick?.(row)}
    >
      {columns.map((column) => (
        <td
          key={column.key}
          className={cn(
            'px-4 py-3 text-[var(--text-primary)] whitespace-nowrap',
            column.align === 'right' && 'text-right',
            column.align === 'center' && 'text-center'
          )}
        >
          {column.render
            ? String(column.render(row[column.key], row) ?? '')
            : String(row[column.key] ?? '')}
        </td>
      ))}
    </tr>
  );

  // Virtual scrolling body
  const renderVirtualBody = () => {
    if (!virtualizer) return null;
    const virtualItems = virtualizer.getVirtualItems();
    const totalSize = virtualizer.getTotalSize();
    const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
    const paddingBottom =
      virtualItems.length > 0 ? totalSize - virtualItems[virtualItems.length - 1].end : 0;

    return (
      <tbody className="divide-y divide-[var(--border-subtle)]">
        {paddingTop > 0 && (
          <tr>
            <td colSpan={columns.length} style={{ height: paddingTop }} />
          </tr>
        )}
        {virtualItems.map((virtualRow) => {
          const row = filteredData[virtualRow.index];
          return (
            <tr
              key={(row.id as React.Key) ?? virtualRow.index}
              className={cn(
                'transition-colors hover:bg-gray-50 dark:bg-gray-900/50 dark:hover:bg-gray-700/50 group',
                onRowClick && 'cursor-pointer'
              )}
              onClick={() => onRowClick?.(row)}
              data-index={virtualRow.index}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-[var(--text-primary)] whitespace-nowrap',
                    column.align === 'right' && 'text-right',
                    column.align === 'center' && 'text-center'
                  )}
                >
                  {column.render
                    ? column.render(row[column.key], row)
                    : String(row[column.key] ?? '')}
                </td>
              ))}
            </tr>
          );
        })}
        {paddingBottom > 0 && (
          <tr>
            <td colSpan={columns.length} style={{ height: paddingBottom }} />
          </tr>
        )}
      </tbody>
    );
  };

  // Paginated body (original behavior)
  const renderPaginatedBody = () => (
    <tbody className="divide-y divide-[var(--border-subtle)]">
      {loading ? (
        Array.from({ length: 5 }).map((_, idx) => (
          <tr key={idx}>
            {columns.map((col) => (
              <td key={col.key} className="px-4 py-4">
                <Skeleton className="h-4 w-full" />
              </td>
            ))}
          </tr>
        ))
      ) : filteredData.length === 0 ? (
        <tr>
          <td
            colSpan={columns.length}
            className="px-4 py-12 text-center text-[var(--text-secondary)]"
          >
            <div className="flex flex-col items-center">
              <Search className="h-10 w-10 mb-2 opacity-20" />
              <p>{emptyMessage}</p>
            </div>
          </td>
        </tr>
      ) : (
        paginatedData.map((row, rowIdx) => renderRow(row, rowIdx))
      )}
    </tbody>
  );

  return (
    <div className={cn('w-full flex flex-col', className)}>
      <div
        ref={useVirtual ? scrollRef : undefined}
        className={cn(
          'overflow-x-auto rounded-lg border border-[var(--border-subtle)] shadow-sm',
          useVirtual && 'max-h-[600px] overflow-y-auto'
        )}
      >
        <table className="w-full text-sm text-left border-collapse bg-[var(--bg-surface)]">
          <thead className="bg-gray-50 dark:bg-gray-900/80 dark:bg-gray-800/80 border-b border-[var(--border-subtle)] sticky top-0 z-10">
            <tr>
              {columns.map((column) => {
                const isSortable = globalSortable && column.sortable !== false;
                const isSorted = sortConfig?.key === column.key;

                return (
                  <th
                    key={column.key}
                    style={{ width: column.width }}
                    className={cn(
                      'px-4 py-3 font-semibold text-[var(--text-secondary)] transition-colors',
                      isSortable &&
                        'cursor-pointer hover:bg-[var(--bg-hover)] dark:hover:bg-gray-700 select-none'
                    )}
                    onClick={() => isSortable && requestSort(column.key)}
                  >
                    <div
                      className={cn(
                        'flex items-center space-x-1',
                        column.align === 'right' && 'justify-end',
                        column.align === 'center' && 'justify-center'
                      )}
                    >
                      <span>{column.header}</span>
                      {isSortable && (
                        <div className="flex flex-col">
                          <ChevronUp
                            className={cn(
                              'h-3 w-3 -mb-1',
                              isSorted && sortConfig?.direction === 'asc'
                                ? 'text-blue-600'
                                : 'text-gray-300'
                            )}
                          />
                          <ChevronDown
                            className={cn(
                              'h-3 w-3',
                              isSorted && sortConfig?.direction === 'desc'
                                ? 'text-blue-600'
                                : 'text-gray-300'
                            )}
                          />
                        </div>
                      )}
                    </div>
                    {globalFilterable && column.filterable !== false && (
                      <div
                        className="mt-2"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        role="presentation"
                      >
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 dark:text-gray-500" />
                          <input
                            type="text"
                            className="w-full pl-7 pr-2 py-1 bg-white dark:bg-gray-800 dark:bg-gray-800 border border-[var(--border-subtle)] rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 font-normal dark:text-white"
                            placeholder="Filter..."
                            value={filters[column.key] || ''}
                            onChange={(e) => handleFilterChange(column.key, e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          {useVirtual ? renderVirtualBody() : renderPaginatedBody()}
        </table>
      </div>

      {useVirtual && !loading && (
        <div className="mt-2 text-xs text-[var(--text-secondary)] text-center">
          Showing all {filteredData.length.toLocaleString()} rows (virtual scrolling)
        </div>
      )}

      {!loading && !useVirtual && filteredData.length > pageSize && (
        <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <span>
            Showing {Math.min(filteredData.length, (currentPage - 1) * pageSize + 1)} to{' '}
            {Math.min(filteredData.length, currentPage * pageSize)} of {filteredData.length} entries
          </span>
          <div className="flex items-center space-x-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 rounded border border-[var(--border-subtle)] hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <span className="px-3 font-medium text-[var(--text-primary)]">
              Page {currentPage} of {Math.ceil(filteredData.length / pageSize)}
            </span>
            <button
              disabled={currentPage >= Math.ceil(filteredData.length / pageSize)}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-2 py-1 rounded border border-[var(--border-subtle)] hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
