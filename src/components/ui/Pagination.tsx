import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  totalItems?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 50,
  onPageSizeChange,
  totalItems,
}) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage === 1) {
        pages.push(2, 3);
      } else if (currentPage === totalPages) {
        pages.push(totalPages - 2, totalPages - 1);
      } else {
        for (let i = start; i <= end; i++) pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 w-full text-sm"
    >
      <div className="flex items-center space-x-4">
        {totalItems !== undefined && (
          <p className="text-[var(--text-secondary)]">
            Showing{' '}
            <span className="font-semibold text-[var(--text-primary)]">
              {Math.min(totalItems, (currentPage - 1) * pageSize + 1)}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-[var(--text-primary)]">
              {Math.min(totalItems, currentPage * pageSize)}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-[var(--text-primary)]">
              {totalItems.toLocaleString()}
            </span>{' '}
            entries
          </p>
        )}
        {onPageSizeChange && (
          <div className="flex items-center space-x-2">
            <span className="text-[var(--text-secondary)]">Rows per page:</span>
            <select
              className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 text-xs font-medium cursor-pointer"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {[10, 25, 50, 100, 250].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-1">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(1)}
          aria-label="First page"
          className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="First Page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
          className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors mr-2"
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center space-x-1">
          {pages.map((page, idx) => (
            <React.Fragment key={idx}>
              {page === '...' ? (
                <span className="px-2 text-[var(--text-secondary)]">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  aria-current={currentPage === page ? 'page' : undefined}
                  aria-label={`Page ${page}`}
                  className={cn(
                    'min-w-[32px] h-8 flex items-center justify-center rounded-md text-xs font-medium transition-all',
                    currentPage === page
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  )}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
          className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors ml-2"
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
          aria-label="Last page"
          className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Last Page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
};
