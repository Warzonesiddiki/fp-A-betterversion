/**
 * FpaClient — top-level SDK entry point.
 *
 * The SDK is a thin, typed façade over:
 *  - `RestApiClient` (axios + auth + retry + 429 handling)
 *  - `WebSocketManager` (reconnect + heartbeat + message queue)
 *  - `ConnectorRegistry` (per-connector OAuth flows)
 *
 * It does **not** duplicate the underlying services. Everything that survives
 * in production in the main app survives here too. The SDK adds three things:
 *
 * 1. A connector-namespaced, ergonomic surface (`client.qbo.accounts.list()`).
 * 2. A typed `realtime` channel (`client.realtime.connect()`).
 * 3. `Result<T, E>` helpers (`getResult` / `postResult`) for callers that
 *    prefer not to use try/catch — mirrors `API_REFERENCE.md` §10.
 *
 * @module sdk/FpaClient
 * @since 0.1.0
 * @version 0.1.0
 *
 * @example
 * ```ts
 * // ESM (TypeScript / bundlers / Node >= 14 with "type": "module")
 * import { FpaClient } from '@finplanpro/sdk';
 * // or, from within the monorepo:
 * import { FpaClient } from './src/sdk';
 *
 * // CommonJS (Node 12 / 14 / 16 default, Jest, older toolchains)
 * const { FpaClient } = require('@finplanpro/sdk');
 * ```
 */

import { RestApiClient } from '../services/api-integration/RestApiClient';
import type {
  ApiRequestConfig,
  ApiResponse,
  ConnectorAuthConfig,
} from '../services/api-integration/types';
import { ApiError } from '../services/api-integration/types';

import {
  ApiNotConfiguredError,
  AuthConfig,
  ConnectorId,
  ConnectorOptions,
  DEFAULT_RETRY_COUNT,
  DEFAULT_REALTIME_PATH,
  DEFAULT_TIMEOUT_MS,
  FpaClientConfig,
  SdkError,
  SdkResult,
  SdkVersion,
  SDK_VERSION,
} from './types';
import { RealtimeChannel } from './realtime/RealtimeChannel';
import { GlCommitNamespace } from './gl/GlCommitNamespace';

// ─── Origin resolution (W6-P0-13 api-origin-truth) ──────────────────────────

/**
 * Resolve the REST origin from build-time env. Returns `''` when
 * `VITE_API_URL` is unset or blank — the SDK then operates in "unconfigured"
 * mode where every request rejects with `ApiNotConfiguredError` BEFORE any
 * network attempt. Read lazily (not at module load) so tests can stub
 * `import.meta.env` and so Vite injects the value per environment.
 */
export function resolveApiBaseUrl(): string {
  const raw: string | undefined = import.meta.env.VITE_API_URL;
  return typeof raw === 'string' ? raw.trim() : '';
}

// ─── Auth translation ────────────────────────────────────────────────────────

/**
 * Translate the SDK's public `AuthConfig` (discriminated union) into the
 * internal `ConnectorAuthConfig` shape that `RestApiClient` expects.
 *
 * Note: the internal config uses snake_case enum values (`'api_key'`,
 * not `'apiKey'`) and splits OAuth2 flow config from runtime tokens.
 * The SDK collapses the two into a single `AuthConfig` value.
 */
function toConnectorAuth(auth: AuthConfig): ConnectorAuthConfig {
  switch (auth.type) {
    case 'oauth2':
      return {
        type: 'oauth2',
        oauth2: {
          clientId: auth.client.clientId,
          clientSecret: auth.client.clientSecret,
          tokenUrl: auth.client.tokenUrl,
          // Internal OAuth2Config requires all six fields. Public type marks
          // authorizationUrl / redirectUri / scopes as optional; fall back to
          // safe defaults so the constructor signature is satisfied.
          authorizationUrl: auth.client.authorizationUrl ?? auth.client.tokenUrl,
          redirectUri: auth.client.redirectUri ?? '',
          scopes: auth.client.scopes ? [...auth.client.scopes] : [],
        },
      };
    case 'apiKey':
      return {
        type: 'api_key',
        apiKey: {
          // Internal ApiKeyConfig requires `headerName`; default to `X-API-Key`.
          headerName: auth.headerName ?? 'X-API-Key',
          key: auth.apiKey,
        },
      };
    case 'bearer':
      return { type: 'bearer', bearer: { token: auth.token } };
    case 'basic':
      return { type: 'basic', basic: { username: auth.username, password: auth.password } };
  }
}

/**
 * Seed OAuth2 runtime tokens on the underlying `RestApiClient`. The
 * constructor only accepts the OAuth2 *flow* config; runtime tokens are
 * passed separately via `setOAuthTokens`.
 */
function seedOAuthTokens(rest: RestApiClient, auth: Extract<AuthConfig, { type: 'oauth2' }>): void {
  const tokens = {
    accessToken: auth.tokens.accessToken,
    refreshToken: auth.tokens.refreshToken,
    expiresAt: auth.tokens.expiresAt,
    tokenType: auth.tokens.tokenType ?? 'Bearer',
    ...(auth.tokens.scope !== undefined ? { scope: auth.tokens.scope } : {}),
  };
  rest.setOAuthTokens(tokens);
}

/** Derive the WebSocket URL from the REST base URL when not explicitly set. */
function toRealtimeUrl(baseUrl: string, override?: string): string {
  if (override) return override;
  // https://api.example.com/v1  →  wss://api.example.com/realtime
  const wsBase = baseUrl.replace(/^http/i, 'ws');
  const url = new URL(wsBase);
  const scheme = url.protocol === 'ws:' ? 'ws' : 'wss';
  return `${scheme}://${url.host}${DEFAULT_REALTIME_PATH}`;
}

/** Extract the bearer token (or API key) to use for the WebSocket handshake. */
function extractWsToken(auth: AuthConfig): string {
  switch (auth.type) {
    case 'oauth2':
      return auth.tokens.accessToken;
    case 'bearer':
      return auth.token;
    case 'apiKey':
      return auth.apiKey;
    case 'basic':
      // Basic over WS is not standard; callers should use OAuth2/bearer.
      return `${auth.username}:${auth.password}`;
  }
}

/**
 * Resolve the realtime handshake credential. When a `tokenSource` is wired
 * with bearer auth, the credential is pulled live (same laziness as REST
 * requests); an empty result rejects with `ApiNotConfiguredError` unless the
 * auth config explicitly allows anonymous access.
 */
function resolveWsToken(client: FpaClient): string {
  if (client.tokenSource && client.auth.type === 'bearer') {
    const allowAnonymous = client.auth.allowAnonymous === true;
    const token = client.tokenSource();
    if (token === '' && !allowAnonymous) {
      throw new ApiNotConfiguredError(
        'No bearer token available for the realtime handshake. ' +
          'Ensure the user is authenticated (tokenSource must yield a non-empty token) ' +
          'or set allowAnonymous: true on the bearer auth config.'
      );
    }
    return token;
  }
  return extractWsToken(client.auth);
}

/** Convert any thrown value into the public `SdkError` shape. */
function toSdkError(err: unknown): SdkError {
  if (err instanceof ApiNotConfiguredError) {
    return { code: err.code, message: err.message, cause: err };
  }
  if (err instanceof ApiError) {
    return {
      code: `HTTP_${err.status}`,
      message: err.message,
      status: err.status,
      cause: err,
    };
  }
  if (err instanceof Error) {
    return { code: 'SDK_ERROR', message: err.message, cause: err };
  }
  return { code: 'SDK_ERROR', message: String(err), cause: err };
}

// ─── Connector namespaces ────────────────────────────────────────────────────

/**
 * Generic CRUD surface used by every connector namespace and the
 * "custom" namespace. Exposes a typed `list/get/create/update/remove` plus
 * the raw `request` escape hatch.
 */
export class ResourceCollection<T> {
  /** Subpath under the connector namespace, e.g. `accounts`, `invoices`. */
  public readonly path: string;

  /** Connector id, forwarded as `X-Connector` header. */
  public readonly connector: ConnectorId;

  public constructor(
    private readonly client: FpaClient,
    path: string,
    connector: ConnectorId
  ) {
    this.path = path;
    this.connector = connector;
  }

  /** `GET /<connector>/<path>?…` */
  public async list(
    params?: Readonly<Record<string, string | number | boolean>>,
    options?: ConnectorOptions
  ): Promise<T[]> {
    const res = await this.client.request<T[]>({
      method: 'GET',
      url: this.connectorPath(options),
      ...(params ? { params: { ...params } } : {}),
    });
    return res.data;
  }

  /** `GET /<connector>/<path>/:id` */
  public async get(id: string, options?: ConnectorOptions): Promise<T> {
    const res = await this.client.request<T>({
      method: 'GET',
      url: `${this.connectorPath(options)}/${encodeURIComponent(id)}`,
    });
    return res.data;
  }

  /** `POST /<connector>/<path>` */
  public async create(body: Partial<T>, options?: ConnectorOptions): Promise<T> {
    const res = await this.client.request<T>({
      method: 'POST',
      url: this.connectorPath(options),
      data: body,
    });
    return res.data;
  }

  /** `PUT /<connector>/<path>/:id` */
  public async update(id: string, body: Partial<T>, options?: ConnectorOptions): Promise<T> {
    const res = await this.client.request<T>({
      method: 'PUT',
      url: `${this.connectorPath(options)}/${encodeURIComponent(id)}`,
      data: body,
    });
    return res.data;
  }

  /** `DELETE /<connector>/<path>/:id` */
  public async remove(id: string, options?: ConnectorOptions): Promise<void> {
    await this.client.request<void>({
      method: 'DELETE',
      url: `${this.connectorPath(options)}/${encodeURIComponent(id)}`,
    });
  }

  private connectorPath(options?: ConnectorOptions): string {
    const tenantSegment = options?.tenantId ? `/${encodeURIComponent(options.tenantId)}` : '';
    return `/${this.connector}${tenantSegment}/${this.path}`;
  }
}

/**
 * QuickBooks Online namespace — typed CRUD over the QBO connector.
 *
 * @example
 * ```ts
 * const accounts = await client.qbo.accounts.list({ active: true });
 * const invoice = await client.qbo.invoices.get('inv-42');
 * const created = await client.qbo.invoices.create({
 *   customerRef: 'cust-1',
 *   totalAmt: 100,
 * });
 * ```
 */
export class QboNamespace {
  public readonly accounts: ResourceCollection<unknown>;
  public readonly invoices: ResourceCollection<unknown>;
  public readonly customers: ResourceCollection<unknown>;
  public readonly vendors: ResourceCollection<unknown>;
  public readonly items: ResourceCollection<unknown>;
  public constructor(client: FpaClient) {
    this.accounts = new ResourceCollection(client, 'accounts', 'qbo');
    this.invoices = new ResourceCollection(client, 'invoices', 'qbo');
    this.customers = new ResourceCollection(client, 'customers', 'qbo');
    this.vendors = new ResourceCollection(client, 'vendors', 'qbo');
    this.items = new ResourceCollection(client, 'items', 'qbo');
  }
}

/**
 * Xero namespace — typed CRUD over the Xero connector.
 *
 * @example
 * ```ts
 * const contacts = await client.xero.contacts.list();
 * const tenants = await client.xero.tenants.list();
 * const updated = await client.xero.invoices.update('inv-7', { status: 'PAID' });
 * ```
 */
export class XeroNamespace {
  public readonly accounts: ResourceCollection<unknown>;
  public readonly invoices: ResourceCollection<unknown>;
  public readonly contacts: ResourceCollection<unknown>;
  public readonly tenants: ResourceCollection<unknown>;
  public constructor(client: FpaClient) {
    this.accounts = new ResourceCollection(client, 'accounts', 'xero');
    this.invoices = new ResourceCollection(client, 'invoices', 'xero');
    this.contacts = new ResourceCollection(client, 'contacts', 'xero');
    this.tenants = new ResourceCollection(client, 'tenants', 'xero');
  }
}

/**
 * Custom REST namespace — generic CRUD against `/api/*` for endpoints
 * that don't have a typed connector namespace (rare, escape hatch).
 *
 * @example
 * ```ts
 * const settings = await client.custom.get<{ theme: string }>('/api/user/settings');
 * const saved = await client.custom.post('/api/notes', { body: 'hello' });
 * await client.custom.delete('/api/cache/org-42');
 * ```
 */
export class CustomNamespace {
  public constructor(private readonly client: FpaClient) {}

  public async get<T>(
    path: string,
    params?: Readonly<Record<string, string | number | boolean>>
  ): Promise<T> {
    const res = await this.client.request<T>({
      method: 'GET',
      url: path,
      ...(params ? { params: { ...params } } : {}),
    });
    return res.data;
  }

  public async post<T>(path: string, body: unknown): Promise<T> {
    const res = await this.client.request<T>({ method: 'POST', url: path, data: body });
    return res.data;
  }

  public async put<T>(path: string, body: unknown): Promise<T> {
    const res = await this.client.request<T>({ method: 'PUT', url: path, data: body });
    return res.data;
  }

  public async delete<T = void>(path: string): Promise<T> {
    const res = await this.client.request<T>({ method: 'DELETE', url: path });
    return res.data;
  }
}

// ─── Realtime factory ────────────────────────────────────────────────────────

/**
 * Factory for `RealtimeChannel`. Held as a property on `FpaClient` so callers
 * can write `client.realtime.connect()` (per §6 SDK quick-start).
 */
export class RealtimeFactory {
  public constructor(private readonly client: FpaClient) {}

  /**
   * Open a realtime channel. If a channel is already open for this client,
   * the existing instance is returned (idempotent).
   *
   * @throws {@link ApiNotConfiguredError} when the REST origin is unconfigured
   * (no `baseUrl` / `VITE_API_URL`) — no connection is attempted.
   */
  public connect(): RealtimeChannel {
    if (this.client.activeChannel) return this.client.activeChannel;
    if (this.client.baseUrl === '') throw new ApiNotConfiguredError();
    const url = toRealtimeUrl(this.client.baseUrl, this.client.realtimeUrl);
    const token = resolveWsToken(this.client);
    const channel = new RealtimeChannel({ url, token });
    this.client.activeChannel = channel;
    channel.connect();
    return channel;
  }

  /** Close the active channel, if any. */
  public disconnect(): void {
    if (!this.client.activeChannel) return;
    this.client.activeChannel.disconnect();
    this.client.activeChannel = null;
  }
}

// ─── FpaClient ───────────────────────────────────────────────────────────────

/**
 * Main SDK client. Construct with `{ baseUrl?, auth, … }` and await
 * the typed connector namespaces.
 *
 * @example
 * ```ts
 * const client = new FpaClient({
 *   auth: { type: 'oauth2', accessToken: '…', refreshToken: '…' },
 * });
 * const accounts = await client.qbo.accounts.list();
 * client.realtime.connect().subscribe('cell:edit', e => console.log(e));
 * ```
 */
export class FpaClient {
  /** SDK semver — set at construction, immutable. */
  public readonly version: SdkVersion = SDK_VERSION;

  /** Effective REST base URL after defaults ('' = unconfigured). */
  public readonly baseUrl: string;

  /**
   * Lazy per-request bearer credential source, when wired. Lives on the
   * instance (not private) so the realtime factory in this module can reuse
   * it without widening FpaClient's API surface further.
   */
  public readonly tokenSource: (() => string) | undefined;

  /** Effective WebSocket URL. */
  public readonly realtimeUrl: string | undefined;

  /** Effective auth. Mutated in place when OAuth2 tokens are refreshed. */
  public auth: AuthConfig;

  /** Connector namespaces. */
  public readonly qbo: QboNamespace;
  public readonly xero: XeroNamespace;
  public readonly custom: CustomNamespace;
  public readonly gl: GlCommitNamespace;
  public readonly realtime: RealtimeFactory;

  private readonly rest: RestApiClient;
  private readonly staticHeaders: Readonly<Record<string, string>>;
  private readonly onAuthRefresh?: (auth: AuthConfig) => Promise<AuthConfig>;
  /** Active realtime channel, if any. */
  public activeChannel: RealtimeChannel | null = null;

  public constructor(config: FpaClientConfig) {
    // W6-P0-13 api-origin-truth: explicit baseUrl wins; otherwise resolve
    // from VITE_API_URL. '' means UNCONFIGURED — every operation then rejects
    // with ApiNotConfiguredError before touching the network. The SDK never
    // invents a default host.
    this.baseUrl = config.baseUrl ?? resolveApiBaseUrl();
    this.auth = config.auth;
    this.tokenSource = config.tokenSource;
    this.realtimeUrl = config.realtimeUrl;
    this.staticHeaders = config.headers ?? {};
    this.onAuthRefresh = config.onAuthRefresh;

    const connectorAuth = toConnectorAuth(config.auth);
    this.rest = new RestApiClient(this.baseUrl, connectorAuth, {
      timeout: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      retryCount: config.retryCount ?? DEFAULT_RETRY_COUNT,
      headers: { ...this.staticHeaders },
    });

    // Seed OAuth2 runtime tokens (the constructor only accepts flow config).
    if (config.auth.type === 'oauth2') {
      seedOAuthTokens(this.rest, config.auth);
    }

    this.qbo = new QboNamespace(this);
    this.xero = new XeroNamespace(this);
    this.custom = new CustomNamespace(this);
    this.gl = new GlCommitNamespace(this);
    this.realtime = new RealtimeFactory(this);
  }

  // ── Origin + credential guards ──────────────────────────────────────────

  /**
   * Reject unconfigured clients BEFORE any transport delegation. This is the
   * single gate that keeps the SDK from ever guessing a host.
   */
  private requireConfiguredOrigin(): void {
    if (this.baseUrl === '') throw new ApiNotConfiguredError();
  }

  /**
   * Build per-request auth headers from a wired `tokenSource` (bearer only).
   * Returns `{}` when no live source applies — static credentials stay on the
   * underlying `RestApiClient`. An empty live token rejects with
   * `ApiNotConfiguredError` unless `auth.allowAnonymous === true`.
   */
  private resolveLiveAuthHeaders(): Record<string, string> {
    if (!this.tokenSource || this.auth.type !== 'bearer') return {};
    const allowAnonymous = this.auth.allowAnonymous === true;
    const token = this.tokenSource();
    if (token === '' && !allowAnonymous) {
      throw new ApiNotConfiguredError(
        'No bearer token available for the FinPlan Pro API. ' +
          'Ensure the user is authenticated (tokenSource must yield a non-empty token) ' +
          'or set allowAnonymous: true on the bearer auth config.'
      );
    }
    return token === '' ? {} : { Authorization: `Bearer ${token}` };
  }

  // ── Generic request escape hatch ────────────────────────────────────────

  /**
   * Raw request — escape hatch for endpoints not covered by the namespaces.
   * Returns the full `ApiResponse<T>` (status, headers, data). Most callers
   * should use the namespace methods which unwrap `.data` automatically.
   *
   * Every REST operation funnels through here: origin + live-token guards run
   * before any transport delegation, and live bearer headers are merged under
   * caller-supplied ones.
   *
   * @throws {@link ApiNotConfiguredError} when the origin or credential is unconfigured.
   */
  public async request<T = unknown>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    this.requireConfiguredOrigin();
    const liveHeaders = this.resolveLiveAuthHeaders();
    const hasLiveHeaders = Object.keys(liveHeaders).length > 0;
    const effective: ApiRequestConfig = hasLiveHeaders
      ? { ...config, headers: { ...liveHeaders, ...(config.headers ?? {}) } }
      : config;
    return this.rest.request<T>(effective);
  }

  // ── Result-style helpers (never throw) ─────────────────────────────────

  // All helpers below route through `request()`, so the origin/credential
  // guards apply uniformly; an unconfigured client surfaces
  // `{ ok: false, error: { code: 'API_NOT_CONFIGURED', … } }` instead of throwing.

  /** Wrap a thunk so its thrown value becomes a `SdkError`. */
  private async wrap<T>(fn: () => Promise<T>): Promise<SdkResult<T>> {
    try {
      const value = await fn();
      return { ok: true, value };
    } catch (err) {
      return { ok: false, error: toSdkError(err) };
    }
  }

  /** `GET` that never throws — returns `{ ok, value | error }`. */
  public getResult<T = unknown>(
    path: string,
    params?: Readonly<Record<string, string | number | boolean>>
  ): Promise<SdkResult<T>> {
    return this.wrap<T>(() => this.get<T>(path, params));
  }

  /** `POST` that never throws. */
  public postResult<T = unknown>(path: string, body: unknown): Promise<SdkResult<T>> {
    return this.wrap<T>(() => this.post<T>(path, body));
  }

  /** `PUT` that never throws. */
  public putResult<T = unknown>(path: string, body: unknown): Promise<SdkResult<T>> {
    return this.wrap<T>(() => this.put<T>(path, body));
  }

  /** `PATCH` that never throws. */
  public patchResult<T = unknown>(path: string, body: unknown): Promise<SdkResult<T>> {
    return this.wrap<T>(() => this.patch<T>(path, body));
  }

  /** `DELETE` that never throws. */
  public deleteResult<T = void>(path: string): Promise<SdkResult<T>> {
    return this.wrap<T>(() => this.delete<T>(path));
  }

  // ── Throwing helpers (unwrap `.data` and re-throw on error) ─────────────

  /** Throwing `GET` — returns the unwrapped body. */
  public async get<T = unknown>(
    path: string,
    params?: Readonly<Record<string, string | number | boolean>>
  ): Promise<T> {
    const r = await this.request<T>({
      method: 'GET',
      url: path,
      ...(params ? { params: { ...params } } : {}),
    });
    return r.data;
  }

  /** Throwing `POST`. */
  public async post<T = unknown>(path: string, body: unknown): Promise<T> {
    const r = await this.request<T>({ method: 'POST', url: path, data: body });
    return r.data;
  }

  /** Throwing `PUT`. */
  public async put<T = unknown>(path: string, body: unknown): Promise<T> {
    const r = await this.request<T>({ method: 'PUT', url: path, data: body });
    return r.data;
  }

  /** Throwing `PATCH`. */
  public async patch<T = unknown>(path: string, body: unknown): Promise<T> {
    const r = await this.request<T>({ method: 'PATCH', url: path, data: body });
    return r.data;
  }

  /** Throwing `DELETE`. */
  public async delete<T = void>(path: string): Promise<T> {
    const r = await this.request<T>({ method: 'DELETE', url: path });
    return r.data;
  }

  // ── Auth refresh hook ───────────────────────────────────────────────────

  /**
   * Replace the current auth. Called by the caller (or the host app) when
   * OAuth2 tokens are refreshed outside the SDK. Triggers `onAuthRefresh`
   * so the host can persist the new credentials.
   */
  public async setAuth(next: AuthConfig): Promise<void> {
    this.auth = next;
    if (this.onAuthRefresh) {
      const persisted = await this.onAuthRefresh(next);
      this.auth = persisted;
    }
    // Re-derive connector auth on the underlying RestApiClient.
    // (For the scaffold, the auth is read once at construction — a future
    // pick can wire `RestApiClient.setOAuthTokens` / equivalent for live swap.)
  }
}

// ─── Re-exports ──────────────────────────────────────────────────────────────

export type { RealtimeEvent } from './types';
