<!-- DRAFT v0.1 — awaiting review — Hephaestus 2026-06-12 -->

# ADR-012: Data Storage Scoping (PII vs Business Data vs Regulated)

> **Status:** Proposed
> **Date:** 2026-06-12
> **Author:** Hephaestus (aionrs/MiniMax-M3)
> **Deciders:** Strategos (architectural) + Apollo (security MUSE) + Founder (sign-off)
> **Reviewers:** Athena, Hera, Mnemosyne, Prometheus
> **Replaces:** Implicit "all sensitive data is PII" framing in the original P0 #5 (`dataStore.ts` encryption finding)

---

## Context

The Hephaestus security audit 2026-06-12 originally framed the `dataStore.ts` P0 #5 finding as:

> "dataStore writes PII to localStorage directly. XSS exfiltrates raw PII."

Athena's cross-check the same day reframed: **`dataStore` contains dashboard and cube data (financial scenarios, allocations, variance analyses), NOT PII. PII lives in `authStore`** (user account data: email, name, role, login timestamps, MFA flags).

The mis-framing has three bad consequences:

1. **Wrong threat model.** XSS exfiltration is the wrong concern for `dataStore`. The right concerns are: (a) DoS via broken `JSON.parse` (corrupted localStorage = app refuses to start), (b) tenant isolation (one tenant's data bleeding into another's), (c) audit trail integrity (was this scenario modified? by whom? when?).

2. **Wrong remediation.** PII → encryption. Business data → integrity + availability + tenant isolation. The fix shapes are different. The original framing would have stalled the project on "encrypt everything."

3. **Wrong compliance mapping.** GDPR/CCPA right-to-erasure is a PII concern (authStore). SOC 2 CC6 (logical access) is the right framework for business data (dataStore).

## Decision

We classify every persisted store by data class using this decision tree:

```
Q1: Does the data identify a natural person? (GDPR Art. 4(1))
  Yes → PII. Encrypt at rest, minimize, right-to-erasure.
  No  → Go to Q2.

Q2: Is the data a trade secret or competitive intelligence? (revenue, costs, projections)
  Yes → Confidential Business Data. Integrity + tenant isolation + audit log.
  No  → Go to Q3.

Q3: Is the data required for regulatory reporting? (SOX, GDPR financial records, etc.)
  Yes → Regulated Data. Retention rules, hash-chain, immutable storage.
  No  → General App State. Availability + DoS resilience.
```

### Store Classification (Phase 0 closeout)

| Store                              | Q1  | Q2  | Q3  | Class                          | Phase 0 Fix                                   | Phase 1 Fix                                                      |
| ---------------------------------- | --- | --- | --- | ------------------------------ | --------------------------------------------- | ---------------------------------------------------------------- |
| `authStore`                        | ✅  | —   | —   | **PII**                        | Try/catch parse (DoS)                         | EncryptionEngine payload + server-side session (Phase 1 backend) |
| `dataStore` (cubes)                | ❌  | ✅  | ✅  | **Regulated Business Data**    | `safeJSONStorage` wrapper                     | Tenant-isolated encryption keys (Phase 1)                        |
| `scenarioStore`                    | ❌  | ✅  | ✅  | **Regulated Business Data**    | `safeJSONStorage` wrapper                     | Tenant-isolated encryption + SOX audit trail (Phase 1)           |
| `uiStore` (theme)                  | ❌  | ❌  | ❌  | **General App State**          | `safeJSONStorage` wrapper                     | —                                                                |
| `notificationStore`                | ❌  | ❌  | ❌  | **General App State**          | `safeJSONStorage` wrapper                     | —                                                                |
| `tourStore`                        | ❌  | ❌  | ❌  | **General App State**          | `safeJSONStorage` wrapper                     | —                                                                |
| `analyticsStore`                   | ❌  | ❌  | ❌  | **General App State**          | `safeJSONStorage` wrapper                     | —                                                                |
| `collaborationStore`               | ❌  | ❌  | ❌  | **General App State**          | `safeJSONStorage` wrapper                     | Server-side (Phase 1)                                            |
| `driverStore`                      | ❌  | ✅  | ❌  | **Confidential Business Data** | `safeJSONStorage` wrapper                     | Tenant isolation (Phase 1)                                       |
| `fxRateStore`                      | ❌  | ✅  | ❌  | **Confidential Business Data** | `safeJSONStorage` wrapper                     | —                                                                |
| `cubeStore` (engine instance)      | ❌  | ✅  | ✅  | **Regulated Business Data**    | `partialize` to exclude engine (already done) | —                                                                |
| `settingsStore`                    | ❌  | ❌  | ❌  | **General App State**          | `safeJSONStorage` wrapper                     | —                                                                |
| `varianceStore`                    | ❌  | ✅  | ✅  | **Regulated Business Data**    | `safeJSONStorage` wrapper                     | —                                                                |
| `budgetStore`                      | ❌  | ✅  | ✅  | **Regulated Business Data**    | `safeJSONStorage` wrapper                     | —                                                                |
| `auditLogStore` (trail, ADR-008) † | ❌  | ❌  | ✅  | **Regulated Data**             | Append-only, hash-chain                       | Server-side immutable (Phase 1) †                                |

† **`auditLogStore` is PLANNED, not yet built.** Per ADR-008 §6 (L75-79, L102), the canonical store is `src/store/auditLogStore.ts` (note: `auditLogStore` with "Log", not `auditStore`). ADR-009 §6 (L190) lists it as a CODEOWNERS-required file. ADR-006 §4 (L61) + §6 (L81) defines the per-store `retention: { class: 'audit' }` config. The **existing** implementation is the engine at `src/engines/AuditLogEngine.ts:148L` (148 lines, append-only, no hash chain yet — T-HEP-010 audit-chain verify cron cycle 8 ACCEPTED adds the hash chain). There is **no** `src/services/auditLog/` (Glob verified 2026-06-13). The Regulated Data class for audit logging is canonical in **ADR-008** — ADR-012 cross-references it via this footnote, not via an invented store row. See also Athena T-AT-009 board scan §7 (which mis-locates the audit log as a service layer; corrected here per D-009 triangulation).

### Phase 0 Fix (Apollo's mechanical sweep, P0 #5)

A single `safeJSONStorage` wrapper applied to ALL 35 stores. It is a **try/catch + FALLBACK_STATE** wrapper around `JSON.parse`/`JSON.stringify` to handle the DoS surface (corrupted localStorage):

```ts
// src/utils/safeJSONStorage.ts (sketch)
export function safeJSONStorage<T>(fallback: T): Storage<T> {
  return {
    getItem: (name) => {
      try {
        const raw = localStorage.getItem(name);
        return raw === null ? null : JSON.parse(raw);
      } catch {
        return fallback; // DoS resilience: never crash on corrupt data
      }
    },
    setItem: (name, value) => {
      try {
        localStorage.setItem(name, JSON.stringify(value));
      } catch (err) {
        // Quota exceeded or storage disabled — log and continue
        logger.warn('safeJSONStorage.setItem failed', err);
      }
    },
    removeItem: (name) => localStorage.removeItem(name),
  };
}
```

This is a **single mechanical sweep** across all 35 stores. Estimated 4-6 hours of work for Apollo.

### Phase 1 Fix (per-class remediation, in `docs/STRATEGIC_REVIEW_Q2_2026.md` §6)

- **PII (authStore)**: Server-side session + HttpOnly cookies. EncryptionEngine payload as defense-in-depth. Right-to-erasure endpoint for GDPR.
- **Confidential Business Data (dataStore, scenarioStore, etc.)**: Per-tenant encryption keys (BYOK), tenant-isolated namespaces in Postgres, encrypted-at-rest in storage layer.
- **Regulated Data (dataStore, scenarioStore, auditLogStore)**: Hash-chained audit log (canonical in ADR-008; T-HEP-010 cron adds SHA-256 chain), 7-year retention, immutable storage (R2 Object Lock Compliance mode, 60-day minimum, per Atlas T-ATL-012).
- **General App State (uiStore, notificationStore, etc.)**: `safeJSONStorage` is sufficient. No encryption needed.

## Consequences

### Positive

- **Right threat model per class.** PII gets the right to erasure; business data gets integrity; regulated data gets retention. No over-engineering, no under-engineering.
- **Single mechanical Phase 0 sweep.** 35 stores get the same `safeJSONStorage` wrapper. Cheap and uniform.
- **Phase 1 plans are clearer.** Per-class remediation is a known pattern (industry standard: Microsoft Purview, AWS Macie, Google Cloud DLP).
- **Compliance mapping is correct.** GDPR → PII. SOX → regulated business data. SOC 2 CC6 → all classes. CCPA → PII. No over-mapping, no under-mapping.

### Negative

- **Two-step remediation.** Phase 0 (safeJSONStorage) is not enough for PII or regulated data; Phase 1 must follow.
- **Documentation debt.** Each store now needs a JSDoc block stating its classification (PII / business / regulated / general). ~35 JSDoc additions, ~4 hours of work for Mnemosyne.
- **Migration risk.** Stores that currently assume no encryption (e.g., `dataStore`'s `partialize` excludes the `engine` Map) need a per-store audit to confirm Phase 0 is sufficient.

### Neutral

- **Phase 2 (encryption) is deferred.** This is intentional — encrypting all 35 stores with one key is a single point of failure; per-tenant keys require Phase 1 multi-tenant infrastructure first.

## Alternatives Considered

### A. Encrypt everything in Phase 0 (original framing)

**Rejected.** Single key for all 35 stores = single point of failure. Per-store key management is a Phase 1 backend concern. Encrypting the wrong things (general app state) wastes CPU + storage with no security benefit.

### B. Skip safeJSONStorage, rely on Phase 1 backend

**Rejected.** Phase 0 has real users (developers, internal pilots) using localStorage. Broken parse on corrupted data = app refuses to start = bad UX. `safeJSONStorage` is cheap insurance.

### C. Re-classify based on data type instead of use

**Considered.** Data-type classification (e.g., "all financial data is regulated") is broader than use-based. Use-based is more accurate: a scenario name is regulated; a chart title is general app state. Decision: use-based, per store, with a documented classification.

## Required Tests

```ts
// src/utils/safeJSONStorage.test.ts
import { safeJSONStorage } from '@/utils/safeJSONStorage';

describe('safeJSONStorage', () => {
  it('returns parsed value on valid JSON', () => {
    localStorage.setItem('k', '{"a":1}');
    expect(safeJSONStorage({}).getItem('k')).toEqual({ a: 1 });
  });

  it('returns fallback on corrupted JSON (DoS resilience)', () => {
    localStorage.setItem('k', '{BROKEN');
    expect(safeJSONStorage({ fallback: true }).getItem('k')).toEqual({ fallback: true });
  });

  it('returns fallback on parse error (undefined.map pattern)', () => {
    localStorage.setItem('k', 'undefined');
    expect(safeJSONStorage([]).getItem('k')).toEqual([]);
  });

  it('setItem does not throw on quota exceeded', () => {
    // Mock localStorage.setItem to throw QuotaExceededError
    const original = localStorage.setItem;
    localStorage.setItem = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    };
    expect(() => safeJSONStorage({}).setItem('k', { x: 1 })).not.toThrow();
    localStorage.setItem = original;
  });
});
```

## References

- **Hephaestus audit 2026-06-12** — P0 #5 finding (original "PII" framing)
- **Athena cross-check 2026-06-12** — reframing: dashboard/cube data ≠ PII
- **Apollo task 019ebce7-… P0 #5** — `safeJSONStorage` mechanical sweep
- **`memory/feedback-data-store-pii-scoping.md`** — full decision tree + per-store classification
- **GDPR Art. 4(1)** — definition of personal data
- **SOC 2 CC6.1** — logical access controls (relevant for all classes)
- **SOX § 404** — financial reporting controls (relevant for regulated business data)
- **ADR-008-audit-logging.md** (L75-79, L81, L102) — canonical scope for the audit log; planned `src/store/auditLogStore.ts` (NOT YET BUILT) + existing `src/engines/AuditLogEngine.ts:148L` (append-only engine, no hash chain yet)
- **ADR-006-data-retention.md** (L61, L81) — `auditLogStore` retention class = `audit`, per-store `retention: { class: 'audit' }` config
- **ADR-009-incident-response.md** (L190) — CODEOWNERS-required PR reference for `auditLogStore` changes
- **T-HEP-010** (cycle 8 ACCEPTED 2026-06-13) — `scripts/compliance/audit-chain-verify.ts` adds SHA-256 hash chain + Monday 02:00 UTC cron
- **T-AT-009 board scan §7 (2026-06-13)** — flagged the `auditStore` fabrication; this ADR-012 fix closes the finding

---

**Changelog:**

- v0.1 (2026-06-12, Hephaestus) — initial draft. 4-class decision tree, 35-store classification table, Phase 0/1 split, 4-test suite, 3 alternatives considered.
- v0.1.1 (2026-06-13, Hephaestus) — D-009 fix per Athena T-AT-009 §7. Renamed `auditStore` → `auditLogStore` per ADR-008 §6 canonical name. Added footnote † explaining: planned store per ADR-008 L75-79 (NOT YET BUILT), existing engine at `src/engines/AuditLogEngine.ts:148L`, NO `src/services/auditLog/` (Glob verified 2026-06-13). Updated References to cite ADR-008, ADR-006, ADR-009, T-HEP-010 (audit-chain cron cycle 8 ACCEPTED). The Regulated Data class for audit logging is canonical in ADR-008 — ADR-012 cross-references via footnote, not via an invented store row.
