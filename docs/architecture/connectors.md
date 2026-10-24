# API Connectors Architecture

## Overview

FinPlan Pro integrates with external ERP, accounting, and financial systems via a
connector framework built on `src/services/api-integration/`. The framework provides
a shared lifecycle (connect, sync, health-check, disconnect), OAuth 2.0 authentication,
retry with exponential backoff, and strict schema validation.

The connector framework is **implemented and tested** but **not yet wired to real
data sources** — wiring requires the owner's D365 export samples (O1) or equivalent
authenticated connections. All connector classes exist with unit tests; no connector
is reachable from a routed page for live data import.

## Architecture

### BaseConnector (`BaseConnector.ts`)

Abstract base class for all connectors. Provides:

- **Lifecycle**: `connect()`, `sync()`, `healthCheck()`, `disconnect()`
- **Authentication**: OAuth 2.0 token management with automatic refresh
- **HTTP client**: Shared `RestApiClient` with retry (configurable count + delay)
- **Status tracking**: `ConnectorStatus` (disconnected → connecting → connected → error)
- **Sync tracking**: `lastSyncAt`, `lastError`, `syncResult`

Each connector implements `fetchAccounts()`, `fetchTransactions()`, `fetchBudgets()`,
and `fetchInvoices()` using the provider's API shapes.

### ConnectorRegistry (`ConnectorRegistry.ts`)

Factory + instance manager:

- `registerFactory(provider, factory)` — register a connector class
- `createConnector(config)` — instantiate by provider name
- `getConnector(id)`, `disconnect(id)`, `listConnectors()`
- `getRegisteredProviders()` — list available connector types

### RestApiClient (`RestApiClient.ts`)

HTTP client with:

- **Retry**: Exponential backoff (configurable count + delay)
- **Rate limiting**: Respects `X-RateLimit-*` headers
- **Circuit breaker**: Trips on consecutive failures, resets after cooldown
- **Auth**: OAuth 2.0 bearer token injection
- **Validation**: Response shape checking before returning data

### GhostShaValidator (`GhostShaValidator.ts`)

Security feature that detects "ghost SHAs" — hexadecimal strings claimed to be git
commit SHAs in API responses or verdict objects that do not exist in `git log`. This
is an evidence-fabrication guard (CWE-345): it validates SHA format, checks against a
known-SHA set, and recursively scans objects for `commit_sha`/`gitSha`/`sha` fields.

## Connectors

| Connector | File | Status | Purpose |
|-----------|------|--------|---------|
| QuickBooks | `QuickBooksConnector.ts` | Implemented + tested | Intuit QuickBooks Online accounting |
| NetSuite | `NetSuiteConnector.ts` | Implemented + tested | Oracle NetSuite ERP |
| Xero | `XeroConnector.ts` | Implemented + tested | Xero cloud accounting |
| Sage | `SageConnector.ts` | Implemented + tested | Sage Intacct / Sage 50 |
| Dynamics | `DynamicsConnector.ts` | Implemented + tested | Microsoft Dynamics 365 (BC + F&O) |
| Salesforce | `SalesforceConnector.ts` | Implemented + tested | Salesforce CRM data |
| Stripe | `StripeConnector.ts` | Implemented + tested | Stripe payment data |
| Plaid | `PlaidConnector.ts` | Implemented + tested | Plaid bank data aggregation |
| Slack | `SlackConnector.ts` | Implemented + tested | Slack notifications |

All connectors inherit from `BaseConnector` and use `RestApiClient` for HTTP. Each
has unit tests covering connection, sync, error handling, and money-safe arithmetic
(`*.money.test.ts` for Dynamics and QuickBooks).

## Security & Reliability

- **OAuth 2.0 / Token Rotation**: Secure credential management with automatic token
  refresh. Tokens are held in memory (not persisted to disk) — restart disconnects.
- **Circuit Breaker**: Automatic tripping on upstream failures to prevent cascading
  latency or connection exhaustion. Resets after a cooldown period.
- **Retry with Exponential Backoff**: Configurable retry count and delay per connector.
- **Idempotency & Validation**: Strict schema validation on ingested financial records.
  Money amounts use the decimal.js money primitive (`@/utils/money`).
- **Ghost SHA Detection**: Evidence-fabrication guard for API responses containing
  claimed git commit SHAs.
- **No egress by default**: Connectors are not reachable from any routed page. The
  Integrations hub (`/settings/integrations`) shows connector management UI, but no
  live data flows without explicit owner configuration.

## Current Status

| Aspect | Status |
|--------|--------|
| Connector classes | 9 connectors implemented |
| Unit tests | All connectors have tests (including money-safe arithmetic) |
| RestApiClient | Implemented + tested (retry, circuit breaker, rate limiting) |
| ConnectorRegistry | Implemented + tested |
| GhostShaValidator | Implemented + tested |
| Wired to real pages | **None** — no live data flow |
| D365 verified export | **BLOCKED-ON-OWNER O1** — needs real anonymised export samples |
| Native desktop persistence | **BLOCKED-ON-OWNER O7** — needs Tauri build verification |

## Path to Wiring

Wiring a connector to a real data source requires:

1. **Owner decision O1**: Provide one real anonymised D365 export per shape (F&O GL,
   journal entity, BC G/L) plus control totals, OR confirm the connector shape is correct.
2. **Page wiring**: Create a page or route that instantiates the connector via
   `ConnectorRegistry.createConnector(config)`, calls `connect()`, then `sync()`.
3. **Data ingestion**: Map connector output to `glStore` (or appropriate store) with
   provenance and control-total reconciliation (DEC-007: abort on any parse rejection).
4. **Governance tests**: Add RBAC guards, audit chain verification, and period-close
   guards for the new data path.
5. **Money safety**: All ingested amounts must use the money primitive; add a
   `*.money.test.ts` with exact expected values.
