/**
 * Performance Monitor — Track engine/operation timing
 *
 * Usage:
 *   const result = PerformanceMonitor.time('engine:three-statement', 'engine', () => {
 *     return ThreeStatementEngine.calculate(data);
 *   });
 */

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

interface PerformanceReport {
  summary: MetricSummary[];
  generatedAt: number;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static maxMetrics = 10_000;
  private static thresholds: Record<string, number> = {
    'engine:recalculate': 16,
    'engine:monte-carlo': 5000,
    'render:grid': 100,
    'render:chart': 200,
    'store:update': 8,
    'import:parse': 3000,
    'export:generate': 5000,
  };

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
    return result;
  }

  private static record(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics / 2);
    }
  }

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

    return { summary, generatedAt: Date.now() };
  }

  static clear(): void {
    this.metrics = [];
  }

  static setThreshold(name: string, ms: number): void {
    this.thresholds[name] = ms;
  }
}
