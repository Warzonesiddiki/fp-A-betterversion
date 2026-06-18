export { RestApiClient } from './RestApiClient';
export type {
  RestApiClientOptions,
  AuthConfig,
  OAuth2Config,
  ApiKeyConfig,
  BasicAuthConfig,
  BearerAuthConfig,
  ApiResponse,
  RequestOptions,
  OAuth2Tokens,
  RestApiEvent,
  RestApiEventListener,
} from './types';
export { ApiError } from './types';

// PATCH 9 — REST_API_CLIENT v0.3 (Hephaestus, 2026-06-16)
// GHOST-SHA detection (NEVER-AGAIN RULE #53)
export { GhostShaValidator, GHOST_SHA_VALIDATOR_CONSTANTS } from './GhostShaValidator';
export type {
  GhostShaClassification,
  GhostShaValidationResult,
  GhostShaScanOptions,
  GhostShaScanResult,
  GhostShaBulkValidationResult,
} from './GhostShaValidator';

// PATCH 21 — CONNECTOR BARREL EXPORTS (Prometheus T-3.15/T-4.0, 2026-06-18)
// ERP / Accounting / Banking connectors
export { NetSuiteConnector } from './NetSuiteConnector';
export type { NetSuiteAuthConfig } from './NetSuiteConnector';

export { QuickBooksConnector } from './QuickBooksConnector';

// PlaidConnector removed — file does not exist (replaced by Stripe per PATCH 22)
// export { PlaidConnector } from './PlaidConnector';
// export type { PlaidAuthConfig } from './PlaidConnector';

export { XeroConnector } from './XeroConnector';

// PATCH 22 — SALESFORCE CONNECTOR (Prometheus T-3.16/T-4.5, 2026-06-18)
// CRM for revenue forecast pipeline integration
export { SalesforceConnector } from './SalesforceConnector';

// PATCH 23 — SAGE INTACCT CONNECTOR (Prometheus T-3.17/T-4.6, 2026-06-18)
// ERP for general ledger integration (chart of accounts + GL entries + AP/AR)
export { SageConnector, type SageAuthConfig } from './SageConnector';

// Connector framework
export { BaseConnector } from './BaseConnector';
export { ConnectorRegistry } from './ConnectorRegistry';
export type { ConnectorFactory } from './ConnectorRegistry';

// Shared connector types
export type {
  ConnectorConfig,
  ConnectorAuthConfig,
  ConnectorHealth,
  ExternalAccount,
  ExternalTransaction,
  ExternalInvoice,
  ExternalInvoiceLineItem,
  ExternalBudget,
  ExternalBudgetEntry,
  PaginatedResponse,
  PaginationParams,
} from './types';
