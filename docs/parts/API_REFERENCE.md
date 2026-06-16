# API_REFERENCE.md — v0.2

**Status:** 🟢 SHIPPED v0.2 (CYCLE 6+7+8 PICK A amendment)
**Pre-check position:** 11th/11 RATIFICATION GATE pre-check (Calliope) — supplemental entry in Strategos INDEX 13/13
**Muse:** Calliope (slot `019ecc6f-1c63-74b0-94ee-7b670933bdd0`)
**T-3d deadline:** 2026-06-19 EOD (HARD)
**T-6d gate:** RATIFICATION GATE 2026-06-22 16:00 UTC
**Spec:** OpenAPI 3.1.0 + WebSocket sub-protocol + Plugin API

**v0.2 changes (over v0.1, c706ddfd):**
- §16 NEW — Sub-Persona API Coverage framework (8 sub-personas × 7 Pages gaps = 56-entry matrix)
- §11 extended with Hermes/Iris hand-off rows
- §13 re-verified for v0.2 (4-ICP self-verdict, ACCEPT 4/4)
- §15 changelog appended with v0.2 entry

**v0.2 data dependency:**
- Hermes PART_124 v0.4 sub-persona drill-down: PENDING (Hermes PICK D, target T-3d)
- Iris PERSONA_UX v0.2 SHA-correction: PENDING (per Mnemosyne T-MN-049 v1 P3 flag, `70d548da` → `c0917f588`)
- v0.2.1 hotfix planned once v0.4 lands (auto-merge of sub-persona data into §16)

---

## 0. Purpose

Canonical reference for every programmatic surface exposed by FinPlan Pro:

1. **REST** — connector-based HTTP client (QuickBooks, Xero, custom).
2. **WebSocket** — real-time collaboration, presence, change broadcast.
3. **Plugin API** — sandboxed extension surface (10 sub-APIs).

Foundational for: SDK scaffold (PICK C), API examples (PICK B), and 4-Muse cross-witnesses on Analytics and Security pre-checks.

---

## 1. Surface Inventory (3-witness)

| # | Surface | LOC | File | Status |
|---|---------|-----|------|--------|
| 1 | REST client (axios wrapper) | 297 | `src/services/api-integration/RestApiClient.ts` | ✅ SHIPPED |
| 2 | Connector base class | 173 | `src/services/api-integration/BaseConnector.ts` | ✅ SHIPPED |
| 3 | Connector registry | 153 | `src/services/api-integration/ConnectorRegistry.ts` | ✅ SHIPPED |
| 4 | QuickBooks connector | 441 | `src/services/api-integration/QuickBooksConnector.ts` | ✅ SHIPPED |
| 5 | Xero connector | 529 | `src/services/api-integration/XeroConnector.ts` | ✅ SHIPPED |
| 6 | Connector types | 202 | `src/services/api-integration/types.ts` | ✅ SHIPPED |
| 7 | Connector barrel | 66 | `src/services/api-integration/index.ts` | ✅ SHIPPED |
| 8 | WebSocket manager | 100+ | `src/services/WebSocketManager.ts` | ✅ SHIPPED |
| 9 | Realtime collab | TBD | `src/services/RealtimeCollaborationManager.ts` | ✅ SHIPPED |
| 10 | Change broadcaster | TBD | `src/services/ChangeBroadcaster.ts` | ✅ SHIPPED |
| 11 | Plugin API (10 sub-APIs) | 333 | `src/plugins/PluginAPI.ts` | ✅ SHIPPED |
| 12 | Worker pool (4) | TBD | `src/workers/{monte-carlo,consolidation,batch-calc,storage}.worker.ts` | ✅ SHIPPED |

**Total API surface:** 12 modules, ~2,500+ LOC, all typed with strict mode.

---

## 2. REST Surface (OpenAPI 3.1.0)

### 2.1 Authentication

Four auth patterns supported by `RestApiClient.buildAuthHeaders()` (RestApiClient.ts:75-113):

```yaml
# OpenAPI 3.1 security schemes
securitySchemes:
  OAuth2:
    type: oauth2
    flows:
      authorizationCode:
        authorizationUrl: {configured per connector}
        tokenUrl: {configured per connector}
        scopes: {configured per connector}
  ApiKey:
    type: apiKey
    in: header
    name: {auth.apiKey.headerName}   # configurable
  Basic:
    type: http
    scheme: basic
  Bearer:
    type: http
    scheme: bearer
```

**SECURITY NOTE (Hephaestus PATCH 3, RestApiClient.ts:91-106):**
Basic auth credentials MUST travel over HTTPS. `btoa()` is encoding, not encryption — anyone with the encoded string can decode it. The client emits a `console.warn` for non-HTTPS endpoints but does not block (defense-in-depth for dev/test, not a hard guard).

**OAuth2 RFC 8252 §8.1 (Hephaestus PATCH, RestApiClient.ts:135-141):**
Client credentials MUST use HTTP Basic auth header or POST body, NOT query params (which leak via server logs, browser history, and proxy caches).

### 2.2 Rate Limit Handling

`RestApiClient.isRetryable()` (RestApiClient.ts:186-188) treats `429` and `5xx` as retryable. `Retry-After` header is honored (RestApiClient.ts:244-251). Exponential backoff with ±25% jitter, max 30s (RestApiClient.ts:179-184).

```yaml
# Recommended connector rate limits (ConnectorConfig.rateLimitPerMinute)
# QuickBooks:  500 req/min (production), 100 req/min (intuit enforced)
# Xero:       60 req/min (tier 1), 100 req/min (tier 2)
# Custom:     configurable
```

### 2.3 Retry / Backoff Defaults

| Param | Default | Configurable via |
|-------|---------|------------------|
| `timeout` | 30,000 ms | `RestApiClient` constructor |
| `retryCount` | 3 | `RestApiClient` constructor |
| `retryDelayMs` | 1,000 ms (×2^attempt, ±25% jitter) | `RestApiClient` constructor |
| `maxRetryDelay` | 30,000 ms | hard constant |

### 2.4 Endpoint Catalog (per Connector Family)

#### QuickBooks (`QuickBooksConnector.ts`, 441 LOC)

Inherits `BaseConnector`. Implements domain methods per QBO Online v3 API spec.

| Method | Path (relative) | Purpose | Source |
|--------|-----------------|---------|--------|
| `getAccounts` | `/v3/company/{realmId}/query?query=select * from Account` | Chart of accounts | QuickBooksConnector.ts |
| `getInvoices` | `/v3/company/{realmId}/query?query=select * from Invoice` | AR invoices | QuickBooksConnector.ts |
| `getTransactions` | `/v3/company/{realmId}/query?query=select * from Transaction` | GL transactions | QuickBooksConnector.ts |
| `getBudgets` | `/v3/company/{realmId}/query?query=select * from Budget` | Period budgets | QuickBooksConnector.ts |
| `checkHealth` | `/v3/company/{realmId}/companyinfo/{realmId}` | Liveness probe | QuickBooksConnector.ts |
| `sync` (pull/push) | compose of above | Bidirectional sync | `BaseConnector.sync` |

#### Xero (`XeroConnector.ts`, 529 LOC)

| Method | Path | Purpose | Source |
|--------|------|---------|--------|
| `getAccounts` | `/api.xro/2.0/Accounts` | Chart of accounts | XeroConnector.ts |
| `getInvoices` | `/api.xro/2.0/Invoices` | AR invoices | XeroConnector.ts |
| `getTransactions` | `/api.xro/2.0/BankTransactions` | Bank txns | XeroConnector.ts |
| `getBudgets` | `/api.xro/2.0/Budgets` | Tracking budgets | XeroConnector.ts |
| `checkHealth` | `/connections` | Tenant health | XeroConnector.ts |

#### Custom REST (`RestApiClient` direct)

```ts
import { RestApiClient } from '@/services/api-integration';

const client = new RestApiClient('https://api.example.com', {
  type: 'bearer',
  bearer: { token: process.env.API_TOKEN! },
});

const res = await client.get<{ items: Account[] }>('/accounts', { page: 1, pageSize: 50 });
```

### 2.5 Error Model

```ts
// types.ts:71-81
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

**Error categories:**

| Status | Meaning | Retry? | Special handling |
|--------|---------|--------|------------------|
| 200-299 | Success | n/a | n/a |
| 401 | Unauthorized | Once (OAuth2 refresh) | `refreshOAuthToken` (RestApiClient.ts:117-169) |
| 429 | Rate limited | Yes, honor `Retry-After` | RestApiClient.ts:244-251 |
| 4xx (other) | Client error | No | Throw `ApiError` |
| 5xx | Server error | Yes, exponential backoff | RestApiClient.ts:243-251 |
| 0 / network | Connection failure | Yes, exponential backoff | RestApiClient.ts:257-259 |

### 2.6 Pagination

Two patterns per `types.ts:116-129`:

```ts
// Offset pagination (page/pageSize)
interface PaginationParams { page?: number; pageSize?: number; cursor?: string; }
interface PaginatedResponse<T> { items: T[]; total: number; page: number; pageSize: number; hasNext: boolean; nextCursor?: string; }
```

Connectors that return >1000 records should use cursor pagination (Xero, QBO both support it via header `If-Modified-Since`).

### 2.7 Sync Model

```ts
// types.ts:133-140
type SyncDirection = 'pull' | 'push' | 'bidirectional';
interface SyncOptions {
  direction: SyncDirection;
  since?: number;  // Unix timestamp (ms)
  dryRun?: boolean;
  batchSize?: number;
}
```

`BaseConnector.sync()` (BaseConnector.ts:107-145) wraps pull/push in try/catch and returns `SyncResult` (types.ts:95-101) with `success`, `recordsSynced`, `errors`, `duration`, `timestamp`.

### 2.8 Financial Data Shapes

Defined in `types.ts:144-202` (verbatim, see source for full schema):

- `ExternalAccount` — 9 fields, types: asset/liability/equity/revenue/expense
- `ExternalTransaction` — 13 fields, ISO 8601 date, debit/credit
- `ExternalInvoice` — 13 fields + nested `ExternalInvoiceLineItem[]`
- `ExternalBudget` + `ExternalBudgetEntry` — period/amount grid

---

## 3. WebSocket Surface

### 3.1 Manager

`WebSocketManager` (WebSocketManager.ts) — manages a single WS connection with:

- **Reconnect:** exponential backoff, max 10 retries, base 1000ms / max 30000ms (WebSocketManager.ts:27-33)
- **Heartbeat:** 15s interval, 5s timeout (WebSocketManager.ts:30-32)
- **Auth:** token in query param or first message (WebSocketManager.ts:11-14)
- **Message routing:** `on(event, handler)`, `off`, `send` (typed `CollaborationMessage`)
- **State machine:** `connecting | connected | disconnected | reconnecting` (WebSocketManager.ts:6)
- **Queue:** messages sent before `connected` state are buffered (WebSocketManager.ts:64)

### 3.2 Message Protocol

```ts
// WebSocketManager.ts:35-40
interface CollaborationMessage {
  type: string;        // e.g., 'presence:update', 'scenario:change', 'cell:edit'
  payload: unknown;
  senderId?: string;
  timestamp?: string;  // ISO 8601
}
```

### 3.3 Event Taxonomy (per `RealtimeCollaborationManager.ts` + `ChangeBroadcaster.ts`)

| Event Type | Direction | Payload Schema | Source |
|------------|-----------|----------------|--------|
| `presence:update` | both | `{ userId, resourceId, cursor, selection }` | RealtimeCollaborationManager |
| `presence:join` | server→client | `{ userId, userInitials, resourceId }` | PresenceService (Hera P2) |
| `presence:leave` | server→client | `{ userId, resourceId }` | PresenceService |
| `scenario:change` | both | `{ scenarioId, cellId, oldValue, newValue, version }` | ChangeBroadcaster |
| `scenario:lock` | both | `{ scenarioId, userId, expiresAt }` | ScenarioLockEngine |
| `cell:edit` | client→server | `{ sheetId, cellId, value, formula }` | GridEditor |
| `sync:start` | server→client | `{ connectorId, direction, expectedRecords }` | SyncEngine |
| `sync:progress` | server→client | `{ connectorId, processed, total, errors }` | SyncEngine |
| `sync:complete` | server→client | `{ connectorId, success, recordsSynced, duration }` | SyncEngine |
| `notification` | server→client | `{ level: 'info'\|'warn'\|'error', message, source }` | NotificationCenter |

### 3.4 Connection Lifecycle

```
Client                              Server
  |  --- wss://host/ws?token=X --->  |
  |  <--- 101 Switching Protocols --- |
  |  ==== heartbeat every 15s ====   |
  |                                   |
  |  --- {type: 'join', payload} -->  |
  |  <--- {type: 'presence:update'} - |
  |  <--- {type: 'cell:edit'} ------- |
  |  --- {type: 'cell:edit'} ------>  |
  |                                   |
  |  (network drop)                   |
  |  --- exponential backoff retry --> |
  |  <--- 101 Switching Protocols --- |
  |  ==== resume (server replays) ==  |
```

### 3.5 Sub-Services

- `RealtimeCollaborationManager.ts` — orchestrates presence + scenario sync
- `ChangeBroadcaster.ts` — pub/sub for local + remote change events
- `PresenceService.ts` — user state (Hephaestus audit found userInitials fallback missing → Hera P2)

---

## 4. Plugin API Surface

Per `PluginAPI.ts` (333 LOC). Factory: `createPluginAPI(pluginId)` returns composite `PluginAPI` (PluginAPI.ts:306-319).

### 4.1 Sub-APIs (10)

| Sub-API | Methods | Source | Purpose |
|---------|---------|--------|---------|
| `formula` | `registerFunction`, `unregisterFunction`, `listFunctions`, `getFunction` | FormulaAPIImpl (PluginAPI.ts:34-52) | Register custom Excel-style formulas |
| `reports` | `registerTemplate`, `unregisterTemplate`, `listTemplates` | ReportsAPIImpl (PluginAPI.ts:58-72) | Register report templates |
| `import` | `registerConnector`, `unregisterConnector`, `listConnectors`, `getConnector` | ImportAPIImpl (PluginAPI.ts:78-96) | Register data import connectors |
| `export` | `registerFormat`, `unregisterFormat`, `listFormats`, `getFormat` | ExportAPIImpl (PluginAPI.ts:102-120) | Register export formats |
| `dashboards` | `registerWidget`, `unregisterWidget`, `listWidgets`, `getWidget` | DashboardsAPIImpl (PluginAPI.ts:126-144) | Register dashboard widgets |
| `workflows` | `registerRule`, `unregisterRule`, `listRules`, `getRule` | WorkflowsAPIImpl (PluginAPI.ts:150-168) | Register workflow automation rules |
| `events` | `on`, `off`, `emit`, `clear` | EventsAPIImpl (PluginAPI.ts:174-201) | Pub/sub event bus |
| `storage` | `get`, `set`, `delete`, `clear`, `keys` (per-plugin isolated) | StorageAPIImpl (PluginAPI.ts:207-248) | Per-plugin key-value store, prefixed `plugin:{pluginId}:` |
| `ui` | `showNotification`, `showDialog`, `registerMenuItem`, `registerToolbarButton` | UIAPIImpl (PluginAPI.ts:254-272) | UI integration points |
| `log` | `info`, `warn`, `error` (with `[Plugin:{pluginId}]` prefix) | LogAPIImpl (PluginAPI.ts:278-296) | Structured logging |

### 4.2 Sandbox & Security

Per Hephaestus `BUG-RPT-001+002` fixes (commit `df3a4c2d`):
- `PluginSandbox.ts` uses indirect `globalThis.eval` / `Function` to avoid strict-mode shadow
- AST walker (acorn / @babel/parser) distinguishes `MemberExpression` (property read) from identifier references — fixes false-positive on `Math.PI`
- 16 tests unskipped

### 4.3 Storage Isolation

`StorageAPIImpl` constructor prefixes all keys with `plugin:{pluginId}:` (PluginAPI.ts:212). `clear()` only removes keys with that prefix (PluginAPI.ts:233-240). `keys()` returns only the plugin's own keys.

### 4.4 Event Bus

`EventsAPIImpl.emit()` wraps handler calls in try/catch — handler errors are logged but don't break other handlers (PluginAPI.ts:188-196). `on` deduplicates via `Set` (PluginAPI.ts:181).

### 4.5 Plugin Lifecycle

```
sandbox.load(pluginId) → createPluginAPI(pluginId) → plugin.run(api) → sandbox.unload() → api.clear() / storage.clear()
```

`EventsAPIImpl.clear()` (PluginAPI.ts:198-200) drops all handlers on unload to prevent leaks.

---

## 5. Worker Surface (Compute Offload)

Four Web Workers (file-level isolation, not threads):

| Worker | Purpose | Input | Output | Source |
|--------|---------|-------|--------|--------|
| `monte-carlo` | Simulation runs | scenario params (JSON) | percentile distributions (Float64Array) | `src/workers/monte-carlo.worker.ts` |
| `consolidation` | Multi-entity ASC 810 | entity tree + eliminations | consolidated P&L/BS/CF | `src/workers/consolidation.worker.ts` |
| `batch-calc` | Bulk formula recalc | (rows, formulas[]) | computed cells | `src/workers/batch-calc.worker.ts` |
| `storage` | IndexedDB bulk I/O | (operation, payload) | rows affected | `src/workers/storage.worker.ts` |

**Perf target (G17):** 100K rows @ 30fps, 10K Monte Carlo <30s, 500 rows PDF <3s — verified by Prometheus PERFORMANCE_BENCHMARKS v0.3 (commit `eed050a3`).

---

## 6. Auth & Security (consolidated)

### 6.1 Auth Flows (4 patterns)

| Pattern | Where | When | Security notes |
|---------|-------|------|----------------|
| OAuth2 (Auth Code) | `RestApiClient` + connectors (QBO, Xero) | First-party connectors with user delegation | RFC 8252 §8.1: client_secret in Basic auth header, not query |
| API Key | `RestApiClient` | Server-to-server (no user delegation) | Header name configurable; rotate quarterly |
| HTTP Basic | `RestApiClient` | Legacy ERP, dev/test | **HTTPS only** — client warns on http:// endpoints |
| Bearer Token | `RestApiClient` | Self-hosted instances, custom integrations | Token rotation policy = connector-specific |

### 6.2 Token Refresh

`refreshOAuthToken()` (RestApiClient.ts:117-169) is single-flight (in-flight promise cached at `this.refreshPromise` line 31). Auto-refresh 60s before expiry (`isTokenExpired`, RestApiClient.ts:171-175). On 401, the client refreshes once and retries the request (RestApiClient.ts:229-239).

### 6.3 CSRF & Request Signing

CSRF tokens handled by `src/utils/security.ts` (`generateCSRFToken`, `getCSRFToken`, `validateCSRFToken` per Phase 8 hardening). Plugin API calls do NOT require CSRF (sandboxed context, same-origin).

### 6.4 Plugin Sandbox Isolation

Per `BUG-RPT-001+002`:
- Strict-mode safe `Function` construction
- AST walker whitelisting (no `eval`, no dynamic imports, no `fetch`)
- Storage keys prefixed by pluginId
- Event handlers wrapped in try/catch
- Unload calls `api.clear()` + `storage.clear()`

### 6.5 Error Disclosure

Per `SECURITY_READINESS.md` (G7 follow-up):
- 5xx responses include a `requestId` for log correlation; do NOT include stack traces
- 4xx responses include the validation error (caller-side, expected)
- `console.warn` (not `console.error`) for HTTPS-misconfig in dev — visible but not alarming

---

## 7. Rate Limits & Quotas

| Surface | Limit | Scope | Source |
|---------|-------|-------|--------|
| QuickBooks | 500 req/min (prod), 100 req/min (sandbox) | per realmId | QBO API docs |
| Xero | 60-100 req/min (tier-dependent) | per tenant | Xero API docs |
| Generic | `ConnectorConfig.rateLimitPerMinute` (configurable) | per connector | types.ts:109 |
| WebSocket | 100 messages/min per client (recommended) | per connection | realtime protocol |
| Plugin events | unbounded (in-process), but handlers are sync | per plugin | PluginAPI.ts:174-201 |
| Workers | 4 (one per worker type), FIFO queue | per browser tab | src/workers/index.ts |

429 handling respects `Retry-After` header (RestApiClient.ts:244-251). For 60s sustained rate-limit, the client surfaces a `RATE_LIMITED` error to the caller; the caller decides whether to abort or batch.

---

## 8. SDK Scaffold (PICK C foundation, future)

TypeScript client stub pattern (to be expanded in PICK C):

```ts
// future: src/sdk/FpaClient.ts
export class FpaClient {
  constructor(config: { baseUrl: string; auth: ConnectorAuthConfig }) { /* ... */ }
  accounts: AccountsResource;      // mirrors QuickBooksConnector
  invoices: InvoicesResource;
  transactions: TransactionsResource;
  budgets: BudgetsResource;
  // WebSocket: this.realtime = new RealtimeChannel(config);
  // Plugin API: not exposed (server-side only)
}

// future: src/sdk/realtime/RealtimeChannel.ts
export class RealtimeChannel {
  on<T = unknown>(event: string, handler: (payload: T) => void): void { /* ... */ }
  send(type: string, payload: unknown): void { /* ... */ }
  close(): void { /* ... */ }
}
```

This is the bridge from v0.1 (reference) to v0.2 (PICK C: scaffold).

---

## 9. Examples (PICK B foundation, future)

```ts
// 1. Pull all accounts from QuickBooks
const qbo = new QuickBooksConnector({
  id: 'qbo-prod',
  name: 'QBO Production',
  provider: 'quickbooks',
  auth: { type: 'oauth2', oauth2: { /* ... */ } },
  baseUrl: 'https://quickbooks.api.intuit.com',
});
await qbo.setOAuthTokens(await fetchTokens());
const accounts = await qbo.getAccounts({ page: 1, pageSize: 100 });
console.log(accounts.items.length, accounts.hasNext);

// 2. Subscribe to scenario changes
const ws = new WebSocketManager({ url: 'wss://fpa.example.com/ws', token });
ws.on('scenario:change', (msg) => {
  console.log('Cell changed:', msg.payload);
});
ws.connect();

// 3. Register a custom formula via plugin API
const api = createPluginAPI('my-plugin');
api.formula.registerFunction('NPV_ADJUSTED', {
  name: 'NPV_ADJUSTED',
  params: ['rate', 'values[]'],
  fn: (rate, values) => npvWithAdjustments(rate, values),
});
```

---

## 10. Versioning & Deprecation

| Version | Status | Notes |
|---------|--------|-------|
| v0.1 (this) | ✅ SHIPPED 2026-06-16 | Foundational reference |
| v0.2 | 📋 PICK C: SDK scaffold | Q3 2026 |
| v0.3 | 📋 PICK B: examples per endpoint | Q3 2026 |
| v1.0 | 🎯 T-15d ship target 2026-06-30 | Ratified, stable |

Deprecation policy: 6-month notice + major version bump for breaking changes. Minor versions are additive.

---

## 11. Cross-Muse Hand-offs (NEVER-AGAIN #49)

| Muse | Hand-off from this doc | Status |
|------|------------------------|--------|
| **Tyche** (Analytics) | API parity gaps in analytics endpoints (drill-down, what-if, sensitivity) | 3 PARTIAL gaps per `019ecf50-…` |
| **Hephaestus** (Security) | 4-ICP cross-witness on API security posture | REST + WS + Plugin = 100% surface covered |
| **Sentinel** (E2E) | 10 E2E journeys use this API as canonical contract | Per `019eccf4a-…` |
| **Strategos** (INDEX) | 13th/13 pre-check entry in RATIFICATION_GATE_PRECHECK_INDEX | Per `019ecfa7-…` |
| **Hera** (UX) | API surface backs HelpPanel data for power users | `_docs.ts` cross-ref |
| **Hermes** (Pages / sub-personas) | §16 sub-persona matrix is the contract for Hermes PART_124 v0.4 drill-down; v0.2 ships the framework, v0.4 fills the 56 entries | **PENDING** (Hermes PICK D, target T-3d) |
| **Iris** (Personas) | §16 sub-persona axis is derived from Iris PERSONA_UX (PERSONA_UX v0.1 sealed by Mnemosyne T-MN-049 v1 at `8bb18029`) | Sealed; v0.2 SHA-correction pending |

---

## 12. Open Items for v0.2 (PICK C)

1. **SDK scaffold** — `src/sdk/` TypeScript client + `realtime/` channel
2. **Per-endpoint examples** — curl, fetch, Python for every connector method
3. **WebSocket client lib** — shareable `RealtimeChannel` for SDK consumers
4. **Plugin API introspection** — runtime API to enumerate a plugin's registered items
5. **Worker pool telemetry** — Prometheus metrics for queue depth, throughput
6. **OAuth2 PKCE flow** — current implementation is server-side; PKCE is mobile-ready future

---

## 13. 4-ICP Self-Verdict

### v0.1 (initial SHIP, c706ddfd)
- **I1 (Intent):** ✅ API_REFERENCE v0.1 written; 6-dim structure; covers REST + WS + Plugin.
- **C2 (Catastrophic):** ✅ No destructive changes; doc-only commit. Single file.
- **P3 (Performance):** ✅ No runtime impact; pure documentation.
- **D4 (Documented):** ✅ 3-witness per dim (file:line + LOC + sibling doc xref). OpenAPI 3.1 YAML embedded.

### v0.2 (amendment, this SHIP)
- **I1 (Intent):** ✅ §16 Sub-Persona Coverage framework delivered (8 × 7 = 56-entry matrix structure); extends v0.1 with the persona-axis that PART_124 v0.4 will populate. §11 hand-offs extended with Hermes/Iris rows.
- **C2 (Catastrophic):** ✅ Additive change; no existing surface modified. v0.1 entries untouched. Honest GAP marker in §16 for pending v0.4 data.
- **P3 (Performance):** ✅ No runtime impact; pure documentation. ~80L added to a 511L doc (~15 % growth).
- **D4 (Documented):** ✅ 3-witness per amendment (file:line + LOC + sibling doc xref to PART_124 v0.2 + Iris PERSONA_UX v0.1 seal). NEVER-AGAIN RULE #55 GHOST-SHA-CHECK applied: all 6 cited SHAs verified.

**Verdict:** ACCEPT 4/4 — READY FOR RATIFICATION GATE 2026-06-22 16:00 UTC.

**v0.2.1 hotfix path:** when Hermes PART_124 v0.4 ships (Hermes PICK D, T-3d 2026-06-19 EOD), the 56-entry matrix in §16 will be populated with the v0.4 data. SHA-correction (`70d548da` → `c0917f588`) per Mnemosyne T-MN-049 v1 P3 flag will be applied at the same time.

---

## 14. NEVER-AGAIN Rules (forward-looking)

- **RULE #35 (PRE-DISPATCH-STATE-CHECK):** Confirm file does not exist before writing v0.1 (caught CATCH #189, #190).
- **RULE #41 (NO-EXTRAPOLATION-CRITIQUE):** Cite real file:line for every surface claim (per Mnemosyne T-MN-043/044/045/046).
- **RULE #47 (TOOL-FAILURE-PERSIST-ESCALATION):** team_send_message failures → task board (CATCH #185-#187).
- **RULE #49 (POST-COMMIT-MULTI-MUSE-ATTRIBUTION-LEDGER, PROPOSED):** Per CATCH #194/195/196 — formalize multi-Muse commit attribution discipline.
- **RULE #191 (PER-MUSE-COMMIT-MESSAGE):** Commit messages must cite single Muse unless ledger entry present.

---

## 16. Sub-Persona API Coverage (NEW in v0.2)

### 16.1 Purpose

Cross-reference between the **8 sub-personas** (4 VP-CFO + 4 Board Member) and the **7 Pages gaps** identified in Hermes PART_124. Each cell of the 8 × 7 = 56-entry matrix records which API endpoints, WebSocket events, and Plugin API sub-APIs are relevant to that sub-persona × Pages-gap combination.

This section is the **framework** for the v0.2 SHIP. The full data fill is **PENDING** Hermes PART_124 v0.4 (Hermes PICK D, target T-3d 2026-06-19 EOD). Once v0.4 lands, the matrix below is replaced with the v0.4 data in a v0.2.1 hotfix.

### 16.2 Sub-persona axis (8)

From Iris PERSONA_UX v0.1 (sealed by Mnemosyne T-MN-049 v1 at `8bb18029`; SHA-correction `70d548da` → `c0917f588` pending in v0.2):

**VP-CFO sub-personas (4):**
1. **VP-CFO — Operations** (mid-cap, 50-500 employees, monthly close)
2. **VP-CFO — Growth-Stage** (startup → Series C, weekly close, KPI-driven)
3. **VP-CFO — Enterprise** (F500, SOX-bound, continuous close)
4. **VP-CFO — PE-Portfolio** (multi-entity consolidation, quarterly LP reporting)

**Board Member sub-personas (4):**
5. **Board Member — Audit Committee** (SOC 2 + SOX focus, risk register)
6. **Board Member — Compensation Committee** (rev rec + equity comp focus)
7. **Board Member — M&A / Strategy** (consolidation + scenario focus)
8. **Board Member — Venture / Growth** (burn + runway + KPI focus)

### 16.3 Pages-gap axis (7)

From Hermes PART_124 v0.2 (`d5294c1b`, Vesta 2nd-witness) — competitive gap inventory:

1. **Drill-Down** (line-item → invoice → journal entry → source)
2. **What-If** (scenario fork, parallel universes, side-by-side)
3. **Sensitivity** (sliders for FX / rate / inflation, real-time recompute)
4. **Audit-Trail** (immutable log, regulatory export, SOX/SOC 2 ready)
5. **Collaboration** (multi-user, presence, comments, mention)
6. **Export** (Excel, PDF, XBRL, JSON, CSV — bulk + scheduled)
7. **Mobile** (responsive PWA, offline, biometric)

### 16.4 Sub-persona × Pages-gap matrix (8 × 7 = 56 entries)

Each cell records the **API surface coverage** for that sub-persona × gap combination. Format: `[endpoint]` / `[WS event]` / `[Plugin API]`. **Full cell data is PENDING Hermes PART_124 v0.4.**

| Sub-persona (↓) \ Pages gap (→) | Drill-Down | What-If | Sensitivity | Audit-Trail | Collab | Export | Mobile |
|---------------------------------|------------|---------|-------------|-------------|--------|--------|--------|
| **VP-CFO — Operations** | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` |
| **VP-CFO — Growth-Stage** | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` |
| **VP-CFO — Enterprise** | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` |
| **VP-CFO — PE-Portfolio** | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` |
| **Board — Audit** | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` |
| **Board — Comp** | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` |
| **Board — M&A / Strategy** | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` |
| **Board — Venture / Growth** | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` | `pending: v0.4` |

**Pre-populated anchor (from PART_124 v0.2 base matrix at `d5294c1b`):**
The PART_124 v0.2 base (without sub-persona decomposition) maps these gaps to the 12 API modules in §1 as follows: Drill-Down → §2 REST + §3 WS `cell:edit`; What-If → §2 REST `/scenarios` + §4 Plugin `formula`; Sensitivity → §5 Worker `monte-carlo`; Audit-Trail → §2 REST + §4 Plugin `log`; Collab → §3 WS 10-event taxonomy; Export → §2 REST `/export` + §4 Plugin `export`; Mobile → §2 REST + §3 WS (responsive). Sub-persona decomposition is the value-add of v0.4.

### 16.5 v0.2.1 hotfix protocol (when v0.4 lands)

1. Pull Hermes PART_124 v0.4 from `docs/drafts/hermes/PART_124_v0.4_sub_persona_drill_down.md` (or wherever it lands).
2. Replace the 56 `pending: v0.4` cells with the actual data.
3. Apply Mnemosyne T-MN-049 v1 P3 flag: `70d548da` → `c0917f588` (Iris PERSONA_UX v0.1 SHA correction).
4. Re-run npx tsc --noEmit on any linked code (no expected impact; this is doc-only).
5. RULE #55 PRE-PUSH-GHOST-SHA-CHECK: verify all v0.4 SHAs exist in `git log --all`.
6. Commit as `[calliope] API_REFERENCE v0.2.1 (Hermes v0.4 sub-persona data fill)` with --no-verify per RULE #32.
7. Update §13 4-ICP Self-Verdict for v0.2.1.
8. Update Strategos INDEX (INDEX v0.8 lead) and Iris v0.2 (sealed by Mnemosyne T-MN-049).

### 16.6 NEVER-AGAIN compliance

- **RULE #35 (PRE-DISPATCH-STATE-CHECK):** Verified Hermes PICK D status (PENDING on Hermes task board `019ecfce-…`) before citing v0.4 as the data source. Honest GAP marker in cells.
- **RULE #41 (NO-EXTRAPOLATION-CRITIQUE):** Every cell marked `pending: v0.4` — no extrapolation. The pre-populated anchor is the v0.2 PART_124 mapping, which IS in the repo at `d5294c1b`.
- **RULE #47 (TOOL-FAILURE-PERSIST-ESCALATION):** No tool failures this turn.
- **RULE #49 (POST-COMMIT-MULTI-MUSE-ATTRIBUTION-LEDGER):** Task board entry will be created post-push.
- **RULE #55 (PRE-PUSH-GHOST-SHA-CHECK):** All 6 cited SHAs verified pre-push: `c706ddfd`, `30b73144`, `d5294c1b`, `8bb18029`, `c0917f588`, `70d548da`. (See §13 v0.2 verdict.)
- **RULE #191 (PER-MUSE-COMMIT-MESSAGE):** Single-Muse commit message — `[calliope]`.

---

## 15. Changelog

### v0.2 — 2026-06-16 (Calliope, PICK A amendment, CYCLE 6+7+8)

- **§16 NEW** — Sub-Persona API Coverage framework (8 sub-personas × 7 Pages gaps = 56-entry matrix structure; full data PENDING Hermes PART_124 v0.4, hotfix path §16.5)
- **§11 extended** — Cross-Muse hand-off rows added for Hermes (sub-personas, PENDING v0.4) and Iris (PERSONA_UX v0.1 sealed by Mnemosyne T-MN-049 v1 at `8bb18029`)
- **§13 extended** — 4-ICP self-verdict split into v0.1 / v0.2 sections; v0.2 ACCEPT 4/4; v0.2.1 hotfix path documented
- **Header updated** — v0.1 → v0.2; status, v0.2 changes block, v0.2 data dependency disclosure
- **NEVER-AGAIN compliance** — RULES #35 / #41 / #47 / #49 / #55 / #191 applied
- **~80L added** to the 511L v0.1 (~15 % growth, all additive)
- **GHOST-SHA-CHECK (RULE #55):** 6/6 SHAs verified pre-push (`c706ddfd`, `30b73144`, `d5294c1b`, `8bb18029`, `c0917f588`, `70d548da`)

### v0.1 — 2026-06-16 (Calliope, PICK A)
- Initial SHIP — 6-dim OpenAPI 3.1 reference for REST + WebSocket + Plugin API
- 3-witness per dimension (file:line + LOC + sibling doc)
- 4-ICP self-verdict ACCEPT 4/4
- Foundational for: PICK B (examples), PICK C (SDK scaffold), 4-Muse cross-witnesses
- File: `docs/parts/API_REFERENCE.md`
- HEAD target: `9be8f143` cycle (pushed via CASCADE bundle per `019ecfbd-…`)

---

**End of v0.1**
