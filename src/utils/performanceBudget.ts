/**
 * Performance Budget — Monitor and enforce performance constraints
 * Tracks startup time, bundle size, calculation time, memory usage
 */

interface PerformanceMark {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  category: 'startup' | 'render' | 'engine' | 'store' | 'import' | 'export';
}

interface PerformanceBudgetConfig {
  startupTimeMs: number; // 2000ms on M1, 4000ms on mid-range
  bundleSizeInitialKB: number; // 2MB initial
  bundleSizeTotalKB: number; // 5MB total
  calculationTimeMs: number; // 16ms per frame
  memoryLimitMB: number; // 512MB soft limit
}

const defaultBudgets: PerformanceBudgetConfig = {
  startupTimeMs: 4000,
  bundleSizeInitialKB: 2048,
  bundleSizeTotalKB: 5120,
  calculationTimeMs: 16,
  memoryLimitMB: 512,
};

const marks = new Map<string, PerformanceMark>();
const history: PerformanceMark[] = [];
const maxHistory = 10000;

export class PerformanceBudget {
  private static budgets = { ...defaultBudgets };

  /**
   * Update budget thresholds
   */
  static setBudgets(budgets: Partial<PerformanceBudgetConfig>): void {
    Object.assign(this.budgets, budgets);
  }

  /**
   * Mark the start of a timed operation
   */
  static markStart(name: string, category: PerformanceMark['category'] = 'engine'): void {
    marks.set(name, {
      name,
      startTime: performance.now(),
      category,
    });
  }

  /**
   * Mark the end of a timed operation, returns duration in ms
   */
  static markEnd(name: string): number {
    const mark = marks.get(name);
    if (!mark) return 0;

    const endTime = performance.now();
    const duration = endTime - mark.startTime;

    const completed: PerformanceMark = {
      ...mark,
      endTime,
      duration,
    };

    marks.delete(name);
    history.push(completed);
    if (history.length > maxHistory) {
      history.splice(0, history.length - maxHistory);
    }

    return duration;
  }

  /**
   * Time a synchronous function
   */
  static time<T>(name: string, fn: () => T, category: PerformanceMark['category'] = 'engine'): T {
    this.markStart(name, category);
    try {
      return fn();
    } finally {
      this.markEnd(name);
    }
  }

  /**
   * Time an async function
   */
  static async timeAsync<T>(
    name: string,
    fn: () => Promise<T>,
    category: PerformanceMark['category'] = 'engine'
  ): Promise<T> {
    this.markStart(name, category);
    try {
      return await fn();
    } finally {
      this.markEnd(name);
    }
  }

  /**
   * Check if startup time is within budget
   */
  static checkStartupTime(): { pass: boolean; actual: number; budget: number } {
    const startupMarks = history.filter(
      (m) => m.category === 'startup' && m.name.startsWith('app.')
    );
    const totalStartup = startupMarks.reduce((sum, m) => sum + (m.duration ?? 0), 0);
    return {
      pass: totalStartup <= this.budgets.startupTimeMs,
      actual: Math.round(totalStartup),
      budget: this.budgets.startupTimeMs,
    };
  }

  /**
   * Check if calculation time is within budget
   */
  static checkCalculationTime(engineName: string): {
    pass: boolean;
    actual: number;
    budget: number;
  } {
    const engineMarks = history.filter((m) => m.name.includes(engineName));
    const avgDuration =
      engineMarks.length > 0
        ? engineMarks.reduce((sum, m) => sum + (m.duration ?? 0), 0) / engineMarks.length
        : 0;
    return {
      pass: avgDuration <= this.budgets.calculationTimeMs,
      actual: Math.round(avgDuration * 100) / 100,
      budget: this.budgets.calculationTimeMs,
    };
  }

  /**
   * Check current memory usage against budget
   */
  static checkMemory(): { pass: boolean; actual: number; budget: number; percentage: number } {
    const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
    const usedMB = mem ? mem.usedJSHeapSize / (1024 * 1024) : 0;
    return {
      pass: usedMB <= this.budgets.memoryLimitMB,
      actual: Math.round(usedMB),
      budget: this.budgets.memoryLimitMB,
      percentage: Math.round((usedMB / this.budgets.memoryLimitMB) * 100),
    };
  }

  /**
   * Get performance report
   */
  static getReport(): {
    startup: ReturnType<typeof PerformanceBudget.checkStartupTime>;
    memory: ReturnType<typeof PerformanceBudget.checkMemory>;
    recentMarks: PerformanceMark[];
    categoryBreakdown: Record<string, { count: number; avgMs: number; p95Ms: number }>;
    violations: string[];
  } {
    const startup = PerformanceBudget.checkStartupTime();
    const memory = PerformanceBudget.checkMemory();
    const recentMarks = history.slice(-100);

    // Category breakdown
    const byCategory = new Map<string, number[]>();
    for (const mark of history) {
      const existing = byCategory.get(mark.category) ?? [];
      existing.push(mark.duration ?? 0);
      byCategory.set(mark.category, existing);
    }

    const categoryBreakdown: Record<string, { count: number; avgMs: number; p95Ms: number }> = {};
    for (const [cat, durations] of byCategory) {
      durations.sort((a, b) => a - b);
      categoryBreakdown[cat] = {
        count: durations.length,
        avgMs: Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 100) / 100,
        p95Ms: Math.round(durations[Math.floor(durations.length * 0.95)] * 100) / 100,
      };
    }

    // Violations
    const violations: string[] = [];
    if (!startup.pass)
      violations.push(`Startup time ${startup.actual}ms exceeds budget ${startup.budget}ms`);
    if (!memory.pass)
      violations.push(`Memory ${memory.actual}MB exceeds budget ${memory.budget}MB`);

    // Check for slow calculations
    const slowCalcs = history.filter(
      (m) => m.category === 'engine' && (m.duration ?? 0) > this.budgets.calculationTimeMs
    );
    if (slowCalcs.length > 0) {
      const worst = slowCalcs.reduce((a, b) => ((a.duration ?? 0) > (b.duration ?? 0) ? a : b));
      violations.push(
        `Slow calculation: ${worst.name} took ${Math.round(worst.duration ?? 0)}ms (budget: ${this.budgets.calculationTimeMs}ms)`
      );
    }

    return { startup, memory, recentMarks, categoryBreakdown, violations };
  }

  /**
   * Clear history
   */
  static clear(): void {
    marks.clear();
    history.length = 0;
  }
}
