/**
 * API Integration Framework - Base Connector
 *
 * Abstract base class for all accounting/ERP connectors.
 * Provides shared lifecycle: connect, sync, health-check, disconnect.
 */

import type {
  ConnectorConfig,
  ConnectorHealth,
  ConnectorStatus,
  ExternalAccount,
  ExternalBudget,
  ExternalInvoice,
  ExternalTransaction,
  OAuth2Tokens,
  PaginatedResponse,
  PaginationParams,
  SyncOptions,
  SyncResult,
} from './types';
import { RestApiClient } from './RestApiClient';

// ─── BaseConnector ───────────────────────────────────────────────────────────

export abstract class BaseConnector {
  protected readonly config: ConnectorConfig;
  protected readonly client: RestApiClient;
  protected status: ConnectorStatus = 'disconnected';
  protected lastSyncAt?: number;
  protected lastError?: string;

  constructor(config: ConnectorConfig) {
    this.config = config;
    this.client = new RestApiClient(config.baseUrl ?? '', config.auth, {
      retryCount: config.retryCount,
      retryDelayMs: config.retryDelayMs,
    });
  }

  // ── Identity ─────────────────────────────────────────────────────────────

  get id(): string {
    return this.config.id;
  }

  get name(): string {
    return this.config.name;
  }

  get provider(): string {
    return this.config.provider;
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  async connect(): Promise<boolean> {
    try {
      const healthy = await this.checkHealth();
      this.status = healthy.status;
      return this.status === 'connected';
    } catch (error: unknown) {
      this.status = 'error';
      this.lastError = error instanceof Error ? error.message : 'Connection failed';
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.status = 'disconnected';
  }

  // ── Health ───────────────────────────────────────────────────────────────

  async checkHealth(): Promise<ConnectorHealth> {
    try {
      const health = await this.performHealthCheck();
      this.status = health.status;
      if (health.lastError) this.lastError = health.lastError;
      return health;
    } catch (error: unknown) {
      this.status = 'error';
      this.lastError = error instanceof Error ? error.message : 'Health check failed';
      return {
        status: 'error',
        lastError: this.lastError,
      };
    }
  }

  getHealth(): ConnectorHealth {
    return {
      status: this.status,
      lastSyncAt: this.lastSyncAt,
      lastError: this.lastError,
    };
  }

  // ── OAuth2 Token Passthrough ─────────────────────────────────────────────

  setOAuthTokens(tokens: OAuth2Tokens): void {
    this.client.setOAuthTokens(tokens);
  }

  // ── Sync ─────────────────────────────────────────────────────────────────

  async sync(options: SyncOptions): Promise<SyncResult> {
    const start = Date.now();
    const errors: string[] = [];
    let recordsSynced = 0;

    try {
      if (options.direction === 'pull' || options.direction === 'bidirectional') {
        const pulled = await this.pullData(options);
        recordsSynced += pulled;
      }

      if (options.direction === 'push' || options.direction === 'bidirectional') {
        const pushed = await this.pushData(options);
        recordsSynced += pushed;
      }

      this.lastSyncAt = Date.now();

      return {
        success: true,
        recordsSynced,
        errors,
        duration: Date.now() - start,
        timestamp: Date.now(),
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      errors.push(message);
      this.lastError = message;

      return {
        success: false,
        recordsSynced,
        errors,
        duration: Date.now() - start,
        timestamp: Date.now(),
      };
    }
  }

  // ── Abstract methods (connector-specific) ────────────────────────────────

  protected abstract performHealthCheck(): Promise<ConnectorHealth>;
  protected abstract pullData(options: SyncOptions): Promise<number>;
  protected abstract pushData(options: SyncOptions): Promise<number>;

  // ── Optional domain methods (override as needed) ─────────────────────────

  async getAccounts(_pagination?: PaginationParams): Promise<PaginatedResponse<ExternalAccount>> {
    return { items: [], total: 0, page: 1, pageSize: 50, hasNext: false };
  }

  async getTransactions(
    _accountId: string,
    _pagination?: PaginationParams
  ): Promise<PaginatedResponse<ExternalTransaction>> {
    return { items: [], total: 0, page: 1, pageSize: 50, hasNext: false };
  }

  async getInvoices(_pagination?: PaginationParams): Promise<PaginatedResponse<ExternalInvoice>> {
    return { items: [], total: 0, page: 1, pageSize: 50, hasNext: false };
  }

  async getBudgets(_pagination?: PaginationParams): Promise<PaginatedResponse<ExternalBudget>> {
    return { items: [], total: 0, page: 1, pageSize: 50, hasNext: false };
  }
}
