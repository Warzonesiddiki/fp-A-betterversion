/**
 * Performance monitoring utility for FinPlan Pro.
 * Tracks render times, engine execution, and API latency.
 * Named exports only — singleton pattern.
 */

interface MetricEntry {
  durations: number[];
  avg: number;
  min: number;
  max: number;
  count: number;
  p95: number;
  p99: number;
}

interface PerformanceReport {
  summary: Array<{
    name: string;
    category: string;
    count: number;
    avg: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  }>;
  generatedAt: number;
}

const metrics = new Map<string, number[]>();
const activeMarks = new Map<string, number>();

/** Start a named measurement */
export function startMeasure(name: string): void {
  activeMarks.set(name, performance.now());
}

/** End a named measurement and return duration in ms */
export function endMeasure(name: string): number {
  const start = activeMarks.get(name);
  if (start === undefined) {
    return 0;
  }
  const duration = performance.now() - start;
  activeMarks.delete(name);

  const entries = metrics.get(name) ?? [];
  entries.push(duration);
  metrics.set(name, entries);

  return duration;
}

/** Get aggregated metrics for all measurements */
export function getMetrics(): Record<string, MetricEntry> {
  const result: Record<string, MetricEntry> = {};

  for (const [name, durations] of metrics.entries()) {
    const sorted = [...durations].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((acc, d) => acc + d, 0);

    result[name] = {
      durations: sorted,
      avg: sum / count,
      min: sorted[0],
      max: sorted[count - 1],
      count,
      p95: sorted[Math.floor(count * 0.95)] ?? sorted[count - 1],
      p99: sorted[Math.floor(count * 0.99)] ?? sorted[count - 1],
    };
  }

  return result;
}

/** Get metrics for a single named measurement */
export function getMetric(name: string): MetricEntry | null {
  const durations = metrics.get(name);
  if (!durations || durations.length === 0) {
    return null;
  }
  const sorted = [...durations].sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((acc, d) => acc + d, 0);

  return {
    durations: sorted,
    avg: sum / count,
    min: sorted[0],
    max: sorted[count - 1],
    count,
    p95: sorted[Math.floor(count * 0.95)] ?? sorted[count - 1],
    p99: sorted[Math.floor(count * 0.99)] ?? sorted[count - 1],
  };
}

/** Reset all metrics */
export function resetMetrics(): void {
  metrics.clear();
  activeMarks.clear();
}

/** Log a formatted performance report to console */
export function logPerformanceReport(): void {
  const allMetrics = getMetrics();
  const entries = Object.entries(allMetrics);

  if (entries.length === 0) {
    return;
  }

  const tableData = entries.map(([name, entry]) => ({
    Name: name,
    Count: entry.count,
    'Avg (ms)': entry.avg.toFixed(2),
    'Min (ms)': entry.min.toFixed(2),
    'Max (ms)': entry.max.toFixed(2),
    'P95 (ms)': entry.p95.toFixed(2),
    'P99 (ms)': entry.p99.toFixed(2),
  }));

  console.group('%c[PerfMonitor] Performance Report', 'color: #3B82F6; font-weight: bold');
  console.table(tableData);
  console.groupEnd();
}

/** Measure an async function's execution time */
export async function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  startMeasure(name);
  try {
    return await fn();
  } finally {
    endMeasure(name);
  }
}

/** Measure a synchronous function's execution time */
export function measureSync<T>(name: string, fn: () => T): T {
  startMeasure(name);
  try {
    return fn();
  } finally {
    endMeasure(name);
  }
}

/** Check if any metric exceeds a threshold and log warnings */
export function checkThresholds(thresholds: Record<string, number>): boolean {
  let allPassed = true;
  const allMetrics = getMetrics();

  for (const [name, threshold] of Object.entries(thresholds)) {
    const metric = allMetrics[name];
    if (metric && metric.p95 > threshold) {
      console.warn(
        `[PerfMonitor] ${name} P95 (${metric.p95.toFixed(2)}ms) exceeds threshold (${threshold}ms)`
      );

      allPassed = false;
    }
  }

  return allPassed;
}

// ── Class-based API (used by tests and consumers that prefer OOP) ──

interface ClassMetric {
  name: string;
  category: string;
  durations: number[];
  threshold?: number;
}

export class PerformanceMonitor {
  private static metrics = new Map<string, ClassMetric>();

  /** Time a synchronous function and record the metric */
  static time<T>(name: string, category: string, fn: () => T): T {
    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = performance.now() - start;
      PerformanceMonitor.record(name, category, duration);
    }
  }

  /** Time an async function and record the metric */
  static async timeAsync<T>(name: string, category: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      PerformanceMonitor.record(name, category, duration);
    }
  }

  /** Record a metric entry */
  private static record(name: string, category: string, duration: number): void {
    const key = `${category}:${name}`;
    const existing = PerformanceMonitor.metrics.get(key);
    if (existing) {
      existing.durations.push(duration);
    } else {
      PerformanceMonitor.metrics.set(key, { name, category, durations: [duration] });
    }
  }

  /** Set a threshold for a named metric */
  static setThreshold(name: string, thresholdMs: number): void {
    for (const [, metric] of PerformanceMonitor.metrics.entries()) {
      if (metric.name === name) {
        metric.threshold = thresholdMs;
      }
    }
    // Store for future entries
    PerformanceMonitor.metrics.set(`__threshold__:${name}`, {
      name,
      category: '__threshold__',
      durations: [],
      threshold: thresholdMs,
    });
  }

  /** Get a full performance report */
  static getReport(): PerformanceReport {
    const summary: PerformanceReport['summary'] = [];

    for (const [, metric] of PerformanceMonitor.metrics.entries()) {
      if (metric.category === '__threshold__') continue;

      const sorted = [...metric.durations].sort((a, b) => a - b);
      const count = sorted.length;
      const sum = sorted.reduce((acc, d) => acc + d, 0);

      summary.push({
        name: metric.name,
        category: metric.category,
        count,
        avg: count > 0 ? sum / count : 0,
        min: count > 0 ? sorted[0] : 0,
        max: count > 0 ? sorted[count - 1] : 0,
        p95: count > 0 ? (sorted[Math.floor(count * 0.95)] ?? sorted[count - 1]) : 0,
        p99: count > 0 ? (sorted[Math.floor(count * 0.99)] ?? sorted[count - 1]) : 0,
      });
    }

    return {
      summary,
      generatedAt: Date.now(),
    };
  }

  /** Clear all metrics */
  static clear(): void {
    PerformanceMonitor.metrics.clear();
  }
}
