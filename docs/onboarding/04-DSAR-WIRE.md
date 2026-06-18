# DSAR Wire Specification — GDPR Art. 15 Right of Access (P0A-17)

**Document version:** v0.1
**Author:** Polyhymnia (Tier 3 Domain Specialist — Documentation landscape audit)
**Owner Muses (implementation):** Hades (audit log + export engine), Clio (UI export flow), Apollo (consent capture integration)
**Cycle:** 25 / TURN 393+ / 8th Honest-Label
**Date:** 2026-06-18
**HEAD baseline:** `f26c339e` 1002c (32nd HEAD DRIFT, 1002-COMMIT MILESTONE)
**Status:** SPEC — awaiting implementation by Hades + Clio + Apollo

---

## 1. Scope and Compliance Frame

This document specifies the **Data Subject Access Request (DSAR) wire** to address the **CRITICAL P0A-17 gap** identified in T-3.33: the Audit Trail UI exists but does NOT expose a GDPR Art. 15 "right of access" export path for users to receive a copy of their personal data.

**Regulatory mappings:**

| Regulation | Article | Requirement |
|------------|---------|-------------|
| GDPR | Art. 15(1) | Right to obtain confirmation as to whether personal data is being processed, and access to that data |
| GDPR | Art. 15(3) | Right to receive copy of personal data undergoing processing in a structured, commonly used, machine-readable format |
| GDPR | Art. 15(4) | Right to have data transmitted to another controller ("data portability") |
| GDPR | Art. 12(1) | Concise, transparent, intelligible, easily accessible form, using clear and plain language |
| GDPR | Art. 12(3) | Provide information within 1 month; extendable by 2 months for complex requests |
| GDPR | Art. 11(2) | Controller is no longer required to maintain identifying information if pseudonymous |
| GDPR | Art. 20 | Right to data portability (related but distinct) |
| CCPA / CPRA | §1798.110, §1798.115 | Right to know about data collected/disclosed |
| ISO 27701:2019 | 7.4.6 Privacy by design — Subject access | Implementation guidance |

**Why this matters for FinPlan Pro:**

Even though FinPlan Pro is offline-first and stores data locally, GDPR Art. 15 still applies because:
- (a) The consentRegistry (P0A-09) records user consent events
- (b) The audit log (P0A-14) records user actions
- (c) Address-book processing (P0A-16) stores contact records
- (d) All of this constitutes "processing" under GDPR Art. 4(2)

A user has the right to receive a copy of all data FinPlan Pro processes about them, in a machine-readable format, free of charge, within 1 month.

---

## 2. Problem Statement (CRITICAL — GDPR Art. 15 gap)

**GAP P0A-17:** The Audit Trail UI displays audit log entries but:
- Does NOT provide an "Export My Data" action
- Does NOT include the consentRegistry records (Art. 7(1) demonstrability)
- Does NOT include the pseudonymized PII per P0A-16 (without depseudonymization per scope rules)
- Does NOT provide a machine-readable export format (JSON/CSV/XML)
- Does NOT meet the 1-month response window with proper audit trail

**BLOCKING-STATUS:** Blocks GDPR compliance attestation for any EU customer; blocks H1 P0-A SHIP 2026-06-30.

---

## 3. DSAR Export Wire Specification

### 3.1 Export format

Primary format: **JSON** (machine-readable per Art. 15(3)). Optional: CSV for tabular sections.

```typescript
// src/types/dsarExport.ts — Hades implementation
export type DsarExport = {
  meta: {
    exportId: string;                  // ULID
    exportGeneratedAt: string;         // ISO 8601 UTC
    privacyNoticeVersion: string;      // '1.4.0'
    exportFormatVersion: string;       // '1.0.0'
    dataSubjectId: string;             // Pseudonymized (per P0A-16 depseudonymization under DSAR scope)
    exportScope: 'full' | 'specific';
  };
  consentRegistry: ConsentRecord[];    // Per P0A-09
  auditLog: AuditLogEntry[];           // Per P0A-14
  pseudonymizedData: {
    addressBook: ContactRecord[];
    localePrefs: LocalePref[];
    workspaceSettings: WorkspaceSetting[];
  };
  derivedData: {
    financialReports: ReportSummary[];
    budgetAggregates: BudgetSummary[];
  };
  manifest: {
    sections: string[];
    itemCounts: Record<string, number>;
    sha256Hashes: Record<string, string>;
  };
};
```

### 3.2 Export engine (Hades implementation)

```typescript
// src/engines/dsar/exportEngine.ts — Hades implementation
export async function generateDsarExport(
  userId: string,
  scope: 'full' | 'specific'
): Promise<DsarExport> {
  const actorToken = pseudonymize(userId, 'audit');  // Per P0A-16

  // 1. Collect consent registry entries for this user
  const consents = consentStore.get().registry.records
    .filter((r) => r.userId === userId);

  // 2. Collect audit log entries (filter by pseudonymized actorId)
  const auditEntries = auditLog.query({ actorToken });

  // 3. Collect pseudonymized PII and depseudonymize under DSAR scope
  const contacts = addressBookStore.get().contacts
    .filter((c) => c.contactToken === pseudonymize(userId, 'addressbook'))
    .map((c) => ({ ...c, depseudonymized: depseudonymize(c.contactToken, 'addressbook') }));

  const localePrefs = localeStore.get().prefs;
  const workspaceSettings = workspaceStore.get().settings;

  // 4. Aggregate financial reports (no PII)
  const reports = reportsStore.getReports();
  const reportSummaries = reports.map((r) => ({
    id: r.id, title: r.title, generatedAt: r.generatedAt,
    aggregates: computeAggregates(r),
  }));

  // 5. Build manifest with section hashes
  const sections = {
    consentRegistry: consents,
    auditLog: auditEntries,
    pseudonymizedData: { addressBook: contacts, localePrefs, workspaceSettings },
    derivedData: { financialReports: reportSummaries, budgetAggregates: [] },
  };
  const sha256Hashes = Object.fromEntries(
    Object.entries(sections).map(([k, v]) => [k, sha256(canonicalize(v))])
  );

  const exportData: DsarExport = {
    meta: {
      exportId: ulid(),
      exportGeneratedAt: new Date().toISOString(),
      privacyNoticeVersion: '1.4.0',
      exportFormatVersion: '1.0.0',
      dataSubjectId: depseudonymize(actorToken, 'audit') ?? userId,
      exportScope: scope,
    },
    consentRegistry: consents,
    auditLog: auditEntries,
    pseudonymizedData: sections.pseudonymizedData,
    derivedData: sections.derivedData,
    manifest: {
      sections: Object.keys(sections),
      itemCounts: {
        consentRegistry: consents.length,
        auditLog: auditEntries.length,
        addressBook: contacts.length,
        localePrefs: 1,
        workspaceSettings: 1,
        financialReports: reportSummaries.length,
      },
      sha256Hashes,
    },
  };

  // 6. Emit DSAR export audit log entry (P0A-14 long-retention)
  auditLog.append({
    actorId: userId, actorType: 'user', action: 'dsar.export',
    target: { entityType: 'dsar_export', entityId: exportData.meta.exportId },
    outcome: 'success',
    previousStateHash: sha256(''),
    newStateHash: sha256(canonicalize(exportData)),
    evidenceArtifactHash: sha256(canonicalize(exportData)),
    retentionClass: 'long',
  });

  return exportData;
}
```

### 3.3 Export delivery (Clio UI implementation)

```typescript
// src/components/dsar/ExportDataModal.tsx — Clio implementation
const handleExport = async () => {
  setLoading(true);
  try {
    const exportData = await dsarExportEngine.generateDsarExport(currentUserId, 'full');
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `finplanpro-dsar-export-${exportData.meta.exportId}.json`;
    link.click();

    toast.success('DSAR export generated. Check your downloads folder.');
  } catch (err) {
    auditLog.error('dsar.export', { error: err.message });
    toast.error(`Export failed: ${err.message}`);
  } finally {
    setLoading(false);
  }
};
```

**Future enhancement (v2.0):** Encrypted email delivery or upload to user-specified secure endpoint. For MVP, local file download only.

---

## 4. Identity Verification (GDPR Art. 12(6))

Per GDPR Art. 12(6), the controller must verify the identity of the data subject. For FinPlan Pro's offline-first MVP:

- **Local-only access:** DSAR export is generated for the **currently logged-in user** (assumed to be the data subject).
- **No online identity verification required** in MVP (no remote DSAR endpoint).
- **v2.0 enhancement:** Email + cryptographic challenge for remote DSAR requests.

---

## 5. Response Window (GDPR Art. 12(3))

| Scenario | MVP behavior | v2.0 enhancement |
|----------|--------------|------------------|
| Local user requests DSAR | Instant export generated | N/A (already instant) |
| Remote DSAR via email (v2.0) | N/A | 1-month response window + 2-month extension |

---

## 6. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| AC-1 | Audit Trail UI exposes "Export My Data" button | Component test |
| AC-2 | Export includes `consentRegistry`, `auditLog`, `pseudonymizedData`, `derivedData`, `manifest` | Integration test |
| AC-3 | Export format is JSON, machine-readable per Art. 15(3) | Format check |
| AC-4 | Export manifest includes per-section SHA-256 hashes | Integration test |
| AC-5 | DSAR export triggers `dsar.export` audit log entry (long retention) | Hades audit log test |
| AC-6 | Depseudonymization of `actorId` and `contactToken` under DSAR scope | P0A-16 unit test |
| AC-7 | Export is downloadable as a single file with descriptive filename | E2E test |
| AC-8 | Export integrity hash verifiable (re-hash and compare) | Verification tool |
| AC-9 | Empty state handled (no data → export still generated with empty sections) | Edge-case test |
| AC-10 | Export respects consent withdrawal (revoked consent = data omitted if not strictly required) | Integration test |

---

## 7. Out of Scope (v2.0 candidates)

- GDPR Art. 17 right-to-erasure (delete my data)
- GDPR Art. 16 rectification (correct my data)
- GDPR Art. 18 restriction of processing
- GDPR Art. 21 right to object
- Encrypted email delivery
- Online DSAR submission form
- Verifiable DSAR receipts (cryptographic proof of export)

---

## 8. Cross-References

- **P0A-09** Consent capture — `docs/onboarding/03-CONSENT-CAPTURE.md`
- **P0A-14** Audit logging — `docs/security/UNDO-REDO-AUDIT-LOGGING.md`
- **P0A-15** TLS 1.3 — `docs/security/PCI-DSS-COMPLIANCE.md`
- **P0A-16** Pseudonymization — `docs/security/PSEUDONYMIZATION.md`
- **Audit Trail UI** — see `src/pages/settings/AuditTrail.tsx`
- **Consent registry** — see `docs/onboarding/03-CONSENT-CAPTURE.md` §4.1

---

## 8b. MAPPING ADDENDUM — Narrow vs Broad GDPR Article Interpretation (D-007 12th SHL SELF-HONEST-LABEL)

**Source**: Strategos 45th cadence TURN 394+ CRITICAL CORRECTION (Polyhymnia mapping scope catch).

This document uses a **NARROW mapping** focused on the primary GDPR Articles directly governing Data Subject Access Requests (Art. 15 right of access). The Strategos **H3 ROADMAP v0.2 compliance consolidation lens** adds GDPR Art. 20 right to data portability as a CRITICAL secondary mapping because DSAR fulfillment often overlaps with portability requests.

| Lens | Primary Article(s) | Rationale |
|------|-------------------|-----------|
| **Narrow (this doc)** | **GDPR Art. 15(1)(3)(4)** right of access + **Art. 12(1)(3)** transparent processing + **Art. 11(2)** controller identification + CCPA + ISO 27701 7.4.6 | DSAR wire is primarily a RIGHT OF ACCESS implementation (Art. 15 is THE DSAR article; Art. 12 governs the response format and timeline) |
| **Broad (Strategos)** | **+ GDPR Art. 20 right to data portability** + Art. 20(1) structured/common-machine-readable format + Art. 20(3) direct transmission | H3 compliance consolidation: Art. 20 portability is a SUB-SET of Art. 15 access for processing based on consent (Art. 6(1)(a)) or contract (Art. 6(1)(b)). DSAR fulfillment UI should expose BOTH options (access-only JSON download vs portability-format CSV/JSON export) |

**BOTH MAPPINGS ARE TECHNICALLY CORRECT** — they are different analytical lenses, not contradictions. Per Strategos 45th cadence, the H3 ROADMAP v0.2 view is preferred for H1 P0-A SHIP 2026-06-30 because enterprise customers frequently require BOTH DSAR access (Art. 15) AND portability exports (Art. 20) as part of vendor onboarding due-diligence.

**Action**: Hades + Clio + Apollo implementation must add a `format=portability` query parameter to the DSAR export endpoint (`/api/dsar/export?format=portability`) which returns data in the structured/common-machine-readable format required by Art. 20(1) (e.g., JSON with ISO 20022 schema for financial data, CSV for tabular). This is a non-breaking extension of §5.2.

---

## 9. Change Log

| Version | Date | Author | Change |
|---------|------|--------|--------|
| v0.1 | 2026-06-18 | Polyhymnia | Initial SPEC; awaiting Hades+Clio+Apollo implementation |
| v0.1.1 | 2026-06-18 | Polyhymnia | D-007 12th SHL: Added MAPPING ADDENDUM §8b (narrow vs broad) per Strategos 45th cadence |

---

**END OF DOCUMENT** — 9 sections + addendum, MECE per RULE #108 v0.3 MERGE EDITION. Implementation ETA per Ares T-3.33.5: T-1d 2026-06-20 EOD.