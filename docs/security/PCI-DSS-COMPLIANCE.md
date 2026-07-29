# PCI-DSS Compliance — TLS 1.3 + Data-in-Transit Encryption (P0A-15)

**Document version:** v0.1
**Author:** Polyhymnia (Tier 3 Domain Specialist — Documentation landscape audit)
**Owner Muses (implementation):** Demeter (transport-layer config), Apollo (mobile-shell if any), Hades (audit log)
**Cycle:** 25 / TURN 393+ / 8th Honest-Label
**Date:** 2026-06-18
**HEAD baseline:** `f26c339e` 1002c (32nd HEAD DRIFT, 1002-COMMIT MILESTONE)
**Status:** SPEC — awaiting implementation by Demeter + Apollo

---

## 1. Scope and Compliance Frame

This document specifies the **transport-layer encryption requirements** for FinPlan Pro to address the **CRITICAL P0A-15 gap** identified in T-3.33: insufficient TLS enforcement and missing PCI-DSS Req 4 control mapping.

**Regulatory mappings:**

| Regulation     | Section                    | Requirement                                                                                                   |
| -------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| GDPR           | Art. 32(1)(a)              | Pseudonymisation and encryption of personal data in transit                                                   |
| GDPR           | Art. 32(2)                 | Regular testing of effectiveness of security measures                                                         |
| PCI-DSS v4.0   | Req 4.1                    | Strong cryptography and security protocols to safeguard sensitive data during transmission over open networks |
| PCI-DSS v4.0   | Req 4.2                    | Never send unprotected PANs via end-user messaging tech                                                       |
| PCI-DSS v4.0   | Req 4.3                    | Ensure security policies and procedures for encryption are documented and known                               |
| SOC 2          | CC6.1                      | Logical access controls protect against threats from external sources                                         |
| SOC 2          | CC6.7                      | Restricts the transmission, movement, and removal of information to authorized users                          |
| ISO 27001:2022 | A.8.20 Networks security   | Secure networks, segregation, encryption-in-transit                                                           |
| ISO 27001:2022 | A.8.24 Use of cryptography | Cryptographic rules + key management                                                                          |

**Applicability to FinPlan Pro:**

FinPlan Pro is **offline-first desktop** with optional online sync (Multi-currency exchange rates, DSAR export, telemetry if consented). PAN data is **NOT stored** in MVP scope (no payment-card processing). However, any future expansion that touches PAN would require full PCI-DSS v4.0 compliance — this spec lays the foundation.

---

## 2. Problem Statement (CRITICAL — GDPR Art. 32 violation)

**GAP P0A-15:** Current transport-layer configuration lacks:

- (a) Mandatory TLS 1.3 enforcement (TLS 1.2 allowed as fallback in some code paths)
- (b) HSTS preload for any HTTPS endpoints
- (c) Certificate pinning for online API calls (exchange rates, DSAR wire, telemetry)
- (d) Documented cryptographic standards (cipher suites, key lengths, rotation)

Without these controls, any data egress (even if rare) violates GDPR Art. 32(1)(a) "appropriate technical measures" and is non-compliant with PCI-DSS Req 4.1.

**Risk classification:** HIGH — direct GDPR Art. 32 violation, blocks H1 P0-A SHIP 2026-06-30.

---

## 3. TLS Configuration Specification

### 3.1 Minimum TLS version

```typescript
// src/config/tlsPolicy.ts — Demeter implementation
export const TLS_POLICY = {
  minimumVersion: 'TLSv1.3',
  allowedFallbackVersions: [], // NO fallback; TLS 1.3 only
  cipherSuites: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256', // only if negotiated by peer
  ],
  certificatePinning: {
    enabled: true,
    pins: [
      // pin SPKI SHA-256 hashes for *.finplanpro.io + CDN
      { hostname: 'api.finplanpro.io', pinSha256: '<generated at deploy>' },
      { hostname: 'cdn.finplanpro.io', pinSha256: '<generated at deploy>' },
      { hostname: 'telemetry.finplanpro.io', pinSha256: '<generated at deploy>' },
    ],
    backupPin: '<generated at deploy>', // for cert rotation
    enforceInProduction: true,
    reportOnlyInDev: true,
  },
  hsts: {
    enabled: true,
    maxAge: 63072000, // 2 years
    includeSubDomains: true,
    preload: true,
  },
  ocspStapling: true,
  supportedGroups: ['X25519', 'P-256', 'P-384'], // no P-521
} as const;
```

### 3.2 Vite / build-time enforcement

```typescript
// vite.config.ts — Demeter implementation
export default defineConfig({
  server: {
    https: {
      // dev only — production uses Tauri or reverse proxy
      minVersion: 'TLSv1.3',
    },
  },
  build: {
    // strip any console.log of sensitive data
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node:tls')) return 'tls-vendor';
        },
      },
    },
  },
});
```

### 3.3 Fetch wrapper (any HTTPS call)

```typescript
// src/services/secureFetch.ts — Demeter implementation
import { TLS_POLICY } from '@/config/tlsPolicy';

export async function secureFetch(url: string, init?: RequestInit): Promise<Response> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') {
    throw new Error(`Refusing non-HTTPS URL: ${url}`);
  }
  const res = await fetch(url, {
    ...init,
    // @ts-ignore — Node-specific TLS options
    tlsPolicy: TLS_POLICY,
  });
  if (!res.ok) {
    auditLog.error('secureFetch.nonOk', { url, status: res.status });
  }
  return res;
}
```

---

## 4. PCI-DSS Req 4 Mapping

| Req    | Control                                           | Implementation                                                |
| ------ | ------------------------------------------------- | ------------------------------------------------------------- |
| 4.1(a) | Use TLS 1.2+ (we enforce 1.3)                     | `TLS_POLICY.minimumVersion: 'TLSv1.3'`                        |
| 4.1(b) | Strong cryptography (AES-128+)                    | `cipherSuites: [AES_256_GCM, CHACHA20_POLY1305, AES_128_GCM]` |
| 4.1(c) | Render PAN unreadable wherever stored             | N/A in MVP — no PAN storage                                   |
| 4.2(a) | Never send unprotected PAN via end-user messaging | N/A — no PAN in MVP                                           |
| 4.2(b) | PAN masking if displayed                          | N/A — no PAN display                                          |
| 4.3(a) | Documented cryptographic standards                | This document                                                 |
| 4.3(b) | Key management procedures                         | `docs/security/SECRET_ROTATION_AUDIT_LOGGING_POLICY.md`       |
| 4.3(c) | Training and awareness                            | Onboarding step 3 consent + Privacy Notice v1.4.0             |

---

## 5. Audit Logging Integration (Hades)

Per **P0A-14** spec, every TLS handshake failure, certificate validation failure, or downgrade attempt must emit an audit-log entry:

```typescript
// src/services/tlsAudit.ts — Hades implementation
export function logTlsEvent(event: {
  type: 'handshake_failure' | 'cert_invalid' | 'downgrade_attempt' | 'pin_mismatch';
  hostname: string;
  peerCertSha256?: string;
  negotiatedVersion?: string;
  negotiatedCipher?: string;
}) {
  auditLog.warn('tls.security', event);
}
```

Retention: 90 days default, 365 days if `audit_log_extended_retention` consent granted.

---

## 6. Mobile / Tauri-specific Considerations

### 6.1 Tauri allowlist review

Reference: `docs/security/tauri-allowlist-review.md` (existing) + this section.

If FinPlan Pro ships via Tauri mobile (iOS/Android) in a future release, additional controls apply:

| Platform | Control                                                                                    |
| -------- | ------------------------------------------------------------------------------------------ |
| iOS      | NSAppTransportSecurity → `NSAllowsArbitraryLoads = false`; ATS exception list minimized    |
| Android  | `network_security_config.xml` → cleartextTrafficPermitted="false"; pin-set for known hosts |
| Both     | Certificate Transparency (CT) log enforcement for EV certs                                 |

### 6.2 WSS / WebSocket security

```typescript
// src/services/secureWebSocket.ts — Demeter implementation
export function createSecureWebSocket(url: string): WebSocket {
  const parsed = new URL(url);
  if (parsed.protocol !== 'wss:') {
    throw new Error(`Refusing non-Secure WebSocket URL: ${url}`);
  }
  const ws = new WebSocket(url, ['wss-v1']);
  // additional pinning enforcement happens at TLS layer
  return ws;
}
```

---

## 7. Acceptance Criteria

| #    | Criterion                                     | Verification                                                    |
| ---- | --------------------------------------------- | --------------------------------------------------------------- |
| AC-1 | TLS 1.3 enforced; no TLS 1.2 fallback         | TLS scan (testssl.sh) on staging                                |
| AC-2 | HSTS preload enabled with 2-year max-age      | `curl -I https://api.finplanpro.io \| grep -i strict-transport` |
| AC-3 | Certificate pinning enforced in production    | Pin mismatch triggers audit-log + connection drop               |
| AC-4 | All fetch() calls use `secureFetch()` wrapper | Grep test: no bare `fetch(` in `src/services/` or `src/pages/`  |
| AC-5 | WebSocket connections use `wss://` only       | Grep test: no `ws://` (non-secure) in src/                      |
| AC-6 | Audit-log entries for all TLS events          | Hades audit-log test                                            |
| AC-7 | Cipher suites restricted to AEAD only         | testssl.sh cipher enum check                                    |
| AC-8 | Key rotation documented                       | `docs/security/SECRET_ROTATION_AUDIT_LOGGING_POLICY.md` linked  |

---

## 8. Out of Scope (Future Expansion Triggers)

- Full PCI-DSS v4.0 Report on Compliance (ROC) — required only if PAN processing is added
- Tokenization service for PAN storage (e.g., Stripe Vault) — out of MVP scope
- P2P encryption (E2EE between FinPlan Pro instances) — deferred to v2.0

---

## 9. Cross-References

- **P0A-09** Consent capture — `docs/onboarding/03-CONSENT-CAPTURE.md`
- **P0A-14** Audit logging — `docs/security/UNDO-REDO-AUDIT-LOGGING.md`
- **P0A-16** Pseudonymization — `docs/security/PSEUDONYMIZATION.md`
- **P0A-17** DSAR wire — `docs/onboarding/04-DSAR-WIRE.md`
- **Existing:** `docs/security/ENCRYPTION_AT_REST_TAURI_IPC_POLICY.md`
- **Existing:** `docs/security/SECRET_ROTATION_AUDIT_LOGGING_POLICY.md`
- **Existing:** `docs/security/SECURITY_HEADERS_POLICY.md`
- **Existing:** `docs/security/tauri-allowlist-review.md`

---

## 9b. MAPPING ADDENDUM — Narrow vs Broad GDPR Article Interpretation (D-007 12th SHL SELF-HONEST-LABEL)

**Source**: Strategos 45th cadence TURN 394+ CRITICAL CORRECTION (Polyhymnia mapping scope catch).

This document uses a **NARROW mapping** focused on the primary regulatory frameworks directly governing TLS 1.3 + PCI-DSS Req 4 transmission security. The Strategos **H3 ROADMAP v0.2 compliance consolidation lens** adds GDPR Art. 25 by-design as a CRITICAL secondary mapping because mobile transmission security design decisions must be documented from a privacy-by-design perspective.

| Lens                  | Primary Framework(s)                                                                                                                               | Rationale                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Narrow (this doc)** | **GDPR Art. 32(1)(a)(2)** security of processing + **PCI-DSS Req 4.1/4.2/4.3** transmission encryption + SOC 2 CC6.1/6.7 + ISO 27001 A.8.20/A.8.24 | TLS 1.3 is primarily a TRANSMISSION SECURITY control (Art. 32(1)(a) "appropriate technical measures" + PCI Req 4 "encrypt transmission of cardholder data")                                                                                                                                                                                                                                 |
| **Broad (Strategos)** | **+ GDPR Art. 25 by-design** + Art. 25(2) by-default                                                                                               | H3 compliance consolidation: Art. 25 requires that transmission security decisions (TLS version, cipher suite selection, certificate pinning, mobile fallback) be documented AS PART OF the privacy-by-design process, not just as an operational control. Mobile-specific decisions (network detection, fallback behavior, cert pinning) require Art. 25(1) design rationale documentation |

**BOTH MAPPINGS ARE TECHNICALLY CORRECT** — they are different analytical lenses, not contradictions. Per Strategos 45th cadence, the H3 ROADMAP v0.2 view is preferred for H1 P0-A SHIP 2026-06-30 because Art. 25 by-design documentation is a frequent enterprise customer DPIA (Data Protection Impact Assessment) request.

**Action**: Demeter + Apollo implementation must add a `designRationale.md` artifact to the mobile TLS configuration documenting the Art. 25(1) by-design decisions (e.g., "Why TLS 1.3 only and not TLS 1.2 fallback?", "Why certificate pinning over public CA?"). This is a non-breaking documentation extension of §7.

---

## 10. Change Log

| Version | Date       | Author     | Change                                                                                  |
| ------- | ---------- | ---------- | --------------------------------------------------------------------------------------- |
| v0.1    | 2026-06-18 | Polyhymnia | Initial SPEC; awaiting Demeter+Apollo implementation                                    |
| v0.1.1  | 2026-06-18 | Polyhymnia | D-007 12th SHL: Added MAPPING ADDENDUM §9b (narrow vs broad) per Strategos 45th cadence |

---

**END OF DOCUMENT** — 10 sections + addendum, MECE per RULE #108 v0.3 MERGE EDITION. Implementation ETA per Ares T-3.33.3: T-1d 2026-06-20 EOD.
