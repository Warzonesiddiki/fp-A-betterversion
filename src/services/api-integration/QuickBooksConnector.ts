/**
 * API Integration Framework - QuickBooks Connector
 *
 * Connects to the QuickBooks Online API (Intuit) to sync:
 * - Accounts (Chart of Accounts)
 * - Transactions (Journal Entries, Expenses)
 * - Invoices
 * - Budgets (via Reports API)
 *
 * API docs: https://developer.intuit.com/app/developer/qbo/docs/api/accounting/most-commonly-used/account
 */

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

// ─── QuickBooks API response shapes ──────────────────────────────────────────

interface QBCompanyInfo {
  CompanyName: string;
  Id: string;
}

interface QBCompanyInfoResponse {
  QueryResponse: {
    CompanyInfo: QBCompanyInfo[];
  };
}

interface QBTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  x_refresh_token_expires_in: number;
}

interface QBQueryResponse<T> {
  QueryResponse: {
    [key: string]: T[] | number | undefined;
    startPosition: number;
    maxResults: number;
    totalCount?: number;
  };
  time: string;
}

interface QBLine {
  Id?: string;
  Description?: string;
  Amount: number;
  DetailType: string;
  SalesItemLineDetail?: {
    UnitPrice?: number;
    Qty?: number;
    ItemRef?: { value: string };
    AccountRef?: { value: string };
  };
}

interface QBAccount {
  Id: string;
  Name: string;
  FullyQualifiedName: string;
  AccountType: string;
  AccountSubType: string;
  Classification: string;
  CurrencyRef?: { value: string };
  CurrentBalance: number;
  Active: boolean;
  MetaData: { LastUpdatedTime: string };
}

interface QBTransaction {
  Id: string;
  TxnDate: string;
  TotalAmt: number;
  PrivateNote?: string;
  Line: QBLine[];
  CurrencyRef?: { value: string };
  DocNumber?: string;
}

interface QBInvoice {
  Id: string;
  DocNumber: string;
  TxnDate: string;
  DueDate: string;
  TotalAmt: number;
  Balance: number;
  CurrencyRef?: { value: string };
  CustomerRef: { value: string };
  Line: QBLine[];
}

// ─── QuickBooksConnector ─────────────────────────────────────────────────────

export class QuickBooksConnector extends BaseConnector {
  private realmId: string;

  constructor(config: ConnectorConfig & { realmId: string }) {
    super({
      ...config,
      baseUrl: `https://quickbooks.api.intuit.com/v3/company/${config.realmId}`,
    });
    this.realmId = config.realmId;
  }

  // ── Token Management ─────────────────────────────────────────────────────

  /**
   * Exchange authorization code for tokens (called during OAuth2 callback).
   */
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuth2Tokens> {
    const oauthConfig = this.config.auth.oauth2;
    if (!oauthConfig) {
      throw new Error('OAuth2 configuration required');
    }

    const credentials = btoa(`${oauthConfig.clientId}:${oauthConfig.clientSecret}`);

    const response = await this.client.post<QBTokenResponse>(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }).toString()
    );

    // Override content-type for token endpoint
    const tokens: OAuth2Tokens = {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: Date.now() + response.data.expires_in * 1000,
      tokenType: 'Bearer',
    };

    this.client.setOAuthTokens(tokens);
    return tokens;
  }

  /**
   * Refresh access token using stored refresh token.
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

    const credentials = btoa(`${oauthConfig.clientId}:${oauthConfig.clientSecret}`);

    const response = await this.client.post<QBTokenResponse>(
      'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: currentTokens.refreshToken,
      }).toString()
    );

    const tokens: OAuth2Tokens = {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: Date.now() + response.data.expires_in * 1000,
      tokenType: 'Bearer',
    };

    this.client.setOAuthTokens(tokens);
    return tokens;
  }

  // ── Health Check ─────────────────────────────────────────────────────────

  protected async performHealthCheck(): Promise<ConnectorHealth> {
    try {
      const response = await this.client.get<QBCompanyInfoResponse>('/companyinfo/1');

      const companyInfo = response.data.QueryResponse?.CompanyInfo?.[0];
      if (!companyInfo) {
        return { status: 'error', lastError: 'No company info returned' };
      }

      return {
        status: 'connected',
        lastSyncAt: Date.now(),
        rateLimitRemaining: parseInt(response.headers['x-ratelimit-remaining'] ?? '500', 10),
        rateLimitReset: parseInt(response.headers['x-ratelimit-reset'] ?? '0', 10),
      };
    } catch (error: unknown) {
      return {
        status: 'error',
        lastError: error instanceof Error ? error.message : 'Health check failed',
      };
    }
  }

  // ── Accounts ─────────────────────────────────────────────────────────────

  async getAccounts(pagination?: PaginationParams): Promise<PaginatedResponse<ExternalAccount>> {
    const startPosition = ((pagination?.page ?? 1) - 1) * (pagination?.pageSize ?? 100) + 1;
    const maxResults = pagination?.pageSize ?? 100;

    const query = `SELECT * FROM Account WHERE Active = true STARTPOSITION ${startPosition} MAXRESULTS ${maxResults}`;

    const response = await this.client.get<QBQueryResponse<QBAccount>>('/query', {
      query,
    });

    const rawAccounts = response.data.QueryResponse.Account;
    const accounts: QBAccount[] = Array.isArray(rawAccounts) ? rawAccounts : [];
    const totalCount = response.data.QueryResponse.totalCount ?? accounts.length;

    return {
      items: accounts.map(this.mapAccount),
      total: totalCount,
      page: pagination?.page ?? 1,
      pageSize: maxResults,
      hasNext: startPosition + maxResults < totalCount,
    };
  }

  private mapAccount(qb: QBAccount): ExternalAccount {
    const typeMap: Record<string, ExternalAccount['type']> = {
      // Classification-level values
      Asset: 'asset',
      Liability: 'liability',
      Equity: 'equity',
      Income: 'revenue',
      Expense: 'expense',
      // AccountType-level values (more specific)
      AccountsPayable: 'liability',
      AccountsReceivable: 'asset',
      Bank: 'asset',
      CostOfGoodsSold: 'expense',
      CreditCard: 'liability',
      FixedAsset: 'asset',
      LongTermLiability: 'liability',
      OtherCurrentAsset: 'asset',
      OtherCurrentLiability: 'liability',
      OtherExpense: 'expense',
      OtherIncome: 'revenue',
    };

    return {
      externalId: qb.Id,
      name: qb.FullyQualifiedName ?? qb.Name,
      type: typeMap[qb.Classification] ?? 'asset',
      subtype: qb.AccountSubType,
      currency: qb.CurrencyRef?.value ?? 'USD',
      balance: qb.CurrentBalance ?? 0,
      active: qb.Active,
      lastUpdated: new Date(qb.MetaData.LastUpdatedTime).getTime(),
    };
  }

  // ── Transactions ─────────────────────────────────────────────────────────

  async getTransactions(
    accountId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<ExternalTransaction>> {
    const startPosition = ((pagination?.page ?? 1) - 1) * (pagination?.pageSize ?? 100) + 1;
    const maxResults = pagination?.pageSize ?? 100;

    const query = `SELECT * FROM JournalEntry WHERE Id IN (SELECT JournalEntryId FROM JournalEntryLine WHERE JournalEntryLine.AccountRef = '${accountId}') STARTPOSITION ${startPosition} MAXRESULTS ${maxResults}`;

    const response = await this.client.get<QBQueryResponse<QBTransaction>>('/query', {
      query,
    });

    const rawTxns = response.data.QueryResponse.JournalEntry;
    const txns: QBTransaction[] = Array.isArray(rawTxns) ? rawTxns : [];
    const totalCount = response.data.QueryResponse.totalCount ?? txns.length;

    const items: ExternalTransaction[] = [];

    for (const txn of txns) {
      for (const line of txn.Line ?? []) {
        items.push({
          externalId: `${txn.Id}-${line.Id ?? '0'}`,
          accountId,
          date: txn.TxnDate,
          description: line.Description ?? txn.PrivateNote ?? '',
          amount: line.Amount,
          currency: txn.CurrencyRef?.value ?? 'USD',
          type: line.Amount >= 0 ? 'debit' : 'credit',
          reference: txn.DocNumber,
        });
      }
    }

    return {
      items,
      total: totalCount,
      page: pagination?.page ?? 1,
      pageSize: maxResults,
      hasNext: startPosition + maxResults < totalCount,
    };
  }

  // ── Invoices ─────────────────────────────────────────────────────────────

  async getInvoices(pagination?: PaginationParams): Promise<PaginatedResponse<ExternalInvoice>> {
    const startPosition = ((pagination?.page ?? 1) - 1) * (pagination?.pageSize ?? 100) + 1;
    const maxResults = pagination?.pageSize ?? 100;

    const query = `SELECT * FROM Invoice ORDERBY TxnDate DESC STARTPOSITION ${startPosition} MAXRESULTS ${maxResults}`;

    const response = await this.client.get<QBQueryResponse<QBInvoice>>('/query', {
      query,
    });

    const rawInvoices = response.data.QueryResponse.Invoice;
    const invoices: QBInvoice[] = Array.isArray(rawInvoices) ? rawInvoices : [];
    const totalCount = response.data.QueryResponse.totalCount ?? invoices.length;

    return {
      items: invoices.map(this.mapInvoice),
      total: totalCount,
      page: pagination?.page ?? 1,
      pageSize: maxResults,
      hasNext: startPosition + maxResults < totalCount,
    };
  }

  private mapInvoice(qb: QBInvoice): ExternalInvoice {
    const lineItems: ExternalInvoiceLineItem[] = (qb.Line ?? [])
      .filter((l) => l.DetailType === 'SalesItemLineDetail')
      .map((l) => ({
        description: l.Description ?? '',
        quantity: l.SalesItemLineDetail?.Qty ?? 1,
        unitPrice: l.SalesItemLineDetail?.UnitPrice ?? l.Amount,
        amount: l.Amount,
        accountId: l.SalesItemLineDetail?.AccountRef?.value,
      }));

    const status: ExternalInvoice['status'] =
      qb.Balance === 0 ? 'paid' : qb.Balance === qb.TotalAmt ? 'sent' : 'draft';

    return {
      externalId: qb.Id,
      number: qb.DocNumber,
      customerId: qb.CustomerRef.value,
      date: qb.TxnDate,
      dueDate: qb.DueDate,
      status,
      subtotal: lineItems.reduce((sum, li) => sum + li.amount, 0),
      tax: 0, // QB tax is on separate lines
      total: qb.TotalAmt,
      currency: qb.CurrencyRef?.value ?? 'USD',
      lineItems,
    };
  }

  // ── Budgets (via Profit & Loss Report) ───────────────────────────────────

  async getBudgets(pagination?: PaginationParams): Promise<PaginatedResponse<ExternalBudget>> {
    // QuickBooks does not have a direct Budget API for all versions.
    // Use the BudgetSummary report when available, otherwise return empty.
    try {
      const year = new Date().getFullYear();
      const response = await this.client.get<{ rows?: { ColData: { value: string }[] }[] }>(
        `/reports/BudgetSummary?start_date=${year}-01-01&end_date=${year}-12-31`
      );

      const rows = response.data.rows ?? [];
      const entries = rows
        .filter((row) => row.ColData?.length >= 2)
        .map((row) => ({
          accountId: row.ColData[0]?.value ?? '',
          category: row.ColData[0]?.value ?? '',
          amount: parseFloat(row.ColData[1]?.value ?? '0') || 0,
          period: `${year}`,
        }));

      return {
        items: [
          {
            externalId: `budget-${year}`,
            name: `Budget ${year}`,
            fiscalYear: `${year}`,
            entries,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 1,
        hasNext: false,
      };
    } catch {
      return { items: [], total: 0, page: 1, pageSize: 50, hasNext: false };
    }
  }

  // ── Sync ─────────────────────────────────────────────────────────────────

  protected async pullData(options: SyncOptions): Promise<number> {
    let total = 0;
    const pageSize = options.batchSize ?? 100;

    // Pull accounts
    const accounts = await this.getAccounts({ page: 1, pageSize });
    total += accounts.items.length;

    // Pull transactions per account
    for (const account of accounts.items.slice(0, 10)) {
      const txns = await this.getTransactions(account.externalId, { page: 1, pageSize });
      total += txns.items.length;
    }

    // Pull invoices
    const invoices = await this.getInvoices({ page: 1, pageSize });
    total += invoices.items.length;

    return total;
  }

  protected async pushData(_options: SyncOptions): Promise<number> {
    // QuickBooks push is not implemented in this phase
    // Would require creating/updating JournalEntries, Invoices, etc.
    return 0;
  }
}
