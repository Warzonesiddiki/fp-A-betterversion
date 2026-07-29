# Pseudonymization Specification — GDPR Art. 4(1) (P0A-16)

**Document version:** v0.1
**Author:** Polyhymnia (Tier 3 Domain Specialist — Documentation landscape audit)
**Owner Muses (implementation):** Demeter (data layer + multi-currency/timezone wire), Hades (audit log), Apollo (UI masking)
**Cycle:** 25 / TURN 393+ / 8th Honest-Label
**Date:** 2026-06-18
**HEAD baseline:** `f26c339e` 1002c (32nd HEAD DRIFT, 1002-COMMIT MILESTONE)
**Status:** SPEC — awaiting implementation by Demeter + Hades

---

## 1. Scope and Compliance Frame

This document specifies the **pseudonymization requirements** for FinPlan Pro to address the **CRITICAL P0A-16 gap**: the Multi-currency/timezone feature wires user-identifying data (locale, address-book contacts) without applying GDPR Art. 4(1) pseudonymization, and Demeter T-4.3 audit found no pseudonymization library or policy in place.

**Regulatory mappings:**

| Regulation     | Article                                | Requirement                                                                                                                                                                                     |
| -------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GDPR           | Art. 4(1) — definitions                | "'pseudonymisation' means processing of personal data in such a manner that the personal data can no longer be attributed to a specific data subject without the use of additional information" |
| GDPR           | Art. 4(5) — 'encryption'               | Distinguished from pseudonymization: pseudonymized data can be re-attributed with separate key material                                                                                         |
| GDPR           | Art. 32(1)(a)                          | Pseudonymisation as appropriate technical measure                                                                                                                                               |
| GDPR           | Art. 25(1) — Data Protection by Design | Pseudonymization as default                                                                                                                                                                     |
| GDPR           | Art. 89(1) — research/statistics       | Pseudonymization for archival purposes                                                                                                                                                          |
| ISO 27001:2022 | A.8.11 Data masking                    | Use of data masking per access policy                                                                                                                                                           |
| ISO 27701:2019 | 7.4.4 De-identification                | Pseudonymization implementation guidance                                                                                                                                                        |

**Pseudonymization vs Anonymization (critical distinction):**

- **Pseudonymized data** is **still personal data** under GDPR (re-attribution possible with key).
- **Anonymized data** is **NOT personal data** under GDPR (re-attribution not reasonably possible).
- FinPlan Pro applies pseudonymization (not anonymization) — pseudonymized data remains in scope of GDPR.

---

## 2. Problem Statement (CRITICAL — GDPR Art. 32(1)(a) gap)

**GAP P0A-16:** The Multi-currency / Multi-timezone feature (and address-book integration if any) introduces these identifiers without pseudonymization:

| Identifier                          | Risk                                              |
| ----------------------------------- | ------------------------------------------------- |
| User display name                   | Direct identifier                                 |
| Email address                       | Direct identifier                                 |
| Phone number                        | Direct identifier                                 |
| IP address (if online)              | Direct identifier                                 |
| Locale (country code, language tag) | Indirect identifier (correlates with nationality) |
| Timezone offset                     | Indirect identifier (correlates with location)    |
| Address-book contacts               | Direct identifiers                                |
| Currency preferences                | Indirect identifier (correlates with geography)   |

Without pseudonymization, even local-only storage exposes direct identifiers in cleartext. If the encrypted store is compromised (lost laptop, stolen device), all PII is exposed.

**BLOCKING-STATUS:** Blocks H1 P0-A SHIP 2026-06-30. Cannot ship multi-currency/timezone feature without pseudonymization wired.

---

## 3. Pseudonymization Strategy

### 3.1 Token-mapping approach

We use **deterministic tokenization with separate key material**:

```
original_value → HMAC-SHA-256(key, value) → truncated_token (16 bytes hex)
```

**Properties:**

- **Deterministic** — same input always maps to same token (needed for joins/aggregation)
- **Irreversible without key** — without the HMAC key, token cannot be reversed
- **Stable per scope** — different scopes use different keys to prevent cross-scope correlation

### 3.2 Pseudonymization levels

| Level                               | Reversibility                            | Use case                                  |
| ----------------------------------- | ---------------------------------------- | ----------------------------------------- |
| Level 0 (cleartext)                 | N/A                                      | User-facing display only, never persisted |
| Level 1 (pseudonymized, scoped)     | Reversible with key in secure vault      | Default for persisted PII                 |
| Level 2 (pseudonymized + truncated) | Reversible with key + truncation mapping | Long-term retention, analytics            |
| Level 3 (anonymized)                | Not reversible                           | Aggregated stats only (out of scope MVP)  |

**Default for all persisted PII in FinPlan Pro: Level 1.**

---

## 4. Implementation Specification (Demeter target)

### 4.1 Pseudonymization library (skeleton)

```typescript
// src/utils/pseudonymize.ts — Demeter implementation
import { createHmac, randomBytes } from 'node:crypto';

type Scope = 'analytics' | 'audit' | 'addressbook' | 'currency_prefs' | 'locale_prefs';

// Keys derived from device-bound master key + scope salt
// Stored in masterStorage (encrypted at rest via Tauri IPC policy)
const SCOPE_KEYS: Record<Scope, Buffer> = {
  /* populated at runtime */
};

function pseudonymize(value: string, scope: Scope): string {
  const key = SCOPE_KEYS[scope];
  const hmac = createHmac('sha256', key);
  hmac.update(value);
  return hmac.digest('hex').slice(0, 32); // 16 bytes hex
}

function depseudonymize(token: string, scope: Scope): string | null {
  // Only for re-attribution under DSAR or admin action
  // Requires key access; emits audit log entry
  auditLog.info('pseudonymization.reverse', { scope });
  return /* reverse-lookup from key-encrypted mapping */ token;
}
```

### 4.2 Multi-currency / Multi-timezone mapping

```typescript
// src/store/localeStore.ts — Demeter implementation
type LocalePref = {
  userId: string; // pseudonymized token
  locale: string; // 'en-US', 'de-DE', etc. — cleartext for display only
  timezoneOffset: number; // -480 to +720 minutes — cleartext for display only
  currency: string; // 'USD', 'EUR', 'GBP' — cleartext for display only
  pseudonymizedAt: string; // ISO 8601 UTC
};

function persistLocalePref(input: LocalePref): void {
  const scoped: LocalePref = {
    ...input,
    userId: pseudonymize(input.userId, 'locale_prefs'),
    locale: input.locale, // cleartext for display
    timezoneOffset: input.timezoneOffset,
    currency: input.currency,
    pseudonymizedAt: new Date().toISOString(),
  };
  set((s) => {
    s.prefs = scoped;
  });
}
```

### 4.3 Address-book processing (P0A-09 consent scope)

```typescript
// src/store/addressBookStore.ts — Demeter implementation
type ContactRecord = {
  contactToken: string; // pseudonymized (HMAC of email or phone)
  displayName: string; // user-provided, never pseudonymized at storage (user expects to see their contacts)
  email?: string; // cleartext (user-provided for utility)
  phone?: string; // cleartext (user-provided for utility)
  pseudonymizedAt: string;
  consentId: string; // FK to consentRegistry.capture('address_book_processing')
};

function addContact(input: ContactRecord): void {
  if (!consentStore.hasActiveConsent('address_book_processing')) {
    throw new Error('Cannot add contact: address-book-processing consent not granted');
  }
  const token = pseudonymize(input.email ?? input.phone ?? '', 'addressbook');
  set((s) => {
    s.contacts.push({ ...input, contactToken: token });
  });
}
```

---

## 5. Key Management

### 5.1 Key derivation

- **Master key** derived from device-bound seed (Tauri keystore or OS keychain on macOS/Windows/Linux).
- **Scope keys** derived as `HMAC-SHA-256(masterKey, scope_salt)`.
- **No key material ever leaves the device** (offline-first).
- **Key rotation** every 365 days; rotation event emits audit log entry + re-tokenizes existing records lazily.

### 5.2 Re-identification (DSAR / admin / audit)

Re-identification (`depseudonymize`) is permitted ONLY when:

- (a) DSAR request received and consentRegistry confirms identity (see `04-DSAR-WIRE.md`)
- (b) Admin action with elevated RBAC role (admin-only) and audit log entry
- (c) Legal compulsion (subpoena, court order) — captured via special audit log tag

Every re-identification emits an audit log entry per P0A-14 spec.

---

## 6. Acceptance Criteria

| #    | Criterion                                                    | Verification                                                                       |
| ---- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| AC-1 | All persisted PII is pseudonymized (Level 1) before storage  | Unit test: every setter in PII stores calls `pseudonymize()`                       |
| AC-2 | HMAC-SHA-256 deterministic per scope                         | Unit test: same input → same token within scope; different scope → different token |
| AC-3 | Keys never logged or displayed in cleartext                  | Grep test: no `console.log(SCOPE_KEYS)` or similar                                 |
| AC-4 | Re-identification emits audit log entry                      | Unit test: `depseudonymize()` calls `auditLog.info()`                              |
| AC-5 | DSAR export includes depseudonymized values per P0A-17       | Integration test (see `04-DSAR-WIRE.md`)                                           |
| AC-6 | Address-book consent required before adding contact          | Component + store test                                                             |
| AC-7 | Key rotation triggers re-tokenization                        | Integration test                                                                   |
| AC-8 | No `any` types in pseudonymization library (tsconfig strict) | `tsc --noEmit`                                                                     |

---

## 7. Out of Scope

- K-anonymity, l-diversity, t-closeness (statistical disclosure controls) — not required for MVP
- Differential privacy — deferred to v2.0 analytics expansion
- Federated learning — N/A
- Homomorphic encryption — N/A

---

## 8. Cross-References

- **P0A-09** Consent capture — `docs/onboarding/03-CONSENT-CAPTURE.md` (address-book-processing consent scope)
- **P0A-14** Audit logging — `docs/security/UNDO-REDO-AUDIT-LOGGING.md`
- **P0A-15** TLS 1.3 — `docs/security/PCI-DSS-COMPLIANCE.md`
- **P0A-17** DSAR wire — `docs/onboarding/04-DSAR-WIRE.md`
- **Existing:** `docs/security/PII_REDACTION_LOGGING_POLICY.md` (complementary redaction)
- **Existing:** `docs/security/ENCRYPTION_AT_REST_TAURI_IPC_POLICY.md` (key storage)
- **Demeter T-4.3 audit findings** — referenced in ch1 memory

---

## 8b. MAPPING ADDENDUM — Narrow vs Broad GDPR Article Interpretation (D-007 12th SHL SELF-HONEST-LABEL)

**Source**: Strategos 45th cadence TURN 394+ CRITICAL CORRECTION (Polyhymnia mapping scope catch).

This document uses a **NARROW mapping** focused on the primary GDPR Article directly governing pseudonymization as a technical measure. The Strategos **H3 ROADMAP v0.2 compliance consolidation lens** adds GDPR Art. 30 records of processing as a CRITICAL secondary mapping because pseudonymization decisions must be documented in the Records of Processing Activities (ROPA).

| Lens                  | Primary Article(s)                                                                                                                                                                                                                        | Rationale                                                                                                                                                                                                                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Narrow (this doc)** | **GDPR Art. 4(1)** pseudonymization definition + **Art. 4(5)** "data concerning health" special category + **Art. 32(1)(a)** appropriate technical measures + **Art. 25(1)** by-design + **Art. 89(1)** safeguards for research/archiving | Pseudonymization is primarily a SECURITY + PRIVACY-BY-DESIGN technical measure (Art. 4(1) defines it; Art. 32 + 25 govern its application)                                                                                                                                                         |
| **Broad (Strategos)** | **+ GDPR Art. 30 records of processing** (ROPA) + Art. 35 DPIA                                                                                                                                                                            | H3 compliance consolidation: Art. 30 requires that pseudonymization decisions be documented in the ROPA register maintained by the controller. Multi-currency conversion introduces NEW processing activities (FX rate feed ingestion, currency conversion logging) that MUST be added to the ROPA |

**BOTH MAPPINGS ARE TECHNICALLY CORRECT** — they are different analytical lenses, not contradictions. Per Strategos 45th cadence, the H3 ROADMAP v0.2 view is preferred for H1 P0-A SHIP 2026-06-30 because Art. 30 ROPA documentation is a SUPERVISORY AUTHORITY audit requirement (per Art. 30(4)) and the multi-currency feature introduces NEW processing activities that trigger ROPA update obligations.

**Action**: Demeter implementation must update `docs/security/ROPA.md` (existing) to include multi-currency processing activities (FX rate feed ingestion, conversion logging, rate snapshot retention) with pseudonymization measures applied. This is a non-breaking documentation extension of §7.

---

## 9. Change Log

| Version | Date       | Author     | Change                                                                                  |
| ------- | ---------- | ---------- | --------------------------------------------------------------------------------------- |
| v0.1    | 2026-06-18 | Polyhymnia | Initial SPEC; awaiting Demeter+Hades implementation                                     |
| v0.1.1  | 2026-06-18 | Polyhymnia | D-007 12th SHL: Added MAPPING ADDENDUM §8b (narrow vs broad) per Strategos 45th cadence |

---

**END OF DOCUMENT** — 9 sections + addendum, MECE per RULE #108 v0.3 MERGE EDITION. Implementation ETA per Ares T-3.33.4: T-1d 2026-06-20 EOD.
