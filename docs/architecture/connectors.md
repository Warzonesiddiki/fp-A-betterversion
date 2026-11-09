# API connectors architecture

## Current status — rechecked 2026-11-02

The connector framework is reachable from the Integrations settings route. The
current UI path is:

```text
/settings/integrations
  → IntegrationSettingsPage / IntegrationCard
  → INTEGRATION_CATALOG
  → integrationStore builds the selected connector
  → getAccounts / getTransactions
  → buildJournalEntries
  → glStore.importGLData
```

`ConnectorRegistry` exists, but this settings/import path does **not** use it.
The catalog is the factory for the UI path. Connector methods and the ledger
store path are covered by mocked/unit tests; no provider credentials or live
account were used for the 2026-11-02 audit. Reachability is not live-provider
compatibility or D365 GL verification.

## Framework

### `BaseConnector.ts`

Provides the common connection lifecycle and status behavior. Provider classes
implement the API methods they support, including `getAccounts` and
`getTransactions`; inheriting the base implementation does not mean a connector
has a real transaction feed (the base transaction method returns an empty page).

### `INTEGRATION_CATALOG` (`src/config/integrations.ts`)

Maps UI credential fields to a provider configuration and connector factory.
Two flags are intentionally distinct:

- `syncable`: the connector supports a pull/push sync operation in the UI.
- `ledgerImportable`: the connector exposes a transaction feed the app permits
  importing into the GL ledger. CRM and notification connectors without that
  feed do not show an “Import to ledger” button; the store rejects direct calls
  too.

Credentials are kept in the app's local storage layer. A user must explicitly
connect, test, sync, or import before provider requests are made. This does not
mean every authentication flow is complete: some OAuth-capable providers accept
a pasted access token, and a full redirect/callback flow is not implemented.

### `RestApiClient.ts`

Shared HTTP support for connectors that use it, including auth injection,
configured retries, and typed responses. Not every provider uses this client:
Plaid has a provider-specific `fetch` request because it needs both
`PLAID-CLIENT-ID` and `PLAID-SECRET`; other provider-specific HTTP details remain
inside their connector classes.

## Provider inventory and ledger-import posture

| Provider | Implemented domain | Ledger import | Scope note |
| --- | --- | --- | --- |
| QuickBooks Online | Accounting | Yes | Account/transaction connector methods exist; no live test in this audit. |
| Xero | Accounting | Yes | Account/transaction connector methods exist; no live test in this audit. |
| NetSuite | ERP | Yes | Account/transaction connector methods exist; no live test in this audit. |
| Sage Intacct | ERP | Yes | Intacct API connector; no live test in this audit. |
| Microsoft Dynamics 365 | Dataverse CRM | **No** | Accounts, contacts, invoices, products, opportunities; not D365 Finance & Operations or Business Central GL, and no transaction-feed override. |
| Salesforce | CRM | **No** | Accounts/opportunities and pipeline data; no transaction-feed override. |
| Stripe | Payments/charges | Yes | Imports charges; it is not a complete accounting ledger or all payment/refund events. |
| Plaid | Banking | Yes | Imports `added` transactions from `/transactions/sync`; see incremental-sync limits below. |
| Slack | Notifications | **No** | Outbound webhook; not a financial transaction source. |

“Ledger import: Yes” means a connector method is wired to the app's local
import pipeline. It does not mean the provider has been sandbox-tested, the
financial mapping has been accepted, or the feed is complete for the owner's
accounting purpose.

## Ledger import behavior and pagination

`integrationStore.importToLedger` follows numeric pages and opaque continuation
cursors for account and transaction feeds. It deduplicates overlapping pages by
source identity, limits each import to 25 accounts, and limits each feed to 100
pages to protect against unbounded/broken pagination. A repeated cursor or page
limit marks the result incomplete. The result carries `complete`, `skipped`,
omission counts, and `omissionCountsExact`; unknown counts use `null` rather
than an invented zero. `IntegrationCard` displays the message and imported /
skipped row counts with an accessible status or alert.

Provider-specific continuation behavior covered by tests:

- **Stripe:** sends `starting_after` from the last charge ID when `has_more` is
  true.
- **Plaid:** sends the returned `next_cursor` on the next
  `/transactions/sync` request.
- **Salesforce:** follows the server's `nextRecordsUrl`; it is not a SOQL
  `OFFSET` value, and cross-origin continuation URLs are rejected.

If account enumeration completes and exceeds the 25-account cap, the number of
omitted accounts is exact. Transaction rows belonging to those unqueried
accounts are not fetched, so their count is unknown. If any cursor/page chain
stalls, the UI reports incomplete pagination and does not show an exact omitted
row count.

## Known provider limits

- **Plaid** returns `added`, `modified`, and `removed` changes. The current GL
  mapping imports `added` only; it does not apply updates/deletions to prior GL
  rows or persist the sync cursor across separate import clicks. Re-imports rely
  on ledger duplicate handling. This is not a complete incremental-sync
  implementation.
- **Stripe** currently maps charge records only. Refunds, disputes, balance
  transactions, and reconciliation to a Stripe payout/settlement statement need
  explicit coverage before the feed is relied on for accounting completeness.
- **Dynamics** does not implement GL transaction retrieval. Its Dataverse CRM
  API model must not be presented as a D365 F&O or Business Central GL connector.
  The owner's D365 GL export remains a CSV/XLSX workflow pending real sample and
  control-total validation.
- **Salesforce** is a CRM/revenue pipeline connector, not a GL feed.
- Numeric/cursor pagination tests establish adapter behavior against fixtures,
  not provider permissions, rate limits, response drift, tenant-specific setup,
  token expiry, or live data correctness.

## Evidence and next validation

Focused regression pass on 2026-11-02: **16 files / 188 tests**, comprising all 10 connector suites plus the store, catalog, settings page, and exception/correction/comparison page tests. Selected suite counts:

- `src/store/integrationStore.test.ts` — 21 tests.
- `src/services/api-integration/StripeConnector.test.ts` — 9 tests.
- `src/services/api-integration/PlaidConnector.test.ts` — 9 tests.
- `src/services/api-integration/SalesforceConnector.test.ts` — 15 tests, including cross-origin cursor rejection.
- `src/pages/settings/IntegrationSettingsPage.test.tsx` — 7 tests.
- `src/config/integrations.test.ts` — 8 tests.

Next validation requires sandbox credentials for each provider the owner wants
to use, followed by a real anonymized D365 GL sample and matching source control
totals. Do not label a provider or D365 shape “verified” from catalog presence,
mocked tests, or a successful connection health check alone.

## Product direction and proposed strategy — 2026-11-04

DEC-104 already records the owner's decision to support universal accounting/
finance import through the user's own template system. The 2026-11-04 product
direction broadens the north-star to any accounting ERP and all industries; this
is a target, not proof of current support. The recommended execution is **hybrid
and import-contract-first**:

1. The user-mapped CSV/XLSX template path is the baseline coverage mechanism.
   Users map their existing ERP export; they should not have to reshape every
   ERP file to a proprietary layout.
2. Optional native API connectors provide provider-specific convenience when
   prioritized by real usage. They must produce the same canonical rows and use
   the same preview, validation, reconciliation, provenance, duplicate and
   commit controls as file import.
3. A connector never bypasses accounting acceptance because it is official or
   its health check passes. A provider integration's exact product/edition,
   object scope, data completeness and evidence level are recorded separately.
4. The accounting ERP remains upstream/system of record. ERP write-back is out
   of scope unless an explicit owner decision accepts its permissions, audit,
   rollback and security consequences.

### Current universal-import boundary

The product currently has two related but separate paths:

- `GLUploadPage` maps uploaded CSV/XLSX and calls `parseGLRows` directly. It uses
  persisted user mapping profiles in `glUploadStore`, keyed by normalized
  header signature.
- `universalImportTemplate.ts` / `universalImportEngine.ts` implement a richer
  template/parser service and have `universalImportEngine.governance.test.ts`.
  Repository inspection found no call from the upload UI to the engine's parse
  or auto-detect entry points.

Therefore the UI has useful saved mappings and the engine has tested template
logic, but the repo has not yet demonstrated one end-to-end user-customizable
template workflow. Gate 1 in the master plan must inventory callers and either
converge both on one parser/validator/commit authority or document a deliberately
separate use. Preserve DEC-007 whole-file atomicity and the DEC-005 authority
boundary. Reconcile `cap:data.universal-import` completion-register support with
the generated capability matrix/service inventory via its generator; never hand
edit generated output and never equate engine tests with user-facing integration.

### Provider evidence ladder

Assign evidence at the level of a **specific provider product/edition, object,
workflow and deployment**:

| Level | Meaning | Minimum evidence |
|---|---|---|
| Catalogued | UI lists the provider/capability. | Catalog metadata and clear limitation text. |
| Implemented | Adapter code exists and has a runtime caller. | Call graph and typed contract; code presence alone is not enough. |
| Unit tested | Adapter behavior is deterministic under controlled responses. | Tests for mapping, pages/cursors, failure and omission behavior. |
| Sandbox validated | Provider API protocol has been exercised. | Real sandbox tenant, auth/scopes, limits, retries, expiration and version behavior. |
| Source reconciled | Mapped records are complete and correct for a stated accounting purpose. | Source-side controls, update/delete/reversal handling, row lineage and independent tie-out. |
| Owner accepted | The real user confirms scope and usability. | Owner-approved source/configuration and workflow sign-off. |
| Production supported | The chosen deployment is recoverable and operationally maintained. | Security, support, monitoring/redaction, backups, rollback and incident runbook. |

Do not collapse these levels into a single “connected/supported” badge. “Ledger
importable” in `INTEGRATION_CATALOG` describes the current code's import
eligibility, not the later evidence levels.

### Minimum provider acceptance checklist

Before advertising a provider as a supported source, record and test:

- exact accounting/ERP product, edition, API version, endpoint, data object and
  the accounting meaning of its records (GL postings vs bank/payment events vs
  CRM/operational context);
- least-privilege scopes, consent, token lifecycle/revocation, approved secret
  storage, log redaction, user-initiated network access and data-egress boundary;
- pagination/cursors, duplicate/overlapping pages, rate limits, retry/backoff,
  resumability, partial results, schema drift and connector cancellation;
- stable source IDs, updates, deletions, reversals, overlapping periods,
  idempotent reimports and recovery from interrupted sync;
- mapping and template version, all returned/skipped/omitted/unknown rows,
  source controls (or why none exist), canonical accounting semantics and
  independent reconciliation;
- sandbox and owner evidence, supported configuration, limitations, upgrade
  policy and rollback/recovery instructions.

A bank feed or payments export is supplemental unless it contains and reconciles
the full accounting facts needed by the owner's use case. For example, the
current Stripe charge mapping and Plaid `added`-only import must not be described
as a complete ERP GL feed. The catalog, provider inventory and limitations above
remain the current code audit; execution priority is owner review under the
master product plan.
