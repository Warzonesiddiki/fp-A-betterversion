# Financial Metric & Lineage Model — FinPlan Pro

> **Status:** DRAFT HYPOTHESIS · **Purpose:** Define how an official financial number remains explainable from source through model, decision, report, and export.  
> **Depends on:** materiality-decision-policy-model.md · **Validation needed:** controller, auditor, FP&A, security review.

## 1. Lineage principle

An official figure is not merely a decimal value. It is an immutable **claim**:

> “For this authorized scope, period, currency, and version, this amount was calculated by this definition from these frozen inputs under this policy at this time.”

If FinPlan cannot reconstruct that claim for an authorized user, it must label the figure draft, stale, or unverified—not official.

## 2. Metric contract

| Field | Requirement |
|---|---|
| Metric ID / semantic code | Stable tenant-scoped identity, e.g. `EBITDA_ADJ` |
| Name / business definition | Human-readable meaning, inclusion/exclusion and owner |
| Formula / calculation version | Parsed formula or approved calculation executable/version hash |
| Dimensions | permitted entity, account, cost center, product, customer, scenario, period grain |
| Unit / currency | currency/percentage/count/days; ISO currency and display/rounding policy |
| Sign / favorable semantics | debit/credit sign and whether increase is favorable, unfavorable, or contextual |
| Data classification | public/internal/confidential/restricted plus column/row constraints |
| Source policy | accepted actual, plan, forecast, FX, driver, and manual-adjustment sources |
| Lifecycle | draft, certified, deprecated, retired; effective dates and approver |
| Test evidence | reconciliation/golden-dataset/test version references |

A metric definition change creates a new version. It never retroactively changes a published snapshot’s meaning.

## 3. Lineage graph (logical model)

```text
Source System / File
  → Source Extract (hash, cursor, timestamp)
  → Import Batch (mapping version, validation/control totals)
  → Normalized Financial Fact (tenant, entity, period, dimensions, money)
  → Calculation Input Set (frozen fact/plan/driver/FX versions)
  → Metric Definition Version / Calculation Run
  → Metric Observation (value, context, freshness, lineage pointer)
  → Decision Case / Reconciliation / Close Certification
  → Report Definition Version
  → Immutable Report Snapshot / Export Artifact
```

Each edge is queryable for entitled users. An evidence drawer defaults to the shortest useful path and permits deeper drill-through; it does not dump every technical event by default.

## 4. Required lineage records

| Record | Immutable fields | Why |
|---|---|---|
| Source Extract | source identity, cursor/range, hash, received time | detects input substitution |
| Import Batch | mapping version, validation outcome, control totals, actor/job | explains normalization and quality |
| Financial Fact | original/base/reporting money, currency, FX reference, dimensions, posting/period | financial foundation |
| Calculation Run | engine/formula version, input-set IDs, execution time, validation status | reproduces result |
| Metric Observation | value, context, metric version, lineage root, freshness | answer shown to user |
| Decision Case | qualification policy/version, observation IDs, owner/action | explains material attention |
| Report Snapshot | definition/input/context versions, publisher, certification, artifact hash | makes reporting reproducible |

## 5. Money, FX, period, and rounding controls

1. Store exact amounts in an approved decimal representation; do not calculate official values with binary floating point.
2. Preserve original currency/amount, functional/base amount, reporting amount, rate, rate type, source, effective date, and translation method.
3. Display rounding is not calculation rounding. Evidence shows display policy and underlying exact value where entitlement permits.
4. A fiscal-period reference includes calendar/version, period status, adjustment/restatement designation, and as-of timestamp.
5. An approved manual adjustment is a distinct traceable input, never an invisible overwrite.

## 6. Freshness and confidence contract

| State | Meaning | UI obligation |
|---|---|---|
| Current | source/calc freshness meets policy | show last successful source/run timestamp |
| Stale | source/run is older than policy | label stale, show age and recovery path |
| Pending | import/calculation/approval in progress | do not show as final; show dependency/status |
| Failed | validation/job/control failure | show actionable reason, no misleading value |
| Draft | local/manual/unpublished model result | label not official and identify owner/version |
| Certified | within certified close/report scope | show certificate scope/time/policy version |

Confidence is not an AI probability unless it is a defined statistical output. Do not use “high confidence” as a vague UI decoration.

## 7. Permission model

Lineage access is the intersection of:

- tenant membership;
- entity/dimension entitlement;
- data classification;
- report/snapshot sharing policy;
- workflow/close lifecycle permission;
- field/attachment-level sensitivity.

A user who can view a summary may see an aggregated explanation but not an underlying salary, journal, restricted customer, or confidential attachment. Audit exports are policy-scoped and themselves audited.

## 8. Reproducibility protocol

To reproduce an official report value, the authoritative service must resolve:

1. report snapshot and definition version;
2. metric definition/calculation version;
3. frozen input-set IDs and source extract/import batch;
4. fiscal context, dimensions, currency/FX/rounding policies;
5. authorization-policy and certification state at publication;
6. validation/reconciliation result.

If any immutable input is unavailable due to retention policy, the snapshot must retain a legally/contractually sufficient evidence artifact and explicitly disclose the limitation.

## 9. API/query contract hypothesis

```ts
interface MetricObservationEvidence {
  observationId: string;
  metric: { id: string; version: string; definition: string };
  context: { tenantId: string; entityScope: string[]; periodIds: string[]; versionId?: string; currency: string };
  value: { exact: string; display: string; roundingPolicy: string };
  freshness: { state: 'current' | 'stale' | 'pending' | 'failed' | 'draft' | 'certified'; asOf: string };
  lineage: { importBatchIds: string[]; calculationRunId?: string; fxReferences: string[]; policyVersions: string[] };
  permissions: { drillDepth: 'summary' | 'fact' | 'restricted' };
}
```

The server resolves entitlement before returning any lineage identifier that could expose restricted existence or content.

## 10. Validation and test requirements

- Golden financial datasets validate metric output across actual/plan/forecast, FX, calendar, adjustment, and rounding boundaries.
- Property tests verify conservation/reconciliation rules where appropriate.
- Snapshot reproduction test returns the same result from frozen versions.
- Negative authorization tests prevent cross-tenant, out-of-entity, and restricted-field lineage disclosure.
- Import substitution/mapping-version tests show changed input creates a new lineage branch.
- Controller/auditor task test verifies an authorized user can trace a published number without engineering assistance.

## 11. Decisions still requiring evidence

- Required retention period and WORM/legal-hold approach by target segment/geography.
- Whether lineage is stored as relational references, an event projection, or an additional graph/read model at scale.
- Exact data classification taxonomy and who owns it.
- Whether source-system document references are stored, linked, or redacted.
- Which published report classes require certification or digital signature.