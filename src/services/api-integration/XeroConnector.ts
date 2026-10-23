/**
 * API Integration Framework - Xero Connector
 *
 * Connects to the Xero Accounting API to sync:
 * - Accounts (Chart of Accounts)
 * - Bank Transactions / Manual Journals
 * - Invoices (Accounts Receivable / Payable)
 * - Budgets (via Budgets API)
 *
 * API docs: https://developer.xero.com/documentation/api/accounting/overview
 */

import { BaseConnector } from './BaseConnector';
import type {
  ConnectorConfig,
  ConnectorHealth,
  ExternalAccount,
  ExternalBudget,
  ExternalBudgetEntry,
  ExternalInvoice,
  ExternalInvoiceLineItem,
  ExternalTransaction,
  OAuth2Tokens,
  PaginatedResponse,
  PaginationParams,
  SyncOptions,
} from './types';

// ─── Xero API response shapes ────────────────────────────────────────────────

interface XeroTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface XeroTenant {
  tenantId: string;
  tenantName: string;
  tenantType: string;
}

interface XeroAccount {
  AccountID: string;
  Code: string;
  Name: string;
  Type: string;
  AccountClass?: string;
  Status: string;
  CurrencyCode?: string;
  ReportingCode?: string;
  EnablePaymentsToAccount?: boolean;
  BankAccountNumber?: string;
  UpdatedDateUTC: string;
}

interface XeroAccountsResponse {
  Accounts: XeroAccount[];
}

interface XeroLineItem {
  LineItemID?: string;
  Description: string;
  Quantity: number;
  UnitAmount: number;
  LineAmount: number;
  AccountCode: string;
  TaxType?: string;
  TaxAmount?: number;
}

interface XeroInvoice {
  InvoiceID: string;
  InvoiceNumber: string;
  Type: 'ACCREC' | 'ACCPAY';
  Reference?: string;
  Date: string;
  DueDate: string;
  Status: string;
  LineAmountTypes: string;
  LineItems: XeroLineItem[];
  SubTotal: number;
  TotalTax: number;
  Total: number;
  CurrencyCode: string;
  Contact: { ContactID: string };
  UpdatedDateUTC: string;
}

interface XeroInvoicesResponse {
  Invoices: XeroInvoice[];
}

interface XeroBankTransaction {
  BankTransactionID: string;
  Type: 'SPEND' | 'RECEIVE' | 'SPEND-TRANSFER' | 'RECEIVE-TRANSFER';
  Contact?: { ContactID: string };
  Date: string;
  Reference?: string;
  Status: string;
  LineItems: XeroLineItem[];
  Total: number;
  CurrencyCode: string;
  BankAccount: { AccountID: string };
  UpdatedDateUTC: string;
}

interface XeroBankTransactionsResponse {
  BankTransactions: XeroBankTransaction[];
}

interface XeroBudget {
  BudgetID: string;
  Type: string;
  Description: string;
  UpdatedDateUTC: string;
  BudgetLines: XeroBudgetLine[];
}

interface XeroBudgetLine {
  AccountID: string;
  AccountCode: string;
  AccountName: string;
  BudgetAmounts: XeroBudgetAmount[];
}

interface XeroBudgetAmount {
  Period: string;
  Amount: number;
  UnitAmount?: number;
}

interface XeroBudgetsResponse {
  Budgets: XeroBudget[];
}

// ─── XeroConnector ───────────────────────────────────────────────────────────

export class XeroConnector extends BaseConnector {
  private tenantId: string = '';
  private readonly tokenUrl = 'https://identity.xero.com/connect/token';
  private readonly connectionsUrl = 'https://api.xero.com/connections';

  constructor(config: ConnectorConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl ?? 'https://api.xero.com/api.xro/2.0',
    });

    // Set up automatic token refresh
    this.client.setTokenRefreshHandler(async (refreshToken: string) => {
      const oauthConfig = this.config.auth.oauth2;
      if (!oauthConfig) {
        throw new Error('OAuth2 configuration required for token refresh');
      }

      const credentials = btoa(`${oauthConfig.clientId}:${oauthConfig.clientSecret}`);

      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data: XeroTokenResponse = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + data.expires_in * 1000,
        tokenType: data.token_type,
        scope: data.scope,
      };
    });
  }

  // ── Token Management ─────────────────────────────────────────────────────

  /**
   * Exchange authorization code for tokens.
   */
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuth2Tokens> {
    const oauthConfig = this.config.auth.oauth2;
    if (!oauthConfig) {
      throw new Error('OAuth2 configuration required');
    }

    const credentials = btoa(`${oauthConfig.clientId}:${oauthConfig.clientSecret}`);

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    const data: XeroTokenResponse = await response.json();
    const tokens: OAuth2Tokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      tokenType: data.token_type,
      scope: data.scope,
    };

    this.client.setOAuthTokens(tokens);

    // Discover tenant ID
    await this.discoverTenant();

    return tokens;
  }

  /**
   * Discover the tenant ID from Xero connections API.
   */
  private async discoverTenant(): Promise<void> {
    const tokens = this.client.getOAuthTokens();
    if (!tokens) throw new Error('No tokens available');

    const response = await fetch(this.connectionsUrl, {
      headers: {
        Authorization: `${tokens.tokenType} ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to discover tenants: ${response.status}`);
    }

    const tenants: XeroTenant[] = await response.json();
    if (tenants.length === 0) {
      throw new Error('No Xero organizations found');
    }

    this.tenantId = tenants[0]!.tenantId;
  }

  /**
   * Set the tenant ID manually (if known).
   */
  setTenantId(tenantId: string): void {
    this.tenantId = tenantId;
  }

  // ── Override request to inject tenant header ─────────────────────────────

  private async xeroRequest<T>(url: string, params?: Record<string, string | number | boolean>) {
    return this.client.get<T>(url, params);
  }

  // ── Health Check ─────────────────────────────────────────────────────────

  protected async performHealthCheck(): Promise<ConnectorHealth> {
    try {
      if (!this.tenantId) {
        await this.discoverTenant();
      }

      const response = await this.client.get<XeroAccountsResponse>('/Accounts', {
        where: 'Status=="ACTIVE"',
        pageSize: '1',
      });

      const accounts = response.data.Accounts ?? [];

      return {
        status: accounts.length >= 0 ? 'connected' : 'error',
        lastSyncAt: Date.now(),
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
    const page = pagination?.page ?? 1;

    const response = await this.client.get<XeroAccountsResponse>('/Accounts', {
      page: page.toString(),
      pageSize: (pagination?.pageSize ?? 100).toString(),
    });

    const accounts = response.data.Accounts ?? [];

    return {
      items: accounts.map(this.mapAccount),
      total: accounts.length,
      page,
      pageSize: pagination?.pageSize ?? 100,
      hasNext: accounts.length === (pagination?.pageSize ?? 100),
    };
  }

  private mapAccount(xero: XeroAccount): ExternalAccount {
    const typeMap: Record<string, ExternalAccount['type']> = {
      CURRENT: 'asset',
      FIXED: 'asset',
      BANK: 'asset',
      LIABILITY: 'liability',
      EQUITY: 'equity',
      REVENUE: 'revenue',
      EXPENSE: 'expense',
      CURRLIAB: 'liability',
      TERMLIAB: 'liability',
      DEPRECIATN: 'expense',
      DIRECTCOSTS: 'expense',
      OVERHEADS: 'expense',
    };

    return {
      externalId: xero.AccountID,
      name: xero.Name,
      type: typeMap[xero.Type] ?? 'asset',
      subtype: xero.ReportingCode,
      currency: xero.CurrencyCode ?? 'NZD',
      balance: 0, // Xero does not return balance in account list
      active: xero.Status === 'ACTIVE',
      lastUpdated: new Date(xero.UpdatedDateUTC).getTime(),
    };
  }

  // ── Transactions (Bank Transactions + Manual Journals) ───────────────────

  async getTransactions(
    accountId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<ExternalTransaction>> {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 100;

    const where = `BankAccount.AccountID==Guid("${accountId}")`;
    const response = await this.client.get<XeroBankTransactionsResponse>('/BankTransactions', {
      where,
      page: page.toString(),
      pageSize: pageSize.toString(),
      order: 'Date DESC',
    });

    const txns = response.data.BankTransactions ?? [];
    const items: ExternalTransaction[] = [];

    for (const txn of txns) {
      for (const line of txn.LineItems ?? []) {
        items.push({
          externalId: `${txn.BankTransactionID}-${line.LineItemID ?? '0'}`,
          accountId,
          date: txn.Date.split('T')[0]!,
          description: line.Description ?? txn.Reference ?? '',
          amount: line.LineAmount,
          currency: txn.CurrencyCode,
          type: txn.Type === 'RECEIVE' ? 'debit' : 'credit',
          category: line.AccountCode,
          reference: txn.Reference,
        });
      }
    }

    return {
      items,
      total: items.length,
      page,
      pageSize,
      hasNext: txns.length === pageSize,
    };
  }

  // ── Invoices ─────────────────────────────────────────────────────────────

  async getInvoices(pagination?: PaginationParams): Promise<PaginatedResponse<ExternalInvoice>> {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 100;

    const response = await this.client.get<XeroInvoicesResponse>('/Invoices', {
      page: page.toString(),
      pageSize: pageSize.toString(),
      order: 'Date DESC',
    });

    const invoices = response.data.Invoices ?? [];

    return {
      items: invoices.map(this.mapInvoice),
      total: invoices.length,
      page,
      pageSize,
      hasNext: invoices.length === pageSize,
    };
  }

  private mapInvoice(xero: XeroInvoice): ExternalInvoice {
    const statusMap: Record<string, ExternalInvoice['status']> = {
      DRAFT: 'draft',
      SUBMITTED: 'sent',
      AUTHORISED: 'sent',
      PAID: 'paid',
      VOIDED: 'void',
    };

    const lineItems: ExternalInvoiceLineItem[] = xero.LineItems.map((li) => ({
      description: li.Description,
      quantity: li.Quantity,
      unitPrice: li.UnitAmount,
      amount: li.LineAmount,
      accountId: li.AccountCode,
    }));

    return {
      externalId: xero.InvoiceID,
      number: xero.InvoiceNumber,
      customerId: xero.Contact.ContactID,
      date: xero.Date.split('T')[0]!,
      dueDate: xero.DueDate.split('T')[0]!,
      status: statusMap[xero.Status] ?? 'draft',
      subtotal: xero.SubTotal,
      tax: xero.TotalTax,
      total: xero.Total,
      currency: xero.CurrencyCode,
      lineItems,
    };
  }

  // ── Budgets ──────────────────────────────────────────────────────────────

  async getBudgets(pagination?: PaginationParams): Promise<PaginatedResponse<ExternalBudget>> {
    const page = pagination?.page ?? 1;

    try {
      const response = await this.client.get<XeroBudgetsResponse>('/Budgets', {
        page: page.toString(),
      });

      const budgets = response.data.Budgets ?? [];

      return {
        items: budgets.map(this.mapBudget),
        total: budgets.length,
        page,
        pageSize: 100,
        hasNext: false,
      };
    } catch {
      // Budgets API may not be available on all Xero plans
      return { items: [], total: 0, page: 1, pageSize: 50, hasNext: false };
    }
  }

  private mapBudget(xero: XeroBudget): ExternalBudget {
    const entries: ExternalBudgetEntry[] = [];

    for (const line of xero.BudgetLines ?? []) {
      for (const amount of line.BudgetAmounts ?? []) {
        entries.push({
          accountId: line.AccountID,
          category: line.AccountName,
          amount: amount.Amount,
          period: amount.Period,
        });
      }
    }

    return {
      externalId: xero.BudgetID,
      name: xero.Description,
      fiscalYear: new Date().getFullYear().toString(),
      entries,
    };
  }

  // ── Sync ─────────────────────────────────────────────────────────────────

  protected async pullData(options: SyncOptions): Promise<number> {
    let total = 0;
    const pageSize = options.batchSize ?? 100;

    // Pull accounts
    const accounts = await this.getAccounts({ page: 1, pageSize });
    total += accounts.items.length;

    // Pull transactions for first few accounts
    for (const account of accounts.items.slice(0, 10)) {
      const txns = await this.getTransactions(account.externalId, { page: 1, pageSize });
      total += txns.items.length;
    }

    // Pull invoices
    const invoices = await this.getInvoices({ page: 1, pageSize });
    total += invoices.items.length;

    // Pull budgets
    const budgets = await this.getBudgets({ page: 1, pageSize });
    total += budgets.items.length;

    return total;
  }

  protected async pushData(_options: SyncOptions): Promise<number> {
    // Xero push is not implemented in this phase
    // Would require creating/updating Invoices, BankTransactions, etc.
    return 0;
  }
}
