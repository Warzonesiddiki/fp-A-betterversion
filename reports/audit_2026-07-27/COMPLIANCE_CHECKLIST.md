# COMPLIANCE CHECKLIST — GDPR + SOX

**Audit Date:** 2026-07-27  
**Repository:** `Warzonesiddiki/fp-A-betterversion`  
**Audit Scope:** GDPR (Art. 5, 6, 7, 9, 15, 16, 17, 30, 32, 35) + SOX (Section 302, 404, 409, 802)

---

## GDPR — GENERAL DATA PROTECTION REGULATION (EU 2016/679)

### 1. Lawfulness of Processing (Art. 6) — CONSENT TRACKING

- **Requirement:** Processing must be based on a lawful basis (`consent`, `contract`, `legal obligation`, `vital interest`, `public task`, `legitimate interest`). Consent must be freely given, specific, informed, unambiguous (`Art. 7`).
- **Evidence:** `src/store/auditTrailGdprEvents.ts` defines `ConsentCapturedEvent` (`consent.captured`) and `ConsentWithdrawnEvent` (`consent.withdrawn`). `LawfulBasis` type includes all 6 bases (`consent`, `contract`, `legal_obligation`, `vital_interest`, `public_task`, `legitimate_interests`).
- **Status:** ⚠️ PARTIAL — Consent registry events are defined but not fully verified if they are emitted/retrieved from the audit trail. No consent management UI (`ConsentPage`) audited.
- **Finding ID:** `C-03` (audit trail mutable, no RBAC gating), `C-01` (client-side only enforcement).
- **Remediation:** Implement `ConsentRegistryPage` or service that tracks consent (`consent.captured`) and allows revocation (`consent.withdrawn`). Ensure consent withdrawal triggers `rightToErasure()` (delete PII) in audit and user data.

---

### 2. Right to Access (Art. 15) — DATA SUBJECT ACCESS REQUEST (DSAR)

- **Requirement:** Data subjects can request access to all personal data processed about them. Must provide data in a structured, commonly used, machine-readable format.
- **Evidence:** `AuditTrailPage` allows CSV export (`handleExport()`). `PIIRedactor.ts` exists but is NOT called in `AuditTrailPage` (`C-03`). `AuditTrailPage` does not filter by `dataSubjectId` or `userId` for DSAR.
- **Status:** ❌ FAIL — No DSAR endpoint or service verified. Audit export includes PII (`userName`, `newValue`, `oldValue`) without redaction. No `dataSubjectId` filter.
- **Finding ID:** `C-03`, `H-03`.
- **Remediation:** Add `DSARPage` or `DataSubjectAccessRequest` service. Filter audit entries by `userId` or `email`. Call `PIIRedactor.redact()` before export. Provide JSON/CSV output.

---

### 3. Right to Erasure / "Right to be Forgotten" (Art. 17)

- **Requirement:** Data subjects can request deletion of personal data when processing is no longer necessary, consent withdrawn, or data processed unlawfully.
- **Evidence:** `auditTrailStore` defines `revertToState()` but does not implement `deleteUserData()` or `erasePersonalData()`. `authStore` has `logout()` but does not delete user profile or audit entries. `masterStorage` persists user data unencrypted — deleting from store does not guarantee deletion from `IndexedDB` (may leave fragments).
- **Status:** ❌ FAIL — No `rightToErasure()` implementation verified. `revertToState()` allows mutation but not erasure.
- **Finding ID:** `C-03` (mutable audit trail), `H-01` (unencrypted persistence).
- **Remediation:** Implement `erasePersonalData(userId)` in `auditTrailStore` (delete all entries for user). Implement `deleteUserProfile()` in `authStore`. Ensure `masterStorage.removeItem()` deletes data from `IndexedDB` and `SQLite`. Verify deletion with storage backend checks.

---

### 4. Data Processing Records (Art. 30)

- **Requirement:** Controllers must maintain records of processing activities (ROPA) including purposes, categories of data, recipients, retention periods, security measures.
- **Evidence:** `auditTrailStore` logs `AuditOperation` (`write`, `update`, `delete`, `bulk`), `userId`, `timestamp`, `cellId`, `dataType`, `oldValue`, `newValue`, `approvalStatus`, `source`, `metadata`. This partially satisfies Art. 30 (processing activities). However, `GDPR_AUDIT_VIEW_ROLES` (`admin`, `compliance`, `data-protection-officer`) is defined but NOT enforced (`C-03`).
- **Status:** ⚠️ PARTIAL — Audit log captures processing but lacks RBAC gating, hash chain (tamper-proof), and retention policy.
- **Finding ID:** `C-03`.
- **Remediation:** Enforce `GDPR_AUDIT_VIEW_ROLES` on audit access. Add `hash` field (`previousHash` → `currentHash`) to make audit trail append-only. Define retention period (`retentionPeriod`) and automatic deletion (`retentionPolicy`).

---

### 5. Data Protection by Design / Default (Art. 25)

- **Requirement:** Controllers must implement technical and organizational measures to protect data by design and by default (minimize data collection, encrypt data, restrict access).
- **Evidence:** `SecretsVault` uses AES-256-GCM (`C-02` for master key weakness). `masterStorage` does NOT encrypt (`H-01`). `PIIRedactor` exists but is NOT integrated into `AuditTrailPage` export (`C-03`). CSP allows `unsafe-inline` (`SecurityHeaders.ts`). WebSocket token leaks (`C-05`).
- **Status:** ❌ FAIL — Encryption not applied to all data (`masterStorage`). PII redaction not enforced. CSP not strict. Session token leaks.
- **Finding ID:** `C-05`, `H-01`, `H-02`, `H-03`, `C-03`.
- **Remediation:** Apply encryption (`AES-256-GCM`) to `masterStorage`. Integrate `PIIRedactor` into all export/log functions. Restrict CSP (`strict` preset only in production). Fix WebSocket token transmission (`C-05`).

---

### 6. Security of Processing (Art. 32)

- **Requirement:** Controllers must implement appropriate security measures (encryption, pseudonymization, access control, regular testing, incident response).
- **Evidence:** `SecretsVault` uses AES-256-GCM (`H-02` — master key weak). `masterStorage` unencrypted (`H-01`). `rbacEnforcer` client-side only (`C-02`). `IncidentResponse` (`IncidentResponse.ts`) not wired up (`M-05`). `ThreatModel` (`ThreatModel.ts`) not fully integrated. Brute-force protection dead (`C-04`). WebSocket token leaks (`C-05`).
- **Status:** ❌ FAIL — Multiple security gaps (client-side RBAC, unencrypted storage, weak encryption key, dead brute-force, token leak, unverified incident response).
- **Finding ID:** `C-02`, `C-04`, `C-05`, `H-01`, `H-02`, `M-05`.
- **Remediation:** Implement server-side RBAC (`C-02`). Integrate brute-force (`C-04`). Fix WebSocket (`C-05`). Strengthen master key (`H-02`). Encrypt `masterStorage` (`H-01`). Wire `IncidentResponse` and `ThreatModel` to security events.

---

### 7. Notification of Personal Data Breach (Art. 33 / Art. 34)

- **Requirement:** Controllers must notify supervisory authority within 72 hours of becoming aware of a breach. Must notify data subjects if breach poses high risk.
- **Evidence:** `IncidentResponse.ts` defines `IncidentResponse` class but is NOT wired up (`M-05`). No breach notification service or endpoint audited. `AuditTrailPage` does not have `breach` event type in `AuditOperation` (`OPERATION_OPTIONS` only has `write`, `update`, `delete`, `bulk`).
- **Status:** ❌ FAIL — No breach notification mechanism verified.
- **Finding ID:** `M-05`.
- **Remediation:** Wire `IncidentResponse` to security events (failed auth, suspicious API calls, CSRF failures). Add `breach` operation type to audit trail. Implement `notifySupervisoryAuthority()` and `notifyDataSubjects()` functions. Define 72-hour timer (`breachTimer` mentioned in `auditTrailGdprEvents` comments).

---

### 8. Data Protection Impact Assessment (DPIA) — Art. 35

- **Requirement:** Controllers must conduct DPIA for high-risk processing (systematic monitoring, sensitive data, automated decision-making).
- **Evidence:** No DPIA document or service audited. `docs/security/SECURITY_THREAT_MODEL.md` (not fully read) may contain threat model but not verified as a formal DPIA.
- **Status:** ❌ FAIL — No DPIA verified.
- **Remediation:** Create `DPIA.md` or service that documents processing risks, mitigation measures, and review schedule. Reference `ThreatModel.ts` and `SecurityHeaders` policies.

---

## SOX — SARBANES-OXLEY ACT (US PUBLIC COMPANIES)

### 9. Internal Controls Over Financial Reporting (Section 302 / 404)

- **Requirement:** Management must certify effectiveness of internal controls. Controls must prevent unauthorized changes to financial data (budgets, forecasts, GL entries, audit trails).
- **Evidence:** `authStore` (`C-01`) allows `setUser()` escalation (bypasses controls). `auditTrailStore` (`C-03`) allows `revertToState()` (modifies audit trail). `rbacEnforcer` (`C-02`) is client-side only. `SageConnector` (`C-07`) has SQL injection (allows unauthorized data extraction/manipulation in ERP integration).
- **Status:** ❌ FAIL — Client-side controls are trivially bypassable. Audit trail mutable. SQL injection allows unauthorized GL entry access.
- **Finding ID:** `C-01`, `C-02`, `C-03`, `C-07`.
- **Remediation:** Implement server-side RBAC (`C-02`). Make audit trail append-only (`C-03`). Remove `setUser()` public access (`C-01`). Fix SQL injection (`C-07`).

---

### 10. Audit Trail Integrity (Section 802 / 404)

- **Requirement:** Audit trails must be complete, accurate, and tamper-proof. Changes to financial data must be logged with who/what/when. Audit logs must be protected from deletion or modification.
- **Evidence:** `auditTrailStore` has `revertToState()` — allows mutation. No `hash` or `checksum` field. `GDPR_AUDIT_VIEW_ROLES` not enforced (`C-03`). `AuditTrailPage` exports CSV without redaction (`H-03`). `AuditLogger` (`AuditLogger.ts`) logs events but does not enforce append-only storage.
- **Status:** ❌ FAIL — Audit trail mutable. No hash chain. RBAC not enforced. PII not redacted.
- **Finding ID:** `C-03`, `H-03`.
- **Remediation:** Implement append-only audit storage (`append` only, no `revert` or `delete` for audit entries). Add `hash` chain (`previousHash` → `hash(entry + previousHash)`). Enforce `GDPR_AUDIT_VIEW_ROLES`. Call `PIIRedactor` before export.

---

### 11. Data Integrity and Validation (Section 302)

- **Requirement:** Financial data must be validated (input validation, double-entry bookkeeping, balance checks, error handling). Errors must be surfaced (not silently swallowed).
- **Evidence:** `SageConnector` (`C-07`) silently swallows errors (`catch { return { items: [], ... } }`). `GLImportService` (`GLImportService.ts`) validates CSV but error handling not fully audited. `masterStorage` (`H-01`) has no-op migration (`migrate: (state) => state`) — schema changes can corrupt persisted data. `GLTrialBalanceStore` uses floating-point equality (`sum(debits) === sum(credits)`) which may fail due to rounding errors.
- **Status:** ❌ FAIL — Silent errors. Unencrypted storage. Migration no-op. Floating-point equality risk.
- **Finding ID:** `C-07`, `H-01`, `M-02` (skipped migration tests), `C-06` (floating-point currency).
- **Remediation:** Surface all errors (remove silent `catch` blocks). Fix `masterStorage` migration (`version` increment + `migrate` function). Use exact arithmetic (integer-cents or `decimal.js`) for trial balance equality.

---

### 12. Segregation of Duties (Section 302 / 404)

- **Requirement:** Different users should have different roles (creator, approver, viewer, auditor). No single user should have all permissions (create + approve + audit + delete).
- **Evidence:** `ROLE_PERMISSIONS` (`authStore.ts`) defines roles (`Admin`, `FP&A_Manager`, `Analyst`, `Department_Head`, `Viewer`) with different permissions. `Admin` has all permissions (`budget:approve`, `audit:read`, `encryption:rotate-keys`, etc.). `FP&A_Manager` can approve budgets (`budget:approve`). `Viewer` can only read. This satisfies basic segregation.
- **Status:** ⚠️ PARTIAL — Roles defined correctly but RBAC enforcement is client-side only (`C-02`). `Admin` can escalate via `setUser()` (`C-01`). `AuditTrailPage` does not enforce `GDPR_AUDIT_VIEW_ROLES` (`C-03`).
- **Finding ID:** `C-02`, `C-01`, `C-03`.
- **Remediation:** Enforce roles server-side (`C-02`). Remove `setUser()` escalation (`C-01`). Enforce audit view roles (`C-03`).

---

### 13. Incident Response and Monitoring (Section 302 / 409)

- **Requirement:** Companies must have incident response plans and monitoring systems to detect and respond to security incidents in a timely manner.
- **Evidence:** `IncidentResponse.ts` (36 KB) defines `IncidentResponse` class but is NOT wired up (`M-05`). `ThreatModel.ts` (31 KB) defines `ThreatSignal` types but emission/consumption not verified. `CircuitBreaker.ts` and `RateLimiter.ts` exist but not fully integrated into server routes. `AuditLogger` logs audit events but does not trigger alerts.
- **Status:** ❌ FAIL — Incident response not wired. Monitoring incomplete.
- **Finding ID:** `M-05`.
- **Remediation:** Wire `IncidentResponse` to security events (failed login, suspicious API call, CSRF failure, WebSocket token exposure). Configure monitoring (Sentry) with appropriate alert thresholds (`replaysOnErrorSampleRate` reduced, `maskAllText` enabled). Implement `breachTimer` (mentioned in `auditTrailGdprEvents` comments) for 72-hour notification.

---

## COMPLIANCE GAP SUMMARY

| Requirement | GDPR / SOX | Status | Evidence / Finding ID |
|---|---|---|---|
| Lawfulness of Processing (Consent) | GDPR Art. 6, 7 | ⚠️ Partial | Consent registry events defined but not fully verified (`C-03`) |
| Right to Access (DSAR) | GDPR Art. 15 | ❌ Fail | No DSAR service; audit export includes PII without redaction (`H-03`) |
| Right to Erasure | GDPR Art. 17 | ❌ Fail | No `erasePersonalData()`; `masterStorage` unencrypted (`H-01`) |
| Data Processing Records (ROPA) | GDPR Art. 30 | ⚠️ Partial | Audit log captures processing but mutable (`C-03`) |
| Data Protection by Design | GDPR Art. 25 | ❌ Fail | Unencrypted storage, weak key, CSP `unsafe-inline` (`C-05`, `H-01`, `H-02`) |
| Security of Processing | GDPR Art. 32 | ❌ Fail | Client-side RBAC, dead brute-force, token leak (`C-02`, `C-04`, `C-05`) |
| Breach Notification (72h) | GDPR Art. 33, 34 | ❌ Fail | `IncidentResponse` not wired (`M-05`) |
| DPIA | GDPR Art. 35 | ❌ Fail | No DPIA verified |
| Internal Controls (Section 302) | SOX 302 | ❌ Fail | Client-side controls bypassable (`C-01`, `C-02`) |
| Audit Trail Integrity (Section 802) | SOX 802, 404 | ❌ Fail | Mutable audit, no hash chain (`C-03`) |
| Data Integrity / Validation | SOX 302 | ❌ Fail | Silent errors (`C-07`), floating-point equality (`C-06`), migration no-op (`H-01`) |
| Segregation of Duties | SOX 302, 404 | ⚠️ Partial | Roles defined but not enforced server-side (`C-02`, `C-01`) |
| Incident Response / Monitoring | SOX 302, 409 | ❌ Fail | `IncidentResponse` not wired (`M-05`) |

---

## OVERALL COMPLIANCE RATING

- **GDPR:** 🔴 NON-COMPLIANT (multiple critical gaps: mutable audit, unencrypted storage, no DSAR, no erasure, weak encryption key, no breach notification, no DPIA, PII redaction missing, RBAC not enforced server-side).
- **SOX:** 🔴 NON-COMPLIANT (multiple critical gaps: client-side controls bypassable, mutable audit trail, silent errors in ERP connector, floating-point currency, unencrypted persistence, incident response not wired, segregation of duties not enforced server-side).
