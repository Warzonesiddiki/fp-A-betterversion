/**
 * API Integration Framework
 *
 * Public API surface for external accounting/ERP connectors.
 *
 * Usage:
 *   import {
 *     connectorRegistry,
 *     QuickBooksConnector,
 *     XeroConnector,
 *     RestApiClient,
 *   } from '@/services/api-integration';
 *
 *   // Register factories
 *   connectorRegistry.registerFactory('quickbooks', (cfg) => new QuickBooksConnector(cfg));
 *   connectorRegistry.registerFactory('xero', (cfg) => new XeroConnector(cfg));
 *
 *   // Create a connector
 *   const qb = connectorRegistry.createConnector({
 *     id: 'qb-main',
 *     name: 'QuickBooks Main',
 *     provider: 'quickbooks',
 *     auth: { type: 'oauth2', oauth2: { ... } },
 *     realmId: '123456',
 *   });
 *
 *   // Connect and sync
 *   await qb.connect();
 *   const result = await qb.sync({ direction: 'pull' });
 */

// ── Core types ───────────────────────────────────────────────────────────────
export type {
  AuthType,
  OAuth2Config,
  ApiKeyConfig,
  BasicAuthConfig,
  BearerTokenConfig,
  ConnectorAuthConfig,
  OAuth2Tokens,
  ApiRequestConfig,
  ConnectorStatus,
  ConnectorHealth,
  SyncResult,
  ConnectorConfig,
  PaginationParams,
  PaginatedResponse,
  SyncDirection,
  SyncOptions,
  ExternalAccount,
  ExternalTransaction,
  ExternalInvoice,
  ExternalInvoiceLineItem,
  ExternalBudget,
  ExternalBudgetEntry,
} from './types';

export { ApiError } from './types';

// ── Classes ──────────────────────────────────────────────────────────────────
export { RestApiClient } from './RestApiClient';
export { BaseConnector } from './BaseConnector';
export { QuickBooksConnector } from './QuickBooksConnector';
export { XeroConnector } from './XeroConnector';
export { ConnectorRegistry, connectorRegistry } from './ConnectorRegistry';
export type { ConnectorFactory } from './ConnectorRegistry';
