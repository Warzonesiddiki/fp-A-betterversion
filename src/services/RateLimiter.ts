// FinPlan Pro v1.0.0 — Phase 7 PATCH 14 (Hephaestus, 2026-06-16)
//
// SECURITY RATIONALE:
//   Bounds resource consumption by enforcing per-identity request budgets
//   before they reach expensive handlers. Uses a token-bucket algorithm with
//   atomic refill so that concurrent requests cannot race past the limit.
//
// THREAT MODEL ADDRESSED:
//   - CWE-770 (Allocation of Resources Without Limits or Throttling)
//   - CWE-400 (Uncontrolled Resource Consumption)
//   - CWE-799 (Improper Control of Interaction Frequency)
//   - CWE-920 (Improper Restriction of Power Consumption)
//
// COMPLIANCE:
//   - SOC 2 CC6.6 (Logical access — external boundary)
//   - SOC 2 A1.1 (Availability — capacity planning)
//   - SOC 2 A1.2 (Availability — environmental protections)

export const RATE_LIMITER_CONSTANTS = {
  SCHEMA_VERSION: 1,
  MAX_CAPACITY: 1_000_000,
  MIN_CAPACITY: 1,
  DEFAULT_CAPACITY: 60,
  DEFAULT_REFILL_PER_SECOND: 1,
  MAX_REFILL_PER_SECOND: 1_000_000,
  MAX_POLICIES: 1_000,
  MAX_IDENTITIES_PER_POLICY: 100_000,
  DEFAULT_LONG_WINDOW_SECONDS: 60,
  MAX_LONG_WINDOW_SECONDS: 24 * 60 * 60,
  DEFAULT_SUSTAINED_DENY_THRESHOLD: 10,
  MAX_SUSTAINED_DENY_THRESHOLD: 10_000,
  DEFAULT_MAX_CONCURRENT: 0,
  MAX_MAX_CONCURRENT: 100_000,
  REASON_ALLOWED: 'allowed',
  REASON_DENIED_BUCKET_EMPTY: 'bucket-empty',
  REASON_DENIED_GLOBAL_CAP: 'global-concurrent-cap',
  REASON_DENIED_POLICY_DISABLED: 'policy-disabled',
  REASON_DENIED_IDENTITY_QUARANTINED: 'identity-quarantined',
  REASON_BACKPRESSURE: 'backpressure',
  POLICY_ID_PREFIX: 'rlp_',
  IDENTITY_ID_PREFIX: 'rid_',
  AUDIT_CATEGORY: 'security-incident' as const,
} as const;

export type RateLimitDecision =
  | 'allow'
  | 'deny-bucket-empty'
  | 'deny-global-concurrent-cap'
  | 'deny-policy-disabled'
  | 'deny-identity-quarantined'
  | 'backpressure';

export interface RateLimitPolicy {
  id: string;
  label: string;
  capacity: number;
  refillPerSecond: number;
  enabled: boolean;
  longWindowSeconds: number;
  sustainedDenyThreshold: number;
  maxConcurrent: number;
  defaultCost: number;
  createdAt: number;
}

export interface RateLimitPolicyOptions {
  label: string;
  capacity?: number;
  refillPerSecond?: number;
  enabled?: boolean;
  longWindowSeconds?: number;
  sustainedDenyThreshold?: number;
  maxConcurrent?: number;
  defaultCost?: number;
}

export interface RateLimitCheckRequest {
  policyId: string;
  identity: string;
  cost?: number;
  now?: number;
}

export interface RateLimitCheckResult {
  decision: RateLimitDecision;
  policyId: string;
  identity: string;
  remaining: number;
  refilled: number;
  capacity: number;
  retryAfterSeconds: number;
  sustainedAttempt: boolean;
  inFlight: number;
  auditEvent: RateLimiterAuditEvent;
}

export interface RateLimiterAuditEvent {
  id: string;
  policyId: string;
  identity: string;
  decision: RateLimitDecision;
  remaining: number;
  cost: number;
  timestamp: number;
  correlationId: string;
  sustainedAttempt: boolean;
}

export interface RateLimiterStats {
  policyCount: number;
  identityCount: number;
  totalAllowed: number;
  totalDenied: number;
  totalBackpressure: number;
  totalSustainedAttempts: number;
  quarantinedIdentityCount: number;
}

interface BucketState {
  tokens: number;
  lastRefillAt: number;
  denyCountWindow: number;
  windowStart: number;
  quarantined: boolean;
  quarantineEndsAt: number;
  id: string;
}

interface PolicyState {
  policy: RateLimitPolicy;
  identities: Map<string, BucketState>;
  inFlight: number;
  totalAllowed: number;
  totalDenied: number;
  totalBackpressure: number;
  totalSustainedAttempts: number;
}

export class RateLimiter {
  private readonly policies = new Map<string, PolicyState>();
  private readonly globalInFlight = { value: 0 };
  private globalMaxConcurrent = 0;
  private monotonicNow: (() => number) | null = null;
  private initialized = false;

  initialize(options?: { globalMaxConcurrent?: number; monotonicNow?: () => number }): void {
    if (options?.globalMaxConcurrent !== undefined) {
      if (options.globalMaxConcurrent < 0) {
        throw new Error('globalMaxConcurrent must be >= 0');
      }
      if (options.globalMaxConcurrent > RATE_LIMITER_CONSTANTS.MAX_MAX_CONCURRENT) {
        throw new Error(
          `globalMaxConcurrent must be <= ${RATE_LIMITER_CONSTANTS.MAX_MAX_CONCURRENT}`
        );
      }
      this.globalMaxConcurrent = options.globalMaxConcurrent;
    }
    if (options?.monotonicNow) {
      this.monotonicNow = options.monotonicNow;
    }
    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private now(): number {
    if (this.monotonicNow) return this.monotonicNow();
    return Date.now();
  }

  registerPolicy(options: RateLimitPolicyOptions): RateLimitPolicy {
    if (!this.initialized) {
      throw new Error('RateLimiter not initialized');
    }
    if (this.policies.size >= RATE_LIMITER_CONSTANTS.MAX_POLICIES) {
      throw new Error(`Maximum policies (${RATE_LIMITER_CONSTANTS.MAX_POLICIES}) reached`);
    }
    const capacity = options.capacity ?? RATE_LIMITER_CONSTANTS.DEFAULT_CAPACITY;
    const refillPerSecond =
      options.refillPerSecond ?? RATE_LIMITER_CONSTANTS.DEFAULT_REFILL_PER_SECOND;
    const longWindowSeconds =
      options.longWindowSeconds ?? RATE_LIMITER_CONSTANTS.DEFAULT_LONG_WINDOW_SECONDS;
    const sustainedDenyThreshold =
      options.sustainedDenyThreshold ?? RATE_LIMITER_CONSTANTS.DEFAULT_SUSTAINED_DENY_THRESHOLD;
    const maxConcurrent = options.maxConcurrent ?? RATE_LIMITER_CONSTANTS.DEFAULT_MAX_CONCURRENT;
    const defaultCost = options.defaultCost ?? 1;

    if (capacity < RATE_LIMITER_CONSTANTS.MIN_CAPACITY) {
      throw new Error(`capacity must be >= ${RATE_LIMITER_CONSTANTS.MIN_CAPACITY}`);
    }
    if (capacity > RATE_LIMITER_CONSTANTS.MAX_CAPACITY) {
      throw new Error(`capacity must be <= ${RATE_LIMITER_CONSTANTS.MAX_CAPACITY}`);
    }
    if (refillPerSecond <= 0) {
      throw new Error('refillPerSecond must be > 0');
    }
    if (refillPerSecond > RATE_LIMITER_CONSTANTS.MAX_REFILL_PER_SECOND) {
      throw new Error(`refillPerSecond must be <= ${RATE_LIMITER_CONSTANTS.MAX_REFILL_PER_SECOND}`);
    }
    if (longWindowSeconds <= 0) {
      throw new Error('longWindowSeconds must be > 0');
    }
    if (longWindowSeconds > RATE_LIMITER_CONSTANTS.MAX_LONG_WINDOW_SECONDS) {
      throw new Error(
        `longWindowSeconds must be <= ${RATE_LIMITER_CONSTANTS.MAX_LONG_WINDOW_SECONDS}`
      );
    }
    if (sustainedDenyThreshold < 0) {
      throw new Error('sustainedDenyThreshold must be >= 0');
    }
    if (sustainedDenyThreshold > RATE_LIMITER_CONSTANTS.MAX_SUSTAINED_DENY_THRESHOLD) {
      throw new Error(
        `sustainedDenyThreshold must be <= ${RATE_LIMITER_CONSTANTS.MAX_SUSTAINED_DENY_THRESHOLD}`
      );
    }
    if (maxConcurrent < 0) {
      throw new Error('maxConcurrent must be >= 0');
    }
    if (maxConcurrent > RATE_LIMITER_CONSTANTS.MAX_MAX_CONCURRENT) {
      throw new Error(`maxConcurrent must be <= ${RATE_LIMITER_CONSTANTS.MAX_MAX_CONCURRENT}`);
    }
    if (defaultCost < 1) {
      throw new Error('defaultCost must be >= 1');
    }
    if (defaultCost > capacity) {
      throw new Error('defaultCost must be <= capacity');
    }

    const id = `${RATE_LIMITER_CONSTANTS.POLICY_ID_PREFIX}${this.shortRandomId()}`;
    const policy: RateLimitPolicy = {
      id,
      label: options.label,
      capacity,
      refillPerSecond,
      enabled: options.enabled ?? true,
      longWindowSeconds,
      sustainedDenyThreshold,
      maxConcurrent,
      defaultCost,
      createdAt: this.now(),
    };
    this.policies.set(id, {
      policy,
      identities: new Map(),
      inFlight: 0,
      totalAllowed: 0,
      totalDenied: 0,
      totalBackpressure: 0,
      totalSustainedAttempts: 0,
    });
    return policy;
  }

  getPolicy(policyId: string): RateLimitPolicy | null {
    const state = this.policies.get(policyId);
    return state ? state.policy : null;
  }

  listPolicies(): RateLimitPolicy[] {
    return Array.from(this.policies.values()).map((s) => s.policy);
  }

  disablePolicy(policyId: string): void {
    const state = this.policies.get(policyId);
    if (!state) throw new Error(`Unknown policy: ${policyId}`);
    state.policy.enabled = false;
  }

  enablePolicy(policyId: string): void {
    const state = this.policies.get(policyId);
    if (!state) throw new Error(`Unknown policy: ${policyId}`);
    state.policy.enabled = true;
  }

  quarantineIdentity(policyId: string, identity: string, durationSeconds?: number): void {
    const state = this.policies.get(policyId);
    if (!state) throw new Error(`Unknown policy: ${policyId}`);
    const bucket = this.getOrCreateBucket(state, identity);
    const duration = durationSeconds ?? state.policy.longWindowSeconds;
    bucket.quarantined = true;
    bucket.quarantineEndsAt = this.now() + duration * 1000;
  }

  releaseIdentity(policyId: string, identity: string): void {
    const state = this.policies.get(policyId);
    if (!state) throw new Error(`Unknown policy: ${policyId}`);
    const bucket = state.identities.get(identity);
    if (!bucket) return;
    bucket.quarantined = false;
    bucket.quarantineEndsAt = 0;
    bucket.denyCountWindow = 0;
  }

  check(request: RateLimitCheckRequest): RateLimitCheckResult {
    if (!this.initialized) {
      throw new Error('RateLimiter not initialized');
    }
    const state = this.policies.get(request.policyId);
    if (!state) throw new Error(`Unknown policy: ${request.policyId}`);

    const now = request.now ?? this.now();
    const cost = request.cost ?? state.policy.defaultCost;
    if (cost < 1) {
      throw new Error('cost must be >= 1');
    }
    if (cost > state.policy.capacity) {
      throw new Error('cost must be <= policy capacity');
    }

    if (!state.policy.enabled) {
      return this.buildResult(
        state,
        request.identity,
        'deny-policy-disabled',
        0,
        0,
        state.policy.capacity,
        0,
        false,
        now,
        cost
      );
    }

    const bucket = this.getOrCreateBucket(state, request.identity);
    this.refillBucket(bucket, state.policy, now);

    if (bucket.quarantined) {
      if (bucket.quarantineEndsAt <= now) {
        bucket.quarantined = false;
        bucket.quarantineEndsAt = 0;
        bucket.denyCountWindow = 0;
      } else {
        this.recordDeny(state, bucket, now);
        const retryAfter = Math.max(0, Math.ceil((bucket.quarantineEndsAt - now) / 1000));
        return this.buildResult(
          state,
          request.identity,
          'deny-identity-quarantined',
          0,
          0,
          state.policy.capacity,
          retryAfter,
          false,
          now,
          cost
        );
      }
    }

    if (this.globalMaxConcurrent > 0 && this.globalInFlight.value >= this.globalMaxConcurrent) {
      this.recordDeny(state, bucket, now);
      return this.buildResult(
        state,
        request.identity,
        'deny-global-concurrent-cap',
        bucket.tokens,
        0,
        state.policy.capacity,
        1,
        false,
        now,
        cost
      );
    }

    if (state.policy.maxConcurrent > 0 && state.inFlight >= state.policy.maxConcurrent) {
      this.recordDeny(state, bucket, now);
      return this.buildResult(
        state,
        request.identity,
        'backpressure',
        bucket.tokens,
        0,
        state.policy.capacity,
        1,
        false,
        now,
        cost
      );
    }

    if (bucket.tokens < cost) {
      this.recordDeny(state, bucket, now);
      const tokensNeeded = cost - bucket.tokens;
      const retryAfter = Math.max(1, Math.ceil(tokensNeeded / state.policy.refillPerSecond));
      return this.buildResult(
        state,
        request.identity,
        'deny-bucket-empty',
        bucket.tokens,
        0,
        state.policy.capacity,
        retryAfter,
        bucket.denyCountWindow >= state.policy.sustainedDenyThreshold &&
          state.policy.sustainedDenyThreshold > 0,
        now,
        cost
      );
    }

    bucket.tokens -= cost;
    state.inFlight += 1;
    if (this.globalMaxConcurrent > 0) this.globalInFlight.value += 1;
    state.totalAllowed += 1;
    return this.buildResult(
      state,
      request.identity,
      'allow',
      bucket.tokens,
      0,
      state.policy.capacity,
      0,
      false,
      now,
      cost
    );
  }

  release(policyId: string, identity: string): void {
    const state = this.policies.get(policyId);
    if (!state) throw new Error(`Unknown policy: ${policyId}`);
    if (state.inFlight > 0) state.inFlight -= 1;
    if (this.globalMaxConcurrent > 0 && this.globalInFlight.value > 0) {
      this.globalInFlight.value -= 1;
    }
  }

  reset(): void {
    this.policies.clear();
    this.globalInFlight.value = 0;
    this.globalMaxConcurrent = 0;
    this.initialized = false;
  }

  getStats(): RateLimiterStats {
    let identityCount = 0;
    let quarantinedIdentityCount = 0;
    let totalAllowed = 0;
    let totalDenied = 0;
    let totalBackpressure = 0;
    let totalSustainedAttempts = 0;
    for (const state of this.policies.values()) {
      identityCount += state.identities.size;
      for (const bucket of state.identities.values()) {
        if (bucket.quarantined) quarantinedIdentityCount += 1;
      }
      totalAllowed += state.totalAllowed;
      totalDenied += state.totalDenied;
      totalBackpressure += state.totalBackpressure;
      totalSustainedAttempts += state.totalSustainedAttempts;
    }
    return {
      policyCount: this.policies.size,
      identityCount,
      totalAllowed,
      totalDenied,
      totalBackpressure,
      totalSustainedAttempts,
      quarantinedIdentityCount,
    };
  }

  static createForTest(options?: {
    globalMaxConcurrent?: number;
    monotonicNow?: () => number;
  }): RateLimiter {
    const rl = new RateLimiter();
    rl.initialize(options);
    return rl;
  }

  private getOrCreateBucket(state: PolicyState, identity: string): BucketState {
    let bucket = state.identities.get(identity);
    if (bucket) return bucket;
    if (state.identities.size >= RATE_LIMITER_CONSTANTS.MAX_IDENTITIES_PER_POLICY) {
      throw new Error(
        `Max identities per policy (${RATE_LIMITER_CONSTANTS.MAX_IDENTITIES_PER_POLICY}) reached`
      );
    }
    bucket = {
      tokens: state.policy.capacity,
      lastRefillAt: this.now(),
      denyCountWindow: 0,
      windowStart: this.now(),
      quarantined: false,
      quarantineEndsAt: 0,
      id: `${RATE_LIMITER_CONSTANTS.IDENTITY_ID_PREFIX}${this.shortRandomId()}`,
    };
    state.identities.set(identity, bucket);
    return bucket;
  }

  private refillBucket(bucket: BucketState, policy: RateLimitPolicy, now: number): void {
    const elapsedMs = Math.max(0, now - bucket.lastRefillAt);
    const elapsedSec = elapsedMs / 1000;
    const refilled = elapsedSec * policy.refillPerSecond;
    if (refilled > 0) {
      bucket.tokens = Math.min(policy.capacity, bucket.tokens + refilled);
      bucket.lastRefillAt = now;
    }
    if (now - bucket.windowStart >= policy.longWindowSeconds * 1000) {
      bucket.windowStart = now;
      bucket.denyCountWindow = 0;
    }
  }

  private recordDeny(state: PolicyState, bucket: BucketState, now: number): void {
    bucket.denyCountWindow += 1;
    state.totalDenied += 1;
    if (
      state.policy.sustainedDenyThreshold > 0 &&
      bucket.denyCountWindow === state.policy.sustainedDenyThreshold
    ) {
      bucket.quarantined = true;
      bucket.quarantineEndsAt = now + state.policy.longWindowSeconds * 1000;
      state.totalSustainedAttempts += 1;
    }
  }

  private buildResult(
    state: PolicyState,
    identity: string,
    decision: RateLimitDecision,
    remaining: number,
    refilled: number,
    capacity: number,
    retryAfterSeconds: number,
    sustainedAttempt: boolean,
    now: number,
    cost: number
  ): RateLimitCheckResult {
    if (decision === 'backpressure') state.totalBackpressure += 1;
    const id = `${RATE_LIMITER_CONSTANTS.IDENTITY_ID_PREFIX}${this.shortRandomId()}`;
    const correlationId = `rl-${state.policy.id}-${now}-${this.shortRandomId()}`;
    return {
      decision,
      policyId: state.policy.id,
      identity,
      remaining,
      refilled,
      capacity,
      retryAfterSeconds,
      sustainedAttempt,
      inFlight: state.inFlight,
      auditEvent: {
        id,
        policyId: state.policy.id,
        identity,
        decision,
        remaining,
        cost,
        timestamp: now,
        correlationId,
        sustainedAttempt,
      },
    };
  }

  private shortRandomId(): string {
    return Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  }
}

let _instance: RateLimiter | null = null;
export function getRateLimiter(): RateLimiter {
  if (!_instance) {
    _instance = new RateLimiter();
    _instance.initialize();
  }
  return _instance;
}

export function resetRateLimiterForTest(): void {
  if (_instance) _instance.reset();
  _instance = null;
}
