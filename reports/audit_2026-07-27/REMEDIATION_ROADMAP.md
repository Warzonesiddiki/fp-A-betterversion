# REMEDIATION ROADMAP — PRIORITIZED BY SEVERITY + EFFORT

**Audit Date:** 2026-07-27  
**Repository:** `Warzonesiddiki/fp-A-betterversion`  
**Branch:** `arena/019fa391-fp-a-betterversion`  
**Total Findings:** 23  
**Critical:** 7 | **High:** 6 | **Medium:** 6 | **Low:** 4

---

## PHASE 1: IMMEDIATE (WEEK 1) — CRITICAL SECURITY FIXES

| Priority | Finding ID | Severity | Effort (Days) | Remediation | Evidence / File |
|---|---|---|---|---|---|
| P1-1 | `C-01` (Mock Auth) | 🔴 Critical | 2 | Implement real JWT verification (`jwt.verify`) in `loginReal()`. Remove or restrict `setUser()` public access. Ensure `VITE_USE_MOCK_AUTH` is never set in production CI. Add server-side session validation. | `src/store/authStore.ts` |
| P1-2 | `C-02` (RBAC Client-Only) | 🔴 Critical | 3 | Apply `requireRole()` or permission middleware (`requirePermission`) to ALL protected server routes (`budgets`, `gl`, `forecasts`, `scenarios`, `reports`, `entities`, `export`). Verify server-side `req.user.role` and `req.user.permissions`. | `server/src/index.ts`, `server/src/middleware/auth.ts` |
| P1-3 | `C-05` (WebSocket Token Leak) | 🔴 Critical | 1 | Pass WebSocket token via `Authorization` header or subprotocol, not URL query param (`?token=...`). Implement server-side token validation on `upgrade`. | `src/services/WebSocketManager.ts` |
| P1-4 | `C-04` (Brute-Force Dead) | 🔴 Critical | 2 | Integrate `checkAccountLockout()` and `recordLoginAttempt()` into `server/src/routes/auth.ts`. Move brute-force state server-side (SQLite or Redis). | `server/src/middleware/accountLockout.ts`, `server/src/routes/auth.ts` |

**Phase 1 Total Effort:** ~8 days (parallel work possible)  
**Phase 1 Impact:** Eliminates 4 of 7 critical vulnerabilities.

---

## PHASE 2: SHORT-TERM (WEEKS 2-3) — DATA SECURITY & ENCRYPTION

| Priority | Finding ID | Severity | Effort (Days) | Remediation | Evidence / File |
|---|---|---|---|---|---|
| P2-1 | `C-03` (Audit Trail) | 🔴 Critical | 4 | Make audit trail append-only (remove `revertToState()` or restrict to super-admin with separate audit log). Add HMAC/hash chain (`previousHash` → hash of entry + previous hash). Enforce `GDPR_AUDIT_VIEW_ROLES` in `AuditTrailPage`. Call `PIIRedactor` before CSV export. | `src/store/auditTrailStore.ts`, `src/pages/audit/AuditTrailPage.tsx` |
| P2-2 | `H-01` (Master Storage) | 🟠 High | 3 | Add AES-256-GCM encryption to `masterStorage` (use `SecretsVault` or separate encryption layer). Implement proper schema migration (`version` increment + `migrate` function). Add `partialize` to all stores with sensitive data. | `src/utils/masterStorage.ts` |
| P2-3 | `H-02` (Secrets Key Weak) | 🟠 High | 2 | Derive master key from OS keychain (`TauriSecureStorage`) or user password, not hardcoded string (`rotationCounterKey`). Rotate master key on first use. Store rotation counter securely. | `src/services/SecretsVault.ts` |
| P2-4 | `C-07` (SQL Injection) | 🔴 Critical | 1 | Replace SQL string interpolation (`FROM GLEntry WHERE ACCOUNTNO = '${accountId}'`) with parameterized query or strict regex validation (`/^[A-Z0-9_-]+$/i`). Surface errors instead of returning empty arrays. | `src/services/api-integration/SageConnector.ts` |
| P2-5 | `C-06` (Floating-Point Currency) | 🔴 Critical | 3 | Enforce `decimalUtils` (`decimal.js` or integer-cents) for ALL currency fields in ALL engines (`SageConnector`, `AggregateTableEngine`, `ForecastStore`, `CapExStore`, `GLStore`). Add `Zod` validation for decimal values. | `src/utils/decimalUtils.ts`, `src/engines/`, `src/store/` |

**Phase 2 Total Effort:** ~13 days  
**Phase 2 Impact:** Fixes audit integrity, encryption, SQL injection, and currency accuracy.

---

## PHASE 3: MEDIUM-TERM (WEEKS 4-5) — COMPLIANCE & DATA PROTECTION

| Priority | Finding ID | Severity | Effort (Days) | Remediation | Evidence / File |
|---|---|---|---|---|---|
| P3-1 | `H-03` (GDPR Audit Export) | 🟠 High | 2 | Integrate `PIIRedactor` into `AuditTrailPage.handleExport()` and all audit APIs. Filter audit entries by `GDPR_AUDIT_VIEW_ROLES`. Implement `rightToErasure()` (`erasePersonalData`) in `auditTrailStore`. | `src/pages/audit/AuditTrailPage.tsx`, `src/store/auditTrailStore.ts`, `src/services/PIIRedactor.ts` |
| P3-2 | `H-04` (NIM API Key Exposure) | 🟠 High | 1 | Remove `VITE_NIM_API_KEY` from `.env.example`. If NIM integration needed, proxy through server (`/api/nim`) using server-side env (`NIM_API_KEY` without `VITE_` prefix). Remove `VITE_*` variables from client bundle. | `.env.example`, `src/services/nim.ts` |
| P3-3 | `H-05` (Sentry Replay PII) | 🟠 High | 1 | Set `replaysOnErrorSampleRate` to `0.05` or lower. Configure `maskAllText` and `block` selectors for PII fields. Ensure replay data hosted in GDPR-compliant region. | `.env.example` |
| P3-4 | `M-05` (Dead Incident Response) | 🟡 Medium | 2 | Wire `IncidentResponse` to security events (failed auth, suspicious API calls, CSRF failures). Configure `ThreatModel.emit()` for security signals. Implement `breachTimer` (72-hour notification). | `src/services/IncidentResponse.ts`, `src/services/ThreatModel.ts` |
| P3-5 | `M-02` (Skipped Migration Tests) | 🟡 Medium | 2 | Unskip 12 skipped migration/back tests. Verify `legacyStorageMigration` (IndexedDB → Tauri SQLite). Test backup integrity with restore verification. | `tests/`, `src/utils/migration/` |
| P3-6 | `M-01` (Deep Wizard Failures) | 🟡 Medium | 3 | Investigate 11 failing deep wizard tests. Fix or document expected failures. Ensure E2E tests (`tests/e2e/`) run in CI. | `tests/` |

**Phase 3 Total Effort:** ~11 days  
**Phase 3 Impact:** Achieves GDPR compliance (access, erasure, audit integrity, PII protection) and improves testing reliability.

---

## PHASE 4: ONGOING (WEEKS 6+) — PERFORMANCE, HYGIENE, MONITORING

| Priority | Finding ID | Severity | Effort (Days) | Remediation | Evidence / File |
|---|---|---|---|---|---|
| P4-1 | `H-06` (Bundle Size Unenforced) | 🟠 High | 2 | Add `bundle-check` enforcement gate to CI. Implement code-splitting and tree-shaking for `Sentry`. Verify all 192 pages use `React.lazy`. | `scripts/bundle-check.js`, `package.json` |
| P4-2 | `M-03` (A11y Warnings) | 🟡 Medium | 3 | Audit 54 non-fixable `jsx-a11y` warnings. Fix high-impact warnings. Document remaining low-impact warnings. | `e2e/a11y/` |
| P4-3 | `M-06` (Archive Hygiene) | 🟡 Medium | 1 | Delete `docs/_archive/` and agent scratch directories (`.ai/`, `agent_runs/`, `.mimocode/`, `.superpowers/`). Consolidate architecture docs. Move strategic plans to external wiki. | `docs/_archive/`, `.ai/` |
| P4-4 | `M-04` (Middleware Ordering) | 🟡 Medium | 1 | Audit all 35 stores for `subscribeWithSelector` ordering (`subscribeWithSelector` → `persist` → `immer`). Add automated lint/test for middleware nesting. | `src/store/` |
| P4-5 | `L-01` (Naming Inconsistency) | 🔵 Low | 2 | Standardize naming conventions (`camelCase` vs `PascalCase`). Remove ritual comments (`CAVEMAN PERSIST`, `DRIFT`, etc.) from production source. | `src/store/`, `src/engines/` |
| P4-6 | Dependency Monitoring | 🔵 Low | Ongoing | Add `npm audit` to CI (`.github/workflows/`). Monitor `npm audit` results weekly. Upgrade `axios`, `react-router`, `dompurify`, `exceljs`. Monitor `sharp`, `adm-zip`, `onnxruntime-node`. | `package.json`, `package-lock.json` |

**Phase 4 Total Effort:** ~9 days (+ ongoing monitoring)  
**Phase 4 Impact:** Improves performance, accessibility, code hygiene, and supply chain security.

---

## EFFORT SUMMARY

| Phase | Duration | Effort (Days) | Critical Fixed | High Fixed | Medium Fixed | Low Fixed |
|---|---|---|---|---|---|---|
| Phase 1 (Immediate) | Week 1 | 8 | 4 | 0 | 0 | 0 |
| Phase 2 (Short-Term) | Weeks 2-3 | 13 | 1 (`C-07`) + `C-06` | 2 (`H-01`, `H-02`) | 0 | 0 |
| Phase 3 (Medium-Term) | Weeks 4-5 | 11 | 0 | 3 (`H-03`, `H-04`, `H-05`) | 3 (`M-05`, `M-02`, `M-01`) | 0 |
| Phase 4 (Ongoing) | Weeks 6+ | 9 (+ongoing) | 0 | 1 (`H-06`) | 2 (`M-03`, `M-04`) | 3 (`L-01`, `L-02`, `L-03`, `L-04`, dependency monitoring) |
| **Total** | **~7 weeks** | **41 days** (parallel: ~20-25 days) | **5** (of 7 critical) | **6** (all high) | **6** (all medium) | **4** (all low) |

---

## RISK REDUCTION PROJECTION

| Phase Complete | Critical Remaining | High Remaining | Overall Risk Rating |
|---|---|---|---|
| Before (Baseline) | 7 | 6 | 🔴 HIGH / CRITICAL |
| After Phase 1 | 3 (`C-03`, `C-06`, `C-07`) | 6 | 🔴 HIGH (reduced) |
| After Phase 2 | 0 (if `C-03`, `C-06`, `C-07` fixed) | 3 (`H-03`, `H-04`, `H-05`) | 🟠 HIGH |
| After Phase 3 | 0 | 1 (`H-06`) | 🟡 MEDIUM |
| After Phase 4 | 0 | 0 | 🔵 LOW (if all fixed) |

---

## DEPENDENCIES & BLOCKERS

- **Phase 1 depends on:** Access to production CI environment (to enforce `VITE_USE_MOCK_AUTH` gate), server deployment access (to apply middleware changes).
- **Phase 2 depends on:** Phase 1 (RBAC server-side must be in place before audit trail fixes are fully effective — audit trail relies on correct user roles).
- **Phase 3 depends on:** Phase 2 (encryption of `masterStorage` must be complete before GDPR compliance can be fully achieved).
- **Phase 4 depends on:** Phase 3 (bundle-size optimization requires stable feature set; accessibility fixes require stable UI components).

---

## MONITORING & VERIFICATION

- **Weekly:** `npm audit` check. Monitor `sharp`, `adm-zip`, `onnxruntime-node` releases.
- **Bi-Weekly:** Verify `bundle-check` results. Monitor `Sentry` error rates (`replaysOnErrorSampleRate` impact).
- **Monthly:** Re-audit `authStore` (ensure `setUser()` not exposed). Re-verify `rbacEnforcer` usage in all new store files. Check `AuditTrailPage` for RBAC gating.
- **Quarterly:** Full security audit (re-run this audit template). Verify DPIA updates. Review `GDPR_AUDIT_VIEW_ROLES` enforcement. Verify `IncidentResponse` wiring.
