// PATCH 23 — SAGE INTACCT CONNECTOR (Prometheus T-3.17/T-4.6, 2026-06-18)
// ERP for general ledger integration (chart of accounts + GL entries + AP/AR)
/**
 * API Integration Framework - Sage Intacct Connector
 *
 * Connects to Sage Intacct ERP via the official REST API v1.0
 * (https://api.intacct.com/ia/api/v1.0/).
 *
 * Why OAuth2 (3-legged) with Sender Credentials:
 * - Sage Intacct uses a 3-legged OAuth2 flow with a unique twist:
 *   the auth payload includes Sender Credentials (companyId, userId, password)
 *   alongside the OAuth2 access/refresh tokens for tenant scoping.
 * - Each Intacct company has a unique companyId (IAID) and the API enforces
 *   per-company rate limits (150 requests/min per company by default).
 * - The refresh token is valid for 24h; access tokens are short-lived (~1h).
 *
 * Endpoints (FP&A focus):
 * - GET  /objects/GLAccount         — Chart of accounts
 * - GET  /objects/GLEntry           — Journal lines (general ledger)
 * - GET  /objects/Vendor            — Vendor master (AP)
 * - GET  /objects/Customer          — Customer master (AR)
 * - GET  /objects/APBill            — Vendor bills (accounts payable)
 * - GET  /objects/ARInvoice         — Customer invoices (accounts receivable)
 * - GET  /objects/Budget            — Operational budgets
 * - POST /functions/readByQuery      — SQL-like query helper
 * - GET  /company/{companyId}/...   — Company-scoped operations
 *
 * Records (FP&A focus):
 * - GLAccount (chart of accounts)
 * - GLEntry (journal lines)
 * - VendorBill / APBill (AP)
 * - CustomerInvoice / ARInvoice (AR)
 * - Budget (operational)
 * - Employee (HR / payroll)
 *
 * PATCH 23 — SAGE CONNECTOR (Prometheus T-3.17/T-4.6, 2026-06-18)
 * FP&A GL integration for ERP connectors (P0A-04 H2 #2 of 3).
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

// ─── Sage Intacct auth config ─────────────────────────────────────────────────

/**
 * Sage Intacct uses OAuth2 with sender credentials (companyId + userId + password).
 *
 * NOTE: SageAuthConfig is a STANDALONE interface (does NOT extend
 * ConnectorAuthConfig) because the Sage-specific sender credentials do not fit
 * the standard OAuth2Config shape. The ConnectorConfig.auth field accepts this
 * via an unknown cast below; a runtime guard in the constructor ensures
 * required fields exist.
 */
export interface SageAuthConfig {
  type: 'oauth2_sage';
  oauth2: {
    clientId: string;
    clientSecret: string;
    authorizationUrl: string;
    tokenUrl: string;
    scopes: string[];
    redirectUri: string;
    // Sage-specific sender credentials (required for API calls)
    sender: {
      companyId: string; // IAID — Intacct company ID
      userId: string; // Intacct user ID
      password: string; // Intacct user password (NOT the SaaS account password)
    };
  };
}

// ─── Sage Intacct response shapes (subset) ────────────────────────────────────

/**
 * Sage Intacct standard response envelope.
 *
 * `items` is `T[]` because Sage returns individual records inside
 * `result.items`. If you want a single object, wrap it: `T[]` becomes
 * `SageResponseEnvelope<T[]>` to access the array. Using `T` (not `T[]`)
 * yields `items?: T[]` which is what most paginated endpoints return.
 */
interface SageResponseEnvelope<T> {
  result?: {
    data?: T;
    listType?: 'page' | 'iterator';
    page?: number;
    totalCount?: number;
    PageSize?: number;
    numPages?: number;
    currentPage?: number;
    items?: T[];
  };
  fault?: {
    type?: string;
    description?: string;
    detail?: {
      errorcode?: string;
      description?: string;
    };
  };
}

interface SageTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

interface SageGLAccount {
  RECORDNO: string;
  ACCOUNTNO: string;
  TITLE: string;
  ACCOUNTTYPE: string; // 'income' | 'expense' | 'asset' | 'liability' | 'equity'
  NORMALBALANCE: 'debit' | 'credit';
  CURRENCY?: string;
  STATUS: 'active' | 'inactive';
  PARENTID?: string;
  PARENTACCOUNT?: string;
  DEPARTMENT?: string;
  LOCATION?: string;
  WHENCREATED: string;
  WHENMODIFIED: string;
}

interface SageGLEntry {
  RECORDNO: string;
  BATCHNO: string;
  JOURNAL: string; // journal symbol (e.g., 'GJ', 'AP', 'AR')
  ENTRYDATE: string; // YYYY-MM-DD
  ACCOUNTNO: string;
  ACCOUNT_TITLE?: string;
  DEBITAMOUNT: number;
  CREDITAMOUNT: number;
  DESCRIPTION?: string;
  DOCNUMBER?: string;
  CURRENCY?: string;
  EXCHANGERATE?: number;
  DEPARTMENTID?: string;
  LOCATIONID?: string;
  PROJECTID?: string;
  VENDORID?: string;
  CUSTOMERID?: string;
  EMPLOYEEID?: string;
  WHENMODIFIED: string;
}

interface SageVendor {
  RECORDNO: string;
  VENDORID: string;
  NAME: string;
  DISPLAYCONTACT?: {
    COMPANY?: string;
    FIRSTNAME?: string;
    LASTNAME?: string;
    EMAIL1?: string;
    PHONE1?: string;
  };
  STATUS: 'active' | 'inactive';
  COMMENTS?: string;
  CURRENCY?: string;
  WHENMODIFIED: string;
}

interface SageCustomer {
  RECORDNO: string;
  CUSTOMERID: string;
  NAME: string;
  STATUS: 'active' | 'inactive';
  CURRENCY?: string;
  WHENMODIFIED: string;
}

interface _SageAPBill {
  RECORDNO: string;
  RECORDID: string; // human-readable bill number
  VENDORID: string;
  VENDORNAME?: string;
  DATE: string;
  DUEDATE: string;
  TOTAMOUNT: number;
  TOTPAID: number;
  BALANCEAMOUNT: number;
  CURRENCY?: string;
  STATUS?: string;
  DESCRIPTION?: string;
  WHENMODIFIED: string;
}

interface SageARInvoice {
  RECORDNO: string;
  RECORDID: string; // invoice number
  CUSTOMERID: string;
  CUSTOMERNAME?: string;
  DATE: string;
  DUEDATE: string;
  TOTAMOUNT: number;
  TOTPAID: number;
  BALANCEAMOUNT: number;
  CURRENCY?: string;
  STATE?: string; // 'Pending', 'Approved', 'Posted', 'Paid', etc.
  DESCRIPTION?: string;
  WHENMODIFIED: string;
}

interface SageBudget {
  RECORDNO: string;
  BUDGETID: string;
  TITLE: string;
  FISCALYEAR: string;
  CURRENCY?: string;
  WHENMODIFIED: string;
}

// ─── Default mappings ─────────────────────────────────────────────────────────

/**
 * Sage Intacct account types → FP&A canonical types.
 */
const ACCOUNT_TYPE_MAP: Record<string, ExternalAccount['type']> = {
  income: 'revenue',
  otherexpense: 'expense',
  expense: 'expense',
  costofgoodssold: 'expense',
  bank: 'asset',
  othercurrentasset: 'asset',
  fixedasset: 'asset',
  otherasset: 'asset',
  accountsreceivable: 'asset',
  accountspayable: 'liability',
  creditcard: 'liability',
  othercurrentliability: 'liability',
  longtermliability: 'liability',
  equity: 'equity',
  retainedearnings: 'equity',
};

// ─── Sage Connector ───────────────────────────────────────────────────────────

export class SageConnector extends BaseConnector {
  private readonly oauth2Config: NonNullable<SageAuthConfig['oauth2']>;
  private readonly sender: SageAuthConfig['oauth2']['sender'];
  private readonly baseUrl: string;

  constructor(config: ConnectorConfig) {
    // Runtime guard — SageAuthConfig is standalone; verify the auth payload
    // has the required oauth2_sage shape before narrowing.
    const authRaw = config.auth as unknown;
    if (
      !authRaw ||
      typeof authRaw !== 'object' ||
      (authRaw as { type?: unknown }).type !== 'oauth2_sage' ||
      !(authRaw as { oauth2?: unknown }).oauth2
    ) {
      throw new Error(
        'SageConnector requires ConnectorConfig.auth with type="oauth2_sage" and oauth2 payload'
      );
    }
    const auth = authRaw as SageAuthConfig;
    const oa = auth.oauth2;

    // Validate sender credentials
    if (!oa.sender || !oa.sender.companyId || !oa.sender.userId || !oa.sender.password) {
      throw new Error(
        'SageConnector requires oauth2.sender with companyId, userId, password (Intacct sender credentials)'
      );
    }

    super({
      ...config,
      baseUrl: config.baseUrl ?? 'https://api.intacct.com/ia/api/v1.0',
    });

    this.oauth2Config = oa;
    this.sender = oa.sender;
    this.baseUrl = 'https://api.intacct.com/ia/api/v1.0';
  }

  // ─── OAuth2 token management ──────────────────────────────────────────────

  /**
   * Exchange authorization code for OAuth2 tokens via Sage Intacct token endpoint.
   *
   * Sage Intacct OAuth2 endpoint: https://api.intacct.com/oauth2/token
   * Note: The token endpoint is OUTSIDE the /ia/api/v1.0 base path.
   */
  async exchangeCodeForTokens(
    code: string,
    redirectUri: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresAt: number;
  }> {
    const tokenUrl = this.oauth2Config.tokenUrl || 'https://api.intacct.com/oauth2/token';

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: this.oauth2Config.clientId,
      client_secret: this.oauth2Config.clientSecret,
      redirect_uri: redirectUri,
    });

    try {
      const response = await this.client.post<SageTokenResponse>(tokenUrl, params.toString());
      const data = response.data;
      if (!data.access_token) {
        throw new Error('Sage token endpoint returned no access_token');
      }
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenType: data.token_type || 'Bearer',
        expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
      };
    } catch (error: unknown) {
      throw new Error(
        `Sage OAuth2 code exchange failed: ${error instanceof Error ? error.message : 'unknown error'}`
      );
    }
  }

  /**
   * Refresh OAuth2 access token. Sage Intacct refresh tokens are valid for 24h.
   */
  async refreshAccessToken(): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresAt: number;
  }> {
    const currentTokens = (
      this.client as unknown as { getOAuthTokens?: () => unknown }
    ).getOAuthTokens?.();
    const refreshToken = (currentTokens as { refreshToken?: string } | null)?.refreshToken ?? null;
    if (!refreshToken) {
      throw new Error('Sage OAuth2 refresh failed: no refresh token available');
    }

    const tokenUrl = this.oauth2Config.tokenUrl || 'https://api.intacct.com/oauth2/token';

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.oauth2Config.clientId,
      client_secret: this.oauth2Config.clientSecret,
    });

    try {
      const response = await this.client.post<SageTokenResponse>(tokenUrl, params.toString());
      const data = response.data;
      if (!data.access_token) {
        throw new Error('Sage token refresh returned no access_token');
      }
      return {
        accessToken: data.access_token,
        // Refresh token rotation — Intacct issues a new refresh token
        refreshToken: data.refresh_token ?? refreshToken,
        tokenType: data.token_type || 'Bearer',
        expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
      };
    } catch (error: unknown) {
      throw new Error(
        `Sage OAuth2 token refresh failed: ${error instanceof Error ? error.message : 'unknown error'}`
      );
    }
  }

  // ─── Health check ──────────────────────────────────────────────────────────

  protected async performHealthCheck(): Promise<ConnectorHealth> {
    try {
      // Minimal request: GET a single GLAccount with limit=1
      // Per-company rate limit: 150 req/min
      const response = await this.client.get<SageResponseEnvelope<unknown>>('/objects/GLAccount', {
        companyId: this.sender.companyId,
        pagesize: 1,
      });
      const status =
        response.data.fault !== undefined ? ('error' as const) : ('connected' as const);

      const result: ConnectorHealth = {
        status,
        lastSyncAt: Date.now(),
      };

      // Best-effort: parse rate limit info from response headers
      const remaining = (response.headers as Record<string, string>)['x-ratelimit-remaining'];
      const reset = (response.headers as Record<string, string>)['x-ratelimit-reset'];
      if (remaining !== undefined) {
        result.rateLimitRemaining = parseInt(remaining, 10);
      }
      if (reset !== undefined) {
        result.rateLimitReset = parseInt(reset, 10) * 1000;
      }

      if (status === 'error' && response.data.fault) {
        result.lastError =
          response.data.fault.description ??
          response.data.fault.detail?.description ??
          'Unknown Sage Intacct fault';
      }

      return result;
    } catch (error: unknown) {
      return {
        status: 'error',
        lastError: error instanceof Error ? error.message : 'Sage health check failed',
      };
    }
  }

  // ─── Chart of Accounts (GLAccount) ─────────────────────────────────────────

  async getAccounts(pagination?: PaginationParams): Promise<PaginatedResponse<ExternalAccount>> {
    const pageSize = pagination?.pageSize ?? 100;
    const page = pagination?.page ?? 1;

    const params: Record<string, string | number> = {
      companyId: this.sender.companyId,
      pagesize: pageSize,
      page,
    };

    try {
      const response = await this.client.get<SageResponseEnvelope<SageGLAccount>>(
        '/objects/GLAccount',
        params
      );

      const list = response.data.result?.items ?? [];
      const totalCount = response.data.result?.totalCount ?? list.length;

      return {
        items: list.map((a) => this.mapAccount(a)),
        total: totalCount,
        page,
        pageSize,
        hasNext: (response.data.result?.numPages ?? 1) > page,
      };
    } catch {
      return { items: [], total: 0, page: 1, pageSize, hasNext: false };
    }
  }

  private mapAccount(a: SageGLAccount): ExternalAccount {
    const normalizedType = (a.ACCOUNTTYPE ?? '').toLowerCase().replace(/[^a-z]/g, '');
    return {
      externalId: a.RECORDNO,
      name: a.TITLE,
      type: ACCOUNT_TYPE_MAP[normalizedType] ?? 'asset',
      subtype: a.ACCOUNTTYPE,
      currency: a.CURRENCY ?? 'USD',
      balance: 0, // Balance requires separate /GLAccount/{id}/balance call
      active: a.STATUS === 'active',
      lastUpdated: a.WHENMODIFIED ? new Date(a.WHENMODIFIED).getTime() : Date.now(),
    };
  }

  // ─── General Ledger Entries (GLEntry) ──────────────────────────────────────

  async getTransactions(
    accountId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<ExternalTransaction>> {
    const pageSize = pagination?.pageSize ?? 100;
    const page = pagination?.page ?? 1;

    // Use readByQuery to filter by ACCOUNTNO
    const query = `FROM GLEntry WHERE ACCOUNTNO = '${accountId}' ORDER BY ENTRYDATE DESC`;

    try {
      const response = await this.client.post<SageResponseEnvelope<SageGLEntry>>(
        '/functions/readByQuery',
        {
          companyId: this.sender.companyId,
          query,
          pagesize: pageSize,
          page,
        }
      );

      const list = response.data.result?.items ?? [];
      const totalCount = response.data.result?.totalCount ?? list.length;

      return {
        items: list.map((entry) => this.mapEntry(entry, accountId)),
        total: totalCount,
        page,
        pageSize,
        hasNext: (response.data.result?.numPages ?? 1) > page,
      };
    } catch {
      return { items: [], total: 0, page: 1, pageSize, hasNext: false };
    }
  }

  private mapEntry(entry: SageGLEntry, accountId: string): ExternalTransaction {
    // GLEntry has both DEBITAMOUNT and CREDITAMOUNT; pick the non-zero side
    const hasDebit = entry.DEBITAMOUNT > 0;
    const amount = hasDebit ? entry.DEBITAMOUNT : entry.CREDITAMOUNT;
    return {
      externalId: entry.RECORDNO,
      accountId,
      date: entry.ENTRYDATE,
      description: entry.DESCRIPTION ?? entry.JOURNAL ?? entry.DOCNUMBER ?? 'GL Entry',
      amount,
      currency: entry.CURRENCY ?? 'USD',
      type: hasDebit ? 'debit' : 'credit',
      category: entry.JOURNAL,
      reference: entry.DOCNUMBER,
      metadata: {
        batchNo: entry.BATCHNO,
        vendorId: entry.VENDORID,
        customerId: entry.CUSTOMERID,
        departmentId: entry.DEPARTMENTID,
        locationId: entry.LOCATIONID,
        projectId: entry.PROJECTID,
      },
    };
  }

  // ─── Invoices (APBill + ARInvoice) ─────────────────────────────────────────

  async getInvoices(pagination?: PaginationParams): Promise<PaginatedResponse<ExternalInvoice>> {
    const pageSize = pagination?.pageSize ?? 100;
    const page = pagination?.page ?? 1;

    // Fetch AR invoices (most common FP&A need)
    try {
      const response = await this.client.get<SageResponseEnvelope<SageARInvoice>>(
        '/objects/ARInvoice',
        { companyId: this.sender.companyId, pagesize: pageSize, page }
      );

      const list = response.data.result?.items ?? [];
      const totalCount = response.data.result?.totalCount ?? list.length;

      return {
        items: list.map((a) => this.mapARInvoice(a)),
        total: totalCount,
        page,
        pageSize,
        hasNext: (response.data.result?.numPages ?? 1) > page,
      };
    } catch {
      return { items: [], total: 0, page: 1, pageSize, hasNext: false };
    }
  }

  private mapARInvoice(inv: SageARInvoice): ExternalInvoice {
    return {
      externalId: inv.RECORDNO,
      number: inv.RECORDID,
      customerId: inv.CUSTOMERID,
      date: inv.DATE,
      dueDate: inv.DUEDATE,
      status: this.mapInvoiceStatus(inv.STATE),
      subtotal: inv.TOTAMOUNT,
      tax: 0, // Tax breakdown requires line item fetch
      total: inv.TOTAMOUNT,
      currency: inv.CURRENCY ?? 'USD',
      lineItems: [],
    };
  }

  private mapInvoiceStatus(state: string | undefined): ExternalInvoice['status'] {
    switch (state?.toLowerCase()) {
      case 'paid':
        return 'paid';
      case 'draft':
        return 'draft';
      case 'pending':
      case 'approved':
      case 'posted':
        return 'sent';
      case 'void':
      case 'voided':
        return 'void';
      default:
        return 'draft';
    }
  }

  // ─── Vendors (AP) ──────────────────────────────────────────────────────────

  async getVendors(pagination?: PaginationParams): Promise<PaginatedResponse<SageVendor>> {
    const pageSize = pagination?.pageSize ?? 100;
    const page = pagination?.page ?? 1;

    try {
      const response = await this.client.get<SageResponseEnvelope<SageVendor>>('/objects/Vendor', {
        companyId: this.sender.companyId,
        pagesize: pageSize,
        page,
      });

      const list = response.data.result?.items ?? [];
      const totalCount = response.data.result?.totalCount ?? list.length;

      return {
        items: list,
        total: totalCount,
        page,
        pageSize,
        hasNext: (response.data.result?.numPages ?? 1) > page,
      };
    } catch {
      return { items: [], total: 0, page: 1, pageSize, hasNext: false };
    }
  }

  // ─── Customers (AR) ────────────────────────────────────────────────────────

  async getCustomers(pagination?: PaginationParams): Promise<PaginatedResponse<SageCustomer>> {
    const pageSize = pagination?.pageSize ?? 100;
    const page = pagination?.page ?? 1;

    try {
      const response = await this.client.get<SageResponseEnvelope<SageCustomer>>(
        '/objects/Customer',
        { companyId: this.sender.companyId, pagesize: pageSize, page }
      );

      const list = response.data.result?.items ?? [];
      const totalCount = response.data.result?.totalCount ?? list.length;

      return {
        items: list,
        total: totalCount,
        page,
        pageSize,
        hasNext: (response.data.result?.numPages ?? 1) > page,
      };
    } catch {
      return { items: [], total: 0, page: 1, pageSize, hasNext: false };
    }
  }

  // ─── Budgets ───────────────────────────────────────────────────────────────

  async getBudgets(pagination?: PaginationParams): Promise<PaginatedResponse<ExternalBudget>> {
    const pageSize = pagination?.pageSize ?? 100;
    const page = pagination?.page ?? 1;

    try {
      const response = await this.client.get<SageResponseEnvelope<SageBudget>>('/objects/Budget', {
        companyId: this.sender.companyId,
        pagesize: pageSize,
        page,
      });

      const list = response.data.result?.items ?? [];
      const totalCount = response.data.result?.totalCount ?? list.length;

      // Sage budgets are headers; line items (account × period × amount) require
      // a separate readByQuery on BudgetLine. We expose the header + empty
      // entries — downstream consumers should call getBudgetLines() if needed.
      return {
        items: list.map((b) => this.mapBudget(b)),
        total: totalCount,
        page,
        pageSize,
        hasNext: (response.data.result?.numPages ?? 1) > page,
      };
    } catch {
      return { items: [], total: 0, page: 1, pageSize, hasNext: false };
    }
  }

  private mapBudget(b: SageBudget): ExternalBudget {
    return {
      externalId: b.RECORDNO,
      name: b.TITLE,
      fiscalYear: b.FISCALYEAR,
      entries: [], // Entries require separate BudgetLine fetch
    };
  }

  // ─── Aggregate GL Balance ──────────────────────────────────────────────────

  /**
   * Pure function: roll up GL entries into a balance summary.
   *
   * Used by the FP&A engine to compute net change by account and total
   * debits/credits across the period. Returned shape is suitable for direct
   * ingestion into the FP&A `accounts` projection.
   */
  aggregateGLBalance(
    entries: SageGLEntry[],
    accountId?: string
  ): {
    accountId: string | null;
    totalDebits: number;
    totalCredits: number;
    netChange: number;
    entryCount: number;
  } {
    let totalDebits = 0;
    let totalCredits = 0;
    for (const e of entries) {
      totalDebits += e.DEBITAMOUNT ?? 0;
      totalCredits += e.CREDITAMOUNT ?? 0;
    }
    return {
      accountId: accountId ?? null,
      totalDebits,
      totalCredits,
      netChange: totalDebits - totalCredits,
      entryCount: entries.length,
    };
  }

  // ─── Sync ──────────────────────────────────────────────────────────────────

  protected async pullData(options: SyncOptions): Promise<number> {
    let total = 0;
    const batchSize = options.batchSize ?? 100;

    // 1. Chart of accounts
    const accounts = await this.getAccounts({ page: 1, pageSize: batchSize });
    total += accounts.items.length;

    // 2. GL entries for each account (limit to first 25 to avoid runaway)
    for (const account of accounts.items.slice(0, 25)) {
      const txns = await this.getTransactions(account.externalId, {
        page: 1,
        pageSize: batchSize,
      });
      total += txns.items.length;
    }

    // 3. AR invoices
    const invoices = await this.getInvoices({ page: 1, pageSize: batchSize });
    total += invoices.items.length;

    // 4. Budgets
    const budgets = await this.getBudgets({ page: 1, pageSize: batchSize });
    total += budgets.items.length;

    return total;
  }

  protected async pushData(_options: SyncOptions): Promise<number> {
    // Sage supports writes via REST API, but for FP&A integration
    // we typically only PULL data (write-back is out of scope).
    return 0;
  }
}
