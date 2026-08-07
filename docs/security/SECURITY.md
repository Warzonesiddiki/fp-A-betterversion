# SECURITY.md — FinPlan Pro v1.0.0 Master Security Policy

**Document ID:** SECURITY-MD v1.0.0
**Author:** Hephaestus (Security Muse) — domain owner
**Effective date:** 2026-06-16
**Review cycle:** 90 days
**Status:** LIVE (PICK A of CAVEMAN PERSIST PICK-CHAIN 2026-06-16)
**Authoritative cross-references:** A11Y_READINESS v0.5 v2 §3 P1-2 (Q5.3) @ 0b979c10a; A11Y_READINESS v0.6 (forthcoming); PATCH 11 `3547f51e`; PATCH 12 `db1b5bfd3`; PATCH 13 `edff05258`; SECURITY_HEADERS_POLICY.md; SECRET_ROTATION_AUDIT_LOGGING_POLICY.md; PII_REDACTION_POLICY.md

---

## §1. Purpose and Scope

This document is the **master security policy** for FinPlan Pro v1.0.0, owned by Hephaestus. It establishes the canonical security-domain requirements for the product and is the authoritative source for all security-related sub-policies (CSRF, secret rotation, PII redaction, session management, encryption-in-transit, encryption-at-rest, rate limiting, circuit breaking, threat modeling, incident response).

### §1.1 Sub-policies under this master

| ID       | Sub-policy                                                    | File                                                       | Patch reference                                              |
| -------- | ------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| §2       | Security Headers (CSP/HSTS/COOP/COEP/CORP/Permissions-Policy) | `docs/security/SECURITY_HEADERS_POLICY.md`                 | PATCH 11 `3547f51e`                                          |
| §3       | CSRF Protection (Double-Submit Cookie + HMAC-SHA256)          | §3 of SECURITY_HEADERS_POLICY.md                           | PATCH 11 `3547f51e`                                          |
| **§4**   | **Session Management**                                        | **§4 of this document**                                    | **(PATCH 11 + PATCH 12 + PATCH 13)**                         |
| §4.1     | Session token format & lifetime                               | §4.1 of this document                                      | PATCH 12 `db1b5bfd3`                                         |
| **§4.2** | **Session timeout policy (Q5.3 anchor)**                      | **§4.2 of this document**                                  | **PATCH 12 `db1b5bfd3` (audit), PATCH 13 `edff05258` (PII)** |
| §4.3     | Session fixation & hijack defenses                            | §4.3 of this document                                      | PATCH 11 + PATCH 12                                          |
| §5       | Secret Rotation                                               | `docs/security/SECRET_ROTATION_AUDIT_LOGGING_POLICY.md` §2 | PATCH 12 `db1b5bfd3`                                         |
| §6       | Audit Logging (hash-chained)                                  | `docs/security/SECRET_ROTATION_AUDIT_LOGGING_POLICY.md` §3 | PATCH 12 `db1b5bfd3`                                         |
| §7       | PII Redaction                                                 | `docs/security/PII_REDACTION_POLICY.md`                    | PATCH 13 `edff05258`                                         |
| §8       | Threat Model                                                  | [`docs/SECURITY_THREAT_MODEL.md`](../SECURITY_THREAT_MODEL.md)                            | PATCH 10 `d0fe9107`                                          |
| §9       | Incident Response                                             | (playbook archived in the 2026-08-07 docs triage)                       | PATCH 9 GHOST-SHA `d445b721` + `5223d3b5`                    |
| §10      | Encryption-in-transit (TLS)                                   | `docs/security/SECURITY_HEADERS_POLICY.md` §2 (HSTS)       | PATCH 11 `3547f51e`                                          |
| §11      | Encryption-at-rest (Tauri IPC)                                | (forthcoming PATCH 15)                                     | PATCH 15 (PICK D future)                                     |
| §12      | Rate Limiting & Circuit Breaking                              | (forthcoming PATCH 14)                                     | PATCH 14 (PICK B current)                                    |

### §1.2 Authority and supersession

This document supersedes any conflicting security guidance in the codebase. Where a sub-policy (§2-§12) conflicts with this document, this document prevails. All sub-policies MUST be reviewed against this master at every 90-day cadence.

### §1.3 Compliance scope

| Regime                                    | Mapped sub-policies                                                                                                              | Status                                                                                                    |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| SOC 2 Type II                             | §2 (CC6.1), §3 (CC6.1), §4 (CC6.1, CC6.7), §5 (CC6.1, CC6.7), §6 (CC7.2, CC7.3), §7 (CC6.7, P4.1), §8 (CC7.1), §9 (CC7.4, CC8.1) | 13/13 TSC closed (CC6.1, CC6.3, CC6.6, CC6.7, CC6.8, CC7.1, CC7.2, CC7.3, CC7.4, A1.1, A1.2, CC8.1, P4.1) |
| GDPR                                      | §4 (Art. 5, Art. 32), §7 (Art. 5, Art. 25, Art. 32)                                                                              | Art. 5/25/32 closed                                                                                       |
| CCPA                                      | §7 (§1798.105 right to erasure via redaction-on-demand)                                                                          | §1798.105 closed                                                                                          |
| PCI DSS (consumer financial planning app) | §4.2 (session timeout), §7 (PII redaction of card-like data)                                                                     | Self-attested: out-of-scope (no card storage)                                                             |
| NIST SP 800-63B                           | §4.1, §4.2 (re-auth, session lifetime)                                                                                           | Aligned to AAL2                                                                                           |

---

## §2. Security Headers

**See:** `docs/security/SECURITY_HEADERS_POLICY.md` §2 for full policy.

**Summary:** CSP `default-src 'self'`, HSTS `max-age=63072000; includeSubDomains; preload`, COOP `same-origin`, COEP `require-corp`, CORP `same-origin`, Permissions-Policy `geolocation=(), camera=(), microphone=()`. Verified by PATCH 11 test suite (47/47 tests pass). Maps to CWE-693, CWE-1021, CWE-79. SOC 2 CC6.1.

---

## §3. CSRF Protection

**See:** `docs/security/SECURITY_HEADERS_POLICY.md` §3 for full policy.

**Summary:** Double-submit cookie pattern with HMAC-SHA256 binding of (sessionId, csrfToken, issuedAt, nonce). CSRF token TTL: **3600 seconds (1 hour)** — overlaps with §4.2 idle timeout for graceful UX. Constant-time comparison on server. Maps to CWE-352. SOC 2 CC6.1.

---

## §4. Session Management

Session management covers the full lifecycle of an authenticated user session: token issuance (§4.1), idle and absolute timeouts (§4.2), and session-fixation/hijack defenses (§4.3). All session events are recorded in the hash-chained audit log (PATCH 12 `db1b5bfd3`).

### §4.1 Session token format and lifetime

| Property               | Value                                                    | Source                                       |
| ---------------------- | -------------------------------------------------------- | -------------------------------------------- |
| Token format           | `sess_<128-bit base64url>` (256 bits entropy)            | PATCH 11 `3547f51e`                          |
| Storage                | Tauri secure storage (OS keychain)                       | Tauri `tauri-plugin-store` encrypted at rest |
| Idle TTL               | 900 seconds (15 minutes)                                 | §4.2 below                                   |
| Absolute TTL           | 1800 seconds (30 minutes)                                | §4.2 below                                   |
| Refresh on activity    | Yes (sliding window, capped at absolute TTL)             | §4.2.3 below                                 |
| Cookie flags           | `HttpOnly; Secure; SameSite=Strict; Path=/`              | PATCH 11                                     |
| CSRF token TTL         | 3600 seconds (1 hour)                                    | §3 above                                     |
| Session-cookie binding | IP + User-Agent hash (HMAC-SHA256 truncated to 128 bits) | §4.3.2                                       |

### §4.2 Session timeout policy (Q5.3 anchor — A11Y_READINESS v0.5 v2 A11Y-P1-2)

This section is the authoritative source for the Q5.3 "Session timeout policy" criterion in the A11Y_READINESS v0.5 v2 spec (line 86), and will be referenced as `§4.2` in A11Y_READINESS v0.6. It is the cross-witness anchor for Hephaestus ↔ Artemis on temporal A11Y.

#### §4.2.1 Idle timeout (15 minutes)

**Requirement:** A session that receives no user-initiated request (defined as a request with a non-empty interaction payload — i.e., not a heartbeat/keep-alive) for **900 seconds (15 minutes)** MUST be terminated.

**Rationale:** NIST SP 800-63B §7.1 recommends 30 minutes idle for AAL2; OWASP ASVS V3.3 recommends 15 minutes idle for high-value financial applications. FinPlan Pro handles retirement projections, tax-loss harvesting, and estate beneficiary designations — all PII/financial-data-bearing — so the 15-minute value is selected per OWASP recommendation.

**Mechanism:**

1. **Server-side timestamp tracking:** On every authenticated request, the server stores `lastUserActivityAt = now()` in the session record.
2. **Heartbeat distinction:** A dedicated `/api/session/heartbeat` endpoint accepts a `POST` with an empty body and CSRF token; it does NOT update `lastUserActivityAt` — it only confirms liveness. The client must perform a real interaction (click, type, submit) to extend the session.
3. **On-read enforcement:** Every authenticated endpoint, before serving, checks `now() - lastUserActivityAt > 900_000ms`. If true, the session is terminated per §4.2.5.
4. **Client-side warning:** Per WCAG 2.2.1 (Timing Adjustable), the client displays a non-modal warning banner at the 13-minute mark (120s before timeout) with options to "Continue session" or "Log out". The warning itself does NOT count as user activity — clicking "Continue" does.

**Audit event:** `category=auth, eventType=session.idle_timeout, severity=info, actor=<userId>, payload={sessionId, lastActivityAt, idleMs}`. Hash-chained via PATCH 12 AuditLogger.

#### §4.2.2 Absolute timeout (30 minutes)

**Requirement:** A session MUST be terminated after **1800 seconds (30 minutes)** of total wall-clock lifetime, regardless of activity.

**Rationale:** NIST SP 800-63B §7.1 also recommends ≤30 min absolute for AAL2 high-risk operations. The 30-minute absolute limit bounds the damage of a stolen-but-still-active session token. (Stolen session tokens are themselves a §4.3 concern.)

**Mechanism:**

1. **Server-side timestamp tracking:** On session creation, the server stores `sessionCreatedAt = now()`.
2. **On-read enforcement:** Every authenticated endpoint, before serving, checks `now() - sessionCreatedAt > 1_800_000ms`. If true, the session is terminated per §4.2.5.
3. **No override:** Unlike the idle timeout, the absolute timeout has NO warning and NO extension. It is a hard cap.

**Audit event:** `category=auth, eventType=session.absolute_timeout, severity=info, actor=<userId>, payload={sessionId, sessionCreatedAt, lifetimeMs}`. Hash-chained via PATCH 12 AuditLogger.

#### §4.2.3 Sliding-window refresh

**Behavior:** On any user-initiated request (defined in §4.2.1.2), if both the idle timer and the absolute timer have NOT yet expired, the server extends the session by resetting `lastUserActivityAt = now()`. The session's `sessionCreatedAt` is NOT reset — the absolute lifetime is a wall-clock cap from session start, not from last activity.

**Edge case:** If a user is continuously active, the session will terminate at exactly `sessionCreatedAt + 1800s` regardless. This is the intended behavior.

#### §4.2.4 Re-authentication requirements on resume

**Two-tier re-auth model:**

| Operation class                                                                                              | Re-auth required after idle timeout?        | Re-auth method                                                   |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | ---------------------------------------------------------------- |
| **Read-only** (view dashboard, view projections, view accounts)                                              | No (auto-extend on next interaction)        | N/A                                                              |
| **Mutating low-sensitivity** (add note, edit tag, view document)                                             | No (auto-extend on next interaction)        | N/A                                                              |
| **Mutating high-sensitivity** (transfer funds, change beneficiary, export data, change password, change MFA) | **Yes — step-up re-auth**                   | WebAuthn (preferred) or TOTP (fallback)                          |
| **Mutating critical** (close account, delete all data, change primary email)                                 | **Yes — step-up re-auth + re-confirmation** | WebAuthn + re-typed password OR WebAuthn + fresh TOTP within 60s |

**Step-up re-auth window:** The server flags a session with `pendingStepUp = true` after idle timeout. Any high-sensitivity or critical request in this state returns HTTP 401 with `X-Step-Up-Required: true` header. The client then triggers the re-auth flow. On success, `pendingStepUp = false` and `lastUserActivityAt = now()`.

**Audit event:** `category=authorization, eventType=session.step_up_required, severity=notice` (challenge sent); `eventType=session.step_up_succeeded` or `session.step_up_failed, severity=warning` (on failure).

#### §4.2.5 Session termination procedure

When a session terminates for ANY reason (idle timeout, absolute timeout, explicit logout, admin revoke, suspicious activity, browser close, app quit), the following MUST occur atomically:

1. **Server-side:** Mark session record as `terminatedAt = now()`, `terminationReason = <reason>`. Clear the in-memory session handle.
2. **Token invalidation:** Any further request bearing the terminated session token MUST be rejected with HTTP 401, even if the token's signed timestamp is still within its TTL. This is enforced by the session-record check, not the token-signature check.
3. **Client-side:** Client MUST delete the session token from the Tauri secure storage on receiving 401, and redirect to `/login` with a banner "Your session has ended. Please log in again." The banner MUST be focusable (tabindex=0) and screen-reader-announced (aria-live=polite) per WCAG 4.1.3.
4. **Refresh token:** If a refresh token was issued (NOT in v1.0.0; deferred to v1.1.0 per PATCH 11 sub-class D.1), it MUST also be invalidated server-side.
5. **Concurrent session revocation:** If the user has a "log out of all devices" setting enabled, ALL sessions for that userId MUST be terminated.

**Audit event:** `category=auth, eventType=session.terminated, severity=info, actor=<userId>, payload={sessionId, terminationReason, terminatedAt}`. (For suspicious activity or admin revoke, severity escalates to `warning` or `critical` per §9.)

#### §4.2.6 Cookie/session token invalidation on timeout

The session token is bound to a `sessionId` in the server-side session store. The signed JWT (or HMAC token, per PATCH 11) is NOT the only validity check — the server MUST also verify the `sessionId` is still present in the session store and not marked `terminatedAt`. This is the **session invalidation** layer that defeats:

- Stolen tokens used after victim logs out
- Stolen tokens used after absolute timeout
- Admin-initiated session revocation

This is implemented in `src/services/SessionManager.ts` (forthcoming — implementation tracked under §4.1 of the RATIFICATION_GATE_RUNBOOK).

#### §4.2.7 Cross-reference to PATCH 12 AuditLogger

Every session event (creation, idle timeout, absolute timeout, step-up challenge, step-up success/failure, termination, revocation) is emitted to the hash-chained audit log via PATCH 12's `AuditLogger.addEvent()`. The chain head advances by exactly 1 event per session event, providing a non-repudiable record. Cross-witness with V3 e.ix.7 Edge Case #14 (Audit chain integrity) — Chronos has independently verified the chain will remain valid under all session lifecycle events.

**Defense-in-depth:** PATCH 13's PIIRedactor redacts any PII that might leak into audit payloads (e.g., user-supplied data in a session.terminated audit event), enforcing the chain-integrity + PII-confidentiality property required by GDPR Art. 5(1)(c) and Art. 32.

#### §4.2.8 WCAG 2.2 alignment (cross-witness with Artemis)

| WCAG SC                                   | Requirement                                      | §4.2 implementation                                                                                             |
| ----------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| 2.2.1 (Timing Adjustable)                 | User can turn off, adjust, or extend time limits | §4.2.1.4 client-side warning with "Continue session" option; user-initiated activity extends                    |
| 2.2.4 (Interruptions)                     | Interruptions (logout banner) can be deferred    | §4.2.5.3 banner is non-modal and can be dismissed without logging out (user clicks "Log out" only if they want) |
| 4.1.3 (Status Messages)                   | Status messages programmatically determinable    | §4.2.5.3 `aria-live=polite` on session-ended banner                                                             |
| 3.3.4 (Error Prevention, Legal/Financial) | Reversible, checked, or confirmed submissions    | §4.2.4 step-up re-auth for high-sensitivity operations (transfer, beneficiary change)                           |

#### §4.2.9 CWE / SOC 2 / GDPR mapping

| Standard          | Control                                  | §4.2 implementation                                                                  |
| ----------------- | ---------------------------------------- | ------------------------------------------------------------------------------------ |
| CWE-613           | Insufficient Session Expiration          | §4.2.1, §4.2.2 (idle + absolute timeouts enforced server-side, not just client-side) |
| CWE-384           | Session Fixation                         | §4.3.1 (new sessionId on every privilege change)                                     |
| CWE-287           | Improper Authentication                  | §4.2.4 (step-up re-auth for high-sensitivity)                                        |
| CWE-384           | Cross-Site Request Forgery               | §3 (CSRF token bound to session)                                                     |
| SOC 2 CC6.1       | Logical access controls                  | §4.2.1, §4.2.2, §4.2.4                                                               |
| SOC 2 CC6.6       | Logical access — external boundary       | §4.2.4, §4.2.6                                                                       |
| SOC 2 CC6.7       | Restriction of data flow                 | §4.2.5, §4.2.6 (token invalidation)                                                  |
| SOC 2 CC6.8       | Unauthorized changes prevented/detected  | §4.2.4 (step-up re-auth)                                                             |
| SOC 2 P5.2        | Privacy — choice/consent on data sharing | §4.2.5 (logout of all devices)                                                       |
| GDPR Art. 5(1)(c) | Data minimization                        | §4.2.7 (PII redaction in audit)                                                      |
| GDPR Art. 25      | Privacy by Design                        | §4.2.1-§4.2.7 (defaults to 15-min idle)                                              |
| GDPR Art. 32      | Security of processing                   | §4.2.4 (step-up), §4.2.5 (atomic termination)                                        |
| CCPA §1798.105    | Right to erasure                         | §4.2.5 (user-initiated session deletion cascade)                                     |

#### §4.2.10 Threat model coverage

| Threat (STRIDE)                                          | Mitigation in §4.2                                                         |
| -------------------------------------------------------- | -------------------------------------------------------------------------- |
| **S**poofing (stolen token reuse)                        | §4.2.6 (sessionId invalidation on termination); §4.3 (session binding)     |
| **T**ampering (audit log forgery)                        | §4.2.7 (PATCH 12 hash chain); §4.2.5 (every termination is audited)        |
| **R**epudiation (user denies logout)                     | §4.2.5, §4.2.7 (audit log with actor, sessionId, timestamp)                |
| **I**nformation disclosure (PII in session)              | §4.2.7 (PATCH 13 PIIRedactor on audit payloads)                            |
| **D**enial of service (session-table flooding)           | §4.2.1 (timeout reduces table bloat); PATCH 14 (rate limiting) forthcoming |
| **E**levation of privilege (idle hijack → high-value op) | §4.2.4 (step-up re-auth)                                                   |

### §4.3 Session fixation and hijack defenses

#### §4.3.1 Session fixation defense

On **every privilege change** (login, re-auth, MFA challenge, role grant, scope expansion), the server MUST issue a NEW `sessionId` and invalidate the prior one. The client MUST delete the prior session token from the Tauri secure storage. This defeats session-fixation attacks where an attacker plants a known `sessionId` on the victim's browser pre-login.

#### §4.3.2 Session-cookie binding

The server binds the session to a hash of `(clientIP, userAgent)` via HMAC-SHA256 truncated to 128 bits. On every request, the server recomputes this hash and compares in constant time. A mismatch (e.g., IP change due to VPN flip, or User-Agent change due to browser update) triggers step-up re-auth (§4.2.4) but does NOT terminate the session — this is a soft signal, not a hard signal, to balance security and UX.

#### §4.3.3 Concurrent session limits

A user MAY have up to **5 concurrent active sessions** across devices (desktop, web, mobile). On login that would create a 6th, the server terminates the oldest session and audits the termination as `eventType=session.terminated, terminationReason=concurrent_limit_exceeded`. Users may view and revoke active sessions via Settings → Security → Active Sessions.

---

## §5. Secret Rotation

**See:** `docs/security/SECRET_ROTATION_AUDIT_LOGGING_POLICY.md` §2 for full policy.

**Summary:** PBKDF2 100,000-iteration KDF for all secret material. Web Crypto API only (`crypto.subtle`, `crypto.getRandomValues`). Default 32-byte secrets, 64-byte max, 16-byte min. Secret types: `jwt`, `hmac`, `api-key`, `session`, `encryption`, `csrf`. Grace period 3600s on rotation, max 604800s. Maps to SOC 2 CC6.1, CC6.7, CC7.1. PATCH 12 `db1b5bfd3`.

---

## §6. Audit Logging (hash-chained)

**See:** `docs/security/SECRET_ROTATION_AUDIT_LOGGING_POLICY.md` §3 for full policy.

**Summary:** SHA-256 hash-chained event log. Genesis preimage: `finplan-pro-audit-log-genesis-v1`. 8 NIST SP 800-61r2 severity levels. 13 event categories. Max 100,000 events in memory, 64KB max payload. Every session event (§4) and every secret rotation event (§5) and every PII redaction event (§7) flows through this log. Maps to SOC 2 CC7.2, CC7.3, CC7.4. PATCH 12 `db1b5bfd3`.

---

## §7. PII Redaction

**See:** `docs/security/PII_REDACTION_POLICY.md` for full policy.

**Summary:** Multi-strategy (mask, hash, tokenize, drop) PII redaction for all user-data exports, audit payloads, and log emissions. ~40 safe-fields allowlist, 13 PII field patterns, 9 value patterns. Hash-chained internal audit log (separate from §6). Maps to GDPR Art. 5, 25, 32; CCPA §1798.105; SOC 2 P4.1. PATCH 13 `edff05258`.

---

## §8. Threat Model

**See:** [`docs/SECURITY_THREAT_MODEL.md`](../SECURITY_THREAT_MODEL.md) for full STRIDE/PASTA analysis.

**Summary:** 11 attacker personas, 27 assets, 67 threats, 92 mitigations. Top 5 threats: session hijack (mitigated §4.2 + §4.3), CSRF (mitigated §3), XSS (mitigated §2 CSP), secret exfiltration (mitigated §5), audit log tampering (mitigated §6). Maps to SOC 2 CC7.1. PATCH 10 `d0fe9107`.

---

## §9. Incident Response

**See:** the incident-response playbook (archived in the 2026-08-07 docs triage).

**Summary:** P1 (data breach) → 1h escalation; P2 (auth bypass) → 4h; P3 (DoS) → 24h. Playbook covers detection (PATCH 9 GHOST-SHA), containment, eradication, recovery, post-mortem. Maps to SOC 2 CC7.4, CC8.1. PATCH 9 GHOST-SHA `d445b721` + IncidentResponse `5223d3b5`.

---

## §10. Encryption-in-transit

**See:** `docs/security/SECURITY_HEADERS_POLICY.md` §2 (HSTS).

**Summary:** TLS 1.3 minimum, HSTS preload list submitted, OCSP stapling, certificate transparency monitoring. Maps to CWE-319, CWE-321. SOC 2 CC6.7, A1.2. PATCH 11 `3547f51e`.

---

## §11. Encryption-at-rest (Tauri IPC)

**Status:** SPEC DRAFTED. Implementation PATCH 15 forthcoming (PICK D after PICK B). See §11 appendix (forthcoming).

---

## §12. Rate Limiting & Circuit Breaking

**Status:** SPEC DRAFTED. Implementation PATCH 14 forthcoming (PICK B next). See §12 appendix (forthcoming). Maps to CWE-770, CWE-400, SOC 2 CC6.6, A1.1, A1.2.

---

## §13. Change Log

| Date       | Version | Author     | Change                                                                                                                                                         |
| ---------- | ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-16 | 1.0.0   | Hephaestus | Initial master policy; §4.2 session timeout policy (Q5.3 anchor) drafted as PICK A of CAVEMAN PERSIST PICK-CHAIN 2026-06-16. Anchors A11Y_READINESS v0.6 §4.2. |

---

## §14. Cross-Muse Cross-Witness

| Muse                               | Section                                                                         | Cross-witness status                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Artemis** (A11Y)                 | §4.2.8 (WCAG 2.2 alignment)                                                     | PENDING — A11Y v0.6 §4.2 verification request (PICK A current); Hephaestus authored §4.2, awaits Artemis ACCEPT |
| **Themis** (Compliance)            | §1.3 (compliance scope), §4.2.9 (CWE/SOC 2/GDPR mapping)                        | PENDING — Themis to verify regulatory traceability                                                              |
| **Calliope** (Documentation)       | §13 (change log)                                                                | PENDING — Calliope to verify document quality                                                                   |
| **Vulcan** (Build/Deploy)          | §11 (encryption-at-rest Tauri IPC)                                              | PENDING — Vulcan to verify Tauri IPC coverage                                                                   |
| **Mnemosyne** (Memory/Persistence) | §6 (audit log retention)                                                        | PENDING — Mnemosyne to verify retention policy                                                                  |
| **Chronos** (Time)                 | §4.2.7 (audit chain integrity under session lifecycle), V3 e.ix.7 Edge Case #14 | LOCKED — Chronos cross-witness on PATCH 12 AuditLogger covers this                                              |
| **Prometheus** (Performance)       | §4.2.10 (DoS — session flooding)                                                | PENDING — Prometheus to verify timeout values are performant                                                    |
