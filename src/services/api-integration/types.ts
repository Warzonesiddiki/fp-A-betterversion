/**
 * API Integration Framework - Core Types
 *
 * Defines the shared interfaces for all external API connectors
 * (QuickBooks, Xero, REST, etc.)
 */

// ─── Auth ────────────────────────────────────────────────────────────────────

export type AuthType = 'oauth2' | 'api_key' | 'basic' | 'bearer';

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
}

export interface ApiKeyConfig {
  headerName: string;
  key: string;
}

export interface BasicAuthConfig {
  username: string;
  password: string;
}

export interface BearerTokenConfig {
  token: string;
}

export interface ConnectorAuthConfig {
  type: AuthType;
  oauth2?: OAuth2Config;
  apiKey?: ApiKeyConfig;
  basic?: BasicAuthConfig;
  bearer?: BearerTokenConfig;
}

// ─── Tokens (OAuth2) ─────────────────────────────────────────────────────────

export interface OAuth2Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp (ms)
  tokenType: string;
  scope?: string;
}

// ─── Request / Response ──────────────────────────────────────────────────────

export interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  data?: unknown;
  timeout?: number;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Connector Contract ──────────────────────────────────────────────────────

export type ConnectorStatus = 'connected' | 'disconnected' | 'error' | 'expired';

export interface ConnectorHealth {
  status: ConnectorStatus;
  lastSyncAt?: number;
  lastError?: string;
  rateLimitRemaining?: number;
  rateLimitReset?: number;
}

export interface SyncResult {
  success: boolean;
  recordsSynced: number;
  errors: string[];
  duration: number; // ms
  timestamp: number;
}

export interface ConnectorConfig {
  id: string;
  name: string;
  provider: string;
  auth: ConnectorAuthConfig;
  baseUrl?: string;
  rateLimitPerMinute?: number;
  retryCount?: number;
  retryDelayMs?: number;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  nextCursor?: string;
}

// ─── Sync ────────────────────────────────────────────────────────────────────

export type SyncDirection = 'pull' | 'push' | 'bidirectional';

export interface SyncOptions {
  direction: SyncDirection;
  since?: number; // Unix timestamp (ms)
  dryRun?: boolean;
  batchSize?: number;
}

// ─── Financial Data Shapes ───────────────────────────────────────────────────

export interface ExternalAccount {
  externalId: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subtype?: string;
  currency: string;
  balance: number;
  active: boolean;
  lastUpdated: number;
}

export interface ExternalTransaction {
  externalId: string;
  accountId: string;
  date: string; // ISO 8601
  description: string;
  amount: number;
  currency: string;
  type: 'debit' | 'credit';
  category?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface ExternalInvoice {
  externalId: string;
  number: string;
  customerId: string;
  date: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  lineItems: ExternalInvoiceLineItem[];
}

export interface ExternalInvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  accountId?: string;
}

export interface ExternalBudget {
  externalId: string;
  name: string;
  fiscalYear: string;
  entries: ExternalBudgetEntry[];
}

export interface ExternalBudgetEntry {
  accountId: string;
  category: string;
  amount: number;
  period: string;
}
