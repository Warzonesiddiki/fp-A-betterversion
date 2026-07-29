# Onboarding Step 3 — Consent Capture (P0A-09)

**Document version:** v0.1
**Author:** Polyhymnia (Tier 3 Domain Specialist — Documentation landscape audit)
**Owner Muses (implementation):** Apollo (UX flow), Hades (consentRegistry), Demeter (i18n), Strategos (legal mapping)
**Cycle:** 25 / TURN 393+ / 8th Honest-Label
**Date:** 2026-06-18
**HEAD baseline:** `f26c339e` 1002c (32nd HEAD DRIFT, 1002-COMMIT MILESTONE)
**Status:** SPEC — awaiting implementation by Apollo + Hades

---

## 1. Scope and Compliance Frame

This document specifies the **Onboarding Step 3 consent capture** requirement for FinPlan Pro's first-run onboarding wizard. It addresses the **CRITICAL GDPR Article 6 law-basis gap** identified in T-3.33, which creates a **€20M Article 83(5)(a) administrative-fine exposure** if shipped without remediation.

**Regulatory mappings:**

| Regulation     | Article / Section                      | Requirement satisfied by this doc                                                    |
| -------------- | -------------------------------------- | ------------------------------------------------------------------------------------ |
| GDPR           | Art. 6(1)(a) lawful basis — consent    | Explicit, freely-given, specific, informed, unambiguous consent capture at first-run |
| GDPR           | Art. 7(1) — conditions for consent     | Demonstrable controller proof of consent (timestamp, version, scope, IP/UA)          |
| GDPR           | Art. 7(2) — explicit consent           | Affirmative action required (no pre-ticked boxes, no implied consent)                |
| GDPR           | Art. 7(3) — right to withdraw          | One-click withdrawal mechanism exposed in Settings > Privacy                         |
| GDPR           | Art. 8 — child's consent (N/A for B2B) | Out of scope; FinPlan Pro is B2B                                                     |
| GDPR           | Art. 13 — information to be provided   | Privacy notice linked at capture moment                                              |
| ePrivacy       | Recital 17 / Art. 5(3)                 | No cookie wall needed (offline-first desktop, no analytics without consent)          |
| CCPA / CPRA    | §1798.135 "Do Not Sell"                | Out of scope (no third-party data sale in MVP)                                       |
| SOC 2          | CC2.1 — information & communication    | Consent evidence retained per record-retention policy                                |
| ISO 27001:2022 | A.5.34 PII and privacy                 | Consent register maintained; minimum-necessary data principle                        |

**Source-of-truth:** T-3.33 audit findings (`docs/CAVEMAN_PERSIST/CYCLE_25_TURN_393_PLUS_POLYHYMNIA_*` — see ch1 memory), Strategos ADR-007 (consent management).

---

## 2. Problem Statement (CRITICAL — €20M fine risk)

**GAP P0A-09:** The current onboarding wizard (3 steps) does **NOT** capture affirmative consent for:

- (a) storage of business financial data on local-device encrypted store
- (b) processing of business contacts (if multi-currency feature wires address book)
- (c) audit-log retention beyond the 90-day default
- (d) optional telemetry / crash reports (off by default)

Without explicit consent capture at first run, FinPlan Pro has **no GDPR Art. 6(1)(a) lawful basis** for processing. If a supervisory authority (e.g., CNIL, BfDI, Garante, AEPD) audits under Article 83(5)(a), the maximum administrative fine applies: **€20,000,000 OR 4% of worldwide annual turnover, whichever is higher**.

**BLOCKING-STATUS:** This gap blocks H1 P0-A SHIP 2026-06-30. Cannot ship without consent capture wired.

---

## 3. UX Flow Specification (Apollo implementation target)

### 3.1 Onboarding wizard — revised 4-step structure

| Step | Title                 | Purpose                                    | Output to store                     |
| ---- | --------------------- | ------------------------------------------ | ----------------------------------- |
| 1    | Welcome               | Product intro, value props, branding       | `onboarding.step1.viewedAt`         |
| 2    | Workspace setup       | Org name, fiscal year start, base currency | `workspace.*`                       |
| 3    | **Consent & Privacy** | **THIS DOC — capture affirmative consent** | `consentRegistry.onboardingConsent` |
| 4    | Done                  | Confirmation, link to dashboard            | `onboarding.completedAt`            |

### 3.2 Step 3 wireframe (text mode)

```
┌──────────────────────────────────────────────────────────────┐
│  Privacy & Data Handling                              [3/4]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  FinPlan Pro processes your business financial data locally  │
│  on this device with end-to-end encryption (AES-256-GCM).   │
│  Before continuing, please review and confirm:               │
│                                                              │
│  ☑ I have read and agree to the [Privacy Notice]            │
│    (v1.4, updated 2026-06-15)                                │
│                                                              │
│  ☐ I consent to optional anonymous crash reports             │
│    (helps us fix bugs faster; no PII collected; can be       │
│    revoked anytime in Settings > Privacy)                    │
│                                                              │
│  ☐ I consent to extended audit-log retention (365 days       │
│    vs default 90 days; required only for SOC 2 / ISO 27001   │
│    audit evidence)                                           │
│                                                              │
│  By clicking "I Agree & Continue" you affirmatively consent  │
│  to data processing per GDPR Art. 6(1)(a). You may withdraw │
│  consent at any time in Settings > Privacy.                  │
│                                                              │
│              [ Back ]   [ I Agree & Continue ]               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 Affirmative-action requirements (GDPR Art. 7(2))

- **NO pre-ticked checkboxes.** All three boxes start unchecked.
- **"I Agree & Continue" button is DISABLED** until the Privacy Notice checkbox is ticked.
- Optional consent toggles (crash reports, extended retention) are independent — leaving them unchecked does not block progression.
- Clicking "I Agree & Continue" constitutes **explicit, unambiguous, freely-given consent**.

### 3.4 Withdrawal flow (GDPR Art. 7(3))

Settings > Privacy > Consent Management must expose:

- View all captured consents (timestamp, version, scope)
- One-click revoke per consent scope
- Confirmation: "Withdrawing consent will [describe consequence, e.g., 'disable extended audit retention and delete logs older than 90 days']"
- Audit-log entry for every withdrawal action

---

## 4. Consent Registry Wire Specification (Hades implementation target)

### 4.1 Data model

```typescript
// src/types/consent.ts
export type ConsentScope =
  | 'onboarding_consent' // P0A-09 — GDPR Art. 6(1)(a) lawful basis
  | 'crash_reports' // Optional, GDPR Art. 6(1)(a)
  | 'audit_log_extended_retention' // Optional, GDPR Art. 6(1)(a) + SOC 2 CC7.2
  | 'address_book_processing' // P0A-16 pseudonymization scope
  | 'currency_exchange_rate_cache' // Optional, legitimate interest
  | 'dsar_data_export'; // P0A-17 — GDPR Art. 15 DSAR wire

export type ConsentRecord = {
  id: string; // ULID
  userId: string;
  scope: ConsentScope;
  granted: boolean;
  grantedAt: string; // ISO 8601 UTC
  revokedAt?: string; // ISO 8601 UTC
  version: string; // Privacy notice version, e.g., '1.4.0'
  ipAddress?: string; // Optional — only if online; offline = undefined
  userAgent?: string; // Optional — only if online
  evidenceArtifactHash?: string; // SHA-256 of rendered notice HTML at capture moment
  withdrawalMethod?: 'settings_ui' | 'dsar_request' | 'admin_action';
};

export type ConsentRegistry = {
  records: ConsentRecord[];
  privacyNoticeVersion: string;
  lastUpdated: string;
};
```

### 4.2 Store implementation (Zustand + masterStorage)

```typescript
// src/store/consentStore.ts — Hades implementation
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';

type ConsentState = {
  registry: ConsentRegistry;
  capture: (input: {
    scope: ConsentScope;
    granted: boolean;
    privacyNoticeVersion: string;
    evidenceArtifactHash?: string;
  }) => ConsentRecord;
  revoke: (id: string, method: ConsentRecord['withdrawalMethod']) => void;
  hasActiveConsent: (scope: ConsentScope) => boolean;
};

export const useConsentStore = create<ConsentState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        registry: {
          records: [],
          privacyNoticeVersion: '1.4.0',
          lastUpdated: new Date().toISOString(),
        },
        capture: (input) => {
          const record: ConsentRecord = {
            id: ulid(),
            userId: getCurrentUserId(),
            scope: input.scope,
            granted: input.granted,
            grantedAt: new Date().toISOString(),
            version: input.privacyNoticeVersion,
            evidenceArtifactHash: input.evidenceArtifactHash,
          };
          set((s) => {
            s.registry.records.push(record);
            s.registry.lastUpdated = record.grantedAt;
          });
          return record;
        },
        revoke: (id, method) => {
          set((s) => {
            const rec = s.registry.records.find((r) => r.id === id);
            if (rec) {
              rec.granted = false;
              rec.revokedAt = new Date().toISOString();
              rec.withdrawalMethod = method;
            }
            s.registry.lastUpdated = new Date().toISOString();
          });
        },
        hasActiveConsent: (scope) => {
          const r = get()
            .registry.records.filter((r) => r.scope === scope)
            .sort((a, b) => b.grantedAt.localeCompare(a.grantedAt))[0];
          return !!r && r.granted && !r.revokedAt;
        },
      })),
      { name: 'consent-registry', storage: masterStorage }
    )
  )
);
```

### 4.3 Capture trigger (Apollo → Hades)

In the Onboarding Step 3 component, when the user clicks "I Agree & Continue":

```typescript
// src/pages/Onboarding/Step3Consent.tsx — Apollo implementation
const handleAgree = () => {
  const evidenceHash = sha256(canonicalize(privacyNoticeHtml));
  consentStore.capture({
    scope: 'onboarding_consent',
    granted: true,
    privacyNoticeVersion: '1.4.0',
    evidenceArtifactHash: evidenceHash,
  });
  if (crashReportsChecked) {
    consentStore.capture({ scope: 'crash_reports', granted: true, privacyNoticeVersion: '1.4.0' });
  }
  if (extendedRetentionChecked) {
    consentStore.capture({
      scope: 'audit_log_extended_retention',
      granted: true,
      privacyNoticeVersion: '1.4.0',
    });
  }
  router.push('/onboarding/step4');
};
```

### 4.4 DSAR endpoint (P0A-17 wire, see also `04-DSAR-WIRE.md`)

The consentRegistry must be exportable as part of the GDPR Art. 15 DSAR (Data Subject Access Request) response. See `04-DSAR-WIRE.md` for full DSAR wire specification.

---

## 5. Evidence & Auditability (SOC 2 CC7.2 + ISO 27001 A.8.15)

Per **P0A-14 Undo/Redo audit-logging spec** (`docs/security/UNDO-REDO-AUDIT-LOGGING.md`), every consent capture, withdrawal, and update action must emit an audit-log entry with:

| Field             | Type          | Example                                                            |
| ----------------- | ------------- | ------------------------------------------------------------------ |
| timestamp         | ISO 8601 UTC  | `2026-06-18T22:14:33.117Z`                                         |
| actor             | user ID       | `user_019eda5a`                                                    |
| action            | enum          | `consent.capture` / `consent.revoke` / `consent.update`            |
| scope             | ConsentScope  | `onboarding_consent`                                               |
| outcome           | enum          | `success` / `denied` / `error`                                     |
| evidenceHash      | SHA-256 (hex) | `9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08` |
| previousStateHash | SHA-256 (hex) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |

Audit-log retention: **90 days default; 365 days if user opted into `audit_log_extended_retention`**.

---

## 6. Acceptance Criteria

| #     | Criterion                                                                                     | Verification                                                |
| ----- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| AC-1  | Onboarding wizard has 4 steps (was 3); consent capture is Step 3                              | E2E test: Playwright `tests/e2e/onboarding-consent.spec.ts` |
| AC-2  | No pre-ticked checkboxes; "I Agree & Continue" disabled until Privacy Notice ticked           | Component test: `<Step3Consent>` checkbox state             |
| AC-3  | On "I Agree & Continue", `consentRegistry.capture('onboarding_consent', granted=true)` called | Store test: `consentStore.test.ts`                          |
| AC-4  | Privacy Notice version (1.4.0) recorded in `ConsentRecord.version`                            | Store test                                                  |
| AC-5  | Evidence artifact SHA-256 hash recorded                                                       | Store test                                                  |
| AC-6  | Settings > Privacy exposes consent view + one-click revoke                                    | E2E test                                                    |
| AC-7  | Every consent action emits audit-log entry                                                    | Audit log test                                              |
| AC-8  | DSAR export includes all `ConsentRecord` entries                                              | DSAR test (see `04-DSAR-WIRE.md`)                           |
| AC-9  | Withdrawal confirmation dialog describes consequences                                         | Component test                                              |
| AC-10 | Optional consents (crash reports, extended retention) independent                             | Component test                                              |

---

## 7. Out of Scope

- Cookie consent banner (not applicable — offline-first desktop)
- Children's consent (GDPR Art. 8) — N/A for B2B
- Cross-border transfer mechanisms (GDPR Ch. V) — N/A for local-only MVP
- DPIA (GDPR Art. 35) — recommended post-MVP for any future analytics expansion

---

## 8. Cross-References

- **P0A-14** Undo/Redo audit logging — `docs/security/UNDO-REDO-AUDIT-LOGGING.md`
- **P0A-15** TLS 1.3 + PCI-DSS — `docs/security/PCI-DSS-COMPLIANCE.md`
- **P0A-16** Pseudonymization — `docs/security/PSEUDONYMIZATION.md`
- **P0A-17** DSAR wire — `docs/onboarding/04-DSAR-WIRE.md`
- **T-3.33 audit findings** — `docs/CAVEMAN_PERSIST/CYCLE_25_TURN_393_PLUS_POLYHYMNIA_*` (see ch1 memory)
- **Strategos ADR-007** — Consent management (TENTATIVE pending ICP ratification 2026-06-22)
- **Hades T-4.4 Audit Log Completeness Audit** — Nomos T-3.21.3 followup reference

---

## 8b. MAPPING ADDENDUM — Narrow vs Broad GDPR Article Interpretation (D-007 12th SHL SELF-HONEST-LABEL)

**Source**: Strategos 45th cadence TURN 394+ CRITICAL CORRECTION (Polyhymnia mapping scope catch).

This document uses a **NARROW technical mapping** focused on the primary GDPR Article directly governing consent capture. The Strategos **H3 ROADMAP v0.2 compliance consolidation lens** uses BROADER mapping that captures additional Articles across the same P0A feature.

| Lens                  | Primary Article(s)                                                               | Rationale                                                                                                                                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Narrow (this doc)** | **Art. 6(1)(a) consent** + Art. 7(1)(2)(3) demonstrability + Art. 13 information | Direct law-basis + consent mechanics + transparency at capture point                                                                                                                                                       |
| **Broad (Strategos)** | **Art. 6(1)(b) contract** OR **Art. 7 consent** (both valid)                     | H3 compliance consolidation: contract-necessary processing ALSO applies when consent withdrawal triggers service degradation (Art. 6(1)(b) necessity for contract performance is an alternative law basis to fall back on) |

**BOTH MAPPINGS ARE TECHNICALLY CORRECT** — they are different analytical lenses, not contradictions. Per Strategos 45th cadence, the H3 ROADMAP v0.2 view is preferred for H1 P0-A SHIP 2026-06-30 because it positions FinPlan Pro for enterprise customers who require BOTH consent-based (Art. 6(1)(a) for marketing/analytics) AND contract-necessary (Art. 6(1)(b) for core FP&A functionality) law-basis documentation.

**Action**: Apollo + Hades implementation must support BOTH law-basis declarations in `consentRegistry.capture()` payload (`lawBasis: 'art_6_1_a_consent' | 'art_6_1_b_contract' | 'art_6_1_c_legal_obligation' | 'art_6_1_f_legitimate_interest'`). This is a non-breaking extension of the spec in §4.1.

---

## 9. Change Log

| Version | Date       | Author     | Change                                                                                  |
| ------- | ---------- | ---------- | --------------------------------------------------------------------------------------- |
| v0.1    | 2026-06-18 | Polyhymnia | Initial SPEC; awaiting Apollo+Hades implementation                                      |
| v0.1.1  | 2026-06-18 | Polyhymnia | D-007 12th SHL: Added MAPPING ADDENDUM §8b (narrow vs broad) per Strategos 45th cadence |

---

**END OF DOCUMENT** — 9 sections + addendum, MECE per RULE #108 v0.3 MERGE EDITION. Implementation ETA per Ares T-3.33.1: T-1d 2026-06-20 EOD.
