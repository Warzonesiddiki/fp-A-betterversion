// @money-ast-allow Reason: Timestamp conversion: charge.created * 1000 converts Unix seconds to milliseconds, not money
/**
 * API Integration Framework - Stripe Connector
 *
 * Connects to the Stripe REST API to sync payment/charge data for revenue
 * forecasting and cash-flow analysis:
 * - GET /v1/balance  — live account balance health check
 * - GET /v1/charges  — payment charges (revenue evidence)
 *
 * API docs: https://docs.stripe.com/api
 *
 * MONEY: Stripe returns amounts in minor units (cents). Amounts are converted
 * to major units via the canonical money primitive (`fromCents` — exact
 * decimal, no float division). No other arithmetic is applied to external
 * amounts; record counts and timestamps are not currency.
 */

import { fromCents } from '@/utils/money';
import { BaseConnector } from './BaseConnector';
import type {
  ConnectorConfig,
  ConnectorHealth,
  ExternalTransaction,
  PaginatedResponse,
  PaginationParams,
  SyncOptions,
} from './types';

// ─── Stripe API response shapes (subset) ─────────────────────────────────────

interface StripeBalanceResponse {
  available: Array<{ amount: number; currency: string }>;
  pending: Array<{ amount: number; currency: string }>;
}

interface StripeCharge {
  id: string;
  amount: number;
  currency: string;
  created: number;
  description: string | null;
  status: string;
  receipt_url: string | null;
}

interface StripeChargeList {
  data: StripeCharge[];
  has_more: boolean;
  url: string;
}

// ─── StripeConnector ─────────────────────────────────────────────────────────

export class StripeConnector extends BaseConnector {
  constructor(config: ConnectorConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl ?? 'https://api.stripe.com/v1',
    });
  }

  // ── Health check ─────────────────────────────────────────────────────────

  protected async performHealthCheck(): Promise<ConnectorHealth> {
    try {
      const response = await this.client.get<StripeBalanceResponse>('/balance');
      const available = response.data.available?.[0];
      if (!available) {
        return { status: 'error', lastError: 'Stripe returned no balance data' };
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

  // ── Charges (revenue transactions) ───────────────────────────────────────

  async getTransactions(
    _accountId: string,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<ExternalTransaction>> {
    const pageSize = pagination?.pageSize ?? 100;

    const response = await this.client.get<StripeChargeList>('/charges', {
      limit: pageSize,
    });

    const charges: StripeCharge[] = Array.isArray(response.data.data) ? response.data.data : [];

    return {
      // Stripe amounts are minor units (cents) → exact decimal conversion.
      items: charges.map((charge) => ({
        externalId: charge.id,
        accountId: 'stripe',
        date: new Date(charge.created * 1000).toISOString(),
        description: charge.description ?? `Stripe charge ${charge.id}`,
        amount: fromCents(charge.amount).toNumber(),
        currency: charge.currency.toUpperCase(),
        type: 'credit',
        category: charge.status,
        reference: charge.receipt_url ?? undefined,
      })),
      total: charges.length,
      page: pagination?.page ?? 1,
      pageSize,
      hasNext: response.data.has_more === true,
    };
  }

  // ── Sync ─────────────────────────────────────────────────────────────────

  protected async pullData(options: SyncOptions): Promise<number> {
    const pageSize = options.batchSize ?? 100;
    const transactions = await this.getTransactions('stripe', { page: 1, pageSize });
    return transactions.items.length;
  }

  protected async pushData(_options: SyncOptions): Promise<number> {
    // Stripe push (creating charges/invoices) is out of scope for FP&A sync.
    return 0;
  }
}
