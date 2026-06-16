// FinPlan Pro v1.0.0 — Phase 7 PATCH 14 tests
//
// Tests for RateLimiter and CircuitBreaker. Uses deterministic time via
// injected monotonicNow so that bucket-refill behavior is reproducible.
//
// Coverage:
//   1. RateLimiter constants
//   2. RateLimiter init/singleton
//   3. RateLimiter policy registration
//   4. RateLimiter allow/deny (bucket-empty)
//   5. RateLimiter refill over time
//   6. RateLimiter sustained-deny auto-quarantine
//   7. RateLimiter manual quarantine / release
//   8. RateLimiter cost > 1 (token > 1)
//   9. RateLimiter policy disabled
//  10. RateLimiter global concurrent cap
//  11. RateLimiter policy concurrent cap (backpressure)
//  12. RateLimiter release()
//  13. RateLimiter reset() / getStats()
//  14. CircuitBreaker constants
//  15. CircuitBreaker init/singleton
//  16. CircuitBreaker closed state — allow
//  17. CircuitBreaker opens on consecutive failures
//  18. CircuitBreaker rejects while open
//  19. CircuitBreaker half-open after cooldown
//  20. CircuitBreaker recovers on half-open successes
//  21. CircuitBreaker re-opens on half-open failure
//  22. CircuitBreaker manual open/close/reset
//  23. CircuitBreaker rolling failure rate
//  24. CircuitBreaker disabled policy rejects
//  25. CircuitBreaker execute() helper
//  26. Cross-service — rate limit + circuit breaker integration

import { describe, test, expect, beforeEach, afterAll } from 'vitest';
import {
  RateLimiter,
  RATE_LIMITER_CONSTANTS,
  getRateLimiter,
  resetRateLimiterForTest,
} from './RateLimiter';
import {
  CircuitBreaker,
  CIRCUIT_BREAKER_CONSTANTS,
  CircuitOpenError,
  getCircuitBreaker,
  resetCircuitBreakerForTest,
} from './CircuitBreaker';

let mockTime = 1_700_000_000_000; // 2023-11-14T22:13:20Z
const advance = (ms: number) => {
  mockTime += ms;
};
const now = () => mockTime;
const clock = { monotonicNow: now };

beforeEach(() => {
  mockTime = 1_700_000_000_000;
  resetRateLimiterForTest();
  resetCircuitBreakerForTest();
});

afterAll(() => {
  resetRateLimiterForTest();
  resetCircuitBreakerForTest();
});

// ---------------------------------------------------------------------------
// RateLimiter
// ---------------------------------------------------------------------------

describe('1. RateLimiter constants', () => {
  test('1.1 exposes schema version 1', () => {
    expect(RATE_LIMITER_CONSTANTS.SCHEMA_VERSION).toBe(1);
  });
  test('1.2 default capacity 60, default refill 1/s', () => {
    expect(RATE_LIMITER_CONSTANTS.DEFAULT_CAPACITY).toBe(60);
    expect(RATE_LIMITER_CONSTANTS.DEFAULT_REFILL_PER_SECOND).toBe(1);
  });
  test('1.3 has 5 decision codes', () => {
    expect(RATE_LIMITER_CONSTANTS.REASON_ALLOWED).toBe('allowed');
    expect(RATE_LIMITER_CONSTANTS.REASON_DENIED_BUCKET_EMPTY).toBe('bucket-empty');
    expect(RATE_LIMITER_CONSTANTS.REASON_DENIED_GLOBAL_CAP).toBe('global-concurrent-cap');
    expect(RATE_LIMITER_CONSTANTS.REASON_DENIED_POLICY_DISABLED).toBe('policy-disabled');
    expect(RATE_LIMITER_CONSTANTS.REASON_DENIED_IDENTITY_QUARANTINED).toBe('identity-quarantined');
    expect(RATE_LIMITER_CONSTANTS.REASON_BACKPRESSURE).toBe('backpressure');
  });
});

describe('2. RateLimiter init / singleton', () => {
  test('2.1 createForTest returns a fresh, initialized instance', () => {
    const rl = RateLimiter.createForTest();
    expect(rl.isInitialized()).toBe(true);
  });
  test('2.2 getRateLimiter returns a singleton', () => {
    const a = getRateLimiter();
    const b = getRateLimiter();
    expect(a).toBe(b);
  });
  test('2.3 check() before init throws', () => {
    const rl = new RateLimiter();
    expect(() =>
      rl.check({ policyId: 'p', identity: 'i' })
    ).toThrow(/not initialized/);
  });
});

describe('3. RateLimiter policy registration', () => {
  test('3.1 registerPolicy returns a policy with id prefix rlp_', () => {
    const rl = RateLimiter.createForTest();
    const p = rl.registerPolicy({ label: 'auth.login' });
    expect(p.id).toMatch(/^rlp_/);
    expect(p.label).toBe('auth.login');
    expect(p.capacity).toBe(60);
    expect(p.refillPerSecond).toBe(1);
  });
  test('3.2 getPolicy returns null for unknown', () => {
    const rl = RateLimiter.createForTest();
    expect(rl.getPolicy('rlp_doesnotexist')).toBeNull();
  });
  test('3.3 listPolicies returns all registered', () => {
    const rl = RateLimiter.createForTest();
    rl.registerPolicy({ label: 'a' });
    rl.registerPolicy({ label: 'b' });
    expect(rl.listPolicies().length).toBe(2);
  });
  test('3.4 invalid capacity throws', () => {
    const rl = RateLimiter.createForTest();
    expect(() => rl.registerPolicy({ label: 'x', capacity: 0 })).toThrow();
    expect(() =>
      rl.registerPolicy({ label: 'x', capacity: RATE_LIMITER_CONSTANTS.MAX_CAPACITY + 1 })
    ).toThrow();
  });
  test('3.5 invalid refill throws', () => {
    const rl = RateLimiter.createForTest();
    expect(() => rl.registerPolicy({ label: 'x', refillPerSecond: 0 })).toThrow();
  });
  test('3.6 defaultCost > capacity throws', () => {
    const rl = RateLimiter.createForTest();
    expect(() =>
      rl.registerPolicy({ label: 'x', capacity: 5, defaultCost: 10 })
    ).toThrow();
  });
});

describe('4. RateLimiter allow / deny (bucket empty)', () => {
  test('4.1 first request allowed, capacity-1 remaining', () => {
    const rl = RateLimiter.createForTest(clock);
    const p = rl.registerPolicy({ label: 'x', capacity: 3, refillPerSecond: 0.001 });
    const r = rl.check({ policyId: p.id, identity: 'i1' });
    expect(r.decision).toBe('allow');
    expect(r.remaining).toBe(2);
  });
  test('4.2 exhausts bucket then denies', () => {
    const rl = RateLimiter.createForTest(clock);
    const p = rl.registerPolicy({ label: 'x', capacity: 2, refillPerSecond: 0.001 });
    expect(rl.check({ policyId: p.id, identity: 'i1' }).decision).toBe('allow');
    expect(rl.check({ policyId: p.id, identity: 'i1' }).decision).toBe('allow');
    const r = rl.check({ policyId: p.id, identity: 'i1' });
    expect(r.decision).toBe('deny-bucket-empty');
    expect(r.retryAfterSeconds).toBeGreaterThan(0);
  });
  test('4.3 different identities are isolated', () => {
    const rl = RateLimiter.createForTest(clock);
    const p = rl.registerPolicy({ label: 'x', capacity: 1, refillPerSecond: 0.001 });
    expect(rl.check({ policyId: p.id, identity: 'a' }).decision).toBe('allow');
    expect(rl.check({ policyId: p.id, identity: 'a' }).decision).toBe('deny-bucket-empty');
    expect(rl.check({ policyId: p.id, identity: 'b' }).decision).toBe('allow');
  });
});

describe('5. RateLimiter refill over time', () => {
  test('5.1 after 1 second at 1/s, 1 token refilled', () => {
    const rl = RateLimiter.createForTest(clock);
    const p = rl.registerPolicy({ label: 'x', capacity: 2, refillPerSecond: 1 });
    rl.check({ policyId: p.id, identity: 'i' });
    rl.check({ policyId: p.id, identity: 'i' });
    expect(rl.check({ policyId: p.id, identity: 'i' }).decision).toBe('deny-bucket-empty');
    advance(1000);
    const r = rl.check({ policyId: p.id, identity: 'i' });
    expect(r.decision).toBe('allow');
    expect(r.remaining).toBe(0);
  });
  test('5.2 bucket capped at capacity', () => {
    const rl = RateLimiter.createForTest(clock);
    const p = rl.registerPolicy({ label: 'x', capacity: 5, refillPerSecond: 1 });
    rl.check({ policyId: p.id, identity: 'i' }); // 4
    advance(60_000); // 60s, would add 60 tokens but capped at 5
    const r = rl.check({ policyId: p.id, identity: 'i' });
    expect(r.decision).toBe('allow');
    expect(r.remaining).toBe(4); // 5 - 1
  });
});

describe('6. RateLimiter sustained-deny auto-quarantine', () => {
  test('6.1 hitting sustainedDenyThreshold auto-quarantines identity', () => {
    const rl = RateLimiter.createForTest(clock);
    const p = rl.registerPolicy({
      label: 'x',
      capacity: 1,
      refillPerSecond: 10,
      longWindowSeconds: 60,
      sustainedDenyThreshold: 3,
    });
    rl.check({ policyId: p.id, identity: 'i' }); // allow
    const d1 = rl.check({ policyId: p.id, identity: 'i' });
    expect(d1.decision).toBe('deny-bucket-empty');
    const d2 = rl.check({ policyId: p.id, identity: 'i' });
    expect(d2.decision).toBe('deny-bucket-empty');
    // 3rd deny hits the threshold.
    const d3 = rl.check({ policyId: p.id, identity: 'i' });
    expect(d3.decision).toBe('deny-bucket-empty');
    expect(d3.sustainedAttempt).toBe(true);
    // 4th call: now quarantined.
    const d4 = rl.check({ policyId: p.id, identity: 'i' });
    expect(d4.decision).toBe('deny-identity-quarantined');
  });
  test('6.2 quarantine releases after longWindowSeconds', () => {
    const rl = RateLimiter.createForTest(clock);
    const p = rl.registerPolicy({
      label: 'x',
      capacity: 1,
      refillPerSecond: 10,
      longWindowSeconds: 5,
      sustainedDenyThreshold: 2,
    });
    rl.check({ policyId: p.id, identity: 'i' });
    rl.check({ policyId: p.id, identity: 'i' });
    rl.check({ policyId: p.id, identity: 'i' }); // hit threshold
    expect(rl.check({ policyId: p.id, identity: 'i' }).decision).toBe('deny-identity-quarantined');
    advance(6_000); // past quarantine
    // Refill brings the bucket back too.
    const r = rl.check({ policyId: p.id, identity: 'i' });
    expect(r.decision).toBe('allow');
  });
});

describe('7. RateLimiter manual quarantine / release', () => {
  test('7.1 quarantineIdentity blocks calls', () => {
    const rl = RateLimiter.createForTest(clock);
    const p = rl.registerPolicy({ label: 'x' });
    rl.quarantineIdentity(p.id, 'i', 60);
    const r = rl.check({ policyId: p.id, identity: 'i' });
    expect(r.decision).toBe('deny-identity-quarantined');
  });
  test('7.2 releaseIdentity unblocks calls', () => {
    const rl = RateLimiter.createForTest(clock);
    const p = rl.registerPolicy({ label: 'x' });
    rl.quarantineIdentity(p.id, 'i', 60);
    rl.releaseIdentity(p.id, 'i');
    const r = rl.check({ policyId: p.id, identity: 'i' });
    expect(r.decision).toBe('allow');
  });
});

describe('8. RateLimiter cost > 1', () => {
  test('8.1 cost consumes multiple tokens', () => {
    const rl = RateLimiter.createForTest(clock);
    const p = rl.registerPolicy({ label: 'x', capacity: 10, refillPerSecond: 0.001 });
    const r = rl.check({ policyId: p.id, identity: 'i', cost: 5 });
    expect(r.decision).toBe('allow');
    expect(r.remaining).toBe(5);
  });
  test('8.2 cost > capacity throws', () => {
    const rl = RateLimiter.createForTest(clock);
    const p = rl.registerPolicy({ label: 'x', capacity: 5, refillPerSecond: 0.001 });
    expect(() => rl.check({ policyId: p.id, identity: 'i', cost: 10 })).toThrow();
  });
});

describe('9. RateLimiter policy disabled', () => {
  test('9.1 disabled policy denies all calls', () => {
    const rl = RateLimiter.createForTest(clock);
    const p = rl.registerPolicy({ label: 'x' });
    rl.disablePolicy(p.id);
    const r = rl.check({ policyId: p.id, identity: 'i' });
    expect(r.decision).toBe('deny-policy-disabled');
  });
  test('9.2 re-enabling restores', () => {
    const rl = RateLimiter.createForTest(clock);
    const p = rl.registerPolicy({ label: 'x' });
    rl.disablePolicy(p.id);
    rl.enablePolicy(p.id);
    const r = rl.check({ policyId: p.id, identity: 'i' });
    expect(r.decision).toBe('allow');
  });
});

describe('10. RateLimiter global concurrent cap', () => {
  test('10.1 calls beyond global cap are denied', () => {
    const rl = RateLimiter.createForTest({ ...clock, globalMaxConcurrent: 1 });
    const p = rl.registerPolicy({ label: 'x', capacity: 10, refillPerSecond: 0.001 });
    expect(rl.check({ policyId: p.id, identity: 'a' }).decision).toBe('allow');
    const r = rl.check({ policyId: p.id, identity: 'b' });
    expect(r.decision).toBe('deny-global-concurrent-cap');
    rl.release(p.id, 'a');
    const r2 = rl.check({ policyId: p.id, identity: 'b' });
    expect(r2.decision).toBe('allow');
  });
});

describe('11. RateLimiter policy concurrent cap (backpressure)', () => {
  test('11.1 calls beyond policy cap are backpressured', () => {
    const rl = RateLimiter.createForTest(clock);
    const p = rl.registerPolicy({
      label: 'x',
      capacity: 10,
      refillPerSecond: 0.001,
      maxConcurrent: 2,
    });
    expect(rl.check({ policyId: p.id, identity: 'a' }).decision).toBe('allow');
    expect(rl.check({ policyId: p.id, identity: 'b' }).decision).toBe('allow');
    const r = rl.check({ policyId: p.id, identity: 'c' });
    expect(r.decision).toBe('backpressure');
  });
});

describe('12. RateLimiter release()', () => {
  test('12.1 release decrements in-flight', () => {
    const rl = RateLimiter.createForTest(clock);
    const p = rl.registerPolicy({ label: 'x', capacity: 10, maxConcurrent: 1, refillPerSecond: 0.001 });
    rl.check({ policyId: p.id, identity: 'a' });
    rl.check({ policyId: p.id, identity: 'b' }); // backpressure
    rl.release(p.id, 'a');
    const r = rl.check({ policyId: p.id, identity: 'b' });
    expect(r.decision).toBe('allow');
  });
});

describe('13. RateLimiter reset / getStats', () => {
  test('13.1 getStats tracks allowed/denied counts', () => {
    const rl = RateLimiter.createForTest(clock);
    const p = rl.registerPolicy({ label: 'x', capacity: 2, refillPerSecond: 0.001 });
    rl.check({ policyId: p.id, identity: 'a' });
    rl.check({ policyId: p.id, identity: 'a' });
    rl.check({ policyId: p.id, identity: 'a' }); // deny
    const stats = rl.getStats();
    expect(stats.policyCount).toBe(1);
    expect(stats.identityCount).toBe(1);
    expect(stats.totalAllowed).toBe(2);
    expect(stats.totalDenied).toBe(1);
  });
  test('13.2 reset clears all state', () => {
    const rl = RateLimiter.createForTest(clock);
    rl.registerPolicy({ label: 'x' });
    rl.reset();
    expect(rl.isInitialized()).toBe(false);
    expect(rl.listPolicies().length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// CircuitBreaker
// ---------------------------------------------------------------------------

describe('14. CircuitBreaker constants', () => {
  test('14.1 schema version 1', () => {
    expect(CIRCUIT_BREAKER_CONSTANTS.SCHEMA_VERSION).toBe(1);
  });
  test('14.2 default failure threshold 5, cooldown 30s', () => {
    expect(CIRCUIT_BREAKER_CONSTANTS.DEFAULT_FAILURE_THRESHOLD).toBe(5);
    expect(CIRCUIT_BREAKER_CONSTANTS.DEFAULT_COOLDOWN_MS).toBe(30_000);
  });
});

describe('15. CircuitBreaker init / singleton', () => {
  test('15.1 createForTest returns initialized', () => {
    const cb = CircuitBreaker.createForTest(clock);
    expect(cb.isInitialized()).toBe(true);
  });
  test('15.2 getCircuitBreaker returns singleton', () => {
    const a = getCircuitBreaker();
    const b = getCircuitBreaker();
    expect(a).toBe(b);
  });
});

describe('16. CircuitBreaker closed state', () => {
  test('16.1 first call in closed state is allowed', () => {
    const cb = CircuitBreaker.createForTest(clock);
    const p = cb.registerPolicy({ label: 'x' });
    const r = cb.beforeCall({ policyId: p.id });
    expect(r.allowed).toBe(true);
    expect(r.state).toBe('closed');
  });
});

describe('17. CircuitBreaker opens on consecutive failures', () => {
  test('17.1 5 consecutive failures opens the breaker', () => {
    const cb = CircuitBreaker.createForTest(clock);
    const p = cb.registerPolicy({ label: 'x', failureThreshold: 5, cooldownMs: 1000 });
    for (let i = 0; i < 5; i += 1) {
      cb.recordOutcome(p.id, 'failure');
    }
    expect(cb.getState(p.id)).toBe('open');
  });
  test('17.2 a single success resets consecutive failures', () => {
    const cb = CircuitBreaker.createForTest(clock);
    const p = cb.registerPolicy({ label: 'x', failureThreshold: 5, cooldownMs: 1000 });
    for (let i = 0; i < 4; i += 1) cb.recordOutcome(p.id, 'failure');
    cb.recordOutcome(p.id, 'success');
    expect(cb.getState(p.id)).toBe('closed');
  });
});

describe('18. CircuitBreaker rejects while open', () => {
  test('18.1 call rejected when open', () => {
    const cb = CircuitBreaker.createForTest(clock);
    const p = cb.registerPolicy({ label: 'x', failureThreshold: 2, cooldownMs: 5000 });
    cb.recordOutcome(p.id, 'failure');
    cb.recordOutcome(p.id, 'failure');
    expect(cb.getState(p.id)).toBe('open');
    const r = cb.beforeCall({ policyId: p.id });
    expect(r.allowed).toBe(false);
    expect(r.state).toBe('open');
    expect(r.nextProbeAt).toBeGreaterThan(0);
  });
});

describe('19. CircuitBreaker half-open after cooldown', () => {
  test('19.1 next call after cooldown transitions to half-open', () => {
    const cb = CircuitBreaker.createForTest(clock);
    const p = cb.registerPolicy({ label: 'x', failureThreshold: 2, cooldownMs: 1000 });
    cb.recordOutcome(p.id, 'failure');
    cb.recordOutcome(p.id, 'failure');
    advance(1001);
    const r = cb.beforeCall({ policyId: p.id });
    expect(r.allowed).toBe(true);
    expect(r.state).toBe('half-open');
    expect(r.isProbe).toBe(true);
  });
  test('19.2 only one probe at a time in half-open', () => {
    const cb = CircuitBreaker.createForTest(clock);
    const p = cb.registerPolicy({ label: 'x', failureThreshold: 2, cooldownMs: 1000 });
    cb.recordOutcome(p.id, 'failure');
    cb.recordOutcome(p.id, 'failure');
    advance(1001);
    expect(cb.beforeCall({ policyId: p.id }).allowed).toBe(true);
    const second = cb.beforeCall({ policyId: p.id });
    expect(second.allowed).toBe(false);
  });
});

describe('20. CircuitBreaker recovers on half-open successes', () => {
  test('20.1 2 successes in half-open closes the breaker', () => {
    const cb = CircuitBreaker.createForTest(clock);
    const p = cb.registerPolicy({ label: 'x', failureThreshold: 2, cooldownMs: 1000, successThreshold: 2 });
    cb.recordOutcome(p.id, 'failure');
    cb.recordOutcome(p.id, 'failure');
    advance(1001);
    cb.beforeCall({ policyId: p.id });
    cb.recordOutcome(p.id, 'success');
    cb.recordOutcome(p.id, 'success');
    expect(cb.getState(p.id)).toBe('closed');
  });
});

describe('21. CircuitBreaker re-opens on half-open failure', () => {
  test('21.1 single failure in half-open re-opens', () => {
    const cb = CircuitBreaker.createForTest(clock);
    const p = cb.registerPolicy({ label: 'x', failureThreshold: 2, cooldownMs: 1000 });
    cb.recordOutcome(p.id, 'failure');
    cb.recordOutcome(p.id, 'failure');
    advance(1001);
    cb.beforeCall({ policyId: p.id });
    cb.recordOutcome(p.id, 'failure');
    expect(cb.getState(p.id)).toBe('open');
  });
});

describe('22. CircuitBreaker manual open/close/reset', () => {
  test('22.1 manualOpen forces open', () => {
    const cb = CircuitBreaker.createForTest(clock);
    const p = cb.registerPolicy({ label: 'x' });
    cb.manualOpen(p.id);
    expect(cb.getState(p.id)).toBe('open');
  });
  test('22.2 manualClose forces closed', () => {
    const cb = CircuitBreaker.createForTest(clock);
    const p = cb.registerPolicy({ label: 'x' });
    cb.manualOpen(p.id);
    cb.manualClose(p.id);
    expect(cb.getState(p.id)).toBe('closed');
  });
  test('22.3 reset clears counters and state', () => {
    const cb = CircuitBreaker.createForTest(clock);
    const p = cb.registerPolicy({ label: 'x', failureThreshold: 2 });
    cb.recordOutcome(p.id, 'failure');
    cb.recordOutcome(p.id, 'failure');
    cb.reset(p.id);
    expect(cb.getState(p.id)).toBe('closed');
    const stats = cb.getStats();
    expect(stats.totalFailed).toBe(0);
  });
});

describe('23. CircuitBreaker rolling failure rate', () => {
  test('23.1 high failure rate trips even without consecutive failures', () => {
    const cb = CircuitBreaker.createForTest(clock);
    const p = cb.registerPolicy({
      label: 'x',
      failureThreshold: 10,
      failureRatePercent: 50,
      windowMs: 1000,
    });
    // 5 successes, 5 failures interleaved.
    for (let i = 0; i < 5; i += 1) {
      cb.recordOutcome(p.id, 'success');
      cb.recordOutcome(p.id, 'failure');
    }
    expect(cb.getState(p.id)).toBe('open');
  });
});

describe('24. CircuitBreaker disabled policy', () => {
  test('24.1 disabled policy rejects all calls', () => {
    const cb = CircuitBreaker.createForTest(clock);
    const p = cb.registerPolicy({ label: 'x', enabled: false });
    const r = cb.beforeCall({ policyId: p.id });
    expect(r.allowed).toBe(false);
  });
});

describe('25. CircuitBreaker execute() helper', () => {
  test('25.1 successful call returns value', async () => {
    const cb = CircuitBreaker.createForTest(clock);
    const p = cb.registerPolicy({ label: 'x' });
    const result = await cb.execute(p.id, async () => 42);
    expect(result).toBe(42);
  });
  test('25.2 failed call throws', async () => {
    const cb = CircuitBreaker.createForTest(clock);
    const p = cb.registerPolicy({ label: 'x' });
    await expect(cb.execute(p.id, async () => { throw new Error('boom'); })).rejects.toThrow('boom');
  });
  test('25.3 open circuit throws CircuitOpenError', async () => {
    const cb = CircuitBreaker.createForTest(clock);
    const p = cb.registerPolicy({ label: 'x', failureThreshold: 1 });
    cb.recordOutcome(p.id, 'failure');
    let caught: unknown = null;
    try {
      await cb.execute(p.id, async () => 1);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(CircuitOpenError);
    if (caught instanceof CircuitOpenError) {
      expect(caught.circuitState).toBe('open');
    }
  });
});

// ---------------------------------------------------------------------------
// Cross-service integration
// ---------------------------------------------------------------------------

describe('26. RateLimiter + CircuitBreaker integration', () => {
  test('26.1 circuit-breaker open path is observable through rate-limiter audit', () => {
    const cb = CircuitBreaker.createForTest(clock);
    const rl = RateLimiter.createForTest(clock);
    const cbPolicy = cb.registerPolicy({ label: 'downstream.api', failureThreshold: 3 });
    const rlPolicy = rl.registerPolicy({ label: 'downstream.api', capacity: 100, refillPerSecond: 10 });
    // Fail 3 times to open the circuit.
    cb.recordOutcome(cbPolicy.id, 'failure');
    cb.recordOutcome(cbPolicy.id, 'failure');
    cb.recordOutcome(cbPolicy.id, 'failure');
    expect(cb.getState(cbPolicy.id)).toBe('open');
    // Rate limiter still allows (different layer), but breaker rejects.
    const rlResult = rl.check({ policyId: rlPolicy.id, identity: 'i' });
    expect(rlResult.decision).toBe('allow');
    const cbResult = cb.beforeCall({ policyId: cbPolicy.id });
    expect(cbResult.allowed).toBe(false);
  });
  test('26.2 in backpressure state, release() after handler completes', () => {
    const rl = RateLimiter.createForTest(clock);
    const p = rl.registerPolicy({ label: 'x', capacity: 10, maxConcurrent: 1, refillPerSecond: 0.001 });
    expect(rl.check({ policyId: p.id, identity: 'a' }).decision).toBe('allow');
    expect(rl.check({ policyId: p.id, identity: 'b' }).decision).toBe('backpressure');
    rl.release(p.id, 'a');
    expect(rl.check({ policyId: p.id, identity: 'b' }).decision).toBe('allow');
  });
});
