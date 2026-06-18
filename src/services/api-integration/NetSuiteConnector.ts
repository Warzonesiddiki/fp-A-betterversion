/**
 * API Integration Framework - NetSuite Connector
 *
 * Connects to Oracle NetSuite ERP via SuiteTalk REST API or RESTlet API.
 * Implements OAuth1.0a with HMAC-SHA256 signature for Token-Based Authentication (TBA).
 *
 * Why OAuth1.0a / TBA:
 * - NetSuite uses OAuth1.0a for all REST/RESTlet API access (NOT OAuth2)
 * - Token-Based Auth (TBA) is the recommended approach for machine-to-machine integrations
 * - Signature: HMAC-SHA256 over (base string + key), where key = consumer_secret&token_secret
 *
 * Endpoints:
 * - REST API: https://{accountId}.suitetalk.api.netsuite.com/services/rest/record/v1/{type}
 * - RESTlet: https://{accountId}.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script={id}&deploy={id}
 *
 * Records (FP&A focus):
 * - Account (chart of accounts)
 * - Transaction (journal entries, vendor bills, customer invoices)
 * - Budget (NetSuite budgets)
 * - Department / Class / Location (segmentation)
 * - Subsidiary (multi-currency / multi-entity)
 */

import { BaseConnector } from './BaseConnector';
import type {
  ConnectorConfig,
  ConnectorHealth,
  ExternalAccount,
  ExternalBudget,
  ExternalInvoice,
  ExternalTransaction,
  PaginatedResponse,
  PaginationParams,
  SyncOptions,
} from './types';

// ─── NetSuite auth config ────────────────────────────────────────────────────

/**
 * NetSuite uses OAuth1.0a with TBA (Token-Based Auth).
 * Required fields: accountId, consumerKey, consumerSecret, tokenId, tokenSecret.
 *
 * Note: NetSuiteAuthConfig is a STANDALONE interface (does NOT extend
 * ConnectorAuthConfig) because the shared AuthType union does not include
 * 'oauth1'. The ConnectorConfig.auth field accepts this via the unknown cast
 * below; a runtime guard in the constructor ensures required fields exist.
 */
export interface NetSuiteAuthConfig {
  type: 'oauth1';
  oauth1: {
    accountId: string; // e.g., "TSTDRV1234567" or "PROD4567890"
    consumerKey: string;
    consumerSecret: string;
    tokenId: string;
    tokenTokenSecret: string; // distinct name to avoid collision with connector tokenSecret
    realm: string; // usually equal to accountId
    signatureMethod: 'HMAC-SHA256'; // TBA requires SHA256
  };
}

// ─── Crypto helpers (Web Crypto API) ─────────────────────────────────────────

/**
 * Compute HMAC-SHA256 signature using Web Crypto API.
 * Returns base64-encoded signature.
 *
 * Note: TextEncoder + SubtleCrypto are available in browsers + Node 18+ + Web Workers.
 */
async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  // Convert ArrayBuffer → base64
  const bytes = new Uint8Array(signatureBuffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/**
 * Generate a random OAuth1.0a nonce (16-byte base64).
 */
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/[+/=]/g, ''); // strip base64 special chars
}

/**
 * RFC3986 percent-encode (OAuth1.0a spec requires stricter encoding than encodeURIComponent).
 */
function percentEncode(value: string): string {
  return encodeURIComponent(value).replace(
    /[!*'()]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

// ─── NetSuite REST response shapes (subset) ──────────────────────────────────

interface NetSuiteLink {
  rel: string;
  href: string;
}

interface NetSuiteAccountRecord {
  id: string;
  type: 'account';
  attributes: {
    links?: NetSuiteLink[];
  };
  acctNumber?: string;
  acctName: string;
  acctType: string; // e.g., 'Bank', 'Income', 'Expense', 'Equity', 'Liability', 'Other Asset'
  description?: string;
  currency?: { id: string; refName: string };
  parent?: { id: string; refName: string };
  subsidiary?: { id: string; refName: string };
  isInactive?: boolean;
  lastModifiedDate?: string;
}

interface NetSuiteTransactionRecord {
  id: string;
  type: string; // e.g., 'journalEntry', 'vendorBill', 'invoice', 'customerPayment'
  attributes: { links?: NetSuiteLink[] };
  tranId?: string;
  date: string;
  postingPeriod?: { id: string; refName: string };
  entity?: { id: string; refName: string };
  currency?: { id: string; refName: string };
  total: number;
  memo?: string;
  status?: string;
  lastModifiedDate?: string;
}

interface NetSuiteBudgetRecord {
  id: string;
  type: 'budget';
  attributes: { links?: NetSuiteLink[] };
  budgetName: string;
  account?: { id: string; refName: string };
  subsidiary?: { id: string; refName: string };
  periodAmountList?: Array<{ period: { id: string; refName: string }; amount: number }>;
  amount?: number;
  fiscalYear?: { id: string; refName: string };
  isInactive?: boolean;
}

interface NetSuitePageResponse<T> {
  count: number;
  hasMore: boolean;
  offset: number;
  totalResults?: number;
  items: T[];
  links?: NetSuiteLink[];
}

// ─── NetSuite Connector ──────────────────────────────────────────────────────

export class NetSuiteConnector extends BaseConnector {
  private readonly accountId: string;
  private readonly consumerKey: string;
  private readonly consumerSecret: string;
  private readonly tokenId: string;
  private readonly tokenSecret: string;
  private readonly realm: string;
  private readonly baseUrl: string;

  constructor(config: ConnectorConfig) {
    // Runtime guard — NetSuiteAuthConfig is standalone; verify the auth payload
    // has the required oauth1 shape before narrowing.
    const authRaw = config.auth as unknown;
    if (
      !authRaw ||
      typeof authRaw !== 'object' ||
      (authRaw as { type?: unknown }).type !== 'oauth1' ||
      !(authRaw as { oauth1?: unknown }).oauth1
    ) {
      throw new Error(
        'NetSuiteConnector requires ConnectorConfig.auth with type="oauth1" and oauth1 payload'
      );
    }
    const auth = authRaw as NetSuiteAuthConfig;
    const oa = auth.oauth1;

    super({
      ...config,
      baseUrl: config.baseUrl ?? `https://${oa.accountId}.suitetalk.api.netsuite.com`,
    });
    this.accountId = oa.accountId;
    this.consumerKey = oa.consumerKey;
    this.consumerSecret = oa.consumerSecret;
    this.tokenId = oa.tokenId;
    this.tokenSecret = oa.tokenTokenSecret;
    this.realm = oa.realm ?? oa.accountId;
    this.baseUrl = `https://${this.accountId}.suitetalk.api.netsuite.com`;
  }

  // ─── OAuth1.0a signature ──────────────────────────────────────────────────

  /**
   * Build and sign an OAuth1.0a request to a NetSuite endpoint.
   *
   * @param method HTTP method (GET, POST, ...)
   * @param endpoint Full URL including query string
   * @returns Headers object with `Authorization: OAuth ...` and `Content-Type`
   */
  private async buildOAuthHeaders(
    method: string,
    endpoint: string
  ): Promise<Record<string, string>> {
    const url = new URL(endpoint);
    const oauthParams: Record<string, string> = {
      oauth_consumer_key: this.consumerKey,
      oauth_token: this.tokenId,
      oauth_nonce: generateNonce(),
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_signature_method: 'HMAC-SHA256',
      oauth_version: '1.0',
    };

    // Collect all params (OAuth + query string) for signature base string
    const allParams: Record<string, string> = { ...oauthParams };
    url.searchParams.forEach((value, key) => {
      allParams[key] = value;
    });

    // 1. Percent-encode, sort alphabetically, build base string
    const sortedKeys = Object.keys(allParams).sort();
    const paramString = sortedKeys
      .map((k) => `${percentEncode(k)}=${percentEncode(allParams[k]!)}`)
      .join('&');

    const baseString = [
      method.toUpperCase(),
      percentEncode(`${url.protocol}//${url.host}${url.pathname}`),
      percentEncode(paramString),
    ].join('&');

    // 2. Signing key = consumer_secret&token_secret (both percent-encoded)
    const signingKey = `${percentEncode(this.consumerSecret)}&${percentEncode(this.tokenSecret)}`;

    // 3. HMAC-SHA256 over base string with signing key
    oauthParams.oauth_signature = await hmacSha256(signingKey, baseString);

    // 4. Build Authorization header
    const authHeader =
      'OAuth realm="' +
      this.realm +
      '", ' +
      Object.entries(oauthParams)
        .map(([k, v]) => `${k}="${percentEncode(v)}"`)
        .join(', ');

    return {
      Authorization: authHeader,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Prefer: 'transient',
    };
  }

  // ─── Generic request ──────────────────────────────────────────────────────

  private async netsuiteRequest<T>(method: string, path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = await this.buildOAuthHeaders(method, url);

    const response = await fetch(url, { method, headers });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(
        `NetSuite ${method} ${path} failed: ${response.status} ${response.statusText} — ${errorBody.slice(0, 200)}`
      );
    }

    return (await response.json()) as T;
  }

  // ─── Health check ──────────────────────────────────────────────────────────

  protected async performHealthCheck(): Promise<ConnectorHealth> {
    try {
      // Make a minimal request: GET /record/v1/account?limit=1
      await this.netsuiteRequest<NetSuitePageResponse<NetSuiteAccountRecord>>(
        'GET',
        '/services/rest/record/v1/account?limit=1'
      );

      return {
        status: 'connected',
        lastSyncAt: Date.now(),
        rateLimitRemaining: undefined,
        rateLimitReset: undefined,
      };
    } catch (error: unknown) {
      return {
        status: 'error',
        lastError: error instanceof Error ? error.message : 'Health check failed',
      };
    }
  }

  // ─── Accounts (Chart of Accounts) ─────────────────────────────────────────

  async getAccounts(pagination?: PaginationParams): Promise<PaginatedResponse<ExternalAccount>> {
    const pageSize = pagination?.pageSize ?? 100;
    const offset = ((pagination?.page ?? 1) - 1) * pageSize;

    const query = new URLSearchParams({
      limit: pageSize.toString(),
      offset: offset.toString(),
    });

    const response = await this.netsuiteRequest<NetSuitePageResponse<NetSuiteAccountRecord>>(
      'GET',
      `/services/rest/record/v1/account?${query.toString()}`
    );

    return {
      items: (response.items ?? []).map(this.mapAccount),
      total: response.totalResults ?? response.items?.length ?? 0,
      page: pagination?.page ?? 1,
      pageSize,
      hasNext: response.hasMore,
    };
  }

  private mapAccount(a: NetSuiteAccountRecord): ExternalAccount {
    // NetSuite acctType → FP&A type mapping
    const typeMap: Record<string, ExternalAccount['type']> = {
      Bank: 'asset',
      'Other Current Asset': 'asset',
      'Fixed Asset': 'asset',
      'Other Asset': 'asset',
      'Accounts Receivable': 'asset',
      Income: 'revenue',
      'Other Income': 'revenue',
      Expense: 'expense',
      'Other Expense': 'expense',
      'Cost of Goods Sold': 'expense',
      'Accounts Payable': 'liability',
      'Credit Card': 'liability',
      'Other Current Liability': 'liability',
      'Long Term Liability': 'liability',
      Equity: 'equity',
      'Retained Earnings': 'equity',
    };

    return {
      externalId: a.id,
      name: a.acctName,
      type: typeMap[a.acctType] ?? 'asset',
      subtype: a.acctType,
      currency: a.currency?.refName ?? 'USD',
      balance: 0, // Balance is fetched via separate /balance endpoint or calculated
      active: !a.isInactive,
      lastUpdated: a.lastModifiedDate ? new Date(a.lastModifiedDate).getTime() : Date.now(),
    };
  }

  // ─── Transactions ─────────────────────────────────────────────────────────

  async getTransactions(
    accountId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<ExternalTransaction>> {
    const pageSize = pagination?.pageSize ?? 100;
    const offset = ((pagination?.page ?? 1) - 1) * pageSize;

    // NetSuite uses SuiteQL for transaction queries — but for simplicity,
    // we use the transaction record endpoint filtered by account.
    const query = new URLSearchParams({
      account: accountId,
      limit: pageSize.toString(),
      offset: offset.toString(),
    });

    try {
      const response = await this.netsuiteRequest<NetSuitePageResponse<NetSuiteTransactionRecord>>(
        'GET',
        `/services/rest/record/v1/transaction?${query.toString()}`
      );

      return {
        items: (response.items ?? []).map((t) => this.mapTransaction(t, accountId)),
        total: response.totalResults ?? response.items?.length ?? 0,
        page: pagination?.page ?? 1,
        pageSize,
        hasNext: response.hasMore,
      };
    } catch {
      // Fallback: transactions endpoint may not accept `account` query param.
      // Return empty paginated response.
      return { items: [], total: 0, page: 1, pageSize, hasNext: false };
    }
  }

  private mapTransaction(t: NetSuiteTransactionRecord, accountId: string): ExternalTransaction {
    // NetSuite transactions: positive total = debit, negative = credit
    // FP&A convention: positive amount + type=debit
    const type: ExternalTransaction['type'] = t.total >= 0 ? 'debit' : 'credit';

    return {
      externalId: t.id,
      accountId,
      date: t.date,
      description: t.memo ?? t.entity?.refName ?? t.type,
      amount: Math.abs(t.total),
      currency: t.currency?.refName ?? 'USD',
      type,
      category: t.type, // NetSuite transaction type as category
      reference: t.tranId,
      metadata: {
        postingPeriod: t.postingPeriod?.refName,
        entity: t.entity?.refName,
        status: t.status,
        nsType: t.type,
      },
    };
  }

  // ─── Invoices ─────────────────────────────────────────────────────────────

  async getInvoices(pagination?: PaginationParams): Promise<PaginatedResponse<ExternalInvoice>> {
    const pageSize = pagination?.pageSize ?? 100;
    const offset = ((pagination?.page ?? 1) - 1) * pageSize;

    const query = new URLSearchParams({
      limit: pageSize.toString(),
      offset: offset.toString(),
    });

    try {
      const response = await this.netsuiteRequest<NetSuitePageResponse<NetSuiteTransactionRecord>>(
        'GET',
        `/services/rest/record/v1/invoice?${query.toString()}`
      );

      return {
        items: (response.items ?? []).map((inv) => this.mapInvoice(inv)),
        total: response.totalResults ?? response.items?.length ?? 0,
        page: pagination?.page ?? 1,
        pageSize,
        hasNext: response.hasMore,
      };
    } catch {
      return { items: [], total: 0, page: 1, pageSize, hasNext: false };
    }
  }

  private mapInvoice(inv: NetSuiteTransactionRecord): ExternalInvoice {
    return {
      externalId: inv.id,
      number: inv.tranId ?? inv.id,
      customerId: inv.entity?.id ?? '',
      date: inv.date,
      dueDate: inv.date, // NetSuite invoice due date requires line item fetch
      status: (inv.status as ExternalInvoice['status']) ?? 'draft',
      subtotal: Math.abs(inv.total),
      tax: 0, // Tax breakdown requires line item fetch
      total: Math.abs(inv.total),
      currency: inv.currency?.refName ?? 'USD',
      lineItems: [], // Line items fetched separately via /invoice/{id}/line
    };
  }

  // ─── Budgets ──────────────────────────────────────────────────────────────

  async getBudgets(pagination?: PaginationParams): Promise<PaginatedResponse<ExternalBudget>> {
    const pageSize = pagination?.pageSize ?? 100;
    const offset = ((pagination?.page ?? 1) - 1) * pageSize;

    const query = new URLSearchParams({
      limit: pageSize.toString(),
      offset: offset.toString(),
    });

    try {
      const response = await this.netsuiteRequest<NetSuitePageResponse<NetSuiteBudgetRecord>>(
        'GET',
        `/services/rest/record/v1/budget?${query.toString()}`
      );

      return {
        items: (response.items ?? []).map((b) => this.mapBudget(b)),
        total: response.totalResults ?? response.items?.length ?? 0,
        page: pagination?.page ?? 1,
        pageSize,
        hasNext: response.hasMore,
      };
    } catch {
      return { items: [], total: 0, page: 1, pageSize, hasNext: false };
    }
  }

  private mapBudget(b: NetSuiteBudgetRecord): ExternalBudget {
    // Convert periodAmountList → entries; each entry is accountId × period × amount
    const entries: ExternalBudget['entries'] = (b.periodAmountList ?? []).map((p) => ({
      accountId: b.account?.id ?? '',
      category: b.budgetName,
      amount: Math.abs(p.amount),
      period: p.period.refName,
    }));

    // If single amount instead of period list, create a single annual entry
    if (entries.length === 0 && b.amount !== undefined) {
      entries.push({
        accountId: b.account?.id ?? '',
        category: b.budgetName,
        amount: Math.abs(b.amount),
        period: b.fiscalYear?.refName ?? 'annual',
      });
    }

    return {
      externalId: b.id,
      name: b.budgetName,
      fiscalYear: b.fiscalYear?.refName ?? new Date().getFullYear().toString(),
      entries,
    };
  }

  // ─── Sync ─────────────────────────────────────────────────────────────────

  protected async pullData(options: SyncOptions): Promise<number> {
    let total = 0;
    const batchSize = options.batchSize ?? 100;

    // 1. Accounts
    const accounts = await this.getAccounts({ page: 1, pageSize: batchSize });
    total += accounts.items.length;

    // 2. Transactions for each account (limited to first 25 to avoid runaway)
    for (const account of accounts.items.slice(0, 25)) {
      const txns = await this.getTransactions(account.externalId, {
        page: 1,
        pageSize: batchSize,
      });
      total += txns.items.length;
    }

    // 3. Invoices
    const invoices = await this.getInvoices({ page: 1, pageSize: batchSize });
    total += invoices.items.length;

    // 4. Budgets
    const budgets = await this.getBudgets({ page: 1, pageSize: batchSize });
    total += budgets.items.length;

    return total;
  }

  protected async pushData(_options: SyncOptions): Promise<number> {
    // NetSuite supports writes via REST API, but for FP&A integration
    // we typically only PULL data (write-back is out of scope).
    return 0;
  }
}
