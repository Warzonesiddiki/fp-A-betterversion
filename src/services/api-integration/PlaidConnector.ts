/**
 * API Integration Framework - Plaid Connector
 *
 * Connects to the Plaid API (banking data) for cash-flow analysis and
 * forecasting. Uses Plaid's Link token flow:
 * - POST /link/token/create  — health check (validates client_id + secret)
 * - POST /transactions/sync  — pull transactions when an access_token from a
 *   completed Link flow is provided (optional field on the connection)
 *
 * API docs: https://plaid.com/docs/api
 *
 * Plaid requires TWO headers (client_id + secret) on every server call, which
 * the shared `RestApiClient` api_key auth does not support (single header), so
 * this connector issues requests directly via fetch, mirroring the
 * NetSuiteConnector pattern. No monetary arithmetic is applied to external
 * amounts (Plaid returns dollar amounts in major units for transactions).
 */

import { BaseConnector } from './BaseConnector';
import type {
  ConnectorConfig,
  ConnectorHealth,
  ExternalTransaction,
  PaginatedResponse,
  PaginationParams,
  SyncOptions,
} from './types';

// ─── Plaid API response shapes (subset) ─────────────────────────────────────

interface PlaidLinkTokenResponse {
  link_token: string;
  expiration: string;
}

interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  date: string;
  name: string;
  amount: number;
  currency_code?: string;
  iso_currency_code?: string;
  pending: boolean;
  merchant_name?: string;
}

interface PlaidTransactionsSyncResponse {
  added: PlaidTransaction[];
  modified: PlaidTransaction[];
  removed: Array<{ transaction_id: string }>;
  has_more: boolean;
  next_cursor: string;
}

interface PlaidErrorResponse {
  error_type?: string;
  error_code?: string;
  error_message?: string;
}

// ─── PlaidConnector ──────────────────────────────────────────────────────────

export class PlaidConnector extends BaseConnector {
  private readonly clientId: string;
  private readonly secret: string;
  private readonly accessToken?: string;
  private readonly baseUrl: string;

  constructor(config: ConnectorConfig & { secret: string; accessToken?: string }) {
    super({
      ...config,
      baseUrl: config.baseUrl ?? 'https://sandbox.plaid.com',
    });
    const apiKey = config.auth.apiKey;
    if (!apiKey?.key) {
      throw new Error('PlaidConnector requires auth.apiKey.key (client_id) and config.secret');
    }
    if (!config.secret) {
      throw new Error('PlaidConnector requires config.secret');
    }
    this.clientId = apiKey.key;
    this.secret = config.secret;
    this.accessToken = config.accessToken;
    this.baseUrl = 'https://sandbox.plaid.com';
  }

  // ── Raw request (Plaid needs client_id + secret headers) ────────────────

  private async plaidRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': this.clientId,
        'PLAID-SECRET': this.secret,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => ({}))) as PlaidErrorResponse;
      throw new Error(
        `Plaid ${path} failed: ${response.status} ${response.statusText} — ` +
          `${errorBody.error_message ?? errorBody.error_code ?? 'unknown error'}`
      );
    }

    return (await response.json()) as T;
  }

  // ── Health check ─────────────────────────────────────────────────────────

  protected async performHealthCheck(): Promise<ConnectorHealth> {
    try {
      // link/token/create validates the client_id + secret without needing an
      // access_token from a completed Link flow.
      const response = await this.plaidRequest<PlaidLinkTokenResponse>('/link/token/create', {
        client_name: 'FinPlan Pro',
        language: 'en',
        country_codes: ['US'],
        products: ['transactions'],
        client_user_id: 'finplan-pro',
      });

      if (!response.link_token) {
        return { status: 'error', lastError: 'Plaid returned no link token' };
      }

      return {
        status: 'connected',
        lastSyncAt: Date.now(),
      };
    } catch (error: unknown) {
      return {
        status: 'error',
        lastError: error instanceof Error ? error.message : 'Health check failed',
      };
    }
  }

  // ── Transactions (requires a completed Link access token) ────────────────

  async getTransactions(
    _accountId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<ExternalTransaction>> {
    if (!this.accessToken) {
      return { items: [], total: 0, page: 1, pageSize: 50, hasNext: false };
    }

    const pageSize = pagination?.pageSize ?? 100;
    const response = await this.plaidRequest<PlaidTransactionsSyncResponse>('/transactions/sync', {
      access_token: this.accessToken,
      count: pageSize,
    });

    const added = Array.isArray(response.added) ? response.added : [];

    return {
      items: added.map((txn) => ({
        externalId: txn.transaction_id,
        accountId: txn.account_id,
        date: txn.date,
        description: txn.merchant_name ?? txn.name,
        amount: Math.abs(txn.amount),
        currency: txn.iso_currency_code ?? txn.currency_code ?? 'USD',
        type: txn.amount >= 0 ? 'debit' : 'credit',
        category: txn.pending ? 'pending' : 'posted',
      })),
      total: added.length,
      page: pagination?.page ?? 1,
      pageSize,
      hasNext: response.has_more === true,
    };
  }

  // ── Sync ─────────────────────────────────────────────────────────────────

  protected async pullData(options: SyncOptions): Promise<number> {
    const pageSize = options.batchSize ?? 100;
    const transactions = await this.getTransactions('plaid', { page: 1, pageSize });
    return transactions.items.length;
  }

  protected async pushData(_options: SyncOptions): Promise<number> {
    // Plaid is a read-only data source for FP&A.
    return 0;
  }
}
