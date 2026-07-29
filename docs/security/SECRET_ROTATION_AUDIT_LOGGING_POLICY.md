# Secret Rotation & Audit Logging Policy

> **FinPlan Pro v1.0.0 — Phase 7, PATCH 12 (Hephaestus, 2026-06-16)**
> Owners: Security (Hephaestus) · Compliance (Themis) · Reliability (Atlas)
> Status: **SHIPPED** · Review cycle: **Quarterly** · Next review: 2026-09-16

---

## 1. Scope

This policy governs the lifecycle of all short-lived secrets in FinPlan Pro
v1.0.0 (JWT signing keys, HMAC secrets, API keys, session keys, encryption
keys, CSRF tokens) and the tamper-evident audit log that records every
creation, rotation, verification, and revocation event.

This document is binding on every code path that produces, consumes,
persists, or transports such a secret.

## 2. Rotation policy

### 2.1 Frequency

| Secret type  | Default TTL | Max TTL | Min TTL | Hard floor (rotation) |
| ------------ | ----------- | ------- | ------- | --------------------- |
| `jwt`        | 24 h        | 90 d    | 1 h     | 24 h                  |
| `hmac`       | 24 h        | 90 d    | 1 h     | 24 h                  |
| `api-key`    | 24 h        | 90 d    | 1 h     | 24 h                  |
| `session`    | 24 h        | 90 d    | 1 h     | 24 h                  |
| `encryption` | 24 h        | 90 d    | 1 h     | 24 h                  |
| `csrf`       | 24 h        | 90 d    | 1 h     | 24 h                  |

Rotation is mandatory:

- **On schedule** — every TTL window, automatically.
- **On compromise** — immediate, with `reason: 'compromised'`.
- **On personnel change** — when an owner with access leaves the team.
- **On incident** — as part of any containment playbook that touches a secret.

### 2.2 Grace period

When a secret is rotated, the old material is retained as a `previousMaterial`
on the old record, marked `status: 'rotating'`, and remains valid for
verification until the grace window elapses. The default grace is **1 hour**;
the maximum is **7 days**.

A grace period of `0` immediately invalidates the old material and is permitted
when the caller's threat model is "no backward compatibility during rotation"
(e.g. mass key compromise where stale tokens are themselves the threat).

### 2.3 Revocation

`revokeSecret(id, reason)` is **idempotent** and **immediate**:

- `status` flips to `'revoked'`.
- Both the primary and previous material are zero-filled in memory.
- All subsequent `verifySecret(id, ...)` calls return `valid: false, status: 'revoked'`,
  even within an active grace window.

A revocation is irreversible. To re-enable verification, a new secret must be
created — never "unrevoke" an old record.

### 2.4 Compromise response

A `reason: 'compromised'` flag in `createSecret` / `rotateSecret` /
`revokeSecret` propagates to the audit log and the surrounding runbook. A
compromise event **must**:

1. Revoke every secret in the same type-class and owner scope.
2. Trigger incident-response playbook `IR-SEC-002` (Key Compromise).
3. Notify the Security Lead (Hephaestus) and the Compliance Lead (Themis)
   within 15 minutes of detection (D-007 SLA).

## 3. Audit log policy

### 3.1 What is logged

Every call to `createSecret`, `rotateSecret`, `verifySecret`, `revokeSecret`,
and the internal `cleanupExpiredGrace` emits a `SecretRotationAuditEvent`.
The audit logger (a SHA-256 hash-chained append-only log) records:

- **id** — monotonic zero-padded string, e.g. `ev_00000003`.
- **timestamp** — epoch millis at append time.
- **actor** — user id, service name, or `'system'`.
- **eventType** — `'secret.created'`, `'secret.rotated'`, etc.
- **category** — always `'secret-rotation'` for SR events.
- **severity** — `info`, `notice`, `warning`, `error`, `critical`, `alert`,
  `emergency` (NIST SP 800-61r2).
- **payload** — structured event details, ≤ 64 KB.
- **source** — originating subsystem (e.g. `'auth'`, `'finplan-pro'`).
- **correlationId** — optional id linking related events.
- **eventHash** — SHA-256 of canonicalized fields + chain head + nonce.
- **prevChainHash** — chain head at append time.
- **nonce** — 16 random bytes (hex), guaranteeing unique hashes per event.

### 3.2 What is NOT logged

- Secret material (bytes), ever.
- `previousMaterial` (bytes), ever.
- Full request bodies, user agents, IP addresses (these belong in the
  HTTP access log, not the secret-rotation audit log).
- Anything that would defeat the 64 KB payload cap.

### 3.3 Integrity guarantees

The chain is built as:

```
eventHash_i = SHA-256(
  prevChainHash_i-1 || id || timestamp || actor || eventType
  || category || severity || canonicalize(payload)
  || source || correlationId || nonce
)
```

- **Insertion** of a synthetic event breaks the chain at the inserted index
  (its `prevChainHash` won't match the prior event's `eventHash`).
- **Deletion** of an event breaks the chain at the deleted index (its successor's
  `prevChainHash` no longer matches).
- **Mutation** of any field breaks the chain at the mutated index
  (the recomputed `eventHash` no longer matches).
- **Reordering** breaks the chain (successor's `prevChainHash` no longer
  matches the moved event's `eventHash`).

`verifyChain()` walks the log in O(N) and reports the first failing index.
A clean chain returns `valid: true, inspected: N, firstFailure: -1, reason: null`.

### 3.4 Retention

- In-memory FIFO cap: **100,000 events** (configurable).
- Truncation is a deliberate operational action; verifiers MUST compare
  against a snapshot exported prior to truncation.
- Snapshots are JSON or JSONL exports and can be `restore()`d into a fresh
  `AuditLogger` instance after chain validation.

### 3.5 What a verifier checks

`verifyChain()` does not trust any field except `eventHash` and `prevChainHash`.
Every other field is recomputed from the canonical event body. This means a
verifier that received a snapshot over an untrusted channel can detect
tampering without trusting the sender.

## 4. Threat model coverage

| CWE / SOC 2 | Mapped mechanism                                                         |
| ----------- | ------------------------------------------------------------------------ |
| CWE-200     | `getSecretMetadata()` returns fingerprint, never material.               |
| CWE-321     | `rotateSecret` always produces fresh material via CSRNG.                 |
| CWE-345     | Hash chain: any tampering detectable by `verifyChain()`.                 |
| CWE-532     | Material is held in `Uint8Array`, not in payload strings.                |
| CWE-613     | Every secret has explicit TTL + revocation path.                         |
| CWE-778     | Every lifecycle event is audited (this policy §3.1).                     |
| CWE-779     | 64 KB payload cap; no recursive payloads.                                |
| CWE-798     | No hardcoded fallbacks; secrets via CSRNG.                               |
| SOC 2 CC6.1 | Logical access (rotation/revocation) is centrally controlled.            |
| SOC 2 CC6.7 | Encryption key rotation is enforced (this policy §2.1).                  |
| SOC 2 CC7.1 | System monitoring via structured audit log.                              |
| SOC 2 CC7.2 | Anomaly detection via severity + category.                               |
| SOC 2 CC7.3 | Security event evaluation via chain integrity.                           |
| SOC 2 CC7.4 | Incident response via `export()` and `revokeSecret(..., 'compromised')`. |

## 5. Integration

### 5.1 Wiring the audit sink

```ts
import { SecretRotation, type SecretRotationAuditEvent } from '@/services/SecretRotation';
import { AuditLogger } from '@/services/AuditLogger';

const auditLog = AuditLogger.getInstance({ source: 'finplan-pro' });

const secretRotation = SecretRotation.getInstance({
  defaultActor: 'system',
  onAudit: async (e: SecretRotationAuditEvent) => {
    await auditLog.addEvent({
      actor: e.type === 'secret.rotated' ? (e as any).actor : 'sr',
      eventType: e.type,
      category: 'secret-rotation',
      severity: e.type === 'secret.rotated' && e.reason === 'compromised' ? 'critical' : 'info',
      payload: e as unknown as Record<string, unknown>,
      source: 'finplan-pro',
      correlationId: null,
    });
  },
});
```

The `onAudit` callback is awaited; failures inside the callback are swallowed
to keep the secret lifecycle reliable. Callers that need delivery guarantees
should persist events out-of-band (e.g. to a durable queue) before returning.

### 5.2 Calling rotation

```ts
// Schedule a rotation
const { newSecretId, oldSecretId, graceEndsAt } = await secretRotation.rotateSecret(currentId, {
  gracePeriodSeconds: 3600,
  reason: 'scheduled',
});
```

### 5.3 Verifying a token

```ts
const candidate = extractMaterialFromToken(token);
const { valid, status } = await secretRotation.verifySecret(secretId, candidate);
if (!valid) {
  // surface to caller: status === 'revoked' | 'expired' | 'rotating' (bad material)
}
```

## 6. Operational procedures

### 6.1 Daily

- Run `cleanupExpiredGrace()` once per hour (cron).
- Verify chain integrity: `auditLog.verifyChain()` once per hour.

### 6.2 Weekly

- Review `listSecrets()` for any secret with `status: 'expired'` that has
  not been cleaned up.
- Review audit log for `severity: 'critical' | 'alert' | 'emergency'` events.

### 6.3 Quarterly

- Rotate every secret on schedule, even if no incident has occurred.
- Review and update this policy.

### 6.4 On incident

- `revokeSecret(id, 'compromised')` immediately.
- Verify chain integrity; export a snapshot for forensics.
- Notify Security Lead and Compliance Lead per D-007 (5-min SLA).

## 7. Performance

| Operation                        | Typical | P99    | Notes                                 |
| -------------------------------- | ------- | ------ | ------------------------------------- |
| `createSecret`                   | <2 ms   | <5 ms  | One SHA-256 + CSRNG bytes.            |
| `rotateSecret`                   | <3 ms   | <8 ms  | One SHA-256 + CSRNG bytes + Map swap. |
| `verifySecret` (active)          | <0.5 ms | <2 ms  | Constant-time 32-byte compare.        |
| `verifySecret` (rotating)        | <0.5 ms | <2 ms  | Constant-time 32-byte compare.        |
| `revokeSecret`                   | <0.5 ms | <1 ms  | Zero-fills material buffers.          |
| `cleanupExpiredGrace` (1000 sec) | <5 ms   | <15ms  | Linear scan over rotating records.    |
| `AuditLogger.addEvent`           | <1 ms   | <3 ms  | One SHA-256 over canonicalized body.  |
| `AuditLogger.verifyChain` (10k)  | <50 ms  | <200ms | O(N) hash + compare.                  |

CSRNG draws (16-64 bytes) are negligible on modern hardware. SHA-256 via
Web Crypto runs at ~1 GB/s on typical CPUs.

## 8. Security considerations

- **Memory hygiene**: material is held in `Uint8Array` and zero-filled on
  rotation/revocation. JavaScript's GC may copy the buffer before zero-fill;
  for HSM-backed deployments, replace `Uint8Array` with a CSRNG-backed
  handle and defer zero-fill to the HSM. **Out of scope for v1.0.0**;
  tracked in `T-SEC-022`.
- **Side channels**: `verifySecret` uses constant-time byte comparison
  (`constantTimeBytesEqual`) to defeat timing side-channels.
- **Audit failures**: `onAudit` callbacks that throw do not crash the
  rotation path. Operators relying on guaranteed delivery must wrap the
  callback in a durable queue (see §5.1).
- **Truncation**: the in-memory 100,000-event cap is a deliberate cap; the
  chain head is **not** recomputed across the truncation boundary. Snapshots
  MUST be exported before truncation if verifiers need cross-truncation
  continuity.

## 9. Compliance traceability

| Control                                    | Evidence                                           |
| ------------------------------------------ | -------------------------------------------------- |
| SOC 2 CC6.1                                | `SecretRotation` class, `listSecrets()`            |
| SOC 2 CC6.7                                | TTL + rotation policy (§2.1, §2.2)                 |
| SOC 2 CC7.1                                | `AuditLogger` with category/severity fields        |
| SOC 2 CC7.2                                | Severity taxonomy (NIST SP 800-61r2)               |
| SOC 2 CC7.3                                | `eventHash` chain, `verifyChain()`                 |
| SOC 2 CC7.4                                | `export()`, `revokeSecret(..., 'compromised')`     |
| SOC 2 P4.1                                 | PII redaction deferred to PATCH 13 (`PIIRedactor`) |
| GDPR Art. 32                               | SHA-256 + CSRNG + zero-fill on revoke              |
| CWE-200, 321, 345, 532, 613, 778, 779, 798 | See §4                                             |

## 10. References

- `src/services/SecretRotation.ts` — implementation.
- `src/services/SecretRotation-AuditLogger.test.ts` — 63 tests, all passing.
- `src/services/AuditLogger.ts` — hash-chained log.
- `docs/security/SECURITY_HEADERS_CSRF_POLICY.md` — PATCH 11.
- `docs/codif/RULE_60_CASCADE_HOLD_ABORT_MERGE_TRAP.md` — CODIF 60 v0.1.

---

_End of policy — Hephaestus, 2026-06-16. CAVEMAN 19/19 HOLDS._
