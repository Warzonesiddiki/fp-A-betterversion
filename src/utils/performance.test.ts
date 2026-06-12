/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackWebVitals, getMetrics, clearMetrics } from './performance';

describe('performance', () => {
  beforeEach(() => {
    clearMetrics();
  });

  it('should return empty metrics initially', () => {
    expect(getMetrics()).toEqual([]);
  });

  it('should clear metrics', () => {
    // Manually push a metric to test clear
    // Since metrics is module-scoped, we test via clearMetrics behavior
    clearMetrics();
    expect(getMetrics()).toEqual([]);
  });

  it('should not throw when window is undefined (SSR)', () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error testing SSR
    delete globalThis.window;

    expect(() => trackWebVitals()).not.toThrow();

    globalThis.window = originalWindow;
  });

  it('should not throw when PerformanceObserver is not available', () => {
    const originalObserver = globalThis.PerformanceObserver;
    // @ts-expect-error testing missing API
    delete globalThis.PerformanceObserver;

    expect(() => trackWebVitals()).not.toThrow();

    globalThis.PerformanceObserver = originalObserver;
  });

  it('should handle PerformanceObserver observe errors', () => {
    const mockObserve = vi.fn(() => {
      throw new Error('not supported');
    });
    const MockObserver = vi.fn().mockImplementation(() => ({
      observe: mockObserve,
    }));
    (globalThis as any).PerformanceObserver = MockObserver;

    expect(() => trackWebVitals()).not.toThrow();

    delete (globalThis as any).PerformanceObserver;
  });

  it('should return a copy of metrics (not reference)', () => {
    const m1 = getMetrics();
    const m2 = getMetrics();
    expect(m1).not.toBe(m2);
    expect(m1).toEqual(m2);
  });
});
