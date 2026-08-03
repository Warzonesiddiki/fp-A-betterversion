/**
 * API Integration Framework - Microsoft Dynamics 365 Connector
 *
 * Connects to Microsoft Dynamics 365 / Dataverse via the Web API v9.2
 * (https://{org}.crm.dynamics.com/api/data/v9.2/).
 *
 * Why OAuth2 client_credentials:
 * - Dynamics 365 server-to-server integrations typically use the
 *   client_credentials grant (no interactive user). The token endpoint
 *   is `https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token`.
 * - Scope is `https://{org}.crm.dynamics.com/.default` (single-scope token).
 * - Access tokens are short-lived (~1h); refresh tokens are NOT issued
 *   for client_credentials, so the connector re-acquires the token on
 *   expiry.
 * - Dataverse enforces service protection API limits (typically 5,000
 *   requests / 5 min / user, with adaptive throttling for sustained load).
 *
 * Endpoints (FP&A focus):
 * - GET    /accounts                 — Customers (Account entity)
 * - GET    /contacts                 — Contacts
 * - GET    /invoices                 — Invoices (AR)
 * - GET    /products                 — Product catalog
 * - GET    /opportunities            — Sales pipeline (revenue forecast)
 * - GET    /transactioncurrencies    — Currency list
 * - POST   /accounts                 — Create account
 * - PATCH  /accounts({id})           — Update account
 * - DELETE /accounts({id})           — Delete account
 * - GET    /WhoAmI                   — Health-check / identity probe
 *
 * Records (FP&A focus):
 * - Account (customers)
 * - Invoice (AR)
 * - Product (catalog)
 * - Opportunity (revenue forecast pipeline)
 * - TransactionCurrency (FX)
 *
 * PATCH 24 — DYNAMICS 365 CONNECTOR (Prometheus T-3.18/T-4.7, 2026-06-18)
 * Dataverse integration for ERP/CRM (P0A-04 H2 #3 of 3).
 *
 * MONEY MIGRATION (2026-08-03): Opportunity revenue aggregation
 * (openPipeline, weightedForecast, closedRevenue, currencyBreakdown) and the
 * invoice subtotal (total − tax) use the canonical money primitive
 * (`src/utils/money.ts`). External amounts are rounded with declared decimal
 * half-up semantics before aggregation; weighted contributions are summed at
 * full decimal precision and the aggregate is cent-rounded. Probability
 * percentages, stage weights, record counts, and timestamps are not currency.
 */

import { multiplyMoney, percentOf, roundTo, subtractMoney, sumMoney } from '@/utils/money';
import { BaseConnector } from './BaseConnector';
import type {
  ConnectorConfig,
  ConnectorHealth,
  ExternalAccount,
  ExternalInvoice,
  PaginatedResponse,
  PaginationParams,
  SyncOptions,
} from './types';

// ─── Dataverse auth config ───────────────────────────────────────────────────

/**
 * Microsoft Dataverse OAuth2 config. Uses the standard OAuth2Config shape
 * (not a standalone interface like Sage) because the auth flow is a
 * regular client_credentials grant with a per-tenant URL.
 *
 * The `dataverse` block carries Dataverse-specific fields:
 * - tenantId:    Azure AD tenant ID (UUID)
 * - orgUrl:      e.g. `https://contoso.crm.dynamics.com` (no trailing /)
 * - scope:       defaults to `{orgUrl}/.default`
 */
export interface DataverseAuthConfig {
  type: 'oauth2_dataverse';
  oauth2: {
    clientId: string;
    clientSecret: string;
    tokenUrl: string; // `https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token`
    scopes: string[];
    dataverse: {
      tenantId: string;
      orgUrl: string; // base URL with no trailing slash
      scope?: string; // optional override (defaults to `${orgUrl}/.default`)
    };
  };
}

// ─── Dataverse response shapes (subset) ───────────────────────────────────────

/**
 * Dataverse OData v4.0 response envelope.
 *
 * `value` is `T[]` because Dataverse returns a JSON array under the
 * `value` property. Use `DataverseODataEnvelope<T>` (singular) to get
 * `value: T[]` — equivalent to how SageResponseEnvelope<T> is used.
 */
interface DataverseODataEnvelope<T> {
  '@odata.context'?: string;
  '@odata.nextLink'?: string;
  value: T[];
}

interface DataverseTokenResponse {
  token_type: string;
  expires_in: number;
  ext_expires_in?: number;
  access_token: string;
}

interface DynamicsAccount {
  accountid: string;
  name: string;
  accountnumber?: string;
  industrycode?: number; // 1=Agriculture, 2=Apparel, ... (option set)
  revenue?: number;
  numberofemployees?: number;
  address1_city?: string;
  address1_stateorprovince?: string;
  address1_country?: string;
  telephone1?: string;
  websiteurl?: string;
  accountcategorycode?: number; // 1=Preferred Customer
  statecode: number; // 0=Active, 1=Inactive
  statuscode?: number;
  _transactioncurrencyid_value?: string;
  createdon: string;
  modifiedon: string;
}

interface DynamicsContact {
  contactid: string;
  fullname: string;
  firstname?: string;
  lastname?: string;
  emailaddress1?: string;
  telephone1?: string;
  jobtitle?: string;
  parentcustomerid_account_accountid?: string;
  statecode: number;
  createdon: string;
  modifiedon: string;
}

interface DynamicsInvoice {
  invoiceid: string;
  invoicenumber: string;
  name: string;
  customerid_account_accountid?: string;
  customerid_contact_contactid?: string;
  totalamount: number;
  totalamount_base?: number;
  discountamount?: number;
  freightamount?: number;
  totaltax?: number;
  duedate?: string; // ISO 8601
  invoiceid_date?: string; // ISO 8601 (invoice date)
  statuscode: number; // 1=Active, 2=Closed, 3=Paid, 4=Canceled
  statecode: number; // 0=Active, 1=Inactive (soft-delete)
  _transactioncurrencyid_value?: string;
  createdon: string;
  modifiedon: string;
}

interface DynamicsProduct {
  productid: string;
  productnumber: string;
  name: string;
  description?: string;
  price?: number;
  standardcost?: number;
  currentcost?: number;
  quantityonhand?: number;
  productstructure?: number; // 1=Product, 2=Product Family, 3=Bundle
  statecode: number;
  _transactioncurrencyid_value?: string;
  createdon: string;
  modifiedon: string;
}

interface DynamicsOpportunity {
  opportunityid: string;
  name: string;
  customerid_account_accountid?: string;
  estimatedvalue: number;
  estimatedcloseate?: string; // ISO 8601
  closeprobability: number; // 0-100 integer percentage
  statecode: number; // 0=Open, 1=Won, 2=Lost
  statuscode: number; // 1=In Progress, 2=On Hold, 3=Won, 4=Canceled, 5=Out-Sold
  stepname?: string; // sales stage
  salesstagecode?: number;
  _transactioncurrencyid_value?: string;
  createdon: string;
  modifiedon: string;
}

// ─── Default mappings ─────────────────────────────────────────────────────────

/**
 * Dynamics account industrycode → human-readable label.
 * Source: Microsoft Dataverse option set (subset).
 */
const INDUSTRY_MAP: Record<number, string> = {
  1: 'Agriculture',
  2: 'Apparel',
  3: 'Banking',
  4: 'Biotechnology',
  5: 'Chemicals',
  6: 'Communications',
  7: 'Construction',
  8: 'Consulting',
  9: 'Education',
  10: 'Electronics',
  11: 'Energy',
  12: 'Engineering',
  13: 'Entertainment',
  14: 'Environmental',
  15: 'Finance',
  16: 'Food & Beverage',
  17: 'Government',
  18: 'Healthcare',
  19: 'Hospitality',
  20: 'Insurance',
  21: 'Machinery',
  22: 'Manufacturing',
  23: 'Media',
  24: 'Not For Profit',
  25: 'Other',
  26: 'Pharmaceuticals',
  27: 'Professional Services',
  28: 'Real Estate',
  29: 'Retail',
  30: 'Software',
  31: 'Technology',
  32: 'Telecommunications',
  33: 'Transportation',
  34: 'Utilities',
  35: 'Wholesale',
};

const INVOICE_STATUS_MAP: Record<number, ExternalInvoice['status']> = {
  1: 'draft', // Active
  2: 'sent', // Closed (submitted)
  3: 'paid', // Paid
  4: 'void', // Canceled
  100001: 'sent', // Partial (custom)
  100002: 'overdue', // Past Due (custom)
};

const OPPORTUNITY_STAGE_WEIGHT: Record<number, number> = {
  1: 0.1, // Qualify
  2: 0.25, // Develop
  3: 0.5, // Propose
  4: 0.75, // Negotiate
  5: 1.0, // Close
};

const FORECAST_CATEGORY_MAP: Record<number, string> = {
  1: 'Pipeline', // Qualify
  2: 'Pipeline', // Develop
  3: 'BestCase', // Propose
  4: 'Commit', // Negotiate
  5: 'Closed', // Close
};

// ─── Dynamics Connector ───────────────────────────────────────────────────────

export class DynamicsConnector extends BaseConnector {
  private readonly oauth2Config: NonNullable<DataverseAuthConfig['oauth2']>;
  private readonly dataverseConfig: NonNullable<DataverseAuthConfig['oauth2']['dataverse']>;
  private readonly apiBaseUrl: string;

  constructor(config: ConnectorConfig) {
    // Runtime guard — DataverseAuthConfig is structurally similar to
    // ConnectorAuthConfig; verify the auth payload has the right shape.
    const authRaw = config.auth as unknown;
    if (
      !authRaw ||
      typeof authRaw !== 'object' ||
      (authRaw as { type?: unknown }).type !== 'oauth2_dataverse' ||
      !(authRaw as { oauth2?: unknown }).oauth2
    ) {
      throw new Error(
        'DynamicsConnector requires ConnectorConfig.auth with type="oauth2_dataverse" and oauth2 payload'
      );
    }
    const auth = authRaw as DataverseAuthConfig;
    const oa = auth.oauth2;

    if (!oa.dataverse || !oa.dataverse.tenantId || !oa.dataverse.orgUrl) {
      throw new Error(
        'DynamicsConnector requires oauth2.dataverse with tenantId and orgUrl (e.g. https://contoso.crm.dynamics.com)'
      );
    }

    const orgUrl = oa.dataverse.orgUrl.replace(/\/+$/, '');
    const apiBase = `${orgUrl}/api/data/v9.2`;

    super({
      ...config,
      baseUrl: config.baseUrl ?? apiBase,
    });

    this.oauth2Config = oa;
    this.dataverseConfig = oa.dataverse;
    this.apiBaseUrl = apiBase;
  }

  // ─── OAuth2 token management (client_credentials) ──────────────────────────

  /**
   * Acquire an OAuth2 access token via the client_credentials grant.
   *
   * Dataverse does not issue refresh tokens for client_credentials, so
   * this is a one-shot acquisition. The connector's `client` retains
   * the token and re-uses it until expiry, then calls this method again.
   */
  async exchangeCodeForTokens(): Promise<{
    accessToken: string;
    refreshToken: null; // client_credentials does not issue refresh tokens
    tokenType: string;
    expiresAt: number;
  }> {
    const tokenUrl =
      this.oauth2Config.tokenUrl ||
      `https://login.microsoftonline.com/${this.dataverseConfig.tenantId}/oauth2/v2.0/token`;

    const scope = this.dataverseConfig.scope || `${this.dataverseConfig.orgUrl}/.default`;

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.oauth2Config.clientId,
      client_secret: this.oauth2Config.clientSecret,
      scope,
    });

    try {
      const response = await this.client.post<DataverseTokenResponse>(tokenUrl, params.toString());
      const data = response.data;
      if (!data.access_token) {
        throw new Error('Dataverse token endpoint returned no access_token');
      }
      return {
        accessToken: data.access_token,
        refreshToken: null,
        tokenType: data.token_type || 'Bearer',
        expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
      };
    } catch (error: unknown) {
      throw new Error(
        `Dataverse OAuth2 client_credentials exchange failed: ${error instanceof Error ? error.message : 'unknown error'}`
      );
    }
  }

  /**
   * Dataverse client_credentials does NOT support refresh — this method
   * exists to satisfy the BaseConnector contract and re-acquires a fresh
   * token via exchangeCodeForTokens().
   */
  async refreshAccessToken(): Promise<{
    accessToken: string;
    refreshToken: null;
    tokenType: string;
    expiresAt: number;
  }> {
    return this.exchangeCodeForTokens();
  }

  // ─── Health check ──────────────────────────────────────────────────────────

  protected async performHealthCheck(): Promise<ConnectorHealth> {
    try {
      // Minimal request: GET /WhoAmI — fast, cheap, and confirms auth + reach.
      const response = await this.client.get<{ UserId: string; BusinessUnitId: string }>('/WhoAmI');
      const status =
        response.data && response.data.UserId ? ('connected' as const) : ('error' as const);

      const result: ConnectorHealth = {
        status,
        lastSyncAt: Date.now(),
      };

      if (status === 'error') {
        result.lastError = 'Dataverse WhoAmI returned no UserId';
      }

      return result;
    } catch (error: unknown) {
      return {
        status: 'error',
        lastError: error instanceof Error ? error.message : 'Dataverse health check failed',
      };
    }
  }

  // ─── Accounts (customers) ──────────────────────────────────────────────────

  async getAccounts(pagination?: PaginationParams): Promise<PaginatedResponse<ExternalAccount>> {
    const top = pagination?.pageSize ?? 100;
    const skip = pagination?.page ? (pagination.page - 1) * top : 0;

    try {
      const response = await this.client.get<DataverseODataEnvelope<DynamicsAccount>>('/accounts', {
        $top: top,
        $skip: skip,
        $select:
          'accountid,name,accountnumber,industrycode,revenue,numberofemployees,address1_city,address1_stateorprovince,address1_country,telephone1,websiteurl,accountcategorycode,statecode,statuscode,_transactioncurrencyid_value,createdon,modifiedon',
      });

      const list = response.data.value ?? [];
      const hasNext = !!response.data['@odata.nextLink'];

      return {
        items: list.map((a) => this.mapAccount(a)),
        total: list.length, // Dataverse does not return totalCount on OData; consumers use @odata.nextLink
        page: pagination?.page ?? 1,
        pageSize: top,
        hasNext,
      };
    } catch {
      return { items: [], total: 0, page: 1, pageSize: top, hasNext: false };
    }
  }

  private mapAccount(a: DynamicsAccount): ExternalAccount {
    return {
      externalId: a.accountid,
      name: a.name,
      type: 'asset', // Dynamics Account ≈ customer (AR); type is fixed.
      subtype: INDUSTRY_MAP[a.industrycode ?? -1] ?? 'Other',
      currency: a._transactioncurrencyid_value ?? 'USD',
      balance: a.revenue ?? 0,
      active: a.statecode === 0,
      lastUpdated: a.modifiedon ? new Date(a.modifiedon).getTime() : Date.now(),
    };
  }

  // ─── Contacts ──────────────────────────────────────────────────────────────

  async getContacts(pagination?: PaginationParams): Promise<PaginatedResponse<DynamicsContact>> {
    const top = pagination?.pageSize ?? 100;
    const skip = pagination?.page ? (pagination.page - 1) * top : 0;

    try {
      const response = await this.client.get<DataverseODataEnvelope<DynamicsContact>>('/contacts', {
        $top: top,
        $skip: skip,
      });

      const list = response.data.value ?? [];
      const hasNext = !!response.data['@odata.nextLink'];

      return {
        items: list,
        total: list.length,
        page: pagination?.page ?? 1,
        pageSize: top,
        hasNext,
      };
    } catch {
      return { items: [], total: 0, page: 1, pageSize: top, hasNext: false };
    }
  }

  // ─── Invoices (AR) ─────────────────────────────────────────────────────────

  async getInvoices(pagination?: PaginationParams): Promise<PaginatedResponse<ExternalInvoice>> {
    const top = pagination?.pageSize ?? 100;
    const skip = pagination?.page ? (pagination.page - 1) * top : 0;

    try {
      const response = await this.client.get<DataverseODataEnvelope<DynamicsInvoice>>('/invoices', {
        $top: top,
        $skip: skip,
        $select:
          'invoiceid,invoicenumber,name,customerid_account_accountid,customerid_contact_contactid,totalamount,totalamount_base,discountamount,freightamount,totaltax,duedate,invoiceid_date,statuscode,statecode,_transactioncurrencyid_value,createdon,modifiedon',
      });

      const list = response.data.value ?? [];
      const hasNext = !!response.data['@odata.nextLink'];

      return {
        items: list.map((inv) => this.mapInvoice(inv)),
        total: list.length,
        page: pagination?.page ?? 1,
        pageSize: top,
        hasNext,
      };
    } catch {
      return { items: [], total: 0, page: 1, pageSize: top, hasNext: false };
    }
  }

  private mapInvoice(inv: DynamicsInvoice): ExternalInvoice {
    return {
      externalId: inv.invoiceid,
      number: inv.invoicenumber,
      customerId: inv.customerid_account_accountid ?? inv.customerid_contact_contactid ?? '',
      date: inv.invoiceid_date ?? inv.createdon,
      dueDate: inv.duedate ?? inv.createdon,
      status: INVOICE_STATUS_MAP[inv.statuscode] ?? 'draft',
      // Subtotal = total − tax is currency arithmetic: exact decimal
      // subtraction, half-up to cents.
      subtotal: roundTo(subtractMoney(inv.totalamount ?? 0, inv.totaltax ?? 0)),
      tax: inv.totaltax ?? 0,
      total: inv.totalamount ?? 0,
      currency: inv._transactioncurrencyid_value ?? 'USD',
      lineItems: [], // Line items require separate invoiceDetail fetch
    };
  }

  // ─── Products (catalog) ────────────────────────────────────────────────────

  async getProducts(pagination?: PaginationParams): Promise<PaginatedResponse<DynamicsProduct>> {
    const top = pagination?.pageSize ?? 100;
    const skip = pagination?.page ? (pagination.page - 1) * top : 0;

    try {
      const response = await this.client.get<DataverseODataEnvelope<DynamicsProduct>>('/products', {
        $top: top,
        $skip: skip,
        $select:
          'productid,productnumber,name,description,price,standardcost,currentcost,quantityonhand,productstructure,statecode,_transactioncurrencyid_value,createdon,modifiedon',
      });

      const list = response.data.value ?? [];
      const hasNext = !!response.data['@odata.nextLink'];

      return {
        items: list,
        total: list.length,
        page: pagination?.page ?? 1,
        pageSize: top,
        hasNext,
      };
    } catch {
      return { items: [], total: 0, page: 1, pageSize: top, hasNext: false };
    }
  }

  // ─── Opportunities (revenue forecast) ─────────────────────────────────────

  async getOpportunities(
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<DynamicsOpportunity>> {
    const top = pagination?.pageSize ?? 100;
    const skip = pagination?.page ? (pagination.page - 1) * top : 0;

    try {
      const response = await this.client.get<DataverseODataEnvelope<DynamicsOpportunity>>(
        '/opportunities',
        {
          $top: top,
          $skip: skip,
          $select:
            'opportunityid,name,customerid_account_accountid,estimatedvalue,estimatedcloseate,closeprobability,statecode,statuscode,stepname,salesstagecode,_transactioncurrencyid_value,createdon,modifiedon',
        }
      );

      const list = response.data.value ?? [];
      const hasNext = !!response.data['@odata.nextLink'];

      return {
        items: list,
        total: list.length,
        page: pagination?.page ?? 1,
        pageSize: top,
        hasNext,
      };
    } catch {
      return { items: [], total: 0, page: 1, pageSize: top, hasNext: false };
    }
  }

  // ─── Aggregate Revenue (PURE FUNCTION) ─────────────────────────────────────

  /**
   * Pure function: roll up opportunities into a weighted revenue forecast.
   *
   * For each opportunity:
   * - Won  (statecode=1): included in `closed` at full value
   * - Lost (statecode=2): excluded entirely
   * - Open (statecode=0): included in `weighted` at closeprobability * value
   *   (or, if closeprobability is 0, at OPPORTUNITY_STAGE_WEIGHT[stepname/salesstagecode])
   *
   * Returned shape is suitable for direct ingestion into the FP&A
   * `revenueForecast` projection.
   */
  aggregateDynamicsRevenue(opportunities: DynamicsOpportunity[]): {
    openCount: number;
    wonCount: number;
    lostCount: number;
    openPipeline: number;
    weightedForecast: number;
    closedRevenue: number;
    currencyBreakdown: Record<string, number>;
  } {
    let openCount = 0;
    let wonCount = 0;
    let lostCount = 0;
    const openPipelineValues: number[] = [];
    const weightedValues: ReturnType<typeof percentOf>[] = [];
    const closedRevenueValues: number[] = [];
    const currencyValues: Record<string, number[]> = {};

    for (const opp of opportunities) {
      // External opportunity values are currency; round each imported amount
      // with declared decimal half-up semantics before aggregation.
      const value = roundTo(opp.estimatedvalue ?? 0);
      const currency = opp._transactioncurrencyid_value ?? 'USD';

      if (opp.statecode === 1) {
        // Won
        wonCount += 1;
        closedRevenueValues.push(value);
        (currencyValues[currency] ??= []).push(value);
      } else if (opp.statecode === 2) {
        // Lost
        lostCount += 1;
      } else {
        // Open
        openCount += 1;
        openPipelineValues.push(value);
        const probPct = opp.closeprobability ?? 0;
        const stageWeight = OPPORTUNITY_STAGE_WEIGHT[opp.salesstagecode ?? 0] ?? 0;
        // Weighted forecast = value × probability% / 100, or value × stage
        // weight when no probability is set. Both are currency products at
        // full decimal precision; the aggregate is cent-rounded below.
        weightedValues.push(
          probPct > 0 ? percentOf(value, probPct) : multiplyMoney(value, stageWeight)
        );
      }
    }

    const openPipeline = roundTo(sumMoney(openPipelineValues));
    const weightedForecast = roundTo(sumMoney(weightedValues));
    const closedRevenue = roundTo(sumMoney(closedRevenueValues));
    const currencyBreakdown: Record<string, number> = {};
    for (const [curr, values] of Object.entries(currencyValues)) {
      currencyBreakdown[curr] = roundTo(sumMoney(values));
    }

    return {
      openCount,
      wonCount,
      lostCount,
      openPipeline,
      weightedForecast,
      closedRevenue,
      currencyBreakdown,
    };
  }

  // ─── Sync ──────────────────────────────────────────────────────────────────

  protected async pullData(options: SyncOptions): Promise<number> {
    let total = 0;
    const batchSize = options.batchSize ?? 100;

    // 1. Accounts
    const accounts = await this.getAccounts({ page: 1, pageSize: batchSize });
    total += accounts.items.length;

    // 2. Invoices
    const invoices = await this.getInvoices({ page: 1, pageSize: batchSize });
    total += invoices.items.length;

    // 3. Products
    const products = await this.getProducts({ page: 1, pageSize: batchSize });
    total += products.items.length;

    // 4. Opportunities
    const opps = await this.getOpportunities({ page: 1, pageSize: batchSize });
    total += opps.items.length;

    return total;
  }

  protected async pushData(_options: SyncOptions): Promise<number> {
    // Dataverse supports writes via Web API (POST/PATCH/DELETE), but for
    // FP&A integration we typically only PULL data (write-back is out of scope).
    return 0;
  }

  // ─── Forecast Category Helper (exposed for external use) ──────────────────

  /**
   * Pure helper: map a sales stage code to a forecast category label.
   * Exposed publicly so consumers can roll up opportunity stage counts
   * by category without re-implementing the mapping.
   */
  getForecastCategory(salesStageCode: number | undefined): string {
    if (salesStageCode === undefined) return 'Unknown';
    return FORECAST_CATEGORY_MAP[salesStageCode] ?? 'Unknown';
  }
}

// Re-export the response types for downstream consumers (test mocks, etc.)
export type {
  DynamicsAccount,
  DynamicsContact,
  DynamicsInvoice,
  DynamicsProduct,
  DynamicsOpportunity,
  DataverseODataEnvelope,
};
