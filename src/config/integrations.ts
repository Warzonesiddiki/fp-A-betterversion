/**
 * Integration catalog — the single source of truth for every integration the
 * Integrations hub can connect to (2026-08-12).
 *
 * Each definition maps UI credential fields → a `ConnectorConfig` → a real
 * connector class from `src/services/api-integration/`. Only integrations
 * with a real connector implementation are listed — no placeholder entries.
 *
 * Note on OAuth2 connectors: client credentials are stored locally and an
 * optional access token (from the provider's OAuth flow) can be pasted to
 * make "Test connection" work in-app. A full browser-based OAuth redirect
 * flow is a future server-authorized capability (F-04 / P-track), not part
 * of the offline-first client.
 */

import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Building2,
  Calculator,
  CreditCard,
  Database,
  Landmark,
  MessageSquare,
  Users,
} from 'lucide-react';
import type { BaseConnector } from '@/services/api-integration/BaseConnector';
import type { ConnectorConfig } from '@/services/api-integration/types';
import {
  DynamicsConnector,
  NetSuiteConnector,
  PlaidConnector,
  QuickBooksConnector,
  SageConnector,
  SalesforceConnector,
  SlackConnector,
  StripeConnector,
  XeroConnector,
} from '@/services/api-integration';

export type IntegrationCategory =
  | 'accounting'
  | 'erp'
  | 'crm'
  | 'payments'
  | 'banking'
  | 'communication';

export interface IntegrationField {
  key: string;
  label: string;
  /** Defaults to 'text'. */
  type?: 'text' | 'password' | 'url';
  required?: boolean;
  placeholder?: string;
  help?: string;
}

export interface IntegrationDefinition {
  provider: string;
  name: string;
  description: string;
  capability: string;
  category: IntegrationCategory;
  icon: LucideIcon;
  authKind: 'oauth2' | 'token' | 'webhook';
  /** True when the connector pulls/pushes data during sync (Slack is outbound-only). */
  syncable: boolean;
  fields: IntegrationField[];
  docsUrl?: string;
  buildConfig: (values: Record<string, string>, id: string) => ConnectorConfig;
  buildConnector: (config: ConnectorConfig) => BaseConnector;
}

export const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  accounting: 'Accounting',
  erp: 'ERP',
  crm: 'CRM',
  payments: 'Payments',
  banking: 'Banking',
  communication: 'Communication',
};

export const INTEGRATION_CATALOG: IntegrationDefinition[] = [
  {
    provider: 'quickbooks',
    name: 'QuickBooks Online',
    description: 'Sync chart of accounts, journal entries, invoices, and budgets.',
    capability: 'Accounts, transactions, invoices, budgets',
    category: 'accounting',
    icon: Calculator,
    authKind: 'oauth2',
    syncable: true,
    fields: [
      {
        key: 'realmId',
        label: 'Company ID (Realm ID)',
        required: true,
        placeholder: '1234567890',
        help: 'Found in QuickBooks Online URL: app.qbo.intuit.com/app/1234567890',
      },
      { key: 'clientId', label: 'Client ID', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      {
        key: 'accessToken',
        label: 'Access Token (optional)',
        type: 'password',
        help: 'Paste a token from your OAuth flow to test the connection without a callback server.',
      },
    ],
    docsUrl: 'https://developer.intuit.com/app/developer/qbo/docs',
    buildConfig: (values, id) => ({
      id,
      name: 'QuickBooks Online',
      provider: 'quickbooks',
      auth: {
        type: 'oauth2',
        oauth2: {
          clientId: values.clientId ?? '',
          clientSecret: values.clientSecret ?? '',
          authorizationUrl: 'https://appcenter.intuit.com/connect/oauth2',
          tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
          scopes: ['com.intuit.quickbooks.accounting'],
          redirectUri: 'http://localhost:5173/callback',
        },
      },
      realmId: values.realmId ?? '',
    }),
    buildConnector: (config) =>
      new QuickBooksConnector(config as ConnectorConfig & { realmId: string }),
  },
  {
    provider: 'xero',
    name: 'Xero',
    description: 'Import accounts, invoices, and bank transactions for cash-flow analysis.',
    capability: 'Accounts, transactions, invoices',
    category: 'accounting',
    icon: BookOpen,
    authKind: 'oauth2',
    syncable: true,
    fields: [
      { key: 'clientId', label: 'Client ID', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      {
        key: 'accessToken',
        label: 'Access Token (optional)',
        type: 'password',
        help: 'Paste a token from your OAuth flow to test the connection without a callback server.',
      },
    ],
    docsUrl: 'https://developer.xero.com/documentation',
    buildConfig: (values, id) => ({
      id,
      name: 'Xero',
      provider: 'xero',
      auth: {
        type: 'oauth2',
        oauth2: {
          clientId: values.clientId ?? '',
          clientSecret: values.clientSecret ?? '',
          authorizationUrl: 'https://login.xero.com/identity/connect/authorize',
          tokenUrl: 'https://identity.xero.com/connect/token',
          scopes: ['accounting.transactions', 'accounting.settings'],
          redirectUri: 'http://localhost:5173/callback',
        },
      },
    }),
    buildConnector: (config) => new XeroConnector(config),
  },
  {
    provider: 'netsuite',
    name: 'NetSuite',
    description: 'Oracle NetSuite ERP — chart of accounts, GL transactions, invoices, and budgets.',
    capability: 'Accounts, GL entries, invoices, budgets',
    category: 'erp',
    icon: Database,
    authKind: 'token',
    syncable: true,
    fields: [
      {
        key: 'accountId',
        label: 'Account ID',
        required: true,
        placeholder: 'TSTDRV1234567',
      },
      { key: 'consumerKey', label: 'Consumer Key', required: true },
      { key: 'consumerSecret', label: 'Consumer Secret', type: 'password', required: true },
      { key: 'tokenId', label: 'Token ID', required: true },
      { key: 'tokenSecret', label: 'Token Secret', type: 'password', required: true },
    ],
    docsUrl: 'https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/',
    buildConfig: (values, id) => ({
      id,
      name: 'NetSuite',
      provider: 'netsuite',
      auth: {
        type: 'oauth1',
        oauth1: {
          accountId: values.accountId ?? '',
          consumerKey: values.consumerKey ?? '',
          consumerSecret: values.consumerSecret ?? '',
          tokenId: values.tokenId ?? '',
          tokenTokenSecret: values.tokenSecret ?? '',
          realm: values.accountId ?? '',
          signatureMethod: 'HMAC-SHA256',
        },
      } as unknown as ConnectorConfig['auth'],
    }),
    buildConnector: (config) => new NetSuiteConnector(config),
  },
  {
    provider: 'sage',
    name: 'Sage Intacct',
    description: 'Sage Intacct ERP — GL accounts, journal entries, AP/AR, and budgets.',
    capability: 'GL accounts, journal entries, invoices, budgets',
    category: 'erp',
    icon: Landmark,
    authKind: 'token',
    syncable: true,
    fields: [
      { key: 'companyId', label: 'Company ID (IAID)', required: true },
      { key: 'userId', label: 'User ID', required: true },
      { key: 'password', label: 'User Password', type: 'password', required: true },
      { key: 'clientId', label: 'OAuth2 Client ID', required: true },
      { key: 'clientSecret', label: 'OAuth2 Client Secret', type: 'password', required: true },
    ],
    docsUrl: 'https://developer.intacct.com',
    buildConfig: (values, id) => ({
      id,
      name: 'Sage Intacct',
      provider: 'sage',
      auth: {
        type: 'oauth2_sage',
        oauth2: {
          clientId: values.clientId ?? '',
          clientSecret: values.clientSecret ?? '',
          authorizationUrl: 'https://www.intacct.com/ia/oauth2/authorize',
          tokenUrl: 'https://api.intacct.com/oauth2/token',
          scopes: ['api'],
          redirectUri: 'http://localhost:5173/callback',
          sender: {
            companyId: values.companyId ?? '',
            userId: values.userId ?? '',
            password: values.password ?? '',
          },
        },
      } as unknown as ConnectorConfig['auth'],
    }),
    buildConnector: (config) => new SageConnector(config),
  },
  {
    provider: 'dynamics',
    name: 'Microsoft Dynamics 365',
    description: 'Dynamics 365 (Dataverse) — accounts, invoices, products, and opportunities.',
    capability: 'Accounts, contacts, invoices, opportunities',
    category: 'erp',
    icon: Building2,
    authKind: 'token',
    syncable: true,
    fields: [
      { key: 'tenantId', label: 'Azure Tenant ID', required: true },
      {
        key: 'orgUrl',
        label: 'Dataverse Organization URL',
        type: 'url',
        required: true,
        placeholder: 'https://org.crm.dynamics.com',
      },
      { key: 'clientId', label: 'Client ID', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/power-apps/developer/data-platform/',
    buildConfig: (values, id) => ({
      id,
      name: 'Microsoft Dynamics 365',
      provider: 'dynamics',
      auth: {
        type: 'oauth2_dataverse',
        oauth2: {
          clientId: values.clientId ?? '',
          clientSecret: values.clientSecret ?? '',
          tokenUrl: `https://login.microsoftonline.com/${values.tenantId ?? ''}/oauth2/v2.0/token`,
          scopes: ['https://api.crm.dynamics.com/.default'],
          dataverse: {
            tenantId: values.tenantId ?? '',
            orgUrl: values.orgUrl ?? '',
          },
        },
      } as unknown as ConnectorConfig['auth'],
    }),
    buildConnector: (config) => new DynamicsConnector(config),
  },
  {
    provider: 'salesforce',
    name: 'Salesforce',
    description: 'CRM pipeline and opportunity data for revenue forecasting.',
    capability: 'Accounts, opportunities (revenue pipeline)',
    category: 'crm',
    icon: Users,
    authKind: 'oauth2',
    syncable: true,
    fields: [
      {
        key: 'instanceUrl',
        label: 'Instance URL',
        type: 'url',
        required: true,
        placeholder: 'https://yourcompany.my.salesforce.com',
      },
      { key: 'clientId', label: 'Consumer Key', required: true },
      { key: 'clientSecret', label: 'Consumer Secret', type: 'password', required: true },
      {
        key: 'accessToken',
        label: 'Access Token (optional)',
        type: 'password',
        help: 'Paste a token from your OAuth flow to test the connection without a callback server.',
      },
    ],
    docsUrl: 'https://developer.salesforce.com/docs',
    buildConfig: (values, id) => ({
      id,
      name: 'Salesforce',
      provider: 'salesforce',
      baseUrl: values.instanceUrl ?? '',
      auth: {
        type: 'oauth2',
        oauth2: {
          clientId: values.clientId ?? '',
          clientSecret: values.clientSecret ?? '',
          authorizationUrl: 'https://login.salesforce.com/services/oauth2/authorize',
          tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
          scopes: ['api'],
          redirectUri: 'http://localhost:5173/callback',
        },
      },
    }),
    buildConnector: (config) => new SalesforceConnector(config),
  },
  {
    provider: 'stripe',
    name: 'Stripe',
    description: 'Payment and charge data for revenue recognition and cash-flow forecasting.',
    capability: 'Balance, charges (revenue transactions)',
    category: 'payments',
    icon: CreditCard,
    authKind: 'token',
    syncable: true,
    fields: [
      {
        key: 'secretKey',
        label: 'Secret Key',
        type: 'password',
        required: true,
        placeholder: 'sk_live_…',
        help: 'Restricted keys are supported — create one with read access to balance and charges.',
      },
    ],
    docsUrl: 'https://docs.stripe.com/api',
    buildConfig: (values, id) => ({
      id,
      name: 'Stripe',
      provider: 'stripe',
      auth: { type: 'bearer', bearer: { token: values.secretKey ?? '' } },
    }),
    buildConnector: (config) => new StripeConnector(config),
  },
  {
    provider: 'plaid',
    name: 'Plaid',
    description: 'Bank account and transaction feeds for cash-flow analysis and forecasting.',
    capability: 'Transactions (requires completed Link flow access token)',
    category: 'banking',
    icon: Landmark,
    authKind: 'token',
    syncable: true,
    fields: [
      { key: 'clientId', label: 'Client ID', required: true },
      { key: 'secret', label: 'Secret', type: 'password', required: true },
      {
        key: 'accessToken',
        label: 'Access Token (optional)',
        type: 'password',
        help: 'From a completed Link flow. Without it, connection tests work but transaction sync returns 0 records.',
      },
    ],
    docsUrl: 'https://plaid.com/docs/api',
    buildConfig: (values, id) =>
      ({
        id,
        name: 'Plaid',
        provider: 'plaid',
        auth: { type: 'api_key', apiKey: { headerName: 'client_id', key: values.clientId ?? '' } },
        secret: values.secret ?? '',
        accessToken: values.accessToken ? values.accessToken : undefined,
      }) as ConnectorConfig,
    buildConnector: (config) =>
      new PlaidConnector(config as ConnectorConfig & { secret: string; accessToken?: string }),
  },
  {
    provider: 'slack',
    name: 'Slack',
    description: 'Send budget approval, forecast, and close alerts to a Slack channel.',
    capability: 'Outbound notifications (incoming webhook)',
    category: 'communication',
    icon: MessageSquare,
    authKind: 'webhook',
    syncable: false,
    fields: [
      {
        key: 'webhookUrl',
        label: 'Incoming Webhook URL',
        type: 'url',
        required: true,
        placeholder: 'https://hooks.slack.com/services/…',
        help: 'Create one in Slack: Apps → Incoming Webhooks.',
      },
      {
        key: 'channel',
        label: 'Channel Name (optional)',
        placeholder: '#finance-alerts',
      },
    ],
    docsUrl: 'https://api.slack.com/messaging/webhooks',
    buildConfig: (values, id) => ({
      id,
      name: values.channel?.trim() ? values.channel.trim() : 'Slack',
      provider: 'slack',
      baseUrl: values.webhookUrl ?? '',
      auth: { type: 'bearer', bearer: { token: '' } },
    }),
    buildConnector: (config) => new SlackConnector(config),
  },
];

export function getIntegrationDefinition(provider: string): IntegrationDefinition | undefined {
  return INTEGRATION_CATALOG.find((def) => def.provider === provider);
}
