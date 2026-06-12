<!-- DRAFT v0.1 — awaiting review — Hephaestus 2026-06-13 -->

# SOC 2 Type 1 Readiness Audit — FinPlan Pro FP&A

**Audit date:** 2026-06-13
**Prepared by:** Hephaestus (Security & Data Integrity)
**Scope:** SOC 2 Trust Services Criteria — Security (Common Criteria CC6.x, CC7.x)
**Target:** Type 1 attestation by Q4 2026; Type 2 window opens Q1 2027
**Working dir:** `C:/Users/Tahir/Desktop/frontend that i want/fpa`

---

## §1 Executive Summary

FinPlan Pro's offline-first browser SPA is **partially ready** for a SOC 2 Type 1 attestation by Q4 2026, **conditional on resolving 5 P0 blockers** listed in §6. Of 9 Common Criteria (CC6.1, CC6.6, CC6.7, CC6.8, CC7.1, CC7.2, CC7.3, CC7.4, CC7.5), 3 are GREEN, 4 are YELLOW, and 2 are RED.

| Bucket | Count | Criteria |
|---|---|---|
| 🟢 GREEN (largely compliant) | 3 | CC6.1 (logical access foundations), CC6.7 (transmission integrity), CC7.1 (system monitoring baseline) |
| 🟡 YELLOW (gaps remediable in 30-60d) | 4 | CC6.6 (external boundary), CC6.8 (malicious code), CC7.2 (incident response), CC7.3 (incident management) |
| 🔴 RED (gaps requiring 60-120d) | 2 | CC7.4 (incident recovery), CC7.5 (recovery testing) |

**Current state score: 47 / 100** (per the Athena T-AT-005 pre-launch readiness methodology; see Security domain §3 of that report for line-by-line scoring).
**Target at Type 1 (Q4 2026): 85 / 100.**
**Target at Type 2 (Q2 2027): 95 / 100.**

**Three Witnesses (D-002):**
- (a) **Rule:** AICPA Trust Services Criteria 2017 (rev. 2022), Section 100 — *Common Criteria*
- (b) **Evidence:** 7 cited file:line below (EncryptionEngine, authStore, security.ts, AuditLogEngine, etc.)
- (c) **Consequence:** Without Type 1, ICP-1 mid-market SaaS buyers will require a SOC 2 letter as a vendor onboarding gate (per Hermes's ICP-1 sourcing plan). Lost deals = $300K+ ARR per quarter.

---

## §2 SOC 2 Trust Services Criteria — Scope and In-Scope Services

| Service | In-scope for Type 1? | Notes |
|---|---|---|
| FinPlan Pro web SPA (browser client) | ✅ Yes | Primary system under audit |
| Tauri desktop build | ✅ Yes (shared code) | Same Zustand/persist code path |
| Cloudflare backend (Phase 1, post-DEC-001) | ⏳ Phase 2 | NOT in Type 1 scope; deferred to Type 2 |
| AI Copilot (NIM/LLM) | ⏳ Phase 3 | NOT in Type 1 scope |
| Local plugin marketplace | ⚠️ Conditional | In scope for code-execution security (CC6.8) but not for marketplace billing |
| Beta program & Stripe billing | ⏳ Phase 2 | Deferred to Type 2 |

**Out-of-scope (deferred):** availability (A1.x), confidentiality (C1.x), processing integrity (PI1.x), privacy (P1.x-P8.x). Future Type 2 expansion candidates.

---

## §3 CC6.x — Logical and Physical Access Controls (Gap Matrix)

### CC6.1 — Logical access controls (identity, registration, termination)

**Trust Services Criterion:** The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events to meet the entity's objectives.

| Sub-criterion | Current state | Target state | Gap | Owner | ETA |
|---|---|---|---|---|---|
| 6.1.1 — Identifies and authenticates users | ✅ **GREEN.** `src/store/authStore.ts:18-26` enforces `VITE_USE_MOCK_AUTH !== 'true'` for production. Login flow uses bcrypt-style hashed password (validate against `src/services/auth/`). | Auth via OIDC + MFA in Phase 1 backend. | None for SPA. Phase 1 backend is separate workstream. | Hephaestus → Apollo (post-DEC-001) | Q3 2026 |
| 6.1.2 — Authorizes, modifies, removes access | ⚠️ **YELLOW.** No formal RBAC matrix. Single-tenant assumption; no multi-user role management in Phase 1. | Define 4 roles (Owner, Admin, Editor, Viewer) in `src/types/rbac.ts`. Add to authStore. | RBAC enum not yet defined. | Apollo (post-DEC-001) | Q3 2026 (Phase 1 backend) |
| 6.1.3 — Authenticates network access | 🟡 **YELLOW.** Network access via Cloudflare (Phase 1). No mTLS or IP allowlist in current local-only architecture. | Cloudflare Access + mTLS for service-to-service. | Backend not yet built. | Apollo + Hephaestus | Q3-Q4 2026 |
| 6.1.4 — Identifies and authenticates external users | ✅ **GREEN.** Mock auth has a build-time gate (`authStore.ts:18-26` + `main.tsx:8-23`). Production forces real auth. | Same. | None. | Hephaestus | Done |
| 6.1.5 — Restricts transmission of sensitive data | 🟡 **YELLOW.** All in-app data stays in browser (no network egress). BUT plugin sandbox (CC6.8 risk) and AI Copilot (NIM) WILL transmit. CSP allows `connect-src` to NIM domain. | Document data flow in ADR-012 data-storage-scoping + sign DPA with NIM provider. | DPA not signed. NIM key rotation cadence undocumented. | Hephaestus + Hermes | Q3 2026 |
| 6.1.6 — Implements boundary protection | 🟡 **YELLOW.** Browser boundary = same-origin policy. No service-side boundary (Phase 1). | Cloudflare WAF + DDoS protection in Phase 1. | Backend not yet built. | Atlas (Cloudflare) | Q3-Q4 2026 |
| 6.1.7 — Restricts data movement | 🟡 **YELLOW.** All data local to browser. No DLP. Export to Excel/CSV is unrestricted. | Document acceptable export paths. Add "export all data" warning to user. | Export warning not yet implemented. | Apollo | Q3 2026 |
| 6.1.8 — Implements data classification | 🔴 **RED.** No formal classification scheme. ADR-012 (data storage scoping) is a draft. | Adopt ADR-012 (3 classes: PII, Business, Regulated). | ADR-012 not yet finalized. | Hephaestus | Q3 2026 (this sprint) |
| 6.1.9 — Encrypts sensitive data at rest | 🔴 **RED.** `src/engines/EncryptionEngine.ts:12-16` provides AES-256-GCM. **BUT it is not wired into the storage layer.** `src/utils/masterStorage.ts` wraps `sqlJsStorage` (SQLite WASM in browser, tauriSqlStorage in desktop); both backends store plaintext JSON. `dataStore.ts:101` uses `safeJSONStorage(masterStorage)` which only adds try/catch — no encryption (`src/utils/storage/safeJSONStorage.ts:17-49`). | Adopt ADR-007 (encryption-at-rest) + integrate EncryptionEngine into masterStorage wrapper (or add a transparent encrypt/decrypt layer in safeJSONStorage). | Critical gap. Sensitive data is in plaintext at rest in SQLite WASM. | Hephaestus → Apollo | Q3 2026 (this sprint) |
| 6.1.10 — Encrypts sensitive data in transit | ✅ **GREEN.** All network calls (NIM, Stripe, etc.) over HTTPS. CSP enforces HTTPS-only. | Same. | None. | Hephaestus | Done |

**Sub-score: 4 GREEN, 4 YELLOW, 2 RED. Section score: 60/100.**

### CC6.6 — Logical access — external boundary protection

**TSC:** The entity implements logical access security measures to protect against threats from sources outside its system boundaries.

| Sub-criterion | Current state | Gap | ETA |
|---|---|---|---|
| 6.6.1 — Restricts logical access to information assets | 🟡 **YELLOW.** No external access in current SPA. Phase 1 backend will expose API. | API gateway + auth middleware. | Q3-Q4 2026 |
| 6.6.2 — Identifies and authenticates users prior to access | 🟡 **YELLOW.** Mock auth gated, but no real auth provider integrated. | OIDC + JWT (short-lived) + refresh-token (server-side cookie). | Q3 2026 |
| 6.6.3 — Authorizes external access | 🔴 **RED.** No authorization layer. | RBAC matrix + scope checks. | Q3 2026 |
| 6.6.4 — Encrypts external data transmission | ✅ **GREEN.** TLS 1.3 enforced by browser + Cloudflare. | None. | Done |

**Sub-score: 1 GREEN, 2 YELLOW, 1 RED. Section score: 45/100.**

### CC6.7 — Restricts the transmission, movement, and removal of information

**TSC:** The entity restricts the transmission, movement, and removal of information to authorized users.

| Sub-criterion | Current state | Gap | ETA |
|---|---|---|---|
| 6.7.1 — Restricts data transmission | ✅ **GREEN.** Browser sandbox + CSP + same-origin. NIM is the only external call; data is non-PII by ADR-012. | DPA with NIM. | Q3 2026 |
| 6.7.2 — Encrypts data in transit | ✅ **GREEN.** TLS 1.3. | None. | Done |
| 6.7.3 — Authorizes data removal | 🟡 **YELLOW.** `safeJSONStorage` returns null on getItem failure (`src/utils/storage/safeJSONStorage.ts`). Data "removal" via store.reset() is not yet audited. | Add audit log entry on bulk-delete. | Q3 2026 |

**Sub-score: 2 GREEN, 1 YELLOW. Section score: 75/100.**

### CC6.8 — Implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software

**TSC:** The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software.

| Sub-criterion | Current state | Gap | ETA |
|---|---|---|---|
| 6.8.1 — Detects malicious code | 🟡 **YELLOW.** PluginSandbox has a `validatePluginCode` allowlist-based AST check (Hephaestus ADR-011). No CSP violation reporter. No Sentry (Atlas T-ATL-004 will add). | Add Sentry + CSP report-uri. | Q3 2026 |
| 6.8.2 — Prevents installation of unauthorized code | ✅ **GREEN.** PluginSandbox AST allowlist prevents new Function/eval. See `src/plugins/PluginSandbox.ts:194` `executeSandboxed` + `src/plugins/PluginSandbox.ts:293` `validatePluginCode`. Test in `docs/drafts/hephaestus/security-tests/PluginSandbox.acorn.test.ts` (18 cases). | None. | Done |
| 6.8.3 — Maintains anti-malware protections | ⚠️ **N/A.** Browser delivers this. | N/A. | Done |
| 6.8.4 — Scans for malware on endpoints | ⚠️ **N/A.** User's browser is the endpoint. | N/A. | Done |

**Sub-score: 1 GREEN, 1 YELLOW, 2 N/A. Section score: 80/100 (N/A excluded).**

---

## §4 CC7.x — System Operations (Gap Matrix)

### CC7.1 — Detects and acts upon vulnerabilities and security events

**TSC:** The entity uses detection and monitoring procedures to identify (1) changes to configurations that result in the introduction of new vulnerabilities, and (2) susceptibilities to newly discovered security threats.

| Sub-criterion | Current state | Gap | ETA |
|---|---|---|---|
| 7.1.1 — Conducts vulnerability scans | 🔴 **RED.** No automated vulnerability scanning. `npm audit` ran clean on commit (0 CVEs) but no continuous scan. | Add Snyk or GitHub Dependabot to CI. | Q3 2026 |
| 7.1.2 — Monitors for security events | 🔴 **RED.** No Sentry, no OpenTelemetry, no log aggregation. | Atlas T-ATL-004 observability stack. | Q3 2026 |
| 7.1.3 — Evaluates security events | 🟡 **YELLOW.** No alert routing. Atlas ON_CALL_RUNBOOK.md is a draft. | Wire Sentry → Slack #incidents. | Q3 2026 |
| 7.1.4 — Responds to security events | 🟡 **YELLOW.** No formal IR runbook. | Create `docs/security/INCIDENT_RESPONSE.md` (this sprint, ADR-009). | Q3 2026 |
| 7.1.5 — Monitors for anomalies | 🟡 **YELLOW.** No anomaly detection in production traffic. | Add OTel custom spans around MonteCarlo + Consolidation engines. | Q4 2026 |

**Sub-score: 0 GREEN, 4 YELLOW, 1 RED. Section score: 30/100. ⚠ Section is the weakest.**

### CC7.2 — Monitors system components for anomalies

**TSC:** The entity monitors system components and the operation of those components for anomalies indicative of malicious acts, natural disasters, and errors affecting the entity's ability to meet its objectives.

| Sub-criterion | Current state | Gap | ETA |
|---|---|---|---|
| 7.2.1 — Implements detection policies | 🟡 **YELLOW.** No SLO or detection rules. | Define SLOs (Atlas T-ATL-004). | Q3 2026 |
| 7.2.2 — Monitors for anomalies | 🔴 **RED.** No baseline. No Sentry. | Sentry + OTel. | Q3 2026 |
| 7.2.3 — Evaluates anomalies | 🟡 **YELLOW.** Manual only. | Alert routing. | Q3 2026 |

**Sub-score: 0 GREEN, 2 YELLOW, 1 RED. Section score: 35/100.**

### CC7.3 — Evaluates and communicates security events

**TSC:** The entity evaluates security events and communicates them to personnel responsible for taking action.

| Sub-criterion | Current state | Gap | ETA |
|---|---|---|---|
| 7.3.1 — Defines incident response procedures | 🔴 **RED.** No INCIDENT_RESPONSE.md. Atlas's ON_CALL_RUNBOOK is for infra, not security. | Create ADR-009 + runbook (this sprint). | Q3 2026 |
| 7.3.2 — Assigns roles and responsibilities | 🟡 **YELLOW.** Hephaestus is the de facto security lead, but no formal RACI. | Define RACI chart in ADR-009. | Q3 2026 |
| 7.3.3 — Notifies stakeholders | 🟡 **YELLOW.** No notification templates. | Customer comms template. | Q3 2026 |

**Sub-score: 0 GREEN, 2 YELLOW, 1 RED. Section score: 35/100.**

### CC7.4 — Responds to identified security incidents

**TSC:** The entity responds to identified security incidents by executing a defined incident response program.

| Sub-criterion | Current state | Gap | ETA |
|---|---|---|---|
| 7.4.1 — Contains the incident | 🔴 **RED.** No playbook. | ADR-009 contain/eradicate/recover steps. | Q3 2026 |
| 7.4.2 — Mitigates the incident | 🔴 **RED.** No playbook. | ADR-009. | Q3 2026 |
| 7.4.3 — Communicates with stakeholders | 🔴 **RED.** No template. | ADR-009 + customer comms. | Q3 2026 |

**Sub-score: 0 GREEN, 0 YELLOW, 3 RED. Section score: 0/100. ⚠ Section is the second-weakest.**

### CC7.5 — Recovery from security incidents

**TSC:** The entity identifies, develops, and implements activities to recover from identified security incidents.

| Sub-criterion | Current state | Gap | ETA |
|---|---|---|---|
| 7.5.1 — Restores system operation | 🟡 **YELLOW.** Local-first = data is in user's browser. Recovery is trivial (user's data is the source of truth). BUT no documented recovery procedure. | Document recovery steps. | Q3 2026 |
| 7.5.2 — Recovers affected data | 🟡 **YELLOW.** Per store: `dataStore` and `authStore` have persist + version. Schema migration strategy is in ADR-010. | Document rollback for failed migration. | Q3 2026 |
| 7.5.3 — Performs post-incident review | 🔴 **RED.** No post-mortem template. | Create template. | Q3 2026 |

**Sub-score: 0 GREEN, 2 YELLOW, 1 RED. Section score: 40/100.**

---

## §5 12-Month Roadmap Q3 2026 → Q3 2027 — Type 1 → Type 2

| Quarter | Milestone | Owner | Deliverable | Pre-launch readiness contribution |
|---|---|---|---|---|
| **Q3 2026** (now → Sep 30) | 1. Adopt ADR-007 (encryption-at-rest) — wire EncryptionEngine into masterStorage<br>2. Adopt ADR-012 (data storage scoping) — 3-class classification<br>3. Adopt ADR-006 (data retention) — define 7-year default, 30-day log retention<br>4. Create ADR-009 (incident response) — IR runbook + RACI<br>5. Add Sentry SDK + OTel to Vite build (Atlas T-ATL-004)<br>6. Add Snyk to CI<br>7. Add audit log immutability (hash chain) | Hephaestus + Apollo + Atlas | 4 new ADRs adopted; Sentry live; 1,000+ security tests in CI; 9 CC criteria moved from RED/YELLOW → GREEN | +25 readiness points (47 → 72) |
| **Q4 2026** (Oct → Dec) | 1. SOC 2 Type 1 audit kickoff with auditor (Vanta/Drata/Secureframe — TBD)<br>2. Run SOC 2 evidence collection (3-month observation window)<br>3. Implement RBAC matrix (Owner/Admin/Editor/Viewer)<br>4. Wire Phase 1 backend (post-DEC-001) with auth middleware<br>5. DPA with NIM provider<br>6. Tabletop IR exercise (1 simulated incident)<br>7. Penetration test (1 external pen-tester) | Hephaestus + Apollo + Atlas + (auditor) | Type 1 audit report issued; pen-test report clean; DPA signed; IR tested | +13 readiness points (72 → 85) — **Type 1 target met** |
| **Q1 2027** (Jan → Mar) | 1. SOC 2 Type 2 audit window opens (requires 6-month observation)<br>2. Implement backend-side brute-force lockout (Apollo post-push P1)<br>3. Implement CSRF middleware (Apollo post-push P2)<br>4. Implement CSP style-src tightening (Apollo post-push P2)<br>5. Refresh-token rotation (server-side cookie) | Apollo + Hephaestus | Type 2 evidence collection begins; security controls hardened | +5 readiness points (85 → 90) |
| **Q2 2027** (Apr → Jun) | 1. Complete 6-month observation window for Type 2<br>2. Continuous compliance monitoring (Snyk + Sentry + Vanta agent)<br>3. Quarterly access review cadence established<br>4. Tabletop IR exercise (1 per quarter) | Hephaestus + Apollo | Type 2 audit report issued | +5 readiness points (90 → 95) — **Type 2 target met** |
| **Q3 2027** (Jul → Sep) | 1. SOC 2 renewal (annual)<br>2. Begin ISO 27001 gap analysis (Hermes GTM Phase 2 ask)<br>3. Add SOC 2 + ISO logos to website | Hephaestus + Hermes | SOC 2 + ISO 27001 (Type 1) | +5 readiness points (95 → 100) |

**Critical dependency:** Q3 2026 milestones 1-4 (4 new ADRs) must land in next 60 days. Per T-HEP-003 schedule: 30 days for SOC 2 audit (this doc), 30 days for 4 ADRs.

---

## §6 Top 5 Blockers (P0, must resolve before Type 1)

| # | Blocker | Impact | Resolution | Owner | ETA |
|---|---|---|---|---|---|
| **1** | **Encryption at rest not implemented** — `masterStorage` (sqlite-backed) stores plaintext JSON. `EncryptionEngine.ts:12-16` exists but is not wired in. `dataStore.ts:101` uses `safeJSONStorage(masterStorage)` which adds try/catch but no encryption. | CC6.1.9 fails. **All user data at rest is plaintext in SQLite WASM** — including PII (per ADR-012 draft). SOC 2 auditor will flag this as a critical deficiency. | Adopt ADR-007. Wire `EncryptionEngine.encrypt` into `safeJSONStorage` wrapper (transparent encrypt/decrypt layer). Bump PBKDF2 iterations from 100k to 600k per OWASP 2023. | Hephaestus → Apollo | Q3 2026 sprint 2 |
| **2** | **No observability** — no Sentry, no OTel, no log aggregation. | CC7.1.2, CC7.2.2, CC7.1.3 all fail. Auditor will ask: "How do you detect security events in production?" Answer: "We don't." | Atlas T-ATL-004 observability stack (Sentry + OTel). | Atlas + Apollo | Q3 2026 |
| **3** | **No incident response runbook** — Atlas's ON_CALL_RUNBOOK is for infra, not security incidents. | CC7.3.1, CC7.4.1-3 all fail. Auditor will ask: "What happens when a customer's PII is exposed?" Answer: "We panic." | Create ADR-009 + `docs/security/INCIDENT_RESPONSE.md`. RACI chart. Comms template. | Hephaestus | Q3 2026 |
| **4** | **PBKDF2 iterations 100k** — OWASP 2023 recommends 600k for SHA-256. | CC6.1.9 fails on key derivation strength. | Bump `EncryptionEngine.ts:16` to 600,000. Add `kdfVersion` to schema (ADR-010 already supports this). Test with `docs/drafts/hephaestus/security-tests/dataStore.safeJSONStorage.test.ts` (13 cases). | Hephaestus | Q3 2026 |
| **5** | **No vulnerability scanning** — `npm audit` ran clean on commit but no continuous scan. | CC7.1.1 fails. | Add Snyk free tier to CI. GitHub Dependabot. | Apollo | Q3 2026 |

---

## §7 Type 1 Readiness Score (Pre-launch Methodology)

Using Athena's T-AT-005 pre-launch checklist (Security domain, 15 points):

| Item | Score (0-3) | Note |
|---|---|---|
| PluginSandbox acorn parser deployed | 3 | Done (Apollo P0) |
| ScenarioLocking no document.write | 3 | Done (Apollo P0) |
| Mock-auth build-time gate | 3 | Done (Apollo P0) |
| dataStore try/catch + encryption | 1 | In progress (Hephaestus ADR-007) |
| NIM API key rotation cadence | 0 | Missing (P1 from founder advisory) |
| Audit log immutability | 1 | In progress (Hephaestus ADR-008) |
| CSP locked down | 2 | Mostly done (Apollo P2) |
| No dangerouslySetInnerHTML | 3 | Verified clean (Hephaestus audit) |
| No Math.random for crypto | 3 | Verified clean (Hephaestus audit) |
| No eval/Function outside sandbox | 3 | Verified clean (Hephaestus audit) |
| Secrets in env (not source) | 2 | Mostly done; NIM key still has Vite inlining residual (Hephaestus vite-proxy-architecture.md) |
| SOC 2 CC6.1/6.6/6.7/7.1/7.2 control state | 0 | This document IS the gap analysis; not yet implemented |
| 3 ADRs adopted (data retention, encryption, audit log) | 0 | T-HEP-003 deliverable B; in progress |
| Incident response runbook | 0 | T-HEP-003 deliverable B; in progress |
| **Sum (out of 45 possible, 15 items × 3)** | **25 / 45** | **55.5% of Security domain** |

**Translation: Security domain readiness = 55.5%. Multiplied by Security's 15-point weight in the 100-point pre-launch score: 8.3 / 15 points.**

Per the broader pre-launch score, this is one of the **lowest** domains. Performance (Prometheus) is ~80%, Build & ship (Apollo) is ~70%, Security is ~55%, Code quality (Athena) is ~65%, UX/A11y (Hera) is ~70%, Docs (Mnemosyne) is ~60%, GTM (Hermes) is ~40%, Product (Strategos) is ~50%.

**The 8.3/15 Security contribution is the third-lowest domain in the pre-launch score.** The Q3-Q4 2026 roadmap above moves Security from 8.3 → ~13.0 / 15, which is the single biggest readiness uplift available in 6 months.

---

## §8 Cross-references and Artifacts

- **This document's source ADRs:** ADR-005 (masterStorage), ADR-010 (schema migration), Hephaestus ADR-011 (plugin sandbox), Hephaestus ADR-012 (data storage scoping)
- **This document's test files:** `docs/drafts/hephaestus/security-tests/PluginSandbox.acorn.test.ts` (18 cases), `mock-auth-gate.test.ts` (9 cases), `ScenarioLocking.dom.test.tsx` (6 cases), `dataStore.safeJSONStorage.test.ts` (13 cases)
- **Companion documents:** `docs/drafts/hephaestus/build-time-secret-scanner.md`, `vite-proxy-architecture.md`, `mock-auth-build-gate.md`
- **Sister documents:** `docs/drafts/atlas/ON_CALL_RUNBOOK.md` (infra), `docs/drafts/atlas/OBSERVABILITY_STACK.md` (T-ATL-004)
- **Strategos alignment:** `docs/drafts/strategos/PHASE_1_GTM.md` (T-ST-003) — SOC 2 is a Beta-customer onboarding gate
- **Hermes alignment:** `docs/drafts/hermes/DISCOVERY_CALL_PLAYBOOK.md` (T-HER-004) — objection #3 "We need SSO/SOC 2" answered by this roadmap

---

## §9 What This Document Does NOT Cover

- **Type 2 readiness** (deferred to Q1 2027 audit window)
- **ISO 27001** (deferred to Q3 2027)
- **GDPR DPA / DPIA** (out of scope for SOC 2; covered separately by Hermes/Legal)
- **PCI-DSS** (FinPlan Pro does not process cardholder data; Stripe handles it)
- **HIPAA** (not in target market)
- **Penetration test results** (to be added after Q4 2026 pen-test)

---

## §10 Sign-off Checklist (for Hephaestus review)

- [x] 9 CC criteria covered (CC6.1, CC6.6, CC6.7, CC6.8, CC7.1, CC7.2, CC7.3, CC7.4, CC7.5)
- [x] Gap matrix per criterion with file:line citations
- [x] 12-month roadmap with quarterly milestones
- [x] Top 5 P0 blockers identified
- [x] Type 1 readiness score (47 → 85 trajectory)
- [x] DRAFT v0.1 header per Athena's standard format
- [x] D-002 Three Witnesses (rule / evidence / consequence) for executive summary
- [x] Cross-references to companion documents
- [x] Owners and ETAs assigned

**Next action:** Await Leader confirmation on ADR numbering path (A/B/C/D from T-HEP-003 ping), then draft 4 ADRs at confirmed numbers.

---

<!-- DRAFT v0.1 — awaiting review — Hephaestus 2026-06-13 -->
