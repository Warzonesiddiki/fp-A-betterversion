# SECTION 10 — SECURITY & COMPLIANCE ARCHITECTURE

## 10.1 Threat model (STRIDE, abbreviated)

| Threat                 | Vector                                           | Control                                                                                                          |
| ---------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Spoofing               | Credential stuffing, session theft               | OIDC/SAML SSO, MFA, short-lived JWT + rotating refresh, device binding, login-attempt throttling                 |
| Tampering              | Direct DB write, API manipulation, audit erasure | Append-only audit with hash chain, DB-level immutability on closed periods, signed commands, checksum on exports |
| Repudiation            | "I didn't approve that"                          | Maker-checker with actor identity, IP, timestamp, correlation id; non-repudiable audit chain                     |
| Information disclosure | Cross-tenant leak, over-broad reads, log leakage | RLS (dual-enforced, PC4), field-level masking, redaction in logs, per-tenant encryption keys                     |
| Denial of service      | Expensive queries, recalc storms, import floods  | Query cost limits, rate limiting, backpressure, job quotas, circuit breakers                                     |
| Elevation of privilege | Role escalation, SoD bypass, plugin escape       | Deny-by-default RBAC+ABAC, SoD matrix enforced server-side, plugins sandboxed with no DB/network access          |

## 10.2 Row-level security — F-PLAT-001 (P0)

Access is deny-by-default. A user sees a fact only if a policy grants it.

```
Policy dimensions: tenant → environment → entity subtree → scenario →
                   book → account class → dimension member set
```

Dual enforcement (PC4): the same predicate compiles to a Postgres RLS policy _and_ to a
mandatory query-builder filter. **Every read path passes through the filter — there is no
"admin bypass" query.** Break-glass access exists, requires justification, is time-boxed,
and pages the security owner.

Test obligation: for every table holding tenant data there is a cross-tenant leak test that
asserts tenant A's credentials return zero rows of tenant B's data. Missing test = failing build.

## 10.3 Field-level masking — F-SEC-003 (P0)

Salary, individual compensation, and PII are masked by default. Masking is applied at the
data layer, not the UI — a masked field is masked in the API response, in exports, in logs,
and in AI prompts. Unmasking is a distinct permission and an audited event.

## 10.4 Identity lifecycle — F-SEC-004 (P0)

SCIM 2.0 provisioning and de-provisioning; joiner/mover/leaver flows; SSO with
just-in-time provisioning; group-to-role mapping; access reviews (quarterly attestation
export); orphaned-account detection. Segregation of duties is a server-enforced matrix:
the creator of a journal cannot approve it; the person who defines a metric cannot certify
it alone; the administrator who grants a role cannot also approve their own grant.

## 10.5 Encryption & key management

At rest: AES-256-GCM, per-tenant data encryption keys wrapped by a KMS master key,
rotatable without re-encrypting everything. In transit: TLS 1.3 only. In the desktop
workspace: OS keychain-backed local encryption. Secrets are never in source, never in
logs, never in error messages. A committed secret is a Severity-0 incident with a
documented rotation runbook.

## 10.6 Compliance targets

| Framework      | Status                                                                                                                                                                                 | Phase                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| SOC 2 Type II  | Controls designed; evidence pipeline scripted (`compliance:evidence`)                                                                                                                  | 2 (readiness) → 3 (audit) |
| ISO 27001      | Control mapping documented                                                                                                                                                             | 3                         |
| GDPR / UK GDPR | DPA, DSR workflow, residency, retention (K25 — retention beats erasure for financial records; erasure applies to PII, with a documented legal-basis carve-out for statutory retention) | 1–2                       |
| SOX / ICFR     | Control matrix, maker-checker, SoD, immutable audit, close evidence pack                                                                                                               | 2                         |
| CCPA           | DSR workflow                                                                                                                                                                           | 2                         |

**Certification honesty (Part LII):** the product claims a certification only when the
audit report exists. Until then the public language is "designed to meet", with the control
evidence available. Claiming an uncertified standard is a Severity-0 integrity failure.

## 10.7 Data retention & residency (Part XLVII)

Financial records: retained per jurisdiction (default 7 years), never hard-deleted.
Audit log: retained ≥ the financial record it describes; append-only. PII: retained per
policy with DSR-driven redaction that preserves the financial fact while removing the
personal identifier. Residency: tenant-pinned region recorded on the tenant row and
enforced at the storage and processing layers; cross-region processing requires explicit
configuration and is audited.

## 10.8 OWASP Top 10 (2021) — financial-application mapping (XVIII-N)

Every item is mapped to a named control and a blocking test. An unmapped item is a lock
blocker, not a backlog item.

| OWASP                                            | Financial-app expression                                                         | Control                                                                                                                                                                                                      | Blocking test                                                                                         |
| ------------------------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| **A01 Broken Access Control**                    | Analyst reads another entity's comp detail; user opens another tenant's scenario | Deny-by-default RLS dual-enforced (PC4): PG policy **and** mandatory query-builder filter; SoD matrix server-side; entitlements checked per call (A.12)                                                      | Cross-tenant leak test **per table**; `tests/security/rls-*.spec.ts`; SoD self-approval negative test |
| **A02 Cryptographic Failures**                   | Bank tokens, salary data, export files at rest                                   | AES-256 at rest, TLS 1.3 in transit, per-tenant DEKs, BYOK/CMEK (PR3); no bank credentials in the app DB (TR1)                                                                                               | Key-rotation runbook rehearsal; secret-scan gate; plaintext-at-rest assertion                         |
| **A03 Injection**                                | SQL in a filter string; formula-driven data exfiltration                         | Parameterised queries only, zero SQL outside `server/src/db/`; formula AST is structured — never string-concatenated into SQL; `INDIRECT`/`OFFSET` restricted, file/URL fetch from a formula banned (A.14.1) | `architecture:guardrails` (no raw SQL); injection fuzz suite on every list endpoint                   |
| **A04 Insecure Design**                          | A "temporarily disable validation" flag; a bypassable close lock                 | Three-statement gate is **runtime and non-disableable** (ADR-010); closed-period immutability at DB level; threat model required per new endpoint (A.21)                                                     | `FIN-000` block test; closed-period write negative test                                               |
| **A05 Security Misconfiguration**                | Debug endpoints in prod; permissive CORS; default admin                          | IaC scanned in CI; environment parity (EN1–EN7); no default credentials; strict CORS/CSP; `ignore-scripts=true` retained (ADR-002)                                                                           | IaC scan gate; prod config smoke test; header assertions                                              |
| **A06 Vulnerable & Outdated Components**         | A transitive CVE in an export or parsing library                                 | Pinned deps, patch-level `overrides` (ADR-001), SCA + SBOM per release, advisory ingest                                                                                                                      | `license:check` + SCA gate blocking on high/critical                                                  |
| **A07 Identification & Authentication Failures** | Shared service accounts; stale leaver access                                     | OIDC/SAML SSO, MFA, step-up auth for money-moving actions, short-lived JWT + rotating refresh, SCIM JML deprovisioning (10.4), break-glass audited and time-boxed                                            | `tests/security/scim.jml.spec.ts`; session-fixation and token-replay tests                            |
| **A08 Software & Data Integrity Failures**       | A tampered import silently changing actuals; an unsigned plugin                  | Append-only audit hash chain (M010), checksums on import and export, reconciliation-or-rollback on every import, plugins sandboxed with no DB/network access, signed commands                                | Hash-chain tamper-detection test; import reconciliation assertion                                     |
| **A09 Logging & Monitoring Failures**            | Nobody notices a cross-tenant read for a month                                   | OTel traces with tenant/correlation ids, 100% audit of privileged and money-path actions, alerting on integrity counters (16.5), log redaction of amounts and PII                                            | Audit-completeness test; alert-fires integration test on a seeded violation                           |
| **A10 SSRF**                                     | A connector URL pointed at cloud metadata                                        | Outbound URLs allow-listed, no user-supplied fetch targets in connectors, egress proxy, metadata endpoints blocked (A.21)                                                                                    | SSRF attempt suite against every connector config field                                               |

**Finance-specific additions beyond the OWASP list** (because the Top 10 does not cover
them and they are how finance products actually get hurt):

```
FS1  Money-egress to an LLM is a distinct control surface (F-AI-011, Section 12.3).
FS2  Field-level masking applies to notifications, exports, and search results —
     not just to the grid (N2, A.10).
FS3  Lower environments are masked clones (PR7); a prod copy in UAT is an incident.
FS4  A report published from uncertified metrics is an integrity failure (MET5),
     tracked with the same severity as an access-control defect.
```

---
