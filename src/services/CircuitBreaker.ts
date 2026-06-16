// FinPlan Pro v1.0.0 — Phase 7 PATCH 14 (Hephaestus, 2026-06-16)
//
// SECURITY RATIONALE:
//   Wraps external or expensive internal calls in a state machine that
//   "trips" when failures exceed a threshold, preventing cascading failure.
//
// THREAT MODEL ADDRESSED:
//   - CWE-400 (Uncontrolled Resource Consumption)
//   - CWE-754 (Improper Check for Unusual or Exceptional Conditions)
//   - CWE-755 (Improper Handling of Exceptional Conditions)
//
// COMPLIANCE:
//   - SOC 2 A1.1 (Availability — capacity planning)
//   - SOC 2 A1.2 (Availability — environmental protections)
//   - SOC 2 CC7.2 (Anomaly detection)

export const CIRCUIT_BREAKER_CONSTANTS = {
  SCHEMA_VERSION: 1,
  DEFAULT_FAILURE_THRESHOLD: 5,
  MAX_FAILURE_THRESHOLD: 1_000_000,
  DEFAULT_COOLDOWN_MS: 30_000,
  MAX_COOLDOWN_MS: 24 * 60 * 60 * 1000,
  DEFAULT_SUCCESS_THRESHOLD: 2,
  MAX_SUCCESS_THRESHOLD: 1_000_000,
  DEFAULT_FAILURE_RATE_PERCENT: 50,
  MAX_FAILURE_RATE_PERCENT: 100,
  DEFAULT_WINDOW_MS: 60_000,
  MAX_WINDOW_MS: 24 * 60 * 60 * 1000,
  MAX_BREAKERS: 1_000,
  REASON_TRIPPED_THRESHOLD: 'failure-threshold',
  REASON_TRIPPED_RATE: 'failure-rate',
  REASON_MANUAL_OPEN: 'manual-open',
  REASON_RECOVERED: 'recovered',
  REASON_HALF_OPEN_PROBE: 'half-open-probe',
  REASON_CALL_REJECTED: 'rejected-open',
  REASON_CALL_FAILED: 'call-failed',
  REASON_CALL_SUCCEEDED: 'call-succeeded',
  BREAKER_ID_PREFIX: 'cb_',
  CALL_ID_PREFIX: 'cbc_',
  AUDIT_CATEGORY: 'system' as const,
} as const;

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerPolicy {
  id: string;
  label: string;
  failureThreshold: number;
  cooldownMs: number;
  successThreshold: number;
  failureRatePercent: number;
  windowMs: number;
  enabled: boolean;
  createdAt: number;
}

export interface CircuitBreakerPolicyOptions {
  label: string;
  failureThreshold?: number;
  cooldownMs?: number;
  successThreshold?: number;
  failureRatePercent?: number;
  windowMs?: number;
  enabled?: boolean;
}

export interface CircuitCallRequest {
  policyId: string;
  now?: number;
}

export interface CircuitCallResult {
  allowed: boolean;
  state: CircuitState;
  policyId: string;
  isProbe: boolean;
  nextProbeAt: number;
  auditEvent: CircuitBreakerAuditEvent;
}

export interface CircuitBreakerAuditEvent {
  id: string;
  policyId: string;
  state: CircuitState;
  event:
    | 'call-allowed'
    | 'call-rejected'
    | 'call-succeeded'
    | 'call-failed'
    | 'state-transition'
    | 'manual-open'
    | 'manual-close'
    | 'manual-reset';
  fromState?: CircuitState;
  toState?: CircuitState;
  reason: string;
  timestamp: number;
  correlationId: string;
}

export interface CircuitBreakerStats {
  policyCount: number;
  totalAllowed: number;
  totalRejected: number;
  totalSucceeded: number;
  totalFailed: number;
  totalProbes: number;
  openCount: number;
  halfOpenCount: number;
  closedCount: number;
}

interface BreakerState {
  policy: CircuitBreakerPolicy;
  state: CircuitState;
  stateSince: number;
  openUntil: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  windowSuccesses: number;
  windowFailures: number;
  windowStart: number;
  totalAllowed: number;
  totalRejected: number;
  totalSucceeded: number;
  totalFailed: number;
  totalProbes: number;
  isProbe: boolean;
}

export type CallOutcome = 'success' | 'failure';

export class CircuitBreaker {
  private readonly breakers = new Map<string, BreakerState>();
  private monotonicNow: (() => number) | null = null;
  private initialized = false;

  initialize(options?: { monotonicNow?: () => number }): void {
    if (options?.monotonicNow) this.monotonicNow = options.monotonicNow;
    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private now(): number {
    return this.monotonicNow ? this.monotonicNow() : Date.now();
  }

  registerPolicy(options: CircuitBreakerPolicyOptions): CircuitBreakerPolicy {
    if (!this.initialized) throw new Error('CircuitBreaker not initialized');
    if (this.breakers.size >= CIRCUIT_BREAKER_CONSTANTS.MAX_BREAKERS) {
      throw new Error(`Maximum breakers (${CIRCUIT_BREAKER_CONSTANTS.MAX_BREAKERS}) reached`);
    }
    const failureThreshold =
      options.failureThreshold ?? CIRCUIT_BREAKER_CONSTANTS.DEFAULT_FAILURE_THRESHOLD;
    const cooldownMs = options.cooldownMs ?? CIRCUIT_BREAKER_CONSTANTS.DEFAULT_COOLDOWN_MS;
    const successThreshold =
      options.successThreshold ?? CIRCUIT_BREAKER_CONSTANTS.DEFAULT_SUCCESS_THRESHOLD;
    const failureRatePercent =
      options.failureRatePercent ?? CIRCUIT_BREAKER_CONSTANTS.DEFAULT_FAILURE_RATE_PERCENT;
    const windowMs = options.windowMs ?? CIRCUIT_BREAKER_CONSTANTS.DEFAULT_WINDOW_MS;

    if (failureThreshold < 1) throw new Error('failureThreshold must be >= 1');
    if (failureThreshold > CIRCUIT_BREAKER_CONSTANTS.MAX_FAILURE_THRESHOLD) {
      throw new Error(
        `failureThreshold must be <= ${CIRCUIT_BREAKER_CONSTANTS.MAX_FAILURE_THRESHOLD}`
      );
    }
    if (cooldownMs < 1) throw new Error('cooldownMs must be >= 1');
    if (cooldownMs > CIRCUIT_BREAKER_CONSTANTS.MAX_COOLDOWN_MS) {
      throw new Error(`cooldownMs must be <= ${CIRCUIT_BREAKER_CONSTANTS.MAX_COOLDOWN_MS}`);
    }
    if (successThreshold < 1) throw new Error('successThreshold must be >= 1');
    if (successThreshold > CIRCUIT_BREAKER_CONSTANTS.MAX_SUCCESS_THRESHOLD) {
      throw new Error(
        `successThreshold must be <= ${CIRCUIT_BREAKER_CONSTANTS.MAX_SUCCESS_THRESHOLD}`
      );
    }
    if (failureRatePercent < 0 || failureRatePercent > 100) {
      throw new Error('failureRatePercent must be in [0, 100]');
    }
    if (windowMs < 1) throw new Error('windowMs must be >= 1');
    if (windowMs > CIRCUIT_BREAKER_CONSTANTS.MAX_WINDOW_MS) {
      throw new Error(`windowMs must be <= ${CIRCUIT_BREAKER_CONSTANTS.MAX_WINDOW_MS}`);
    }

    const id = `${CIRCUIT_BREAKER_CONSTANTS.BREAKER_ID_PREFIX}${this.shortRandomId()}`;
    const policy: CircuitBreakerPolicy = {
      id,
      label: options.label,
      failureThreshold,
      cooldownMs,
      successThreshold,
      failureRatePercent,
      windowMs,
      enabled: options.enabled ?? true,
      createdAt: this.now(),
    };
    this.breakers.set(id, {
      policy,
      state: 'closed',
      stateSince: this.now(),
      openUntil: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      windowSuccesses: 0,
      windowFailures: 0,
      windowStart: this.now(),
      totalAllowed: 0,
      totalRejected: 0,
      totalSucceeded: 0,
      totalFailed: 0,
      totalProbes: 0,
      isProbe: false,
    });
    return policy;
  }

  getPolicy(policyId: string): CircuitBreakerPolicy | null {
    const state = this.breakers.get(policyId);
    return state ? state.policy : null;
  }

  listPolicies(): CircuitBreakerPolicy[] {
    return Array.from(this.breakers.values()).map((s) => s.policy);
  }

  getState(policyId: string): CircuitState | null {
    const state = this.breakers.get(policyId);
    return state ? state.state : null;
  }

  beforeCall(request: CircuitCallRequest): CircuitCallResult {
    if (!this.initialized) throw new Error('CircuitBreaker not initialized');
    const state = this.breakers.get(request.policyId);
    if (!state) throw new Error(`Unknown breaker: ${request.policyId}`);
    const now = request.now ?? this.now();

    if (!state.policy.enabled) {
      return this.buildResult(
        state,
        false,
        false,
        0,
        now,
        'call-rejected',
        CIRCUIT_BREAKER_CONSTANTS.REASON_CALL_REJECTED
      );
    }

    if (now - state.windowStart >= state.policy.windowMs) {
      state.windowStart = now;
      state.windowSuccesses = 0;
      state.windowFailures = 0;
    }

    switch (state.state) {
      case 'closed': {
        state.totalAllowed += 1;
        return this.buildResult(
          state,
          true,
          false,
          0,
          now,
          'call-allowed',
          CIRCUIT_BREAKER_CONSTANTS.REASON_CALL_SUCCEEDED
        );
      }
      case 'open': {
        if (now >= state.openUntil) {
          this.transitionState(state, 'open', 'half-open', now);
          state.consecutiveSuccesses = 0;
          state.consecutiveFailures = 0;
          state.isProbe = true;
          state.totalProbes += 1;
          state.totalAllowed += 1;
          return this.buildResult(
            state,
            true,
            true,
            0,
            now,
            'state-transition',
            CIRCUIT_BREAKER_CONSTANTS.REASON_HALF_OPEN_PROBE
          );
        }
        state.totalRejected += 1;
        return this.buildResult(
          state,
          false,
          false,
          state.openUntil,
          now,
          'call-rejected',
          CIRCUIT_BREAKER_CONSTANTS.REASON_CALL_REJECTED
        );
      }
      case 'half-open': {
        if (state.isProbe) {
          state.totalRejected += 1;
          return this.buildResult(
            state,
            false,
            false,
            0,
            now,
            'call-rejected',
            CIRCUIT_BREAKER_CONSTANTS.REASON_CALL_REJECTED
          );
        }
        state.isProbe = true;
        state.totalProbes += 1;
        state.totalAllowed += 1;
        return this.buildResult(
          state,
          true,
          true,
          0,
          now,
          'call-allowed',
          CIRCUIT_BREAKER_CONSTANTS.REASON_HALF_OPEN_PROBE
        );
      }
    }
  }

  recordOutcome(policyId: string, outcome: CallOutcome, now?: number): CircuitBreakerAuditEvent {
    if (!this.initialized) throw new Error('CircuitBreaker not initialized');
    const state = this.breakers.get(policyId);
    if (!state) throw new Error(`Unknown breaker: ${policyId}`);
    const t = now ?? this.now();
    state.isProbe = false;

    if (outcome === 'success') {
      state.totalSucceeded += 1;
      state.windowSuccesses += 1;
      state.consecutiveFailures = 0;
      state.consecutiveSuccesses += 1;

      if (state.state === 'half-open') {
        if (state.consecutiveSuccesses >= state.policy.successThreshold) {
          this.transitionState(state, 'half-open', 'closed', t);
          state.consecutiveSuccesses = 0;
          state.consecutiveFailures = 0;
          state.windowSuccesses = 0;
          state.windowFailures = 0;
          return this.buildResult(
            state,
            true,
            false,
            0,
            t,
            'state-transition',
            CIRCUIT_BREAKER_CONSTANTS.REASON_RECOVERED
          ).auditEvent;
        }
      }
      return this.buildResult(
        state,
        true,
        false,
        0,
        t,
        'call-succeeded',
        CIRCUIT_BREAKER_CONSTANTS.REASON_CALL_SUCCEEDED
      ).auditEvent;
    }

    state.totalFailed += 1;
    state.windowFailures += 1;
    state.consecutiveSuccesses = 0;
    state.consecutiveFailures += 1;

    if (state.state === 'half-open') {
      this.transitionState(state, 'half-open', 'open', t);
      state.openUntil = t + state.policy.cooldownMs;
      state.consecutiveFailures = 0;
      return this.buildResult(
        state,
        true,
        false,
        0,
        t,
        'state-transition',
        CIRCUIT_BREAKER_CONSTANTS.REASON_TRIPPED_THRESHOLD
      ).auditEvent;
    }

    if (state.state === 'closed') {
      if (state.consecutiveFailures >= state.policy.failureThreshold) {
        this.transitionState(state, 'closed', 'open', t);
        state.openUntil = t + state.policy.cooldownMs;
        return this.buildResult(
          state,
          true,
          false,
          0,
          t,
          'state-transition',
          CIRCUIT_BREAKER_CONSTANTS.REASON_TRIPPED_THRESHOLD
        ).auditEvent;
      }
      const total = state.windowSuccesses + state.windowFailures;
      if (total >= state.policy.failureThreshold) {
        const rate = (state.windowFailures / total) * 100;
        if (rate >= state.policy.failureRatePercent) {
          this.transitionState(state, 'closed', 'open', t);
          state.openUntil = t + state.policy.cooldownMs;
          return this.buildResult(
            state,
            true,
            false,
            0,
            t,
            'state-transition',
            CIRCUIT_BREAKER_CONSTANTS.REASON_TRIPPED_RATE
          ).auditEvent;
        }
      }
    }
    return this.buildResult(
      state,
      true,
      false,
      0,
      t,
      'call-failed',
      CIRCUIT_BREAKER_CONSTANTS.REASON_CALL_FAILED
    ).auditEvent;
  }

  manualOpen(policyId: string, now?: number): void {
    const state = this.breakers.get(policyId);
    if (!state) throw new Error(`Unknown breaker: ${policyId}`);
    const t = now ?? this.now();
    this.transitionState(state, state.state, 'open', t);
    state.openUntil = t + state.policy.cooldownMs;
  }

  manualClose(policyId: string, now?: number): void {
    const state = this.breakers.get(policyId);
    if (!state) throw new Error(`Unknown breaker: ${policyId}`);
    const t = now ?? this.now();
    this.transitionState(state, state.state, 'closed', t);
    state.consecutiveFailures = 0;
    state.consecutiveSuccesses = 0;
    state.windowSuccesses = 0;
    state.windowFailures = 0;
    state.openUntil = 0;
  }

  reset(policyId: string, now?: number): void {
    const state = this.breakers.get(policyId);
    if (!state) throw new Error(`Unknown breaker: ${policyId}`);
    const t = now ?? this.now();
    this.transitionState(state, state.state, 'closed', t);
    state.consecutiveFailures = 0;
    state.consecutiveSuccesses = 0;
    state.windowSuccesses = 0;
    state.windowFailures = 0;
    state.openUntil = 0;
    state.totalAllowed = 0;
    state.totalRejected = 0;
    state.totalSucceeded = 0;
    state.totalFailed = 0;
    state.totalProbes = 0;
  }

  getStats(): CircuitBreakerStats {
    let totalAllowed = 0;
    let totalRejected = 0;
    let totalSucceeded = 0;
    let totalFailed = 0;
    let totalProbes = 0;
    let openCount = 0;
    let halfOpenCount = 0;
    let closedCount = 0;
    for (const s of this.breakers.values()) {
      totalAllowed += s.totalAllowed;
      totalRejected += s.totalRejected;
      totalSucceeded += s.totalSucceeded;
      totalFailed += s.totalFailed;
      totalProbes += s.totalProbes;
      if (s.state === 'open') openCount += 1;
      else if (s.state === 'half-open') halfOpenCount += 1;
      else closedCount += 1;
    }
    return {
      policyCount: this.breakers.size,
      totalAllowed,
      totalRejected,
      totalSucceeded,
      totalFailed,
      totalProbes,
      openCount,
      halfOpenCount,
      closedCount,
    };
  }

  async execute<T>(policyId: string, fn: () => Promise<T>, now?: number): Promise<T> {
    const before = this.beforeCall({ policyId, now });
    if (!before.allowed) {
      throw new CircuitOpenError(`Circuit '${policyId}' is open (${before.state})`, before);
    }
    try {
      const result = await fn();
      this.recordOutcome(policyId, 'success', now);
      return result;
    } catch (err) {
      this.recordOutcome(policyId, 'failure', now);
      throw err;
    }
  }

  static createForTest(options?: { monotonicNow?: () => number }): CircuitBreaker {
    const cb = new CircuitBreaker();
    cb.initialize(options);
    return cb;
  }

  private transitionState(
    state: BreakerState,
    from: CircuitState,
    to: CircuitState,
    now: number
  ): void {
    if (from === to) return;
    state.state = to;
    state.stateSince = now;
    if (to === 'open') {
      state.openUntil = now + state.policy.cooldownMs;
    }
    if (to === 'closed') {
      state.openUntil = 0;
    }
  }

  private buildResult(
    state: BreakerState,
    allowed: boolean,
    isProbe: boolean,
    nextProbeAt: number,
    now: number,
    event: CircuitBreakerAuditEvent['event'],
    reason: string
  ): CircuitCallResult {
    const id = `${CIRCUIT_BREAKER_CONSTANTS.CALL_ID_PREFIX}${this.shortRandomId()}`;
    const correlationId = `cb-${state.policy.id}-${now}-${this.shortRandomId()}`;
    return {
      allowed,
      state: state.state,
      policyId: state.policy.id,
      isProbe,
      nextProbeAt,
      auditEvent: {
        id,
        policyId: state.policy.id,
        state: state.state,
        event,
        reason,
        timestamp: now,
        correlationId,
      },
    };
  }

  private shortRandomId(): string {
    return Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  }
}

export class CircuitOpenError extends Error {
  readonly auditEvent: CircuitBreakerAuditEvent;
  readonly circuitState: CircuitState;
  readonly policyId: string;

  constructor(message: string, result: CircuitCallResult) {
    super(message);
    this.name = 'CircuitOpenError';
    this.auditEvent = result.auditEvent;
    this.circuitState = result.state;
    this.policyId = result.policyId;
  }
}

let _instance: CircuitBreaker | null = null;
export function getCircuitBreaker(): CircuitBreaker {
  if (!_instance) {
    _instance = new CircuitBreaker();
    _instance.initialize();
  }
  return _instance;
}

export function resetCircuitBreakerForTest(): void {
  _instance = null;
}
