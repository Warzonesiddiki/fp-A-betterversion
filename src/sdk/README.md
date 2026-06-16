# FpaClient SDK

A typed, ergonomic TypeScript SDK for the **FinPlan Pro** API surface. Wraps
the existing `RestApiClient` and `WebSocketManager` services without
duplicating their logic, and adds a connector-namespaced, IDE-discoverable
surface that mirrors `docs/parts/API_REFERENCE.md` and the SDK quick-start
preview in `docs/parts/API_EXAMPLES.md §6`.

**Version:** `0.1.0` (semver — bump on any breaking type change)
**Public surface:** `src/sdk/index.ts`
**Strict + `noUncheckedIndexedAccess`** — 0 TypeScript errors in `src/sdk/`.

---

## Install

```bash
# From the FinPlan Pro monorepo (development):
#   Already on the path via `import { FpaClient } from './src/sdk'`.
#
# For external consumers (planned v0.2):
npm install @finplanpro/sdk   # placeholder
```

## Quick start

```ts
import { FpaClient } from './src/sdk';
// or, for external consumers:
// import { FpaClient } from '@finplanpro/sdk';

const client = new FpaClient({
  auth: {
    type: 'oauth2',
    client: {
      clientId: '…',
      clientSecret: '…',
      tokenUrl: 'https://oauth.provider.com/token',
      scopes: ['read', 'write'],
    },
    tokens: {
      accessToken: '…',
      refreshToken: '…',
      expiresAt: Date.now() + 3600_000,
    },
  },
});

// QBO accounts
const accounts = await client.qbo.accounts.list();

// Xero invoices
const invoices = await client.xero.invoices.list({ status: 'AUTHORISED' });

// Realtime channel
client.realtime.connect().subscribe('cell:edit', (e) => {
  console.log(`cell ${e.payload.cell} → ${e.payload.value}`);
});

// Custom REST (advanced)
const me = await client.custom.get<{ id: string; email: string }>('/api/me');

// Result-style helpers (never throw)
const r = await client.getResult<{ balance: number }>('/api/balance');
if (r.ok) console.log(r.value.balance);
else console.error(r.error.code, r.error.message);
```

That's the full happy path. Everything below is reference.

---

## Configuration — `FpaClientConfig`

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `baseUrl` | `string` | `DEFAULT_BASE_URL` (`https://api.finplanpro.dev/v1`) | REST base URL. |
| `auth` | `AuthConfig` | — (required) | Discriminated union — see below. |
| `timeoutMs` | `number` | `30_000` | Per-request timeout. |
| `retryCount` | `number` | `3` | Retries on 5xx / 429 (idempotent verbs only). |
| `connector` | `ConnectorId` | — | Default connector namespace. |
| `headers` | `Record<string,string>` | `{}` | Static headers on every request. |
| `realtimeUrl` | `string` | derived | Override WebSocket URL. |
| `onAuthRefresh` | `(a) => Promise<AuthConfig>` | — | Hook for token persistence. |

### `AuthConfig` (discriminated union)

| `type` | Required fields | Notes |
|--------|-----------------|-------|
| `oauth2` | `client` (`OAuth2ClientConfig`), `tokens` (`OAuth2TokenState`) | `client` is the OAuth2 *flow* config (`clientId`/`clientSecret`/`tokenUrl`/optional `authorizationUrl`/`redirectUri`/`scopes`). `tokens` is the *runtime* token state (`accessToken`/`refreshToken`/`expiresAt`/optional `scope`/`tokenType`). The SDK seeds both on the underlying `RestApiClient` for you. |
| `apiKey`  | `apiKey`, `headerName?` (default `X-API-Key`) | |
| `bearer`  | `token` | Static; no refresh. |
| `basic`   | `username`, `password` | Not recommended for WebSocket. |

---

## Connector namespaces

The SDK exposes three top-level namespaces plus a generic `custom` escape
hatch. Each namespace contains a `ResourceCollection<T>` per resource
(`accounts`, `invoices`, etc.) with a typed CRUD surface.

### `client.qbo` — QuickBooks Online

```ts
const accounts = await client.qbo.accounts.list();
const account  = await client.qbo.accounts.get('35');
const created  = await client.qbo.accounts.create({ Name: 'New', AccountType: 'Expense' });
const updated  = await client.qbo.accounts.update('35', { Name: 'Renamed' });
await client.qbo.accounts.remove('35');

// Tenant-scoped read:
const tenantInvoices = await client.qbo.invoices.list(undefined, { tenantId: '4620816365114594805' });
```

Resources: `accounts`, `invoices`, `customers`, `vendors`, `items`.

### `client.xero` — Xero

Resources: `accounts`, `invoices`, `contacts`, `tenants`.

### `client.custom` — Generic REST

```ts
await client.custom.get<T>('/api/foo');
await client.custom.post<T>('/api/foo', { x: 1 });
await client.custom.put<T>('/api/foo', { x: 2 });
await client.custom.delete<void>('/api/foo');
```

### Per-resource options

Every `ResourceCollection` method accepts an optional
`ConnectorOptions` second argument:

| Field | Type | Notes |
|-------|------|-------|
| `tenantId` | `string` | Forwarded as a path segment. |
| `minorVersion` | `string` | Force a connector API minor version. |
| `sandbox` | `boolean` | QBO sandbox mode. |

---

## Realtime — `client.realtime`

The SDK exposes a typed `RealtimeChannel` that wraps the internal
`WebSocketManager`. It validates inbound events against the 10-event
taxonomy from `API_REFERENCE.md §3.3` and isolates handler errors so one
bad subscriber cannot kill the channel.

```ts
const channel = client.realtime.connect();

// Subscribe to a specific event
const off = channel.subscribe('cell:edit', (e) => {
  console.log(`${e.payload.userId} → ${e.payload.cell} = ${e.payload.value}`);
});

// Send a write event (broadcasts to all other clients)
channel.send({
  type: 'cell:edit',
  payload: { sheetId: 's1', cell: 'A1', value: 42, userId: 'u1', ts: Date.now() },
});

// Connection state
const unsub = channel.onState((state) => {
  console.log('realtime state →', state); // 'connecting'|'connected'|'reconnecting'|'closed'|'error'
});

// Disconnect when done
client.realtime.disconnect(); // idempotent
```

### Event taxonomy (10 types)

| Type | Payload |
|------|---------|
| `cell:edit` | `{ sheetId, cell, value, userId, ts }` |
| `sheet:created` | `{ sheetId, userId }` |
| `cell:formatted` | `{ range, style }` |
| `cursor:moved` | `{ userId, cell }` |
| `comment:added` | `{ cell, author, text }` |
| `selection:changed` | `{ userId, range }` |
| `presence:joined` | `{ userId, name }` |
| `presence:left` | `{ userId }` |
| `data:imported` | `{ source, rows }` |
| `formula:recalculated` | `{ sheetId, durationMs }` |

---

## Result-style helpers

For callers that prefer not to use `try/catch`, the SDK exposes
`getResult` / `postResult` / `putResult` / `patchResult` / `deleteResult`
returning `SdkResult<T, SdkError>` (mirrors `API_REFERENCE.md §10`):

```ts
type SdkResult<T, E = SdkError> =
  | { ok: true;  value: T }
  | { ok: false; error: E };

const r = await client.getResult<Account[]>('/qbo/accounts');
if (r.ok) {
  // r.value: Account[]
} else {
  // r.error: { code, message, status?, cause? }
}
```

## Raw request — `client.request`

```ts
import type { ApiRequestConfig } from './src/services/api-integration/types';

const res = await client.request<{ ok: boolean }>({
  method: 'POST',
  url: '/qbo/invoices',
  data: { CustomerRef: { value: '1' }, Line: [] },
});
// res.data, res.status, res.headers
```

---

## Error shape — `SdkError`

```ts
interface SdkError {
  code: string;       // 'HTTP_429' | 'HTTP_500' | 'SDK_ERROR' | …
  message: string;
  status?: number;    // HTTP status, when applicable
  cause?: unknown;    // Original error
}
```

`ApiError` from the internal client is normalized to this shape by
`toSdkError()`.

---

## Versioning

`SDK_VERSION = '0.1.0'` is exported as both a value and a type literal
(`SdkVersion`). On any breaking type change, bump per semver and add a
migration note to `docs/parts/API_REFERENCE.md §11`.

---

## Architecture & internals

The SDK is a *thin* wrapper. It does **not** implement HTTP, WebSocket,
OAuth, or retry logic — those live in:

| Internal | Path | Role |
|----------|------|------|
| `RestApiClient` | `src/services/api-integration/RestApiClient.ts` | axios + auth + 429 + retry |
| `WebSocketManager` | `src/services/WebSocketManager.ts` | reconnect + heartbeat + queue |
| `ConnectorRegistry` | `src/services/api-integration/ConnectorRegistry.ts` | per-connector OAuth flows |
| `ApiError` | `src/services/api-integration/types.ts` | error normalization |

The SDK is a *façade* — if a fix lands in `RestApiClient`, the SDK
inherits it without re-implementation. The new file structure is:

```
src/sdk/
├── index.ts                 (43L)  — barrel export
├── types.ts                 (152L) — public type definitions
├── FpaClient.ts             (451L) — main client + namespaces
└── realtime/
    └── RealtimeChannel.ts   (221L) — typed WS wrapper
```

---

## Testing

Vitest spec for the SDK is a queued follow-on (PICK 2 in the
PROACTIVE-PICK-CHAIN). In the meantime, examples in
`docs/parts/API_EXAMPLES.md §6` serve as the executable spec.

---

## Related docs

- [`docs/parts/API_REFERENCE.md`](../parts/API_REFERENCE.md) — full surface spec
- [`docs/parts/API_EXAMPLES.md`](../parts/API_EXAMPLES.md) — 27 working code examples
- [`src/services/api-integration/RestApiClient.ts`](../../services/api-integration/RestApiClient.ts) — the underlying client
- [`src/services/WebSocketManager.ts`](../../services/WebSocketManager.ts) — the underlying WebSocket
