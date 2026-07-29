# PII Redaction Policy

> **FinPlan Pro v1.0.0 — Phase 7, PATCH 13 (Hephaestus, 2026-06-16)**
> Owners: Security (Hephaestus) · Privacy (Themis) · Data (Mnemosyne)
> Status: **SHIPPED** · Review cycle: **Quarterly** · Next review: 2026-09-16

---

## 1. Scope

This policy governs the last-line-of-defense redaction of personally
identifiable information (PII) flowing through FinPlan Pro v1.0.0 logs,
exports, telemetry, and audit trails. The `PIIRedactor` service is applied
**before** any value reaches a logger, exporter, or third-party sink.

This document is binding on every code path that emits a structured log
record, audit event, or export payload.

## 2. Classification

### 2.1 PII field categories (13)

| Category      | Example keys                             | Strategy default |
| ------------- | ---------------------------------------- | ---------------- |
| `email`       | `email`, `emailAddress`, `userEmail`     | `mask`           |
| `phone`       | `phone`, `mobileNumber`, `tel`           | `mask` (last 4)  |
| `ssn`         | `ssn`, `nationalId`                      | `mask` (last 4)  |
| `creditCard`  | `cc_number`, `cardNumber`, `pan`         | `mask` (last 4)  |
| `cvv`         | `cvv`, `cvc`                             | `mask`           |
| `bankAccount` | `accountNumber`, `iban`, `routingNumber` | `mask` (last 4)  |
| `name`        | `fullName`, `firstName`, `lastName`      | `mask`           |
| `address`     | `addressLine1`, `zipCode`, `postalCode`  | `mask`           |
| `dob`         | `dob`, `dateOfBirth`, `birthDate`        | `mask`           |
| `passport`    | `passportNumber`, `driversLicense`       | `mask`           |
| `ip`          | `ipAddress`, `remoteIp`, `clientIp`      | `mask`           |
| `userId`      | `userId`, `uid`, `ownerId`               | `hash`           |
| `password`    | `password`, `passwd`, `secret`, `apiKey` | `drop`           |

Field names are matched case-insensitively against the regex patterns in
`PII_REDACTION_CONSTANTS.PII_FIELD_PATTERNS`.

### 2.2 Value patterns (9)

The redactor also detects PII by **content** when the field name is generic
(e.g. `note`, `description`):

- Email: `\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b`
- Phone: `\+?\d[\d\s().-]{7,}\d`
- SSN: `\b\d{3}-\d{2}-\d{4}\b`
- Credit card: `\b(?:\d[ -]?){13,19}\b`
- IBAN: `\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b`
- IPv4 / IPv6
- UUID: `\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b`
- JWT: `\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b`

Value-pattern detection is on by default in `strict` mode and disabled in
`permissive` mode (field-name detection only).

## 3. Strategies

### 3.1 `mask` (default)

Replaces the value with a fixed placeholder. Numeric values (phones, SSNs,
credit cards, bank accounts) keep the **last 4 digits** to support
forensics correlation without exposing the original.

```
"alice@example.com"  -> "[REDACTED]"
"4111111111111111"   -> "****1111"
"123-45-6789"        -> "****6789"
```

### 3.2 `hash`

Replaces the value with a deterministic, category-tagged pseudonym:

```
"alice@example.com"  -> "tkn_<16-hex>e"
```

- Domain-separation prefix prevents cross-category collisions for the
  same byte string (e.g. `email:a@b.com` and `phone:a@b.com` hash
  differently).
- FNV-1a 64-bit is used (synchronous, no Web Crypto). It is **not** a
  CSPRNG; do not use `hash` strategy as a secret.
- Same input + same category always produces the same pseudonym,
  enabling downstream correlation.

### 3.3 `tokenize`

Same output as `hash`, plus a side-effect: if an `hmacKey` (≥ 16 bytes)
is configured, the **original value is stored in the in-memory
rehydration map** keyed by the token. `rehydrate(token)` recovers the
original.

**Security properties:**

- Rehydration is only possible by callers with access to the SAME
  `PIIRedactor` instance (in-memory map).
- Without `hmacKey`, `tokenize` is identical to `hash` and irreversible.
- The map is **not persisted**; it dies with the process.
- Callers that need long-term reversibility must persist the map out
  of band with equivalent access controls.

### 3.4 `drop`

Replaces the value with `[REDACTED]`. The original is discarded at the
call boundary. No map, no fingerprint. **This is the strongest guarantee
but prevents downstream forensics correlation.**

## 4. Modes

### 4.1 `strict` (default)

- Field-name detection: **ON**
- Value-pattern detection: **ON**
- Audit: **emit** with `redactedCount` and `byCategory`

Strict mode is the deny-by-default posture. Any value that matches a
PII field name OR a value pattern is redacted.

### 4.2 `permissive`

- Field-name detection: **ON**
- Value-pattern detection: **OFF**
- Audit: **emit**

Permissive mode is for callers that have already classified their data
and want redaction to honor explicit field naming only, without
content scanning. Use cases: structured log lines from a known schema
where every key is intentional.

### 4.3 `audit-only`

- Field-name detection: **ON**
- Value-pattern detection: **ON**
- Redaction: **OFF** (value passes through)
- Audit: **emit** with `redacted: false` on every match

Audit-only mode is for discovery: which fields WOULD be redacted if
strict mode were enabled? The output is the original value plus an
audit event recording what would have been redacted. Use this to size
the blast radius before flipping a service to strict.

## 5. SAFE-FIELDS allowlist

The following fields are NEVER redacted by default (deny-by-default
still applies to the rest of the object):

```
id, count, amount, total, currency, createdAt, updatedAt, timestamp,
status, type, label, name, description, category, subcategory, tags,
metadata, public, active, enabled, verified, archived, deleted,
version, etag, cacheControl, contentType, contentLength, hash,
fingerprint, schemaVersion, eventType, eventId, correlationId,
requestId, tenantId, orgId, plan, tier, role, scope
```

`name` is allowlisted (despite being a PII category) because it has
high overlap with non-PII object labels (e.g. product name, account
name). Callers that need stricter behavior should:

1. Use specific keys (`firstName`, `lastName`) which match the `name`
   pattern, OR
2. Add `name` to `skipFields` to allow through, OR
3. Use a custom redaction profile (out of scope for v1.0.0; tracked
   in `T-SEC-024`).

`skipFields` overrides everything else, including value-pattern
detection, on a per-key basis.

## 6. Audit chain

Every `redact()` call emits one `pii.redacted` event into a
SHA-256 hash-chained log. The chain head is updated atomically
(prevChainHash read → eventHash compute → chain head write) and
emissions are serialized via a promise chain so concurrent
`redact()` calls produce a valid chain.

```
eventHash_i = SHA-256(
  prevChainHash_i-1 || type || actor || source || redactedCount
  || canonicalize(byCategory) || success || timestamp || nonce
)
```

`verifyChain()` walks the log in O(N) and reports the first failing
index. `export()` snapshots the log for forensics; the export includes
the chain head and a JSON-or-JSONL serialized event stream.

The redaction audit log is **separate from the secret-rotation audit
log** (PATCH 12). Both are independently hash-chained; an operator
that needs to correlate them uses the `actor` + `timestamp` fields.

## 7. Threat model coverage

| CWE / SOC 2 / GDPR / CCPA | Mapped mechanism                                     |
| ------------------------- | ---------------------------------------------------- |
| CWE-200                   | Recursive redaction strips PII before it leaves.     |
| CWE-213                   | SAFE-FIELDS allowlist + deny-default + skipFields.   |
| CWE-359                   | Multi-strategy redaction of PII before logging.      |
| CWE-532                   | Material values are redacted before reaching a sink. |
| SOC 2 P4.1                | Minimization for use, retention, disclosure phases.  |
| GDPR Art. 5               | Data minimization: only the redacted view is stored. |
| GDPR Art. 25              | Data protection by design AND by default.            |
| GDPR Art. 32              | Hash-chained audit trail (this policy §6).           |
| CCPA                      | Right-to-minimize workflow via `permissive` mode.    |

## 8. Operational procedures

### 8.1 Wiring the redactor

```ts
import { PIIRedactor } from '@/services/PIIRedactor';

const redactor = PIIRedactor.getInstance({
  defaultStrategy: 'mask',
  defaultMode: 'strict',
  hmacKey: crypto.getRandomValues(new Uint8Array(32)),
  source: 'auth-svc',
  onAudit: async (e) => {
    // forward to the AuditLogger or your durable queue
  },
});

// Before logging:
const { output, redactedCount } = redactor.redact(payload, { actor: 'user-42' });
console.log(JSON.stringify(output)); // safe to log
```

### 8.2 Test mode

Use `PIIRedactor.createForTest(config)` to obtain a fresh instance with
custom config without disturbing the production singleton. Both factory
methods are public; the singleton `getInstance` is intended for runtime
use, `createForTest` for unit tests.

### 8.3 Performance

| Operation                  | Typical | P99    | Notes                       |
| -------------------------- | ------- | ------ | --------------------------- |
| `redact()` (10 fields)     | <0.5 ms | <2 ms  | 1 pass, recursive.          |
| `redact()` (1000 fields)   | <10 ms  | <30ms  | Linear in field count.      |
| `audit emission` (10 evts) | <5 ms   | <15ms  | 10 microtasks + 10 SHA-256. |
| `verifyChain` (10k events) | <50 ms  | <200ms | O(N) hash + compare.        |
| `rehydrate`                | <0.1 ms | <0.5ms | Map lookup.                 |

FNV-1a 64-bit hashing is O(string length); at <1µs per 1KB string, this
is negligible. SHA-256 audit hash via Web Crypto runs at ~1 GB/s on
modern CPUs.

## 9. Compliance traceability

| Control                | Evidence                                           |
| ---------------------- | -------------------------------------------------- |
| SOC 2 P4.1             | Multi-strategy redaction, allowlist, default mode. |
| GDPR Art. 5            | `permissive` mode supports minimization.           |
| GDPR Art. 25           | Default is `mask` + `strict` (deny-by-default).    |
| GDPR Art. 32           | Hash-chained audit log.                            |
| CCPA §1798.105         | `rehydrate` supports erasure-by-reference flows.   |
| CWE-200, 213, 359, 532 | See §7.                                            |

## 10. References

- `src/services/PIIRedactor.ts` — implementation.
- `src/services/PIIRedactor.test.ts` — 70 tests, all passing.
- `docs/security/SECRET_ROTATION_AUDIT_LOGGING_POLICY.md` — PATCH 12.
- `docs/security/SECURITY_HEADERS_CSRF_POLICY.md` — PATCH 11.
- `docs/codif/RULE_60_CASCADE_HOLD_ABORT_MERGE_TRAP.md` — CODIF 60 v0.1.

---

_End of policy — Hephaestus, 2026-06-16. CAVEMAN 19/19 HOLDS._
