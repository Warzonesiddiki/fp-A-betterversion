# Vision alignment & connector recheck — 2026-11-02

> This dated recheck supersedes the **current-state conclusions** in
> [`VISION_ALIGNMENT_AUDIT_2026_10_24.md`](VISION_ALIGNMENT_AUDIT_2026_10_24.md).
> The October audit remains unchanged as historical evidence. This document is
> a repository/code audit, not owner acceptance, live-provider certification, or
> a claim that FinPlan Pro is production-ready.

## Executive conclusion

The product's owner-stated destination remains an all-in-one FP&A workspace,
starting with the owner's Dynamics 365 GL workflow. More of that workflow now
has routed code than the October audit reported: exception review, correction
follow-through, and day/month/year comparison pages exist and have focused test
coverage. These facts close the old "no page/consumer" claims, but do **not**
prove the owner's real monthly process, rule thresholds, or D365 data shape.

The integration hub is reachable and has a code path from the catalog through
`integrationStore` into `glStore`. The import path previously read only the
first page and hid skipped/import results; it now follows numeric and cursor
pagination, reports incomplete coverage, and shows import results. Provider
protocol tests are mocked. No live provider account or credentials were used.
Most importantly, the Dynamics connector is for **Dataverse CRM**, not D365
Finance & Operations or Business Central GL, and it does not provide a GL
transaction feed. The owner's real GL sample and control totals remain the
critical product-validation dependency.

## Vision jobs — current code evidence and remaining proof

| Owner job | Current code evidence | What remains unproven |
| --- | --- | --- |
| **J1 — bring the D365 GL dump into one workspace** | CSV/XLSX upload, mapping, validation, provenance, control totals, ledger, trial balance, and statement paths exist. Synthetic D365-shaped fixtures are covered. `/settings/integrations` also supports an explicit connector-to-ledger path for providers whose catalog metadata marks them ledger-importable. | No owner-provided D365 GL file or source-side control totals have been reconciled. Dynamics/Dataverse CRM is not a substitute for F&O/BC GL. No supported connector-to-D365-GL mapping has been live-validated. |
| **J2 — find entries for human review** | `/data/exceptions` runs `runExceptionRules` and `runAggregateRules`; findings are presented as review candidates with evidence, not confirmed errors. | The owner has not accepted the rule corpus/results against a real close cycle. Finding completeness depends on the imported scope and source quality. |
| **J3 — guide the accounts team through corrections** | `/data/corrections` and the correction store support an in-tool, human-controlled request lifecycle, assignment/instructions, event history, and optional Excel export. | The accounts team has not validated a real correction cycle. Re-verification is a cue, not proof that a specific source entry was corrected or that the import scope is complete. |
| **J4 — compare day/month/year in detail** | `/data/comparison` exposes day, month, and year comparison, drill-through to contributing entries, and “not in file” for absent periods rather than treating them as zero. | The owner's detailed review has not been run on an accepted real D365 cycle. The owner-directed rule is to show everything and use tiers for ranking, not suppress differences; real-use fit still needs confirmation. |

Focused regression evidence for J2–J4: `ExceptionQueuePage.test.tsx`,
`CorrectionsPage.test.tsx`, and `ComparisonPage.test.tsx` (3 files / 16 tests).
Passing tests establish the exercised software path, not owner acceptance.

## Connector audit

### Reachability and import path

```text
/settings/integrations
  → IntegrationSettingsPage / IntegrationCard
  → INTEGRATION_CATALOG (provider capability metadata)
  → integrationStore builds the selected connector
  → getAccounts + getTransactions pages
  → buildJournalEntries
  → glStore.importGLData
```

`ConnectorRegistry` is not used on this UI path. The catalog now distinguishes
`syncable` from `ledgerImportable`; CRM/notification connectors without a GL
transaction feed do not show an “Import to ledger” button, and the store also
rejects such a call defensively.

### Data-flow page truthfulness

The `/data/data-flow` page formerly presented unmeasured engine/store/page
counts, listed Salesforce as an ERP connector, and claimed a Sankey diagram
that had already been replaced by a custom flow. It now describes the actual
file-import, connector-import, exception/correction, and comparison/reporting
paths; derives its importable/excluded provider lists from `INTEGRATION_CATALOG`;
and states that the map is illustrative rather than live runtime tracing. Its
regression suite now passes **3/3**. The route remains EXPERIMENTAL; these UI
clarifications do not upgrade its maturity grade.

### Import completeness changes

- The store walks account and transaction pages using either page numbers or
  opaque cursors, deduplicates overlap by source identity, and caps transaction
  imports at 25 accounts. Each feed is bounded at 100 pages; a repeated cursor
  or page cap marks the result incomplete rather than looping or claiming
  success.
- Results include `complete`, `skipped`, omission counts, and whether omission
  counts are exact. The UI announces the provider message and imported/skipped
  row counts. If pagination stalls or the account cap prevents transaction
  reads, an unknown count is represented as `null` and explained to the user.
- A complete account enumeration reports the exact number of accounts excluded
  by the 25-account cap. Transactions for those unqueried accounts are not
  fetched, so their row count is explicitly unknown.
- Stripe follows `has_more` with `starting_after` using the last charge ID;
  Plaid passes `next_cursor` to the next `/transactions/sync` call. Salesforce
  follows its `nextRecordsUrl` as a provider cursor (not as a SOQL `OFFSET`).
  These are test-covered adapter behaviors, not live API proofs.

### Provider boundaries

| Provider | Current ledger-import posture | Important boundary |
| --- | --- | --- |
| QuickBooks Online, Xero, NetSuite, Sage Intacct | Catalog marks transaction feeds ledger-importable; connector methods and pagination exist in code. | No live credentials, sandbox runs, or owner mapping acceptance in this audit. |
| Stripe | Ledger-importable; charge pagination follows Stripe cursors. | Current feed is charges, not a complete accounting ledger or all payment/refund events. No live test. |
| Plaid | Ledger-importable; cursor pagination for added transactions is implemented. | `modified`/`removed` deltas are not applied to GL, and the cursor is not persisted between separate imports; repeated imports rely on ledger duplicate handling. No live Link/account test. |
| Dynamics 365 | Not marked ledger-importable. | This connector targets Dataverse CRM entities; its transaction method is the base empty feed. It is not an F&O or Business Central GL connector. |
| Salesforce | Not marked ledger-importable. | CRM/opportunity functionality; its transaction method is the base empty feed. |
| Slack | Not marked ledger-importable; outbound notification only. | Not a financial transaction source. |

## Route-grade correction — verified breakdown

The completion register now requires exact canonical CONNECTED and GOVERNED
claims, matching route disposition, and the `docs:verify` gate before a route
can be `SUPPORTED`. Current measured register: **709 rows** (227 routes, 180
engines, 19 requirements, 200 annex sections, 83 capabilities); total-row grades
are **115 SUPPORTED, 374 EXPERIMENTAL, 0 BLOCKED-ON-OWNER, 2 RETIRED, and 218
NOT_BUILT**.

At route level, **19/227 are SUPPORTED** and 208 remain EXPERIMENTAL. Canonical
manifests contain 19 CONNECTED and 104 GOVERNED routes, with an intersection of
19: the 85 GOVERNED-only routes and 123 routes with neither CONNECTED nor
GOVERNED evidence account for the 208 experimental routes. A route existing or
rendering is not enough to earn SUPPORTED. This grade correction does not remove
runtime pages, prove provider behavior, or certify the D365 workflow.

## Verification and limits

Focused connector/integration/workflow command — **16 files / 188 tests passed**:

- All 10 connector suites (Base, Dynamics, NetSuite, Plaid, QuickBooks, Sage,
  Salesforce, Slack, Stripe, Xero); `SalesforceConnector.test.ts` is now **15/15**,
  including the cross-origin `nextRecordsUrl` rejection regression.
- `integrationStore.test.ts` — 21/21; `integrations.test.ts` — 8/8;
  `IntegrationSettingsPage.test.tsx` — 7/7.
- Exception/correction/comparison pages — 3 files / 16 tests within the 188.

Branch validation passed `npm run tsc`, `npm run lint`, `npm run format:check`,
and `npm run docs:verify`. The docs gate reports expected legacy-annex warnings:
sections 108–110 unresolved and 93 sections 108–200 SOURCE OWED.

The initial `npm run test:sharded` run returned **17,910 passed, 16 failed,
1 skipped** across eight shards (1,100 seconds). The two DataFlowMap failures
were stale duplicate-heading and removed-Sankey assertions; the map and its tests
now describe actual code paths, derive provider eligibility from the catalog,
and pass **3/3**. The other 14 failing tests were individually triaged and
corrected: stale route counts/aliases, dead-link handling of the wildcard-backed
`/404` destination, smoke fixtures and icon mocks, semantic contrast tokens,
spine classification, and the asynchronous PDF contract. Three suites that
previously failed during module import because their `lucide-react` mocks lacked
icons used by `EmptyState` now execute as part of the run. A final full sharded
run passes **17,937 tests with 1 skipped; 8/8 shards** in 1,105 seconds. The
focused connector/integration/workflow pass remains green at 16 files / 188
tests. No live provider, owner GL sample, D365-side reconciliation,
accounts-team workflow, or native-desktop persistence test was performed. The
production dependency audit measured 15 root production advisories (13
moderate, 2 high) and 2 server high advisories; they remain an open security
maintenance item.

## Next steps, ordered by validation value

1. Obtain the owner's anonymized D365 GL sample(s) and matching source control
   totals; identify the exact F&O/BC export shape and account/entity/currency
   mapping. Do not label a shape verified before a real reconciliation.
2. Validate the exception findings, correction hand-off, and comparison output
   with the owner/accounts team on that same supported cycle.
3. Run sandbox/live-provider acceptance for each connector the owner actually
   wants, including permissions, token lifecycle, source mapping, page limits,
   and duplicate/re-import behavior. Keep CRM/payments/banking evidence separate
   from D365 GL compatibility.
4. Resolve the remaining dependency advisories and legacy-annex source questions
   through their own owners and evidence gates.

---

## Documentation and importer follow-up — 2026-11-04 addendum

This file remains the dated **2026-11-02 code/connector audit**, not product
strategy. The owner’s 2026-11-04 direction broadens the north-star to one-stop
all-in-one FP&A, user-customizable intake for any accounting ERP, and
all-industry extensibility. DEC-033 and DEC-104 already establish the all-FP&A
scope and universal user-template import direction. The detailed proposed
architecture, phased execution, evidence gates and owner questions are in
[`MASTER_PRODUCT_AND_EXECUTION_PLAN.md`](MASTER_PRODUCT_AND_EXECUTION_PLAN.md);
they do not certify current capabilities.

Repository follow-up confirmed two separate import experiences: the live
`GLUploadPage` calls `parseGLRows` and persists simple header-signature mapping
profiles in `glUploadStore`; `universalImportTemplate.ts` /
`universalImportEngine.ts` have governance tests but the page does not call the
engine's parse/auto-detect entry points. The completion register marks
`cap:data.universal-import` SUPPORTED, while the generated capability matrix's
static service inventory says “BUILT — TEST NOT FOUND.” Phase 1 must reconcile
the actual callers, converge the user journey and update the matrix generator;
this audit does not edit generated output or call the paths a completed
end-to-end feature.

The full frontend suite was rerun on **2026-11-04**: `npm run test:sharded`,
8/8 shards, 17,937 passed, 1 skipped. The TypeScript, lint, format, docs and
diff-whitespace checks also passed in the current workspace. These local checks
do not change the no-live-provider, no-owner-data, no-native-desktop and
no-owner-accepted-workflow limitations above.
