/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * API Integration Framework - Salesforce Connector
 *
 * Connects to the Salesforce REST API to sync:
 * - Opportunity (sales pipeline → revenue forecast)
 * - OpportunityLineItem (deal line items)
 * - Account (customers)
 * - Product2 + PricebookEntry (price book)
 * - Forecast / OpportunityForecast (revenue forecast snapshot)
 *
 * FP&A primary use case: pull sales pipeline → revenue forecast + actuals
 *
 * Auth: OAuth 2.0 Web Server Flow (refresh tokens valid until revoked).
 * API docs: https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_rest.htm
 * SOQL docs: https://developer.salesforce.com/docs/atlas.en-us.soql_sosl.meta/soql_sosl/sforce_api_calls_soql.htm
 *
 * MONEY MIGRATION (2026-08-03): Opportunity revenue aggregation
 * (pipeline/bestCase/commit/closed/omitted, total, and the probability-
 * weighted forecast) uses the canonical money primitive (`src/utils/money.ts`).
 * External Amount values are rounded with declared decimal half-up semantics
 * before aggregation; weighted contributions are summed at full decimal
 * precision and the aggregate is cent-rounded. Probability percentages and
 * record counts are not currency.
 */

import { percentOf, roundTo, sumMoney } from '@/utils/money';
import { BaseConnector } from './BaseConnector';
import type {
  ConnectorConfig,
  ConnectorHealth,
  ExternalAccount,
  ExternalBudget,
  ExternalInvoice,
  ExternalInvoiceLineItem,
  ExternalTransaction,
  OAuth2Tokens,
  PaginatedResponse,
  PaginationParams,
  SyncOptions,
} from './types';

// ─── Salesforce response shapes ─────────────────────────────────────────────

/** OAuth2 token endpoint response. */
interface SfTokenResponse {
  access_token: string;
  refresh_token?: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
  signature: string;
  scope?: string;
}

/** Identity response from /services/oauth2/userinfo. */
interface SfIdentity {
  user_id: string;
  organization_id: string;
  username: string;
  display_name: string;
  email: string;
  active: boolean;
  user_type: string;
  language: string;
}

/** SOQL query response envelope. */
interface SfQueryResponse<T> {
  totalSize: number;
  done: boolean;
  nextRecordsUrl?: string;
  records: T[];
}

/** Opportunity record (sales pipeline). */
interface SfOpportunity {
  attributes: { type: string; url: string };
  Id: string;
  Name: string;
  AccountId: string | null;
  StageName: string;
  Amount: number | null;
  Probability: number | null;
  CloseDate: string;
  CreatedDate: string;
  LastModifiedDate: string;
  IsClosed: boolean;
  IsWon: boolean;
  ForecastCategory: string | null;
  ForecastCategoryName: string | null;
  OwnerId: string;
  Description: string | null;
  LeadSource: string | null;
  Type: string | null;
  NextStep: string | null;
  CustomFields?: Record<string, unknown>;
}

/** Account (customer) record. */
interface SfAccount {
  attributes: { type: string; url: string };
  Id: string;
  Name: string;
  AccountNumber: string | null;
  Industry: string | null;
  AnnualRevenue: number | null;
  NumberOfEmployees: number | null;
  BillingCity: string | null;
  BillingState: string | null;
  BillingCountry: string | null;
  Phone: string | null;
  Website: string | null;
  Type: string | null;
  IsActive: boolean;
  LastModifiedDate: string;
}

/** OpportunityLineItem (deal line item) record. */
interface SfOpportunityLineItem {
  attributes: { type: string; url: string };
  Id: string;
  OpportunityId: string;
  PricebookEntryId: string;
  Product2Id: string;
  ProductCode: string | null;
  Name: string;
  Quantity: number;
  UnitPrice: number;
  TotalPrice: number;
  Description: string | null;
  ServiceDate: string | null;
}

/** Product2 record (price book item). */
interface SfProduct {
  attributes: { type: string; url: string };
  Id: string;
  Name: string;
  ProductCode: string | null;
  Description: string | null;
  IsActive: boolean;
  Family: string | null;
}

/** Forecast (revenue forecast snapshot) record. */
interface SfForecast {
  attributes: { type: string; url: string };
  Id: string;
  ForecastName: string;
  PeriodId: string;
  OwnerId: string;
  Quota: number | null;
  QuotaOwnerId: string | null;
  ForecastAmount: number | null;
  IsQuota: boolean;
  ForecastCategory: string | null;
}

/** Salesforce API error envelope. */
interface SfErrorResponse {
  errorCode: string;
  message: string;
  fields?: string[];
}

// ─── Stage → ForecastCategory mapping ──────────────────────────────────────

/**
 * Default Salesforce opportunity stages. The exact set is org-specific
 * (configurable), so this serves as a reference mapping for FP&A rollups.
 */
const DEFAULT_FORECAST_CATEGORIES: Record<string, string> = {
  Prospecting: 'Pipeline',
  Qualification: 'Pipeline',
  'Needs Analysis': 'Pipeline',
  'Value Proposition': 'Pipeline',
  'Id. Decision Makers': 'Pipeline',
  'Perception Analysis': 'Pipeline',
  'Proposal/Price Quote': 'BestCase',
  'Negotiation/Review': 'Commit',
  Negotiation: 'Commit',
  'Closed Won': 'Closed',
  'Closed Lost': 'Omitted',
};

// ─── SalesforceConnector ────────────────────────────────────────────────────

export class SalesforceConnector extends BaseConnector {
  private instanceUrl: string;

  constructor(config: ConnectorConfig) {
    // instance_url is established during token exchange; BaseConnector
    // can be constructed with a placeholder that getOverwritten in
    // exchangeCodeForTokens / refreshAccessToken.
    super({
      ...config,
      baseUrl: config.baseUrl ?? 'https://login.salesforce.com',
    });
    this.instanceUrl = config.baseUrl ?? 'https://login.salesforce.com';
  }

  // ── Token Management ─────────────────────────────────────────────────────

  /**
   * Exchange authorization code for tokens. Returns tokens AND updates
   * the connector's instance_url for subsequent REST calls.
   */
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuth2Tokens> {
    const oauthConfig = this.config.auth.oauth2;
    if (!oauthConfig) {
      throw new Error('OAuth2 configuration required');
    }

    const credentials = btoa(`${oauthConfig.clientId}:${oauthConfig.clientSecret}`);

    const response = await this.client.post<SfTokenResponse>(
      'https://login.salesforce.com/services/oauth2/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: oauthConfig.clientId,
        client_secret: oauthConfig.clientSecret,
      }).toString()
    );

    this.instanceUrl = response.data.instance_url.replace(/\/$/, '');
    const tokens: OAuth2Tokens = {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token ?? '',
      expiresAt: Date.now() + 2 * 60 * 60 * 1000, // Salesforce access tokens typically valid 2h
      tokenType: response.data.token_type || 'Bearer',
    };

    this.client.setOAuthTokens(tokens);
    return tokens;
  }

  /**
   * Refresh access token. Salesforce refresh tokens do NOT expire (unless
   * revoked) so the refreshed access token can be used indefinitely.
   */
  async refreshAccessToken(): Promise<OAuth2Tokens> {
    const currentTokens = this.client.getOAuthTokens();
    if (!currentTokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const oauthConfig = this.config.auth.oauth2;
    if (!oauthConfig) {
      throw new Error('OAuth2 configuration required');
    }

    const response = await this.client.post<SfTokenResponse>(
      'https://login.salesforce.com/services/oauth2/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: currentTokens.refreshToken,
        client_id: oauthConfig.clientId,
        client_secret: oauthConfig.clientSecret,
      }).toString()
    );

    this.instanceUrl = response.data.instance_url.replace(/\/$/, '');
    const tokens: OAuth2Tokens = {
      accessToken: response.data.access_token,
      refreshToken: currentTokens.refreshToken, // Refresh tokens are preserved
      expiresAt: Date.now() + 2 * 60 * 60 * 1000,
      tokenType: response.data.token_type || 'Bearer',
    };

    this.client.setOAuthTokens(tokens);
    return tokens;
  }

  // ── Health Check ─────────────────────────────────────────────────────────

  protected async performHealthCheck(): Promise<ConnectorHealth> {
    try {
      // Use the lightweight identity endpoint to verify the token + org.
      const response = await this.client.get<SfIdentity>(
        `${this.instanceUrl}/services/oauth2/userinfo`
      );

      if (!response.data.active) {
        return { status: 'error', lastError: 'Salesforce session inactive' };
      }

      // Parse Sforce-Limit-Info header: "api-usage=23/15000"
      const limitInfo = response.headers['sforce-limit-info'] ?? '';
      const match = /api-usage=(\d+)\/(\d+)/.exec(limitInfo);
      const remaining = match
        ? parseInt(match[2] ?? '0', 10) - parseInt(match[1] ?? '0', 10)
        : undefined;

      return {
        status: 'connected',
        lastSyncAt: Date.now(),
        rateLimitRemaining: remaining,
      };
    } catch (error: unknown) {
      return {
        status: 'error',
        lastError: error instanceof Error ? error.message : 'Health check failed',
      };
    }
  }

  // ── Opportunities (sales pipeline → revenue forecast) ───────────────────

  /**
   * Fetch sales opportunities (deals in the pipeline). This is the PRIMARY
   * FP&A data source: Amount × StageName × ForecastCategoryName rolls up
   * to a revenue forecast.
   */
  async getOpportunities(pagination?: PaginationParams): Promise<PaginatedResponse<SfOpportunity>> {
    const limit = Math.min(pagination?.pageSize ?? 100, 2000);
    const soql = [
      'SELECT Id, Name, AccountId, StageName, Amount, Probability, CloseDate, CreatedDate,',
      'LastModifiedDate, IsClosed, IsWon, ForecastCategory, ForecastCategoryName,',
      'OwnerId, Description, LeadSource, Type, NextStep',
      `FROM Opportunity ORDER BY CloseDate DESC LIMIT ${limit}`,
      pagination?.cursor ? `OFFSET ${pagination.cursor}` : '',
    ]
      .filter((s) => s)
      .join(' ');

    return this.query<SfOpportunity>(soql, limit);
  }

  /** Map a Salesforce Opportunity to the canonical opportunity shape. */
  mapOpportunity(opp: SfOpportunity): {
    externalId: string;
    name: string;
    accountId: string | null;
    stage: string;
    amount: number;
    probability: number;
    closeDate: string;
    isClosed: boolean;
    isWon: boolean;
    forecastCategory: string;
    ownerId: string;
    leadSource: string | null;
    description: string | null;
    lastModified: number;
  } {
    return {
      externalId: opp.Id,
      name: opp.Name,
      accountId: opp.AccountId,
      stage: opp.StageName,
      amount: opp.Amount ?? 0,
      probability: opp.Probability ?? 0,
      closeDate: opp.CloseDate,
      isClosed: opp.IsClosed,
      isWon: opp.IsWon,
      forecastCategory:
        opp.ForecastCategoryName ?? DEFAULT_FORECAST_CATEGORIES[opp.StageName] ?? 'Pipeline',
      ownerId: opp.OwnerId,
      leadSource: opp.LeadSource,
      description: opp.Description,
      lastModified: new Date(opp.LastModifiedDate).getTime(),
    };
  }

  /** Aggregate opportunities into a revenue forecast (FP&A). */
  aggregateForecast(opps: SfOpportunity[]): {
    pipeline: number;
    bestCase: number;
    commit: number;
    closed: number;
    omitted: number;
    total: number;
    weightedForecast: number;
  } {
    const pipelineValues: number[] = [];
    const bestCaseValues: number[] = [];
    const commitValues: number[] = [];
    const closedValues: number[] = [];
    const omittedValues: number[] = [];
    const totalValues: number[] = [];
    const weightedValues: ReturnType<typeof percentOf>[] = [];

    for (const opp of opps) {
      // External opportunity amounts are currency; round each imported value
      // with declared decimal half-up semantics before aggregation.
      const amount = roundTo(opp.Amount ?? 0);
      const category =
        opp.ForecastCategoryName ?? DEFAULT_FORECAST_CATEGORIES[opp.StageName] ?? 'Pipeline';
      totalValues.push(amount);
      // Weighted forecast = amount × probability% / 100 (exact decimal
      // product); the aggregate is cent-rounded below.
      weightedValues.push(percentOf(amount, opp.Probability ?? 0));
      switch (category) {
        case 'Pipeline':
          pipelineValues.push(amount);
          break;
        case 'BestCase':
          bestCaseValues.push(amount);
          break;
        case 'Commit':
          commitValues.push(amount);
          break;
        case 'Closed':
          closedValues.push(amount);
          break;
        case 'Omitted':
          omittedValues.push(amount);
          break;
      }
    }

    return {
      pipeline: roundTo(sumMoney(pipelineValues)),
      bestCase: roundTo(sumMoney(bestCaseValues)),
      commit: roundTo(sumMoney(commitValues)),
      closed: roundTo(sumMoney(closedValues)),
      omitted: roundTo(sumMoney(omittedValues)),
      total: roundTo(sumMoney(totalValues)),
      weightedForecast: roundTo(sumMoney(weightedValues)),
    };
  }

  // ── Accounts (customers) ─────────────────────────────────────────────────

  async getAccounts(pagination?: PaginationParams): Promise<PaginatedResponse<ExternalAccount>> {
    const limit = Math.min(pagination?.pageSize ?? 100, 2000);
    const soql = [
      'SELECT Id, Name, AccountNumber, Industry, AnnualRevenue, NumberOfEmployees,',
      'BillingCity, BillingState, BillingCountry, Phone, Website, Type, IsActive, LastModifiedDate',
      `FROM Account WHERE IsActive = true ORDER BY Name ASC LIMIT ${limit}`,
      pagination?.cursor ? `OFFSET ${pagination.cursor}` : '',
    ]
      .filter((s) => s)
      .join(' ');

    const result = await this.query<SfAccount>(soql, limit);
    return {
      items: result.items.map(this.mapAccount),
      total: result.total,
      page: 1,
      pageSize: limit,
      hasNext: result.hasNext,
      nextCursor: result.nextCursor,
    };
  }

  private mapAccount = (sf: SfAccount): ExternalAccount => ({
    externalId: sf.Id,
    name: sf.Name,
    type: 'revenue', // Accounts are revenue sources
    subtype: sf.Industry ?? undefined,
    currency: 'USD', // Default; per-account currency requires multi-currency feature
    balance: sf.AnnualRevenue ?? 0,
    active: sf.IsActive,
    lastUpdated: new Date(sf.LastModifiedDate).getTime(),
  });

  // ── Opportunity Line Items (deal line items) ──────────────────────────────

  async getOpportunityLineItems(opportunityId: string): Promise<SfOpportunityLineItem[]> {
    const soql = [
      'SELECT Id, OpportunityId, PricebookEntryId, Product2Id, ProductCode,',
      'Name, Quantity, UnitPrice, TotalPrice, Description, ServiceDate',
      `FROM OpportunityLineItem WHERE OpportunityId = '${opportunityId}'`,
    ].join(' ');

    const result = await this.query<SfOpportunityLineItem>(soql, 2000);
    return result.items;
  }

  // ── Products (price book) ────────────────────────────────────────────────

  async getProducts(pagination?: PaginationParams): Promise<PaginatedResponse<SfProduct>> {
    const limit = Math.min(pagination?.pageSize ?? 100, 2000);
    const soql = [
      'SELECT Id, Name, ProductCode, Description, IsActive, Family',
      `FROM Product2 WHERE IsActive = true ORDER BY Name ASC LIMIT ${limit}`,
      pagination?.cursor ? `OFFSET ${pagination.cursor}` : '',
    ]
      .filter((s) => s)
      .join(' ');

    return this.query<SfProduct>(soql, limit);
  }

  // ── Forecasts (revenue forecast snapshots) ───────────────────────────────

  async getForecasts(pagination?: PaginationParams): Promise<PaginatedResponse<SfForecast>> {
    const limit = Math.min(pagination?.pageSize ?? 100, 2000);
    const soql = [
      'SELECT Id, ForecastName, PeriodId, OwnerId, Quota, QuotaOwnerId,',
      'ForecastAmount, IsQuota, ForecastCategory',
      `FROM Forecast ORDER BY PeriodId DESC LIMIT ${limit}`,
      pagination?.cursor ? `OFFSET ${pagination.cursor}` : '',
    ]
      .filter((s) => s)
      .join(' ');

    return this.query<SfForecast>(soql, limit);
  }

  // ── SOQL Query Helper ────────────────────────────────────────────────────

  /**
   * Run a SOQL query with automatic pagination via nextRecordsUrl.
   * Returns one page of results.
   */
  async query<T>(soql: string, _limit: number): Promise<PaginatedResponse<T>> {
    const path = `/services/data/v59.0/query?q=${encodeURIComponent(soql)}`;
    const response = await this.client.get<SfQueryResponse<T>>(`${this.instanceUrl}${path}`);

    return {
      items: response.data.records,
      total: response.data.totalSize,
      page: 1,
      pageSize: response.data.records.length,
      hasNext: !response.data.done && Boolean(response.data.nextRecordsUrl),
      nextCursor: response.data.nextRecordsUrl,
    };
  }

  // ── Composite API (batch operations) ─────────────────────────────────────

  /**
   * Run up to 25 sub-requests in a single API call (Composite API).
   * Reduces API call consumption and is more efficient for bulk syncs.
   */
  async composite<T>(
    subrequests: Array<{ method: string; url: string; body?: unknown }>
  ): Promise<T[]> {
    if (subrequests.length > 25) {
      throw new Error('Composite API supports up to 25 sub-requests per call');
    }
    const response = await this.client.post<{ compositeResponse: T[] }>(
      `${this.instanceUrl}/services/data/v59.0/composite`,
      { allOrNone: false, compositeRequest: subrequests }
    );
    return response.data.compositeResponse;
  }

  // ── Sync ─────────────────────────────────────────────────────────────────

  protected async pullData(options: SyncOptions): Promise<number> {
    let total = 0;
    const pageSize = options.batchSize ?? 200;

    // FP&A priority: opportunities drive revenue forecast
    const opps = await this.getOpportunities({ page: 1, pageSize });
    total += opps.items.length;

    // Accounts (customers) — required to roll up revenue by customer
    const accounts = await this.getAccounts({ page: 1, pageSize });
    total += accounts.items.length;

    // Products (active price book)
    const products = await this.getProducts({ page: 1, pageSize });
    total += products.items.length;

    // Forecasts (revenue forecast snapshots)
    const forecasts = await this.getForecasts({ page: 1, pageSize });
    total += forecasts.items.length;

    return total;
  }

  protected async pushData(_options: SyncOptions): Promise<number> {
    // Salesforce push is not implemented in this phase
    // Would require creating/updating Opportunities, Accounts, etc.
    return 0;
  }

  // ── Backwards-compat shims for BaseConnector's domain methods ────────────
  // (The connector's primary value is the Opportunity pipeline; the
  //  BaseConnector signatures for getInvoices/getTransactions map onto
  //  Salesforce concepts differently and are intentionally unused.)

  async getInvoices(_pagination?: PaginationParams): Promise<PaginatedResponse<ExternalInvoice>> {
    return { items: [], total: 0, page: 1, pageSize: 50, hasNext: false };
  }

  async getTransactions(
    _accountId: string,
    _pagination?: PaginationParams
  ): Promise<PaginatedResponse<ExternalTransaction>> {
    return { items: [], total: 0, page: 1, pageSize: 50, hasNext: false };
  }

  async getBudgets(_pagination?: PaginationParams): Promise<PaginatedResponse<ExternalBudget>> {
    return { items: [], total: 0, page: 1, pageSize: 50, hasNext: false };
  }
}
