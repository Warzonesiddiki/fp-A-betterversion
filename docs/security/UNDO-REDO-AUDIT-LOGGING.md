# Undo/Redo Audit Logging — SOC 2 CC7.2 + ISO 27001 A.8.15 (P0A-14)

**Document version:** v0.1
**Author:** Polyhymnia (Tier 3 Domain Specialist — Documentation landscape audit)
**Owner Muses (implementation):** Hades (audit log infrastructure), Apollo (Undo/Redo UI integration), Demeter (store-level action wrapping)
**Cycle:** 25 / TURN 393+ / 8th Honest-Label
**Date:** 2026-06-18
**HEAD baseline:** `f26c339e` 1002c (32nd HEAD DRIFT, 1002-COMMIT MILESTONE)
**Status:** SPEC — awaiting implementation by Hades + Apollo + Demeter

---

## 1. Scope and Compliance Frame

This document specifies the **audit-logging requirements for the Undo/Redo system** to address the **CRITICAL P0A-14 gap**: the Undo/Redo feature wires state mutations but does NOT emit SOC 2 / ISO 27001 compliant audit log entries, breaking the chain of accountability required for financial-data integrity.

**Regulatory mappings:**

| Regulation | Section | Requirement |
|------------|---------|-------------|
| SOC 2 (Trust Services Criteria 2017, updated 2022) | CC7.2 — System monitoring | System monitoring detects anomalies and security events; audit logs retained for analysis |
| SOC 2 | CC7.3 — Anomaly detection | Security events evaluated, escalated, and resolved |
| SOC 2 | CC8.1 — Change management | Changes to system components are authorized and tracked |
| ISO 27001:2022 | A.8.15 Logging | Logs recording activities, exceptions, information security events produced, kept, regularly reviewed |
| ISO 27001:2022 | A.8.16 Monitoring activities | Networks, systems, applications monitored for anomalies |
| ISO 27001:2022 | A.8.32 Change management | Changes to information processing facilities and systems tracked |
| GDPR | Art. 5(1)(f) — integrity & confidentiality | Pseudonymization, encryption; ability to restore availability after incident |
| GDPR | Art. 30 — records of processing | Controllers must maintain records of processing activities |
| GDPR | Art. 32(1)(d) — regular testing | Regular testing of effectiveness of security measures |
| PCI-DSS v4.0 | Req 10.1 — audit trails | All access to network resources and cardholder data logged |
| PCI-DSS v4.0 | Req 10.2 — audit trail contents | User identification, type of event, date/time, success/failure, origination, affected component |
| PCI-DSS v4.0 | Req 10.5 — log integrity | Audit logs protected from destruction and unauthorized modifications |

**Applicability:**

FinPlan Pro is a financial-planning desktop application. Every state mutation — including Undo/Redo — constitutes a change to financial data and must be auditable for:
- (a) Forensic investigation after a data integrity incident
- (b) Regulatory audit (SOC 2 Type II, ISO 27001 surveillance)
- (c) Internal fraud detection
- (d) DSAR responses (per P0A-17)

---

## 2. Problem Statement (CRITICAL — SOC 2 CC7.2 violation)

**GAP P0A-14:** The Undo/Redo system currently:
- Reverses/re-applies state mutations WITHOUT emitting audit log entries
- Does NOT capture the "before" and "after" state hashes for integrity verification
- Does NOT link undo actions to the original forward action (breaking the audit trail chain)
- Does NOT support retention policies (90d default, 365d with consent)

Without these controls, an auditor cannot reconstruct the sequence of changes, who initiated them, or verify data integrity after an incident.

**BLOCKING-STATUS:** Blocks SOC 2 Type II readiness and H1 P0-A SHIP 2026-06-30.

---

## 3. Audit Log Entry Schema

### 3.1 Entry types

| Action type | Description | Example |
|-------------|-------------|---------|
| `state.mutate` | Forward action (create/update/delete) | User edits budget line item |
| `state.undo` | Undo of previous forward action | User undoes the budget edit |
| `state.redo` | Redo of previously undone action | User redoes the budget edit |
| `state.batch` | Atomic multi-action commit | Budget save commits 12 line items at once |
| `state.compact` | Internal compaction event | Periodic log compaction to bound size |
| `state.replay` | Initial state hydration | App startup replays log to reconstruct state |
| `auth.login` / `auth.logout` | Authentication events | N/A in offline-first MVP |
| `consent.capture` / `consent.revoke` | Per P0A-09 | See `03-CONSENT-CAPTURE.md` |
| `dsar.export` / `dsar.delete` | Per P0A-17 | See `04-DSAR-WIRE.md` |
| `tls.security` | Per P0A-15 | See `PCI-DSS-COMPLIANCE.md` |

### 3.2 Entry schema

```typescript
// src/types/auditLog.ts — Hades implementation
export type AuditLogEntry = {
  id: string;                        // ULID, sortable by time
  timestamp: string;                 // ISO 8601 UTC with millisecond precision
  actorId: string;                   // pseudonymized user ID (P0A-16 scope 'audit')
  actorType: 'user' | 'system' | 'admin' | 'migration';
  action: AuditActionType;
  target: {
    entityType: string;              // e.g., 'budget', 'report', 'consent'
    entityId: string;                // e.g., budget line ID
  };
  outcome: 'success' | 'denied' | 'error' | 'partial';
  reasonCode?: string;               // e.g., 'rbac_denied', 'consent_missing', 'validation_failed'
  previousStateHash: string;         // SHA-256 of canonicalized pre-mutation state
  newStateHash: string;              // SHA-256 of canonicalized post-mutation state
  linkedEntryId?: string;            // For undo/redo: links to original forward action
  batchId?: string;                  // For batch mutations
  evidenceArtifactHash?: string;     // For consent captures, DSAR exports, etc.
  retentionClass: 'short' | 'long';  // 'short' = 90d default, 'long' = 365d (consent-gated)
  ipAddress?: string;                // Optional (only when online)
  userAgent?: string;                // Optional
};
```

### 3.3 Hash chain integrity

Each entry references the `previousStateHash` of the entry before it. This creates a **Merkle-style hash chain** that detects tampering:

```
entry[N].previousStateHash === SHA-256(canonicalize(entry[N-1]))
```

Any modification to entry[N-1] invalidates entry[N]'s reference. A periodic "consistency audit" job verifies the chain end-to-end.

---

## 4. Undo/Redo Audit Trail

### 4.1 Forward action capture (Demeter implementation)

```typescript
// src/engines/audit/auditWrap.ts — Demeter implementation
export function withAuditLog<T>(
  entityType: string,
  entityId: string,
  mutation: () => T
): T {
  const preState = getCurrentStateHash(entityType, entityId);
  const result = mutation();
  const postState = getCurrentStateHash(entityType, entityId);

  auditLog.append({
    actorId: getCurrentUserId(),
    actorType: 'user',
    action: 'state.mutate',
    target: { entityType, entityId },
    outcome: 'success',
    previousStateHash: preState,
    newStateHash: postState,
    retentionClass: consentStore.hasActiveConsent('audit_log_extended_retention')
      ? 'long'
      : 'short',
  });
  return result;
}
```

### 4.2 Undo action capture (Apollo + Hades)

```typescript
// src/store/historyStore.ts — Apollo implementation
type HistoryEntry = {
  forwardEntryId: string;   // Audit log entry ID of the original action
  entityType: string;
  entityId: string;
  preState: unknown;
  postState: unknown;
  undoEntryId?: string;     // Set when undo occurs
  redoEntryId?: string;     // Set when redo occurs
};

function undo(entry: HistoryEntry): void {
  const preStateHash = getCurrentStateHash(entry.entityType, entry.entityId);
  // Apply reverse mutation
  applyState(entry.entityType, entry.entityId, entry.preState);
  const postStateHash = getCurrentStateHash(entry.entityType, entry.entityId);

  // Emit audit log entry linked to the original
  const undoLogId = auditLog.append({
    actorId: getCurrentUserId(),
    actorType: 'user',
    action: 'state.undo',
    target: { entityType: entry.entityType, entityId: entry.entityId },
    outcome: 'success',
    previousStateHash: preStateHash,
    newStateHash: postStateHash,
    linkedEntryId: entry.forwardEntryId,
    retentionClass: consentStore.hasActiveConsent('audit_log_extended_retention')
      ? 'long'
      : 'short',
  });

  // Update history entry with undo reference
  entry.undoEntryId = undoLogId;
}

function redo(entry: HistoryEntry): void {
  // Symmetric to undo() — emits 'state.redo' with linkedEntryId = entry.undoEntryId
  /* ... */
}
```

---

## 5. Retention Policy

### 5.1 Default retention: 90 days

- Applies to all audit log entries by default.
- Expired entries are pruned by background compaction job (`state.compact` audit event).

### 5.2 Extended retention: 365 days

- Triggered by user consent `audit_log_extended_retention` (per P0A-09).
- Required for SOC 2 CC7.2 + ISO 27001 A.8.15 audit evidence retention.
- Consent withdrawal triggers immediate transition: 365d → 90d for future entries; existing entries past 90d are pruned at next compaction.

### 5.3 Hash chain preservation

Even after pruning, the **last compacted hash** is retained as a checkpoint. New entries reference the checkpoint as their `previousStateHash`. This preserves the chain integrity property indefinitely.

---

## 6. Storage and Protection (PCI-DSS Req 10.5 alignment)

| Control | Implementation |
|---------|----------------|
| Audit logs protected from unauthorized access | Encrypted at rest via Tauri IPC policy (see `ENCRYPTION_AT_REST_TAURI_IPC_POLICY.md`) |
| Audit logs protected from unauthorized modification | Hash chain + append-only log structure; no in-place edit API |
| Audit logs protected from deletion before retention expiry | Background compaction is the only deletion path; protected by RBAC |
| Audit logs backed up | Optional: replicate to user-specified backup destination (per consent) |

---

## 7. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| AC-1 | Every state mutation emits a `state.mutate` audit log entry | Unit test: `withAuditLog` wrapper emits entry |
| AC-2 | Every undo emits `state.undo` entry with `linkedEntryId` | Unit test |
| AC-3 | Every redo emits `state.redo` entry with `linkedEntryId` | Unit test |
| AC-4 | `previousStateHash` and `newStateHash` are SHA-256 of canonicalized state | Unit test |
| AC-5 | Hash chain consistency verification passes | Integration test |
| AC-6 | Default retention is 90d; extended is 365d with consent | Unit test on `retentionClass` logic |
| AC-7 | Consent withdrawal triggers retention class transition | Unit test |
| AC-8 | Audit log entries are append-only (no edit/delete API) | API surface test |
| AC-9 | Audit log included in DSAR export per P0A-17 | Integration test (see `04-DSAR-WIRE.md`) |
| AC-10 | Audit log entries survive app restart (persisted) | Persistence test |
| AC-11 | `actorId` is pseudonymized (Level 1 per P0A-16) | Unit test |

---

## 8. Out of Scope

- Real-time anomaly detection (deferred to v2.0)
- SIEM integration (deferred to v2.0)
- Audit log forwarding to external SOC (N/A — offline-first MVP)
- Cryptographic timestamping via external TSA (deferred to v2.0)

---

## 9. Cross-References

- **P0A-09** Consent capture — `docs/onboarding/03-CONSENT-CAPTURE.md` (audit_log_extended_retention consent scope)
- **P0A-15** TLS 1.3 — `docs/security/PCI-DSS-COMPLIANCE.md` (audit log for TLS events)
- **P0A-16** Pseudonymization — `docs/security/PSEUDONYMIZATION.md` (actorId pseudonymization)
- **P0A-17** DSAR wire — `docs/onboarding/04-DSAR-WIRE.md` (audit log export scope)
- **Hades T-4.4 Audit Log Completeness Audit** (Nomos T-3.21.3 reference) — see ch1 memory
- **Existing:** `docs/security/PII_REDACTION_LOGGING_POLICY.md`

---

## 9b. MAPPING ADDENDUM — Narrow vs Broad GDPR Article Interpretation (D-007 12th SHL SELF-HONEST-LABEL)

**Source**: Strategos 45th cadence TURN 394+ CRITICAL CORRECTION (Polyhymnia mapping scope catch).

This document uses a **NARROW mapping** focused on the primary regulatory frameworks directly governing audit logging (SOC 2 + ISO 27001 + PCI-DSS Req 10). The Strategos **H3 ROADMAP v0.2 compliance consolidation lens** adds GDPR Art. 17 erasure (RTBF) as a CRITICAL secondary mapping because audit log retention interacts directly with data subject erasure rights.

| Lens | Primary Framework(s) | Rationale |
|------|---------------------|-----------|
| **Narrow (this doc)** | **SOC 2 CC7.2/7.3/8.1** + **ISO 27001 A.8.15/8.16/8.32** + **PCI-DSS Req 10.1/10.2/10.5** + GDPR Art. 5(1)(f)/30/32 | Audit logging is primarily a SECURITY control (CC7), ASSET inventory control (A.8.15), and TRANSACTION monitoring control (PCI Req 10) |
| **Broad (Strategos)** | **+ GDPR Art. 17 erasure (RTBF)** + Art. 5(1)(e) storage limitation | H3 compliance consolidation: when a data subject exercises Art. 17 RTBF, ALL audit log entries containing their PII (actorId, targetId) MUST be pseudonymized or deleted. This requires Art. 17-aware retention logic in undo/redo stacks |

**BOTH MAPPINGS ARE TECHNICALLY CORRECT** — they are different analytical lenses, not contradictions. Per Strategos 45th cadence, the H3 ROADMAP v0.2 view is preferred for H1 P0-A SHIP 2026-06-30 because Art. 17 RTBF + audit log retention is a known enterprise customer compliance question (DSAR vs audit retention conflict).

**Action**: Hades + Apollo implementation must add an `onDSARErasure(pseudonymizeAuditLogEntries)` hook to the audit log writer so that when a DSAR erasure is processed (per `docs/onboarding/04-DSAR-WIRE.md` §6), audit log entries are pseudonymized (preserving forensic value) rather than deleted (preserving compliance). This is a non-breaking extension of §6.3.

---

## 10. Change Log

| Version | Date | Author | Change |
|---------|------|--------|--------|
| v0.1 | 2026-06-18 | Polyhymnia | Initial SPEC; awaiting Hades+Apollo+Demeter implementation |
| v0.1.1 | 2026-06-18 | Polyhymnia | D-007 12th SHL: Added MAPPING ADDENDUM §9b (narrow vs broad) per Strategos 45th cadence |

---

**END OF DOCUMENT** — 10 sections + addendum, MECE per RULE #108 v0.3 MERGE EDITION. Implementation ETA per Ares T-3.33.2: T-1d 2026-06-20 EOD.