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
}: ChartWrapperProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex items-center justify-between px-4 py-3">
        <div>
          <h3 className="font-semibold text-sm dark:text-gray-100">{title}</h3>
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
            <AlertCircle className="h-6 w-6 text-red-400 dark:text-red-500 mb-2" />
            <p className="text-red-400 dark:text-red-500 text-sm mb-3">{error}</p>
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
