# ADR-006: Data Retention Policy (per data class)

<!-- DRAFT v0.1 — awaiting review — Hephaestus 2026-06-13 -->

- **Status:** DRAFT v0.1
- **Date:** 2026-06-13
- **Author:** Hephaestus
- **Supersedes:** none
- **Related:** [ADR-007 encryption-at-rest](./ADR-007-encryption-at-rest.md), [ADR-008 audit logging](./ADR-008-audit-logging.md), [ADR-009 incident response](./ADR-009-incident-response.md), [ADR-010 schema migration](./ADR-010-schema-migration-strategy.md), [ADR-012 data storage scoping](./ADR-012-data-storage-scoping.md)

## Context and Problem Statement

FinPlan Pro persists user financial data locally (browser SQLite WASM / Tauri SQLite) and will persist to a Cloudflare backend in Phase 1. Without an explicit retention policy:

- PII (account holder names, emails, contact info) lingers in local stores and on backup media indefinitely.
- Financial transactions (the "regulated data" class per ADR-012) have legal retention requirements (SOX: 7 years; GDPR: minimize; PCI: do not store unless required) that conflict.
- Audit logs grow unbounded, increasing PII blast radius and storage cost.
- Backup/restore behavior is undefined after schema migration (ADR-010).
- SOC 2 CC6.1.7 (data movement) and CC7.5 (recovery) cannot be satisfied without a written retention policy.

The team needs a single, machine-enforceable retention policy per data class.

## Decision Drivers

- **SOC 2 Type 1 readiness (Q4 2026):** CC6.1.7, CC7.5 require written retention.
- **Legal minimums:** SOX §802 (7-year retention for financial records); GDPR Article 5(1)(e) (storage limitation).
- **Local-first + cloud-hybrid:** retention must apply in BOTH local (browser) and backend tiers.
- **Forensic defensibility:** audit logs must be retained long enough to reconstruct an incident.
- **Storage cost:** unbounded growth in browser local storage causes perf regressions (SQLite WASM has practical limits).
- **Right-to-erasure (GDPR Art. 17):** retention policy must coexist with deletion-on-request flow.

## Considered Options

### Option A — Single 7-year retention for everything
- **Pro:** Simple, satisfies SOX.
- **Con:** Holds PII far longer than necessary. Violates GDPR Art. 5(1)(e) "kept in a form which permits identification of data subjects for no longer than is necessary." Audit logs grow 100x larger than needed.

### Option B — Per-class retention (chosen)
- **Pro:** Tailored to legal/business need. Audit log retained 30 days hot, 7 years cold.
- **Con:** More complex. Requires 3-class data tagging (per ADR-012).
- **Pro:** Satisfies SOX + GDPR + SOC 2 + storage-cost goals simultaneously.

### Option C — User-configurable retention
- **Pro:** Maximum user control.
- **Con:** Misconfiguration risk (user keeps PII 7 years by accident). SOC 2 auditor will flag as insufficient.

## Decision Outcome

**Chosen: Option B — Per-class retention**, with hard defaults that comply with SOX + GDPR. Users can SHORTHEN retention (right-to-erasure override) but cannot LENGTHEN past the cap. Retention is enforced in `masterStorage` (ADR-005) via a per-store TTL layer, with backup eviction on read.

**Default retention per data class (per ADR-012):**

| Class | Examples | Hot retention | Cold/archive | Deletion trigger | Right-to-erasure |
|---|---|---|---|---|---|
| **PII** | user email, display name, org name | Indefinite (user controls account) | None | Account deletion + 30-day grace | Immediate on request |
| **Business data** | scenarios, models, dimensions, drivers | Indefinite (user's work product) | Optional encrypted backup export | Account deletion + 30-day grace | Immediate on request |
| **Regulated data** | GL transactions, journal entries, audit trail | 7 years (SOX §802) | Encrypted cold storage (S3 RRS) | Legal hold overrides | Cannot erase if legal hold active |
| **Session telemetry** | feature usage, performance traces | 30 days hot | Aggregated to anonymous metrics after 30d | Auto-purge at 30d | N/A (no PII) |
| **Security audit log** | auth events, access events, key rotations | 90 days hot, 7 years cold | Append-only S3 Object Lock (WORM) | Legal hold overrides | Cannot erase (immutable) |

**Implementation:** `src/utils/storage/retentionPolicy.ts` (new), with per-store config in `dataStore.ts:9`, `authStore.ts:7`, `auditLogStore.ts` (new in ADR-008). The policy runs on every `masterStorage.setItem` and via a daily `setTimeout` sweep (Tauri desktop) or on next page load (browser).

## Compliance

| Framework | Requirement | This ADR satisfies |
|---|---|---|
| **SOC 2 CC6.1.7** | Restrict data movement | ✅ Per-class retention prevents indefinite PII hoarding |
| **SOC 2 CC6.1.8** | Data classification | ✅ Built on ADR-012's 3-class scheme |
| **SOC 2 CC7.5.2** | Recovers affected data | ✅ Cold archive path is part of recovery |
| **SOX §802** | 7-year retention for financial records | ✅ Regulated data: 7 years cold |
| **GDPR Art. 5(1)(c)** | Data minimization | ✅ PII: indefinite-until-account-deletion, not 7 years |
| **GDPR Art. 5(1)(e)** | Storage limitation | ✅ Session telemetry: 30d hot, aggregated after |
| **GDPR Art. 17** | Right to erasure | ✅ PII + business data: immediate on request |
| **ISO 27001 A.5.34** | Privacy and protection of PII | ✅ PII is the most-restricted class |
| **PCI-DSS 3.2** | Do not store sensitive auth data | ✅ Out of scope (Stripe handles cards) |

## Migration Plan

1. **Phase 1 (Q3 2026 sprint 2) — add retention config + sweep**
   - Create `src/utils/storage/retentionPolicy.ts` with `getRetentionForClass(class)` + `enforceRetention()`.
   - Add per-store `retention: { class: 'pii' | 'business' | 'regulated' | 'session' | 'audit' }` to dataStore, authStore, settingsStore, auditLogStore (new).
   - Daily sweep via Tauri scheduler; on-next-load sweep for browser.
   - **Verify:** tsc, lint, test pass.

2. **Phase 2 (Q3 2026 sprint 3) — add legal-hold override**
   - Add `legalHold: boolean` to `dataStore` and `auditLogStore`. When true, sweep skips.
   - Wire to admin console (Phase 1 backend).
   - **Verify:** retention sweep test skips held items.

3. **Phase 3 (Q3 2026 sprint 4) — add right-to-erasure flow**
   - Add `deleteUserData(userId)` to backend API. Purges PII + business data immediately. Marks regulated data + audit log as `erased: true` (record metadata kept, content purged).
   - **Verify:** GDPR deletion test scenario.

4. **Phase 4 (Q4 2026) — cold archive to S3 (Regulated class)**
   - Move audit logs + GL transactions older than 90d to encrypted S3 (Object Lock, 7-year retention).
   - Local cache only the last 90d.
   - **Verify:** cold-archive restore test (drill Q1 2027).

5. **Phase 5 (Q4 2026) — auditor walkthrough**
   - SOC 2 auditor reviews retention policy + sweep logs + legal-hold trail.

## Enforcement

- **Static:** `npm run lint` + a custom ESLint rule that rejects `setItem(` without a `retention` argument on regulated-class stores.
- **Unit tests:** `retentionPolicy.test.ts` (planned in T-HEP-004 logic-gap spec §3) — 6 cases: PII delete-on-request, business delete-on-request, regulated 7-year cap, audit log immutable, legal hold override, sweep idempotent.
- **Integration:** Sentry alert on any retention sweep that purges > 1MB in a single run (anomaly).
- **Audit:** Every retention sweep writes a log entry to `auditLogStore` ("retention:purge", count, class, scope).
- **Review:** Quarterly manual review of retention policy + last 90d of sweep logs (Hephaestus).
- **SOC 2 evidence:** retention policy doc + sweep logs (exported) + legal-hold trail = evidence package for CC6.1.7 + CC7.5.2.

## Consequences

**Positive:**
- ✅ SOC 2 CC6.1.7, CC6.1.8, CC7.5.2 satisfied (Type 1 ready Q4 2026).
- ✅ SOX + GDPR conflict resolved (PII minimization + 7-year regulated).
- ✅ Storage cost predictable (PII/business capped by account lifetime, not years).
- ✅ Right-to-erasure flow becomes a single API call.

**Negative:**
- ❌ More complex than "store forever." 3 retention classes = 3× the policy surface to test.
- ❌ Per-store config is a PII-tag risk — if a store is mis-tagged, retention is wrong. Mitigated by ESLint rule + audit log of tag changes.
- ❌ Cold archive to S3 adds 1 dependency. Mitigated by S3 RRS (rarely accessed) at ~$0.01/GB/mo.

**Neutral:**
- Local-only users get the same retention (no data egress required).
- Phase 1 backend reuses the same policy (no second implementation).

## Pros and Cons of the Options

| Option | Pros | Cons |
|---|---|---|
| A — 7-year everything | Simple | GDPR violation; unbounded audit log; 100× storage cost |
| **B — Per-class (chosen)** | Compliant; tailored; storage-efficient | Complex; tag-risk |
| C — User-configurable | User control | Misconfiguration; auditor insufficient |

## References

- [ADR-005 masterStorage](./ADR-005-custom-masterstorage.md) — the storage layer this policy rides on
- [ADR-007 encryption-at-rest](./ADR-007-encryption-at-rest.md) — required for cold archive
- [ADR-008 audit logging](./ADR-008-audit-logging.md) — audit logs are a separate class with their own retention
- [ADR-009 incident response](./ADR-009-incident-response.md) — invokes the audit-log retention during IR
- [ADR-010 schema migration](./ADR-010-schema-migration-strategy.md) — schema-migration must respect retention
- [ADR-012 data storage scoping](./ADR-012-data-storage-scoping.md) — defines the 3 data classes
- [SOC 2 Type 1 readiness audit](../hephaestus/SOC2_READINESS_2026-06-13.md) — the §3 CC6.1.7 + §6 blocker-3 reference
- SOX §802 — 7-year retention (17 CFR §210.2-02)
- GDPR Art. 5(1)(c), 5(1)(e), 17 — Data minimization, storage limitation, right to erasure
- ISO 27001 A.5.34 — Privacy and protection of PII
- PCI-DSS 3.2 — Protect stored cardholder data (out of scope for FinPlan Pro; cited for completeness)

---

<!-- DRAFT v0.1 — awaiting review — Hephaestus 2026-06-13 -->
