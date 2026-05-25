/**
 * Performance Monitor — Track engine/operation timing, render performance, and Web Vitals.
 *
 * Usage:
 *   const result = PerformanceMonitor.time('engine:three-statement', 'engine', () => {
 *     return ThreeStatementEngine.calculate(data);
 *   });
 *
 *   // In a component:
 *   function HeavyChart() {
 *     useRenderMetrics('HeavyChart');
 *     return <RechartsComponent />;
 *   }
 */

import { useEffect, useRef } from 'react';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  category: 'engine' | 'render' | 'store' | 'import' | 'export';
  metadata?: Record<string, unknown>;
}

interface MetricSummary {
  name: string;
  count: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
}

interface WebVital {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface PerformanceReport {
  summary: MetricSummary[];
  webVitals: WebVital[];
  generatedAt: number;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static webVitals: WebVital[] = [];
  private static maxMetrics = 10_000;
  private static slowThreshold = 50; // ms — operations above this are logged
  private static thresholds: Record<string, number> = {
    'engine:recalculate': 16,
    'engine:monte-carlo': 5000,
    'render:grid': 100,
    'render:chart': 200,
    'store:update': 8,
    'import:parse': 3000,
    'export:generate': 5000,
  };

  /**
   * Time a synchronous function.
   */
  static time<T>(
    name: string,
    category: PerformanceMetric['category'],
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    this.record({ name, duration, timestamp: Date.now(), category, metadata });

    const threshold = this.thresholds[name];
    if (threshold && duration > threshold) {
      console.warn(
        `Performance: ${name} took ${duration.toFixed(1)}ms (threshold: ${threshold}ms)`
      );
    }

    return result;
  }

  /**
   * Time an async function.
   */
  static async timeAsync<T>(
    name: string,
    category: PerformanceMetric['category'],
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    this.record({ name, duration, timestamp: Date.now(), category, metadata });

    const threshold = this.thresholds[name];
    if (threshold && duration > threshold) {
      console.warn(
        `Performance: ${name} took ${duration.toFixed(1)}ms (threshold: ${threshold}ms)`
      );
    }

    return result;
  }

  private static record(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics / 2);
    }
  }

  /**
   * Record a Web Vitals measurement.
   */
  static recordWebVital(name: string, value: number): void {
    let rating: WebVital['rating'] = 'good';
    // Thresholds per https://web.dev/vitals/
    if (name === 'LCP') {
      rating = value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
    } else if (name === 'FID') {
      rating = value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
    } else if (name === 'CLS') {
      rating = value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
    } else if (name === 'INP') {
      rating = value <= 200 ? 'good' : value <= 500 ? 'needs-improvement' : 'poor';
    } else if (name === 'TTFB') {
      rating = value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
    }
    this.webVitals.push({ name, value, rating, timestamp: Date.now() });
  }

  /**
   * Get aggregate report with metric summaries + Web Vitals.
   */
  static getReport(): PerformanceReport {
    const byName = new Map<string, number[]>();

    for (const m of this.metrics) {
      const existing = byName.get(m.name) ?? [];
      existing.push(m.duration);
      byName.set(m.name, existing);
    }

    const summary: MetricSummary[] = [];
    for (const [name, durations] of byName) {
      durations.sort((a, b) => a - b);
      summary.push({
        name,
        count: durations.length,
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        p50: durations[Math.floor(durations.length * 0.5)],
        p95: durations[Math.floor(durations.length * 0.95)],
        p99: durations[Math.floor(durations.length * 0.99)],
        max: Math.max(...durations),
      });
    }

    return { summary, webVitals: [...this.webVitals], generatedAt: Date.now() };
  }

  /**
   * Get the slowest operations, optionally filtered by category.
   */
  static getSlowOps(category?: PerformanceMetric['category'], limit = 10): PerformanceMetric[] {
    const filtered = category
      ? this.metrics.filter((m) => m.category === category)
      : this.metrics;
    return [...filtered]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  static clear(): void {
    this.metrics = [];
    this.webVitals = [];
  }

  static setThreshold(name: string, ms: number): void {
    this.thresholds[name] = ms;
  }

  static setSlowThreshold(ms: number): void {
    this.slowThreshold = ms;
  }

  /**
   * Directly record a render metric (used by useRenderMetrics hook).
   */
  static recordRender(componentName: string, duration: number): void {
    this.record({
      name: `render:${componentName}`,
      duration,
      timestamp: Date.now(),
      category: 'render',
      metadata: { component: componentName },
    });

    const threshold = this.thresholds[`render:${componentName}`] ?? this.thresholds['render:chart'];
    if (threshold && duration > threshold) {
      console.warn(
        `Performance: render:${componentName} took ${duration.toFixed(1)}ms (threshold: ${threshold}ms)`
      );
    }
  }

  /**
   * Auto-instrument Web Vitals via PerformanceObserver.
   * Call once at app startup.
   */
  static observeWebVitals(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
        if (lastEntry) {
          this.recordWebVital('LCP', lastEntry.startTime);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // LCP observer not supported
    }

    // First Input Delay / Interaction to Next Paint
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as PerformanceEntry & {
            processingStart?: number;
            startTime: number;
          };
          const delay = fidEntry.processingStart
            ? fidEntry.processingStart - fidEntry.startTime
            : fidEntry.startTime;
          this.recordWebVital(entry.entryType === 'first-input' ? 'FID' : 'INP', delay);
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch {
      // FID observer not supported
    }

    // Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as PerformanceEntry & {
            hadRecentInput?: boolean;
            value?: number;
          };
          if (!layoutShift.hadRecentInput && layoutShift.value != null) {
            clsValue += layoutShift.value;
          }
        }
        this.recordWebVital('CLS', clsValue);
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // CLS observer not supported
    }

    // Time to First Byte
    try {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        const nav = navEntries[0] as PerformanceNavigationTiming;
        this.recordWebVital('TTFB', nav.responseStart - nav.requestStart);
      }
    } catch {
      // Navigation timing not supported
    }
  }
}

/**
 * React hook to track component render durations.
 * Logs to PerformanceMonitor under `render:{componentName}`.
 *
 * Usage:
 *   function HeavyChart() {
 *     useRenderMetrics('HeavyChart');
 *     return <RechartsComponent />;
 *   }
 */
export function useRenderMetrics(componentName: string): void {
  const renderStart = useRef(performance.now());

  useEffect(() => {
    const duration = performance.now() - renderStart.current;
    // Only record renders that are measurable (> 0.5ms)
    if (duration > 0.5) {
      PerformanceMonitor.recordRender(componentName, duration);
    }
    // Reset for next render
    renderStart.current = performance.now();
  });
}

/**
 * Standalone init function — call from main.tsx to auto-instrument Web Vitals.
 */
export function initPerformanceObservation(): void {
  if (process.env.NODE_ENV !== 'production') {
    return; // only instrument in production to avoid dev noise
  }
  PerformanceMonitor.observeWebVitals();
}
