import React from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

export interface LazyChartProps {
  /** The actual chart component to render lazily */
  children: React.ReactNode;
  /** Placeholder height while not visible (default: 300) */
  height?: number;
  /** CSS class for the wrapper */
  className?: string;
  /** Root margin for IntersectionObserver (default: '200px') */
  rootMargin?: string;
  /** Custom loading skeleton */
  skeleton?: React.ReactNode;
}

/**
 * LazyChart defers rendering its children until the element scrolls into the viewport.
 * Uses IntersectionObserver with a configurable margin for pre-loading.
 *
 * @example
 * <LazyChart height={300}>
 *   <WaterfallChart data={data} height={300} />
 * </LazyChart>
 */
export function LazyChart({
  children,
  height = 300,
  className,
  rootMargin = '200px',
  skeleton,
}: LazyChartProps) {
  const { ref, isVisible } = useIntersectionObserver({
    rootMargin,
    triggerOnce: true,
  });

  return (
    <div ref={ref} className={className} style={{ minHeight: height }}>
      {isVisible
        ? children
        : (skeleton ?? (
            <div
              className="w-full flex items-center justify-center bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl"
              style={{ height }}
            >
              <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin opacity-40" />
                <span className="text-xs">Loading chart...</span>
              </div>
            </div>
          ))}
    </div>
  );
}

/**
 * withLazyChart HOC wraps any chart component with lazy loading.
 *
 * @example
 * const LazyWaterfallChart = withLazyChart(WaterfallChart);
 * <LazyWaterfallChart data={data} height={300} />
 */
export function withLazyChart<P extends { height?: number; className?: string }>(
  ChartComponent: React.ComponentType<P>
) {
  const Wrapped = React.memo(function LazyChartWrapper(props: P) {
    return (
      <LazyChart height={props.height ?? 300} className={props.className}>
        <ChartComponent {...props} />
      </LazyChart>
    );
  });
  Wrapped.displayName = `withLazyChart(${ChartComponent.displayName ?? ChartComponent.name ?? 'Chart'})`;
  return Wrapped;
}
