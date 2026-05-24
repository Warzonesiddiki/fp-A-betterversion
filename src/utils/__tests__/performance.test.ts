import { describe, it, expect } from 'vitest';
import { trackWebVitals, getMetrics, clearMetrics } from '../performance';

describe('performance', () => {
  it('trackWebVitals does not throw when window is undefined', () => {
    expect(() => trackWebVitals()).not.toThrow();
  });

  it('getMetrics returns empty array initially', () => {
    clearMetrics();
    expect(getMetrics()).toEqual([]);
  });

  it('clearMetrics resets metrics', () => {
    clearMetrics();
    expect(getMetrics()).toHaveLength(0);
  });
});
