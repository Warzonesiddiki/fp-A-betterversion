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
import type {
  ConnectorStatus,
  ExternalAccount,
  ExternalTransaction,
  PaginatedResponse,
  PaginationParams,
} from '@/services/api-integration/types';
import { randomId } from '@/utils/cryptoId';
// W6-P0-14: connector lifecycle is permission-guarded. Creating a connection
// stores provider credentials and opens an import channel (import:create);
// test/sync/disconnect mutate persisted connection state (import:update);
// importToLedger writes GL rows (import:create, matching glStore.importGLData).
// getConnection is a read.
import { enforce, Permissions } from '@/utils/rbacEnforcer';
import { nowMs } from '@/utils/clock';
import { asMoney, roundTo, subtractMoney } from '@/utils/money';

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
  /** True when every source page was fetched and no account was skipped by the cap. */
  complete: boolean;
  imported: number;
  skipped: number;
  /** Null means the omitted-record count is unknown or pagination was incomplete. */
  omittedAccounts: number | null;
  omittedTransactions: number | null;
  /** True only when both omission counts are exact (including zero). */
  omissionCountsExact: boolean;
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
const MAX_IMPORT_PAGES = 100;

interface PageCollection<T> {
  items: T[];
  complete: boolean;
}

/**
 * Follow either numeric pages or opaque provider cursors. The hard page cap
 * and repeated-cursor check prevent a broken connector from looping forever;
 * callers must surface `complete: false` rather than presenting that import
 * as complete.
 */
async function collectAllPages<T>(
  fetchPage: (pagination: PaginationParams) => Promise<PaginatedResponse<T>>,
  getKey: (item: T) => string
): Promise<PageCollection<T>> {
  const items: T[] = [];
  const seenItems = new Set<string>();
  const requestedCursors = new Set<string>();
  let page = 1;
  let cursor: string | undefined;

  for (let pagesFetched = 0; pagesFetched < MAX_IMPORT_PAGES; pagesFetched += 1) {
    const currentCursor = cursor;
    if (currentCursor) {
      if (requestedCursors.has(currentCursor)) return { items, complete: false };
      requestedCursors.add(currentCursor);
    }

    const pagination: PaginationParams = { page, pageSize: IMPORT_PAGE_SIZE };
    if (currentCursor) pagination.cursor = currentCursor;
    const response = await fetchPage(pagination);

    for (const item of response.items) {
      const key = getKey(item);
      if (!seenItems.has(key)) {
        seenItems.add(key);
        items.push(item);
      }
    }

    if (!response.hasNext) return { items, complete: true };

    const nextCursor = response.nextCursor;
    if (nextCursor) {
      if (nextCursor === currentCursor || requestedCursors.has(nextCursor)) {
        return { items, complete: false };
      }
      cursor = nextCursor;
    } else {
      // A cursor-based feed must return its continuation token on every page.
      if (currentCursor) return { items, complete: false };
      cursor = undefined;
      page += 1;
    }

    if (nextCursor) page += 1;
  }

  return { items, complete: false };
}

function plural(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? '' : 's'}`;
}

function importResultMessage(
  baseMessage: string,
  coverage: {
    accountsComplete: boolean;
    transactionsComplete: boolean;
    omittedAccounts: number | null;
    skipped: number;
  }
): string {
  const warnings: string[] = [];
  if (coverage.omittedAccounts === null) {
    warnings.push(
      'The omitted account count is unknown because account pagination did not complete.'
    );
  } else if (coverage.omittedAccounts > 0) {
    warnings.push(
      coverage.accountsComplete
        ? `${plural(coverage.omittedAccounts, 'account')} omitted due to the 25-account limit.`
        : `At least ${plural(coverage.omittedAccounts, 'account')} are omitted due to the 25-account limit; the exact count is unknown.`
    );
  }

  if (!coverage.transactionsComplete) {
    warnings.push(
      'At least one additional transaction page could not be fetched; the omitted transaction count is unknown.'
    );
  }
  if (coverage.omittedAccounts !== 0) {
    warnings.push('The transaction count for omitted or unlisted accounts is unknown.');
  }
  if (coverage.skipped > 0) warnings.push(`Skipped ${plural(coverage.skipped, 'row')}.`);

  const incomplete =
    !coverage.accountsComplete || !coverage.transactionsComplete || coverage.omittedAccounts !== 0;
  if (!warnings.length) return baseMessage;
  return `${baseMessage}${incomplete ? ' Import incomplete:' : ''} ${warnings.join(' ')}`;
}

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
                conn.connectedAt = ok ? nowMs() : undefined;
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
                  conn.connectedAt ??= nowMs();
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
              complete: false,
              imported: 0,
              skipped: 0,
              omittedAccounts: null,
              omittedTransactions: null,
              omissionCountsExact: false,
              message: 'No connection for this integration.',
            };
          }
          const definition = getIntegrationDefinition(provider);
          if (!definition) {
            return {
              success: false,
              complete: false,
              imported: 0,
              skipped: 0,
              omittedAccounts: null,
              omittedTransactions: null,
              omissionCountsExact: false,
              message: 'Connector unavailable for this integration.',
            };
          }
          if (!definition.ledgerImportable) {
            return {
              success: false,
              complete: false,
              imported: 0,
              skipped: 0,
              omittedAccounts: null,
              omittedTransactions: null,
              omissionCountsExact: false,
              message: `${definition.name} does not provide a ledger transaction feed.`,
            };
          }
          const connector = buildConnector(connection);
          if (!connector) {
            return {
              success: false,
              complete: false,
              imported: 0,
              skipped: 0,
              omittedAccounts: null,
              omittedTransactions: null,
              omissionCountsExact: false,
              message: 'Connector unavailable for this integration.',
            };
          }

          set((state) => {
            state.busy[provider] = true;
          });

          try {
            const accounts = await collectAllPages(
              (pagination) => connector.getAccounts(pagination),
              (account: ExternalAccount) => account.externalId
            );
            const knownOmittedAccounts = Math.max(0, accounts.items.length - MAX_IMPORT_ACCOUNTS);
            const omittedAccounts = accounts.complete
              ? knownOmittedAccounts
              : knownOmittedAccounts > 0
                ? knownOmittedAccounts
                : null;
            const importedAccounts = accounts.items.slice(0, MAX_IMPORT_ACCOUNTS);
            const transactions: ExternalTransaction[] = [];
            let transactionPagesComplete = true;

            // Accounting/ERP connectors expose accounts first, then per-account
            // transactions. Payments/banking connectors (Stripe, Plaid) have no
            // accounts feed — fall back to a direct transaction pull.
            for (const account of importedAccounts) {
              const accountTransactions = await collectAllPages(
                (pagination) => connector.getTransactions(account.externalId, pagination),
                (transaction: ExternalTransaction) =>
                  `${transaction.accountId ?? ''}\u0000${transaction.externalId}`
              );
              transactions.push(...accountTransactions.items);
              if (!accountTransactions.complete) transactionPagesComplete = false;
            }
            if (accounts.items.length === 0) {
              const directTransactions = await collectAllPages(
                (pagination) => connector.getTransactions('ledger', pagination),
                (transaction: ExternalTransaction) =>
                  `${transaction.accountId ?? ''}\u0000${transaction.externalId}`
              );
              transactions.push(...directTransactions.items);
              if (!directTransactions.complete) transactionPagesComplete = false;
            }

            const omittedTransactions =
              accounts.complete && omittedAccounts === 0 && transactionPagesComplete ? 0 : null;
            const omissionCountsExact =
              accounts.complete &&
              omittedAccounts !== null &&
              omittedTransactions !== null &&
              transactionPagesComplete;
            const complete = accounts.complete && omittedAccounts === 0 && transactionPagesComplete;
            const mapped = buildJournalEntries(transactions, provider);
            const skipped = mapped.skipped;
            const coverage = {
              accountsComplete: accounts.complete,
              transactionsComplete: transactionPagesComplete,
              omittedAccounts,
              skipped,
            };

            if (mapped.rows.length === 0) {
              set((state) => {
                state.busy[provider] = false;
              });
              return {
                success: true,
                complete,
                imported: 0,
                skipped,
                omittedAccounts,
                omittedTransactions,
                omissionCountsExact,
                message: importResultMessage(
                  'No transaction rows to import from this integration.',
                  coverage
                ),
              };
            }

            // Q5 stage 4: `importGLData` takes ledger rows whose money fields are
            // `Money`; a connector row is a major-unit number, so it crosses here.
            const result = useGLStore.getState().importGLData(
              mapped.rows.map((row) => ({
                ...row,
                debit: asMoney(row.debit),
                credit: asMoney(row.credit),
                amount: asMoney(roundTo(subtractMoney(row.debit, row.credit))),
                netChange: asMoney(roundTo(subtractMoney(row.debit, row.credit))),
              })),
              `${provider}-connector`
            );
            const totalSkipped = skipped + result.errors;

            set((state) => {
              state.busy[provider] = false;
              const conn = state.connections[provider];
              if (conn) {
                conn.lastImportAt = nowMs();
                conn.lastImportCount = result.success ? result.imported : 0;
                conn.lastError = undefined;
              }
            });

            const baseMessage = result.success
              ? result.imported > 0
                ? `Imported ${result.imported} ledger rows.`
                : 'No new ledger rows imported (all duplicates or invalid).'
              : `Ledger import rejected ${result.errors} row(s).`;

            return {
              success: true,
              complete,
              imported: result.success ? result.imported : 0,
              skipped: totalSkipped,
              omittedAccounts,
              omittedTransactions,
              omissionCountsExact,
              message: importResultMessage(baseMessage, { ...coverage, skipped: totalSkipped }),
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
              complete: false,
              imported: 0,
              skipped: 0,
              omittedAccounts: null,
              omittedTransactions: null,
              omissionCountsExact: false,
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
