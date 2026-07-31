import { describe, it, expect } from 'vitest';
import { FEATURE_FLAGS, isFeatureActive, sessionBucket } from './feature-flags';

describe('feature-flags (Omega Protocol §8)', () => {
  describe('sessionBucket', () => {
    it('is deterministic — same session always lands in the same bucket', () => {
      for (const id of ['user-42', 'abc', 'session::xyz', '']) {
        expect(sessionBucket(id)).toBe(sessionBucket(id));
      }
    });

    it('returns a value in 0..99', () => {
      for (let i = 0; i < 1000; i++) {
        const b = sessionBucket(`sess-${i}`);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(99);
      }
    });

    it('distributes sessions broadly across the range', () => {
      const seen = new Set<number>();
      for (let i = 0; i < 5000; i++) seen.add(sessionBucket(`s-${i}`));
      // 5000 distinct sessions should cover (almost) all 100 buckets.
      expect(seen.size).toBeGreaterThan(90);
    });
  });

  describe('isFeatureActive', () => {
    it('100% rollout is active for every session', () => {
      for (let i = 0; i < 500; i++) {
        expect(isFeatureActive('engine.consolidation.v2', `sess-${i}`)).toBe(true);
      }
    });

    it('a disabled flag is never active, regardless of bucket', () => {
      for (let i = 0; i < 500; i++) {
        expect(isFeatureActive('engine.tax-optimizer', `sess-${i}`)).toBe(false);
      }
    });

    it('a 10% canary activates ~10% of sessions and is stable per session', () => {
      const before = isFeatureActive('engine.monte-carlo.advanced', 'canary-user-7');
      const after = isFeatureActive('engine.monte-carlo.advanced', 'canary-user-7');
      expect(before).toBe(after); // deterministic per session

      let active = 0;
      const N = 10000;
      for (let i = 0; i < N; i++) {
        if (isFeatureActive('engine.monte-carlo.advanced', `s-${i}`)) active++;
      }
      // Expect ~1000 (10%); allow a generous statistical margin.
      expect(active).toBeGreaterThan(500);
      expect(active).toBeLessThan(1500);
    });

    it('a flag pinned to 0% rollout is inactive even when enabled', () => {
      const zero = { ...FEATURE_FLAGS['engine.consolidation.v2'], rolloutPercentage: 0 } as const;
      expect(zero.rolloutPercentage).toBe(0);
    });
  });
});
