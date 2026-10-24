import React, { memo } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { AlertCircle } from 'lucide-react';

export interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  height?: number;
  loading?: boolean;
  empty?: boolean;
  error?: string | null;
  exportable?: boolean;
  onExport?: () => void;
  onRetry?: () => void;
  className?: string;
  /**
   * Semantic heading level for the title. Defaults to h3 for backward
   * compatibility; pages that place the chart directly under a page h1
   * should pass 'h2' so heading order remains valid.
   */
  headingLevel?: 'h2' | 'h3';
}

export const ChartWrapper = memo(function ChartWrapper({
  title,
  subtitle,
  children,
  height = 300,
  loading,
  empty,
  error,
  exportable,
  onExport,
  onRetry,
  className,
  headingLevel = 'h3',
}: ChartWrapperProps) {
  const TitleTag = headingLevel === 'h2' ? 'h2' : 'h3';
  return (
    <Card className={className}>
      <CardHeader className="flex items-center justify-between px-4 py-3">
        <div>
          <TitleTag className="font-semibold text-sm text-[var(--text-primary)]">{title}</TitleTag>
          {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
        </div>
        {exportable && (
          <Button size="sm" variant="ghost" onClick={onExport} aria-label="Export chart as image">
            Export
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {loading && (
          <div className="flex items-center justify-center" style={{ height }}>
            <Skeleton variant="rectangular" width="100%" height={`${height - 20}px`} />
          </div>
        )}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center text-center" style={{ height }}>
            <AlertCircle className="h-6 w-6 text-red-400 dark:text-red-600 mb-2" />
            <p className="text-red-400 dark:text-red-600 text-sm mb-3">{error}</p>
            {onRetry && (
              <Button size="sm" variant="secondary" onClick={onRetry}>
                Retry
              </Button>
            )}
          </div>
        )}
        {empty && !loading && !error && (
          <div
            className="flex items-center justify-center text-[var(--text-muted)] text-sm"
            style={{ height }}
          >
            No data available for this period
          </div>
        )}
        {!loading && !error && !empty && children}
      </CardContent>
    </Card>
  );
});
