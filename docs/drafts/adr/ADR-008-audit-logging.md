# ADR-008: Audit Logging (Append-Only + Hash Chain + S3 Object Lock)

<!-- DRAFT v0.1 — awaiting review — Hephaestus 2026-06-13 -->

- **Status:** DRAFT v0.1
- **Date:** 2026-06-13
- **Author:** Hephaestus
- **Supersedes:** none
- **Related:** [ADR-006 data retention](./ADR-006-data-retention.md), [ADR-007 encryption-at-rest](./ADR-007-encryption-at-rest.md), [ADR-009 incident response](./ADR-009-incident-response.md), [ADR-011 plugin sandbox AST](./ADR-011-plugin-sandbox-ast.md), [ADR-012 data storage scoping](./ADR-012-data-storage-scoping.md)

## Context and Problem Statement

FinPlan Pro needs a tamper-evident audit log to satisfy:

- **SOC 2 CC7.1, CC7.2, CC7.3** — detect, evaluate, and respond to security events.
- **SOX §802** — 7-year retention of financial record changes (GL journal entries, scenario publishes, etc.).
- **Forensic defensibility** — when an incident happens (per ADR-009), the log must be admissible.
- **AuditTrailPage** (existing) — currently shows a UI for a log that has no integrity guarantees.

The current `src/engines/AuditLogEngine.ts:148L` provides a basic append-only API but has NO tamper-evidence: no hash chain, no signature, no off-store anchor. A user with shell access to the local SQLite could rewrite history without detection.

The team needs a log that is:
1. Append-only at the API level (no `update` or `delete`).
2. Tamper-evident: any modification breaks a hash chain.
3. Retained per ADR-006 (90d hot, 7y cold).
4. Exportable for forensic / legal / SOC 2 audit purposes.

## Decision Drivers

- **SOC 2 CC7.1 + CC7.2 + CC7.3** — currently RED, blocks Type 1.
- **SOX §802** — 7-year retention with chain-of-custody.
- **Forensic defensibility** — admissible in court (no break in chain).
- **Local-first reality** — must work in browser (no server) AND in cloud (Phase 1).
- **GDPR Art. 17** — right-to-erasure conflicts with immutability. Resolution: erase PII fields, keep record metadata.
- **Storage cost** — append-only logs grow fast; need cold archive.

## Considered Options

### Option A — Hash-chained append-only log (chosen)
- **Pro:** Tamper-evident; standard pattern (used by AWS QLDB, Google Cloud Audit Logs).
- **Pro:** Verifiable in O(n) on read; no external anchor needed for local.
- **Con:** Pure-local log can still be wiped + restarted. Mitigated by cloud-side anchor.

### Option B — Merkle tree anchor (e.g., periodic publish to public chain)
- **Pro:** Cryptographically strongest.
- **Con:** Adds external dependency; cost; latency.

### Option C — Signature-based (sign each entry with HSM key)
- **Pro:** Stronger than hash chain.
- **Con:** Requires HSM; Phase 1 backend deferred. Browser can't sign with HSM.

### Option D — Database-level immutability (revoke UPDATE/DELETE permissions)
- **Pro:** Strongest in theory.
- **Con:** SQLite WASM doesn't support this. Tauri SQLite does, but inconsistent.

## Decision Outcome

**Chosen: Option A — hash-chained append-only log**, with the following specifics:

1. **Entry shape:** `{ id, ts, actor, action, target, before?, after?, prevHash, hash, signature? }`.
2. **Hash chain:** `hash = SHA-256(prevHash + canonicalize(entry))`. `prevHash` of entry N is the `hash` of entry N-1. Genesis entry has `prevHash = "0" * 64`.
3. **Tamper detection:** On every read, the engine re-walks the chain and verifies each `hash`. Any mismatch raises `AuditChainBrokenError` and triggers ADR-009 IR flow.
4. **Append-only API:** `auditLog.append(entry)` is the ONLY write method. `update` and `delete` are not exported. The TypeScript type system enforces this.
5. **Per-class tagging:** Each entry tags the data class (per ADR-012). PII fields are redacted at write time; the chain records `(field, hash(redacted))` so the chain is unbroken AND PII is minimized.
6. **Storage:**
   - **Local (browser):** `auditLogStore` → `safeJSONStorage(masterStorage)` → SQLite WASM. Capped at 90 days hot per ADR-006.
   - **Cloud (Phase 1):** cold-archive to S3 with Object Lock in Compliance mode (WORM, 7-year retention, no overwrite, no delete even by root). Per ADR-006 retention.
7. **Verification cadence:**
   - On every read: full chain verification (O(n), n ≤ ~10K entries for browser hot, ~1M for cloud).
   - Hourly: random spot-check of 100 random entries + verify chain.
   - Daily: full re-verify + Sentry alert on any mismatch.
8. **Export:** `auditLog.export()` returns the full chain as JSONL, suitable for SOC 2 auditor or court.

**Implementation files:**
- New: `src/store/auditLogStore.ts` — the local-first store
- New: `src/utils/audit/chain.ts` — hash chain primitives (`hashEntry`, `verifyChain`, `AuditChainBrokenError`)
- New: `src/utils/audit/redact.ts` — PII redaction per ADR-012
- Modified: `src/engines/AuditLogEngine.ts` — deprecate in favor of the new store (or keep as a domain layer on top)
- Modified: `src/pages/AuditTrailPage.tsx` — show chain status (✅ chain intact / ❌ chain broken)

**Existing `AuditLogEngine.ts:148L`** — keep as-is (used for business audit events, e.g., "scenario published"); the new `auditLogStore` is the security audit channel.

## Compliance

| Framework | Requirement | This ADR satisfies |
|---|---|---|
| **SOC 2 CC7.1.4** | Responds to security events | ✅ `AuditChainBrokenError` triggers ADR-009 IR |
| **SOC 2 CC7.2.3** | Evaluates anomalies | ✅ Hourly + daily verification |
| **SOC 2 CC7.3.1** | Defines incident response procedures | ✅ Chain break is a defined trigger |
| **SOC 2 CC7.4.1** | Contains the incident | ✅ Export is part of containment |
| **SOX §802** | 7-year retention for financial record changes | ✅ 7-year cold archive in S3 Object Lock |
| **GDPR Art. 17** | Right to erasure | ✅ PII redacted at write; record metadata retained |
| **ISO 27001 A.8.15** | Logging | ✅ Append-only with integrity |
| **ISO 27001 A.8.16** | Monitoring activities | ✅ Hourly + daily verification + Sentry alerts |
| **NIST SP 800-92** | Guide to computer security log management | ✅ All 4 sections covered (planning, content, retention, monitoring) |
| **PCI-DSS 10.x** | Logging (out of scope but cited) | ✅ Hash chain + retention pattern |

## Migration Plan

1. **Phase 1 (Q3 2026 sprint 3) — write the chain + store**
   - Create `src/utils/audit/chain.ts` (hash, verify, error type).
   - Create `src/store/auditLogStore.ts` with append-only API.
   - Unit tests: 8 cases per T-HEP-004 §2 (planned).
   - **Verify:** tsc, lint, test green; existing `AuditLogEngine.ts:148L` still works.

2. **Phase 2 (Q3 2026 sprint 3) — wire into existing security events**
   - Replace direct `AuditLogEngine.log()` calls in `src/store/authStore.ts`, `src/utils/storage/encryptedStorage.ts` (per ADR-007) with `useAuditLogStore.getState().append()`.
   - **Verify:** existing 4 Hephaestus security tests (`docs/drafts/hephaestus/security-tests/`) still pass; chain grows on every test.

3. **Phase 3 (Q3 2026 sprint 4) — add cloud cold-archive**
   - Add Cloudflare R2 (S3-compatible) bucket with Object Lock in Compliance mode, 7-year retention.
   - Daily worker reads 90d+ entries from local store, signs them, uploads to R2.
   - **Verify:** cold-archive restore drill (Q1 2027).

4. **Phase 4 (Q3 2026 sprint 4) — chain verification cadence**
   - Wire hourly spot-check + daily full re-verify.
   - Sentry alert on any `AuditChainBrokenError`.
   - **Verify:** chaos test — manually break a chain entry, confirm Sentry fires.

5. **Phase 5 (Q4 2026) — auditor walkthrough**
   - SOC 2 auditor reviews chain integrity + R2 Object Lock configuration + redaction policy.

## Enforcement

- **Static:** TypeScript types prevent `auditLogStore.update` or `.delete` from existing (the store only exports `.append`, `.list`, `.verifyChain`, `.export`).
- **Unit tests:** `chain.test.ts` — 8 cases per T-HEP-004 §2: append, verify, tamper detection, genesis, redaction, export, chain broken, performance (10K entries < 500ms).
- **Integration:** Sentry alert on any `AuditChainBrokenError` (defined in ADR-009).
- **SLA:** Hourly spot-check + daily full re-verify are tracked in `EngineRegistry.metrics.auditChain` (per Prometheus's perf dashboard).
- **Audit log of the audit log:** the audit log is itself audited. Every append logs `(append, hash)` to the audit log (recursive but bounded; the meta-entries are tiny).
- **Review:** Monthly review of chain integrity metrics (Hephaestus).

## Consequences

**Positive:**
- ✅ SOC 2 CC7.1, CC7.2, CC7.3, CC7.4 satisfied (Type 1 ready Q4 2026).
- ✅ SOX §802 satisfied (7-year WORM cold archive).
- ✅ GDPR Art. 17 satisfied (PII redacted at write).
- ✅ Forensic defensibility (chain break is the canonical signal).
- ✅ Exports are JSONL (auditor-friendly).

**Negative:**
- ❌ Hash chain grows O(n²) on full re-verify (n=1M ≈ ~30s). Mitigated by hourly spot-check + daily full re-verify off the hot path.
- ❌ R2 Object Lock adds 1 external dep + ~$5/TB/mo cost. Mitigated by 90d hot / 7y cold split (hot is local).
- ❌ Redaction is per-field, not per-record. If a PII field is mis-tagged, it leaks. Mitigated by ESLint rule that flags `append(...)` calls without a `class:` arg on PII-flagged stores.

**Neutral:**
- Cloudflare R2 chosen over AWS S3 (cheaper egress, S3-compatible, 1 vendor).
- Hash chain is SHA-256 (NIST-approved, FIPS 140-3). No future quantum concern at 7y horizon for our data class.

## Pros and Cons of the Options

| Option | Pros | Cons |
|---|---|---|
| **A — Hash-chained (chosen)** | Tamper-evident; standard pattern; offline-verifiable | Pure-local can be wiped (mitigated by cloud anchor) |
| B — Merkle + public chain | Cryptographically strongest | External dep; cost; latency |
| C — Signature + HSM | Strongest in theory | HSM required; browser can't sign with HSM |
| D — DB-level immutability | Strongest in theory | SQLite WASM doesn't support; inconsistent |

## References

- [ADR-006 data retention](./ADR-006-data-retention.md) — defines audit log retention (90d hot, 7y cold)
- [ADR-007 encryption-at-rest](./ADR-007-encryption-at-rest.md) — audit log is itself encrypted
- [ADR-009 incident response](./ADR-009-incident-response.md) — chain break triggers IR
- [ADR-011 plugin sandbox AST](./ADR-011-plugin-sandbox-ast.md) — plugin execution is audited
- [ADR-012 data storage scoping](./ADR-012-data-storage-scoping.md) — defines what gets redacted
- [SOC 2 Type 1 readiness audit](../hephaestus/SOC2_READINESS_2026-06-13.md) — §4 CC7.x + §6 blocker #2 (this ADR is part of the fix)
- `src/engines/AuditLogEngine.ts:148L` — existing engine (kept for business events)
- `src/pages/AuditTrailPage.tsx` — existing UI (extended with chain status)
- AWS QLDB, Google Cloud Audit Logs — pattern reference
- NIST SP 800-92 — Computer security log management guide
- NIST FIPS 180-4 — SHA-256
- Cloudflare R2 Object Lock docs

---

<!-- DRAFT v0.1 — awaiting review — Hephaestus 2026-06-13 -->
