# Rate Limiting & Circuit Breaker Policy — FinPlan Pro v1.0.0

**Document ID:** RATE_LIMITING_CIRCUIT_BREAKER_POLICY v1.0.0
**Author:** Hephaestus (Security Muse)
**Effective date:** 2026-06-16
**Status:** LIVE (PICK B of CAVEMAN PERSIST PICK-CHAIN 2026-06-16)
**Source PATCHes:** PATCH 14 — `src/services/RateLimiter.ts`, `src/services/CircuitBreaker.ts`
**Authoritative cross-references:** SECURITY.md v1.0.0 §12 @ 384b8ac96; THREAT_MODEL.md (PATCH 10 `d0fe9107`); INCIDENT_RESPONSE.md (PATCH 9 GHOST-SHA `d445b721`)

---

## §1. Purpose and Scope

This policy establishes the canonical rate-limiting and circuit-breaking controls for FinPlan Pro v1.0.0, implemented in PATCH 14 (`RateLimiter.ts` + `CircuitBreaker.ts`). It bounds resource consumption at the request boundary and prevents cascading failure when downstream services degrade.

The two controls operate at **different layers** and are **complementary**:

- **RateLimiter** operates at the **edge** — it bounds the rate at which an identity (user, IP, API key) may invoke the system.
- **CircuitBreaker** operates at the **downstream** — it bounds the failure rate a downstream dependency may inflict on the system, fast-failing when that downstream is unhealthy.

## §2. Threat Model

| Threat                                               | CWE     | Mitigation                                                             |
| ---------------------------------------------------- | ------- | ---------------------------------------------------------------------- |
| Allocation of Resources Without Limits or Throttling | CWE-770 | §3 RateLimiter — every endpoint has identity-scoped bucket             |
| Uncontrolled Resource Consumption                    | CWE-400 | §3 RateLimiter (global concurrent cap) + §4 CircuitBreaker (fast-fail) |
| Improper Control of Interaction Frequency            | CWE-799 | §3.1 token bucket (per-identity)                                       |
| Improper Restriction of Power Consumption            | CWE-920 | §3.1 long-window counter (sub-second bursts detected)                  |
| Improper Check for Unusual Conditions                | CWE-754 | §4.1 three-state machine (closed/open/half-open)                       |
| Improper Handling of Exceptional Conditions          | CWE-755 | §4.2 failure classification (consecutive + rolling rate)               |

## §3. RateLimiter

### §3.1 Algorithm — token bucket with atomic refill

Each policy has:

- **Capacity** — burst budget (max tokens in the bucket).
- **Refill rate** — sustained throughput (tokens added per second).
- **Long window** — rolling window for sustained-attempt detection.
- **Sustained-deny threshold** — number of denials within the window that triggers auto-quarantine.
- **Max concurrent** — in-flight cap (optional, for backpressure).
- **Default cost** — token cost per request (default 1, supports weighted requests).

**Atomic refill:** On every `check()`, the bucket is refilled based on elapsed time, then the cost is consumed. The refill + consumption is logically atomic from the perspective of the caller — concurrent `check()` calls cannot race past the limit because the bucket state is per-identity (Map of buckets).

**Burst:** `capacity` tokens are available immediately on bucket creation, allowing a one-time burst up to the cap.

**Sustained rate:** `refillPerSecond` is the steady-state rate, regardless of burst.

### §3.2 Decision codes

| Code                         | Reason                                  | Action                                  |
| ---------------------------- | --------------------------------------- | --------------------------------------- |
| `allow`                      | Tokens available                        | Proceed                                 |
| `deny-bucket-empty`          | Tokens < cost                           | Retry after `retryAfterSeconds`         |
| `deny-global-concurrent-cap` | Global in-flight ≥ cap                  | Retry after 1s                          |
| `deny-policy-disabled`       | Operator disabled policy                | Refuse (do not retry)                   |
| `deny-identity-quarantined`  | Identity in quarantine (auto or manual) | Refuse until `quarantineEndsAt`         |
| `backpressure`               | Policy in-flight ≥ cap                  | Retry after 1s (operator can shed load) |

### §3.3 Default policies (v1.0.0)

| Policy                | Capacity | Refill/s       | Long window | Sustained-deny | Max concurrent | Cost |
| --------------------- | -------- | -------------- | ----------- | -------------- | -------------- | ---- |
| `auth.login`          | 5        | 0.1 (1/10s)    | 300s        | 10             | 5              | 1    |
| `auth.mfa`            | 3        | 0.05 (1/20s)   | 300s        | 5              | 3              | 1    |
| `auth.password-reset` | 3        | 0.0167 (1/min) | 3600s       | 3              | 2              | 1    |
| `api.finplan.read`    | 60       | 10             | 60s         | 100            | 50             | 1    |
| `api.finplan.write`   | 30       | 5              | 60s         | 30             | 20             | 1    |
| `api.finplan.export`  | 5        | 0.05 (1/20s)   | 3600s       | 3              | 2              | 1    |
| `session.heartbeat`   | 1        | 0.5 (1/2s)     | 60s         | 30             | 100            | 0.1  |
| `audit.query`         | 10       | 0.5 (1/2s)     | 60s         | 5              | 3              | 1    |

(Specific values may be tuned post-RATIFICATION_GATE based on production telemetry; defaults are conservative.)

### §3.4 Auto-quarantine

When a single identity hits `sustainedDenyThreshold` denials within `longWindowSeconds`, it is auto-quarantined for the duration of `longWindowSeconds`. Auto-quarantine releases automatically when the timer expires. Manual quarantine via `quarantineIdentity(policyId, identity, duration)` overrides the auto behavior.

### §3.5 Audit integration

Every `check()` emits a `RateLimiterAuditEvent` with `category=security-incident`. Production deployments MUST persist these events to the PATCH 12 `AuditLogger` (hash-chained) for non-repudiation. Sustained attempts (`sustainedAttempt=true`) MUST be alerted to the on-call security engineer per INCIDENT_RESPONSE.md §3 P2 (auth bypass) thresholds.

## §4. CircuitBreaker

### §4.1 State machine

```
   [closed] --failureThreshold consecutive failures--> [open]
   [closed] --rolling failure rate ≥ X% over Y calls--> [open]
       |
   [open] --cooldownMs elapsed, next call allowed--> [half-open] (probe)
       |
   [half-open] --successThreshold consecutive successes--> [closed]
   [half-open] --single failure--> [open]
```

**Closed** — All calls allowed. Counters track consecutive failures and rolling failure rate.

**Open** — All calls rejected. After `cooldownMs`, the next call is allowed (transition to half-open) to probe downstream health.

**Half-open** — Exactly one probe call is allowed at a time. `successThreshold` consecutive successes transition to closed. A single failure transitions back to open.

### §4.2 Failure detection

The breaker uses two complementary triggers:

- **Consecutive failures** (default 5) — catches repeated hard failures
- **Rolling failure rate** (default 50% over the window) — catches intermittent flakiness

Either trigger opens the breaker. The rolling window is configurable (default 60s); counters reset when the window expires.

### §4.3 Default breakers (v1.0.0)

| Breaker                  | Failure threshold | Cooldown | Success threshold | Failure rate | Window |
| ------------------------ | ----------------- | -------- | ----------------- | ------------ | ------ |
| `downstream.tax-api`     | 5                 | 30s      | 2                 | 50%          | 60s    |
| `downstream.market-data` | 10                | 60s      | 3                 | 30%          | 120s   |
| `downstream.bank-feed`   | 3                 | 120s     | 2                 | 50%          | 60s    |
| `downstream.email-send`  | 10                | 30s      | 3                 | 50%          | 60s    |
| `downstream.audit-store` | 5                 | 60s      | 2                 | 50%          | 60s    |

### §4.4 Operator override

`manualOpen` / `manualClose` / `reset` allow operators to override the state machine. Manual opens auto-close after `cooldownMs` (same as automatic opens). Manual closes clear all counters.

### §4.5 `execute()` helper

```ts
const result = await circuitBreaker.execute(policyId, async () => {
  return await fetchExternalService();
});
```

If the breaker is open, `execute()` throws `CircuitOpenError` immediately without invoking the function. On success, the outcome is recorded. On thrown error, the outcome is recorded as failure and the error is re-thrown.

## §5. Cross-cutting: RateLimiter + CircuitBreaker

**Two layers, two different failures:**

- RateLimiter protects **us** (the FinPlan backend) from being overwhelmed by clients.
- CircuitBreaker protects **us** (the FinPlan backend) from being overwhelmed by a failing downstream.

A typical request flow:

1. Client → RateLimiter.check(policyId, identity) — if denied, return 429.
2. Handler executes → CircuitBreaker.beforeCall(breakerPolicyId) — if denied, return 503.
3. Handler invokes downstream → recordOutcome(success | failure).
4. Handler returns → RateLimiter.release(policyId, identity).

Both layers emit audit events that flow into the PATCH 12 `AuditLogger`. Sustained rate-limit denials AND circuit-breaker trips are observable to the security/ops teams.

## §6. Compliance traceability

| Regime      | Control                                     | Section                           |
| ----------- | ------------------------------------------- | --------------------------------- |
| SOC 2 CC6.6 | Logical access — external boundary          | §3                                |
| SOC 2 A1.1  | Availability — capacity planning            | §3.5, §4                          |
| SOC 2 A1.2  | Availability — environmental protections    | §3.3, §4.3                        |
| SOC 2 CC7.2 | Anomaly detection                           | §3.5 (audit), §4.2 (rolling rate) |
| SOC 2 CC7.3 | Anomaly evaluation                          | §3.4 (auto-quarantine)            |
| CWE-770     | Allocation of resources without limits      | §3                                |
| CWE-400     | Uncontrolled resource consumption           | §3, §4                            |
| CWE-799     | Improper control of interaction frequency   | §3.1                              |
| CWE-920     | Improper restriction of power consumption   | §3.1                              |
| CWE-754     | Improper check for unusual conditions       | §4.1                              |
| CWE-755     | Improper handling of exceptional conditions | §4.2                              |

## §7. Performance

- **RateLimiter.check()** — O(1): one Map.get + one refill computation + one comparison. Sub-microsecond per call.
- **CircuitBreaker.beforeCall()** — O(1): one Map.get + one timestamp comparison. Sub-microsecond per call.
- **Memory** — bounded by `MAX_POLICIES * MAX_IDENTITIES_PER_POLICY * sizeof(BucketState)`. Default caps: 1,000 policies × 100,000 identities × ~80 bytes = ~8GB worst case. Production deployments should scope caps to actual usage (typically <100 policies, <10,000 identities).

## §8. Operational procedures

### §8.1 Adding a new rate-limit policy

1. Determine identity key (userId, IP, composite).
2. Determine capacity & refill rate (consult §3.3 for similar policies).
3. Determine cost (default 1, increase for expensive endpoints).
4. Add to default policy list §3.3 (or operator config in production).
5. Add integration test under `src/services/RateLimiter.test.ts`.

### §8.2 Adding a new circuit-breaker

1. Determine failure threshold (lower for critical paths, higher for resilient paths).
2. Determine cooldown (longer for slow-recovering downstreams).
3. Add to default breaker list §4.3.
4. Add integration test under `src/services/CircuitBreaker.test.ts`.

### §8.3 Incident response

- Sustained rate-limit denials → check downstream health (may indicate attack or legitimate load spike).
- Circuit-breaker open → check downstream, do NOT bypass the breaker (the breaker is protecting the system).
- Auto-quarantine storm → check for coordinated attack; consider raising `sustainedDenyThreshold` or shortening `longWindowSeconds`.

## §9. Cross-Muse cross-witness

| Muse                         | Section                                | Status                                                |
| ---------------------------- | -------------------------------------- | ----------------------------------------------------- |
| **Prometheus** (Performance) | §7                                     | PENDING — Prometheus to verify perf claims under load |
| **Vulcan** (Build/Deploy)    | §3.3, §4.3 (default policies/breakers) | PENDING — Vulcan to verify production config          |
| **Themis** (Compliance)      | §6                                     | PENDING — Themis to verify regulatory traceability    |
| **Mnemosyne** (Memory)       | §3.5 (audit integration)               | PENDING — Mnemosyne to verify retention policy        |

## §10. Change log

| Date       | Version | Author     | Change                                                                                                                                                              |
| ---------- | ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-16 | 1.0.0   | Hephaestus | Initial policy for PATCH 14 (RateLimiter + CircuitBreaker). Closes CWE-770, CWE-400, +CWE-799, +CWE-920, +CWE-754, +CWE-755. SOC 2 CC6.6, A1.1, A1.2, CC7.2, CC7.3. |

---

**End of RATE_LIMITING_CIRCUIT_BREAKER_POLICY v1.0.0**
