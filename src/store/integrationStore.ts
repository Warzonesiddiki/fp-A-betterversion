/**
 * integrationStore — persisted state for the Integrations hub (2026-08-12).
 *
 * Holds one connection per provider (keyed by provider name), built on top of
 * the real connector framework (`src/services/api-integration`). Connect /
 * test / sync create a connector instance from the catalog's definition and
 * the stored credentials, then exercise the real connector lifecycle.
 *
 * Credentials are persisted through `masterStorage` (the app's canonical
 * local encrypted storage — sql.js / Tauri SQLite), consistent with the
 * offline-first design: local workspace data is draft/cache and never leaves
 * the device.
 */

import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';
import { getIntegrationDefinition } from '@/config/integrations';
import { buildJournalEntries } from '@/engines/ConnectorImportEngine';
import { useGLStore } from '@/store/glStore';
import type { BaseConnector } from '@/services/api-integration/BaseConnector';
import type { ConnectorStatus, ExternalTransaction } from '@/services/api-integration/types';
import { randomId } from '@/utils/cryptoId';
// W6-P0-14: connector lifecycle is permission-guarded. Creating a connection
// stores provider credentials and opens an import channel (import:create);
// test/sync/disconnect mutate persisted connection state (import:update);
// importToLedger writes GL rows (import:create, matching glStore.importGLData).
// getConnection is a read.
import { enforce, Permissions } from '@/utils/rbacEnforcer';

export interface IntegrationConnection {
  provider: string;
  id: string;
  name: string;
  status: ConnectorStatus;
  /** Provider-specific credential fields (see catalog definitions). */
  credentials: Record<string, string>;
  connectedAt?: number;
  lastSyncAt?: number;
  lastSyncCount?: number;
  lastImportAt?: number;
  lastImportCount?: number;
  lastError?: string;
}

export interface ImportToLedgerResult {
  success: boolean;
  imported: number;
  skipped: number;
  message: string;
}

interface IntegrationState {
  connections: Record<string, IntegrationConnection>;
  /** Per-provider in-flight flag for connect/test/sync/import. */
  busy: Record<string, boolean>;
  connect: (provider: string, credentials: Record<string, string>) => Promise<boolean>;
  disconnect: (provider: string) => void;
  test: (provider: string) => Promise<boolean>;
  sync: (provider: string) => Promise<boolean>;
  /** Pull external transactions and import them into the GL ledger. */
  importToLedger: (provider: string) => Promise<ImportToLedgerResult>;
  getConnection: (provider: string) => IntegrationConnection | undefined;
}

/** Cap on accounts walked per import (mirrors the connectors' own pull bounds). */
const MAX_IMPORT_ACCOUNTS = 25;
const IMPORT_PAGE_SIZE = 200;

// ─── Connector construction ─────────────────────────────────────────────────

function buildConnector(connection: IntegrationConnection): BaseConnector | null {
  const def = getIntegrationDefinition(connection.provider);
  if (!def) return null;

  const config = def.buildConfig(connection.credentials, connection.id);
  const connector = def.buildConnector(config);

  // Optional pasted OAuth access token (no callback server in a desktop app).
  const token = connection.credentials.accessToken;
  if (token) {
    connector.setOAuthTokens({
      accessToken: token,
      refreshToken: '',
      expiresAt: 0,
      tokenType: 'Bearer',
    });
  }
  return connector;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export const useIntegrationStore = create<IntegrationState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        connections: {},
        busy: {},

        connect: enforce(Permissions.IMPORT_CREATE, 'connect', async (provider, credentials) => {
          const def = getIntegrationDefinition(provider);
          if (!def) return false;

          const id = randomId(`conn-${provider}-`);
          set((state) => {
            state.busy[provider] = true;
            state.connections[provider] = {
              provider,
              id,
              name: def.name,
              status: 'disconnected',
              credentials,
            };
          });

          const connection = get().connections[provider];
          if (!connection) return false;
          const connector = buildConnector(connection);
          if (!connector) {
            set((state) => {
              state.busy[provider] = false;
            });
            return false;
          }

          try {
            const ok = await connector.connect();
            set((state) => {
              state.busy[provider] = false;
              const conn = state.connections[provider];
              if (conn) {
                conn.status = ok ? 'connected' : 'error';
                conn.connectedAt = ok ? Date.now() : undefined;
                conn.lastError = ok
                  ? undefined
                  : 'Connection test failed — check your credentials.';
              }
            });
            return ok;
          } catch (error) {
            set((state) => {
              state.busy[provider] = false;
              const conn = state.connections[provider];
              if (conn) {
                conn.status = 'error';
                conn.lastError = errorMessage(error, 'Connection failed');
              }
            });
            return false;
          }
        }),

        disconnect: enforce(Permissions.IMPORT_UPDATE, 'disconnect', (provider) => {
          set((state) => {
            delete state.connections[provider];
            delete state.busy[provider];
          });
        }),

        test: enforce(Permissions.IMPORT_UPDATE, 'test', async (provider) => {
          const connection = get().connections[provider];
          if (!connection) return false;
          const connector = buildConnector(connection);
          if (!connector) return false;

          set((state) => {
            state.busy[provider] = true;
          });

          try {
            const ok = await connector.connect();
            set((state) => {
              state.busy[provider] = false;
              const conn = state.connections[provider];
              if (conn) {
                conn.status = ok ? 'connected' : 'error';
                conn.lastError = ok
                  ? undefined
                  : 'Connection test failed — check your credentials.';
                if (ok) {
                  conn.connectedAt ??= Date.now();
                }
              }
            });
            return ok;
          } catch (error) {
            set((state) => {
              state.busy[provider] = false;
              const conn = state.connections[provider];
              if (conn) {
                conn.status = 'error';
                conn.lastError = errorMessage(error, 'Connection test failed');
              }
            });
            return false;
          }
        }),

        sync: enforce(Permissions.IMPORT_UPDATE, 'sync', async (provider) => {
          const connection = get().connections[provider];
          if (!connection) return false;
          const connector = buildConnector(connection);
          if (!connector) return false;

          set((state) => {
            state.busy[provider] = true;
          });

          try {
            const result = await connector.sync({ direction: 'pull', batchSize: 100 });
            set((state) => {
              state.busy[provider] = false;
              const conn = state.connections[provider];
              if (conn) {
                if (result.success) {
                  conn.status = 'connected';
                  conn.lastSyncAt = result.timestamp;
                  conn.lastSyncCount = result.recordsSynced;
                  conn.lastError = undefined;
                } else {
                  conn.status = 'error';
                  conn.lastError = result.errors[0] ?? 'Sync failed';
                }
              }
            });
            return result.success;
          } catch (error) {
            set((state) => {
              state.busy[provider] = false;
              const conn = state.connections[provider];
              if (conn) {
                conn.status = 'error';
                conn.lastError = errorMessage(error, 'Sync failed');
              }
            });
            return false;
          }
        }),

        importToLedger: enforce(Permissions.IMPORT_CREATE, 'importToLedger', async (provider) => {
          const connection = get().connections[provider];
          if (!connection) {
            return {
              success: false,
              imported: 0,
              skipped: 0,
              message: 'No connection for this integration.',
            };
          }
          const connector = buildConnector(connection);
          if (!connector) {
            return {
              success: false,
              imported: 0,
              skipped: 0,
              message: 'Connector unavailable for this integration.',
            };
          }

          set((state) => {
            state.busy[provider] = true;
          });

          try {
            const transactions: ExternalTransaction[] = [];
            let skipped = 0;

            // Accounting/ERP connectors expose accounts first, then per-account
            // transactions. Payments/banking connectors (Stripe, Plaid) have no
            // accounts feed — fall back to a direct transaction pull.
            const accounts = await connector.getAccounts({ page: 1, pageSize: IMPORT_PAGE_SIZE });
            for (const account of accounts.items.slice(0, MAX_IMPORT_ACCOUNTS)) {
              const page = await connector.getTransactions(account.externalId, {
                page: 1,
                pageSize: IMPORT_PAGE_SIZE,
              });
              transactions.push(...page.items);
            }
            if (accounts.items.length === 0) {
              const page = await connector.getTransactions('ledger', {
                page: 1,
                pageSize: IMPORT_PAGE_SIZE,
              });
              transactions.push(...page.items);
            }

            const mapped = buildJournalEntries(transactions, provider);
            skipped = mapped.skipped;

            if (mapped.rows.length === 0) {
              set((state) => {
                state.busy[provider] = false;
              });
              return {
                success: true,
                imported: 0,
                skipped,
                message: 'No transaction rows to import from this integration.',
              };
            }

            const result = useGLStore.getState().importGLData(mapped.rows, `${provider}-connector`);

            set((state) => {
              state.busy[provider] = false;
              const conn = state.connections[provider];
              if (conn) {
                conn.lastImportAt = Date.now();
                conn.lastImportCount = result.success ? result.imported : 0;
                conn.lastError = undefined;
              }
            });

            return {
              success: true,
              imported: result.success ? result.imported : 0,
              skipped: skipped + result.errors,
              message: result.success
                ? result.imported > 0
                  ? `Imported ${result.imported} ledger rows.`
                  : 'No new ledger rows imported (all duplicates or invalid).'
                : `Ledger import rejected ${result.errors} row(s).`,
            };
          } catch (error) {
            set((state) => {
              state.busy[provider] = false;
              const conn = state.connections[provider];
              if (conn) {
                conn.status = 'error';
                conn.lastError = errorMessage(error, 'Ledger import failed');
              }
            });
            return {
              success: false,
              imported: 0,
              skipped: 0,
              message: errorMessage(error, 'Ledger import failed'),
            };
          }
        }),

        // Read-only accessor.
        getConnection: (provider) => get().connections[provider],
      })),
      {
        name: 'integration-store',
        storage: masterStorage,
        version: 1,
        partialize: (state) => ({
          connections: state.connections,
        }),
      }
    )
  )
);
