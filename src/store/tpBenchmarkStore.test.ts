import { describe, it, expect, beforeEach } from 'vitest';
import { useTPBenchmarkStore } from './tpBenchmarkStore';
import { setClock, resetClock } from '@/utils/clock';

/**
 * Phase 8: benchmark attachment is a recorded human action — it demands
 * a study reference and a sane range, and stamps the clock time.
 */
describe('tpBenchmarkStore', () => {
  beforeEach(() => {
    setClock('2026-10-15T09:00:00.000Z');
    useTPBenchmarkStore.setState({ benchmarks: {} });
  });

  it('attaches with a study reference and clock timestamp', () => {
    useTPBenchmarkStore.getState().attachBenchmark('tx-1', {
      margin: 10,
      rangeLow: 7,
      rangeHigh: 12,
      studyRef: '2026 TNMM benchmark study',
    });
    const b = useTPBenchmarkStore.getState().benchmarks['tx-1']!;
    expect(b.margin).toBe(10);
    expect(b.attestedAt).toBe('2026-10-15T09:00:00.000Z');
    resetClock();
  });

  it('refuses evidence-free or inverted-range attachments', () => {
    expect(() =>
      useTPBenchmarkStore.getState().attachBenchmark('tx-1', {
        margin: 10,
        rangeLow: 7,
        rangeHigh: 12,
        studyRef: '  ',
      })
    ).toThrow(/study reference/i);
    expect(() =>
      useTPBenchmarkStore.getState().attachBenchmark('tx-1', {
        margin: 10,
        rangeLow: 12,
        rangeHigh: 7,
        studyRef: 'study',
      })
    ).toThrow(/range/i);
    expect(useTPBenchmarkStore.getState().benchmarks).toEqual({});
    resetClock();
  });

  it('removes attachments, returning the row to unbenchmarked', () => {
    useTPBenchmarkStore.getState().attachBenchmark('tx-1', {
      margin: 10,
      rangeLow: 7,
      rangeHigh: 12,
      studyRef: 'study',
    });
    useTPBenchmarkStore.getState().removeBenchmark('tx-1');
    expect(useTPBenchmarkStore.getState().benchmarks).toEqual({});
    resetClock();
  });
});
