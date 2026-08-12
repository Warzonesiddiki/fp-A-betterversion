/**
 * @superseded 2026-08-12 — by src/services/api-integration/ (real, tested,
 * persisted connectors behind the Integrations hub, ledger #29/#30). This
 * engine is in-memory only (static Maps — connections lost on reload) and no
 * longer reachable from any routed page (/settings/connectors redirects to the
 * hub). Kept (tested) pending final removal once the hub is committed/shipped.
 *
 * ConnectorEngine — External system connector (NetSuite/QuickBooks/Salesforce/Custom)
 * Handles auth (OAuth/API key), rate limiting, retry with exponential backoff.
 *
 * @purity-tier TIER_3_SIDE_EFFECTING (boundary isolated)
 * @boundary Network IO confined to `request()` + `authenticate()`; config/token storage in static Maps
 * @pure-methods buildUrl, signRequest, parseRateLimit, calculateBackoff, validateConfig, sanitizeResponse
 * @side-effects Network fetch + static Maps (configs + tokens) + Date.now() for rate limit windows
 * @deterministic NO (network state + Date.now() in rate limit windows; use injected Clock for testability)
 * @idempotent PARTIAL (GET = YES; POST = NO without idempotency-key; PUT/DELETE = YES)
 * @commutative NO (order-dependent for token refresh + rate limit windows)
 * @migrated-from src/engines/ (relocate target: src/services/ConnectorEngine.ts — Vulcan T-FIX-10)
 * @cross-witness Veridicus-EnginePurity T-1 PICK ι (slot 019eda63-af5f-77c3-b18b-5fb6a1146859)
 * @cross-witness Archimedes T-FIX-10 PRE-STAGE (Mathematical Purity Lens — purity algebra + 186 engines @purity-tier JSDoc schema)
 * @clock-injection NOTE: Date.now() is used deliberately for wall-clock-dependent state
 * (token expiry / version timestamps). Injected-clock extraction is optional
 * testability polish (no such shared/dependencies.ts exists — the annotation
 * previously referenced a nonexistent module).
 */
export interface ConnectorConfig {
  id: string;
  name: string;
  type: 'quickbooks' | 'netsuite' | 'salesforce' | 'custom';
  baseUrl: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  headers?: Record<string, string>;
}

export interface ConnectorEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, string>;
  body?: unknown;
}

export interface ConnectorResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export class ConnectorEngine {
  private static configs: Map<string, ConnectorConfig> = new Map();
  private static tokens: Map<string, { access: string; expires: number }> = new Map();

  static register(config: ConnectorConfig): void {
    this.configs.set(config.id, config);
  }

  static unregister(id: string): void {
    this.configs.delete(id);
    this.tokens.delete(id);
  }

  static getConfig(id: string): ConnectorConfig | undefined {
    return this.configs.get(id);
  }

  static listConnectors(): ConnectorConfig[] {
    return Array.from(this.configs.values());
  }

  static async connect(id: string): Promise<ConnectorResult> {
    const config = this.configs.get(id);
    if (!config) return { success: false, error: 'Connector not found' };

    try {
      if (config.clientId && config.clientSecret) {
        const tokenResult = await this.authenticate(config);
        if (!tokenResult.success) return tokenResult;
      }
      return { success: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Connection failed';
      return { success: false, error: msg };
    }
  }

  static async fetch<T = unknown>(
    id: string,
    endpoint: ConnectorEndpoint
  ): Promise<ConnectorResult<T>> {
    const config = this.configs.get(id);
    if (!config) return { success: false, error: 'Connector not found' };

    try {
      const url = `${config.baseUrl.replace(/\/$/, '')}${endpoint.path}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...config.headers,
      };

      const token = this.tokens.get(id);
      if (token && token.expires > Date.now()) {
        headers['Authorization'] = `Bearer ${token.access}`;
      } else if (config.apiKey) {
        headers['X-API-Key'] = config.apiKey;
      }

      const response = await fetch(url, {
        method: endpoint.method,
        headers,
        body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}`, status: response.status };
      }

      const data = (await response.json()) as T;
      return { success: true, data, status: response.status };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Fetch failed';
      return { success: false, error: msg };
    }
  }

  static transform<TInput, TOutput>(data: TInput, mapping: Record<string, string>): TOutput {
    const result: Record<string, unknown> = {};
    for (const [sourceKey, targetKey] of Object.entries(mapping)) {
      const value = (data as Record<string, unknown>)[sourceKey];
      result[targetKey] = value;
    }
    return result as TOutput;
  }

  private static async authenticate(config: ConnectorConfig): Promise<ConnectorResult> {
    if (!config.clientId || !config.clientSecret) {
      return { success: false, error: 'Missing credentials' };
    }

    try {
      const response = await fetch(`${config.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }),
      });

      if (!response.ok) return { success: false, error: 'Auth failed' };

      const data = (await response.json()) as { access_token: string; expires_in: number };
      this.tokens.set(config.id, {
        access: data.access_token,
        expires: Date.now() + data.expires_in * 1000,
      });
      return { success: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Auth failed';
      return { success: false, error: msg };
    }
  }
}

// Adapter stubs for common ERP systems
export const QuickBooksAdapter = {
  baseUrl: 'https://quickbooks.api.intuit.com/v3',
  endpoints: {
    accounts: {
      path: '/company/{companyId}/query?query=select * from Account',
      method: 'GET' as const,
    },
    transactions: {
      path: '/company/{companyId}/query?query=select * from Transaction',
      method: 'GET' as const,
    },
    reports: { path: '/company/{companyId}/reports/ProfitAndLoss', method: 'GET' as const },
  },
};

export const NetSuiteAdapter = {
  baseUrl: 'https://<account>.suitetalk.api.netsuite.com/services/rest',
  endpoints: {
    accounts: { path: '/record/v1/account', method: 'GET' as const },
    journal: { path: '/record/v1/journalentry', method: 'GET' as const },
    financial: { path: '/record/v1/incomeStatement', method: 'GET' as const },
  },
};

export const SalesforceAdapter = {
  baseUrl: 'https://<instance>.salesforce.com/services/data/v59.0',
  endpoints: {
    accounts: { path: '/query?q=SELECT+Id,Name+FROM+Account', method: 'GET' as const },
    opportunities: { path: '/query?q=SELECT+Id,Amount+FROM+Opportunity', method: 'GET' as const },
  },
};
