import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { masterStorage } from '@/utils/masterStorage';
import { nowISO } from '@/utils/clock';
import type { TPBenchmark } from '@/pages/tax/transferPricingData';

/**
 * Phase 8 — transfer-pricing benchmark attachments.
 *
 * Benchmark data (margins, arm's-length ranges, study references) is
 * external evidence: it exists only when a human attaches it from a
 * real benchmark study. Attaching is a human action recorded with the
 * study reference and a clock timestamp; it is never derived from the
 * ledger. Compliance is then COMPUTED (margin vs the attached range),
 * not granted by the attachment itself.
 */
interface TPBenchmarkState {
  benchmarks: Record<string, TPBenchmark>;
  attachBenchmark: (
    transactionId: string,
    data: { margin: number; rangeLow: number; rangeHigh: number; studyRef: string }
  ) => void;
  removeBenchmark: (transactionId: string) => void;
}

export const useTPBenchmarkStore = create<TPBenchmarkState>()(
  persist(
    (set) => ({
      benchmarks: {},

      attachBenchmark: (transactionId, data) => {
        if (!transactionId) throw new Error('A transaction is required to attach a benchmark');
        if (!data.studyRef.trim()) {
          throw new Error('A benchmark study reference is required — evidence, not assertion');
        }
        if (
          !Number.isFinite(data.margin) ||
          !Number.isFinite(data.rangeLow) ||
          !Number.isFinite(data.rangeHigh) ||
          data.rangeLow > data.rangeHigh
        ) {
          throw new Error('Benchmark margin and range must be finite, with rangeLow <= rangeHigh');
        }
        set((s) => ({
          benchmarks: {
            ...s.benchmarks,
            [transactionId]: {
              margin: data.margin,
              rangeLow: data.rangeLow,
              rangeHigh: data.rangeHigh,
              studyRef: data.studyRef.trim(),
              attestedAt: nowISO(),
            },
          },
        }));
      },

      removeBenchmark: (transactionId) =>
        set((s) => {
          const next = { ...s.benchmarks };
          delete next[transactionId];
          return { benchmarks: next };
        }),
    }),
    { name: 'tp-benchmark-store', storage: masterStorage, version: 1 }
  )
);
